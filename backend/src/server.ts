import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// Enable CORS for frontend Vite client dev and production URLs
app.use(cors({
  origin: (origin, callback) => {
    // Dynamically allow any origin to prevent CORS deployment errors
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// REST Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/notifications', notificationRoutes);
app.get('/api/notification-preferences', authenticateToken, getNotificationPreferences);
app.patch('/api/notification-preferences', authenticateToken, updateNotificationPreferences);

// Socket.io initialization with custom ping configurations for quick reconnections
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Dynamically allow any origin to prevent CORS deployment errors
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

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LunaCare Core functioning on port ${PORT}`);
});
