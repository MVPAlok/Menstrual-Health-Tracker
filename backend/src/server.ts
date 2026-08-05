import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient, isRedisConnected } from './config/redis';
import authRoutes from './routes/authRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import logRoutes from './routes/logRoutes';
import partnerRoutes from './routes/partnerRoutes';
import predictionsRoutes from './routes/predictionsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { getNotificationPreferences, updateNotificationPreferences } from './controllers/notificationController';
import { authenticateToken } from './middleware/authMiddleware';
import { registerSocketHandlers } from './sockets/syncSocket';
import { startNotificationScheduler } from './services/notificationEngine';
import { setSocketIoInstance } from './services/notificationService';
import { startNotificationWorker } from './workers/notificationWorker';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure Redis-backed API Rate Limiter with instant Memory fallback if Redis is offline
const redisRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
});

const memoryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
});

const apiRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (isRedisConnected) {
    return redisRateLimiter(req, res, next);
  }
  return memoryRateLimiter(req, res, next);
};

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Apply rate limiter to all API endpoints
app.use('/api', apiRateLimiter);

// REST Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/notifications', notificationRoutes);
app.get('/api/notification-preferences', authenticateToken, getNotificationPreferences);
app.patch('/api/notification-preferences', authenticateToken, updateNotificationPreferences);

// Socket.io initialization with custom ping configurations
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Configure Socket.io Redis Adapter for cross-server real-time pub/sub sync
if (isRedisConnected) {
  try {
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('⚡ [Socket.io] Redis Pub/Sub adapter connected');
  } catch (e) {
    console.warn('⚠️ [Socket.io] Failed to connect Redis adapter, falling back to default memory adapter');
  }
}

// Bind WebSocket event listeners
registerSocketHandlers(io);
setSocketIoInstance(io);

// Initialize background cron for real-time notification alerts
startNotificationScheduler(io);

// Start BullMQ background worker for Push Notifications only if Redis is connected
if (isRedisConnected) {
  try {
    startNotificationWorker();
    console.log('⚡ [BullMQ] Notification worker running');
  } catch (e) {
    console.warn('⚠️ [BullMQ] Failed to start notification worker');
  }
}


const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 NariCare Core functioning on port ${PORT}`);
});
