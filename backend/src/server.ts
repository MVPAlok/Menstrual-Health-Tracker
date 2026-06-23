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
import { registerSocketHandlers } from './sockets/syncSocket';
import { startNotificationScheduler } from './services/notificationEngine';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Enable CORS for frontend Vite client dev and production URLs
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// REST Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/predictions', predictionsRoutes);

// Socket.io initialization with custom ping configurations for quick reconnections
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Bind WebSocket event listeners
registerSocketHandlers(io);

// Initialize background cron for real-time notification alerts
startNotificationScheduler(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LunaCare Core functioning on port ${PORT}`);
});
