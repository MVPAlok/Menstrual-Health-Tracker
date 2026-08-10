import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient, isRedisConnected, onRedisReady } from './config/redis';
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

// Security Warning for unconfigured JWT secret in production
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('YOUR_SUPER_SECRET'))) {
  console.error('🔴 [SECURITY ERROR] Production mode requires a strong custom JWT_SECRET set in environment variables!');
}

const app = express();
const httpServer = createServer(app);

// Apply Helmet HTTP security headers (XSS, HSTS, X-Frame-Options, Content-Type sniffing)
app.use(helmet({
  contentSecurityPolicy: false, // Disable default CSP to allow custom WebSocket / cross-origin connections if needed
}));

// Configure Redis-backed API Rate Limiter with instant Memory fallback if Redis is offline
const redisRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (command: string, ...args: string[]) => redisClient.call(command, ...args),
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
    try {
      return redisRateLimiter(req, res, next);
    } catch (e) {
      console.warn('⚠️ [Rate Limiter] Redis store error, falling back to memory');
    }
  }
  return memoryRateLimiter(req, res, next);
};

const allowedOrigins = [
  'https://naricaree.com',
  'https://www.naricaree.com',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL || ''
].filter(Boolean);


app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Origin blocked for security'));
    }
  },
  credentials: true
}));


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Apply rate limiter to all API endpoints
app.use('/api', apiRateLimiter);

import prisma from './prisma';

// REST Route Registrations
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      redis: isRedisConnected ? 'connected' : 'offline',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: err?.message || 'Database connection error',
      redis: isRedisConnected ? 'connected' : 'offline',
      timestamp: new Date().toISOString()
    });
  }
});

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

// Bind WebSocket event listeners
registerSocketHandlers(io);
setSocketIoInstance(io);

// Initialize background cron for real-time notification alerts
startNotificationScheduler(io);

// Configure Socket.io Redis Adapter & BullMQ worker as soon as Redis is ready
let isWorkerStarted = false;
let isAdapterConfigured = false;

onRedisReady(() => {
  if (!isAdapterConfigured) {
    try {
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      isAdapterConfigured = true;
      console.log('⚡ [Socket.io] Redis Pub/Sub adapter connected');
    } catch (e: any) {
      console.warn('⚠️ [Socket.io] Failed to connect Redis adapter:', e.message);
    }
  }

  if (!isWorkerStarted) {
    try {
      startNotificationWorker();
      isWorkerStarted = true;
      console.log('⚡ [BullMQ] Notification worker running');
    } catch (e: any) {
      console.warn('⚠️ [BullMQ] Failed to start notification worker:', e.message);
    }
  }
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 NariCare Core functioning on port ${PORT}`);
});

