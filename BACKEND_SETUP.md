# 🌌 LunaCare Backend & Real-Time Setup Guide

Welcome to the backend architecture blueprint for **LunaCare**. This document provides an exhaustive, step-by-step implementation guide to build, connect, and deploy a robust Node.js/TypeScript backend powered by a **Neon PostgreSQL** database and **Prisma ORM**, with full **real-time synchronization** capabilities (via **Socket.io**).

Following this guide, you can fully convert the client-side mock state (`localStorage`) into a production-grade, secure, multi-device real-time platform.

---

## 🏗️ Architecture Overview

The system operates on an event-driven, real-time sync model:

```mermaid
sequenceDiagram
    participant Client A (Desktop)
    participant Express Server & WebSockets
    participant Neon Database (PostgreSQL)
    participant Client B (Mobile App)

    Client A->>Express Server & WebSockets: HTTP POST /api/logs (Daily telemetry logged)
    Express Server & WebSockets->>Neon Database (PostgreSQL): Prisma query to save log details
    Neon Database (PostgreSQL)-->>Express Server & WebSockets: Confirm write operation
    Express Server & WebSockets-->>Client A: HTTP 200 OK (State saved)
    Express Server & WebSockets->>Client B: Socket.io Emit "log:sync" (Real-time updates broadcasted)
    Client B-->>Client B: Live update UI orb & statistics instantly
```

1. **Vite Frontend (React + TypeScript)**: The UI communicates with the backend via a REST API (for heavy operations like Auth and Onboarding) and a WebSocket connection (for instant biometrics, logs, partner-syncing, and notifications).
2. **Express & Socket.io Backend (TypeScript)**: Houses endpoints, parses biometrics, handles calendar computations, runs JWT auth checks, and maintains open socket channels to push events to active users.
3. **Neon Serverless PostgreSQL**: Stores persistent user metrics, onboarding profiles, and daily health logs.
4. **Prisma ORM**: Interfaces Express with Neon, manages SQL schemas, handles automatic migrations, and runs transactional queries.

---

## 💾 1. Neon Database Configuration

Neon provides serverless PostgreSQL with autoscaling and branching.

### Setup Instructions:
1. Log in to the [Neon Console](https://console.neon.tech/).
2. Create a new project, naming it `lunacare-db`. Select your preferred region and click **Create Project**.
3. Once created, copy the **Connection string** from the Dashboard. It will look like this:
   ```env
   postgresql://alex:password@ep-cool-glade-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Since we will use connection pooling for serverless execution and standard connections for database migrations, obtain two strings:
   - **Pooled URL**: `postgresql://...neondb?sslmode=require&pgbouncer=true` (Used for runtime requests).
   - **Direct URL**: `postgresql://...neondb?sslmode=require` (Used for running Prisma migrations directly).

---

## 🛠️ 2. Prisma Database Schema Setup

Create a separate backend directory or initialize Prisma directly within the repository. We recommend housing backend code in a `/backend` directory at the project root for modularity.

### Initialize Prisma
Within the backend root:
```bash
npm init -y
npm install typescript @types/node tsx -D
npm install @prisma/client dotenv
npx prisma init
```

### Prisma Schema (`backend/prisma/schema.prisma`)
Copy this schema. It represents the exact data fields required by the LunaCare onboarding wizard, calendar logging, and dashboard statistics, plus authorization states and partner pairing.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// User Profile Table
model User {
  id                   String        @id @default(uuid())
  email                String        @unique
  passwordHash         String
  name                 String
  verificationToken    String?       // Used during OTP / email validation
  isVerified           Boolean       @default(false)
  resetToken           String?       // Used for forgot-password recovery
  resetTokenExpiry     DateTime?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
  
  onboarding           Onboarding?
  dailyLogs            DailyLog[]
  partnerSyncInitiator PartnerSync[] @relation("UserInitiated")
  partnerSyncReceiver  PartnerSync[] @relation("UserReceived")
  notifications        Notification[]
}

// Onboarding Data Table (Matches OnboardingFlow steps)
model Onboarding {
  id                  String        @id @default(uuid())
  userId              String        @unique
  user                User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  lastPeriodDate      String        // Format: YYYY-MM-DD
  cycleLength         Int           @default(28) // 21 to 35
  periodLength        Int           @default(5)  // 2 to 10
  healthGoals         String[]      // e.g., ["Track Periods", "Understand Symptoms"]
  sleepQuality        SleepType     @default(Restorative)
  stressLevel         StressType    @default(Moderate)
  activityLevel       ActivityType  @default(Active)
  hydrationLevel      HydrationType @default(Average)
  notifyPeriod        Boolean       @default(true)
  notifyOvulation     Boolean       @default(true)
  notifyInsights      Boolean       @default(true)
  notifyWellnessTips  Boolean       @default(false)
  onboardingCompleted Boolean       @default(false)
  updatedAt           DateTime      @updatedAt
}

// Daily Telemetry Logs (Matches Dashboard.tsx metrics)
model DailyLog {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  date          String    // Format: YYYY-MM-DD
  mood          Mood      @default(Balanced)
  sleepHours    Float     @default(7.0) // Support decimals (e.g. 7.5 hrs)
  energyRate    Int       @default(7)   // 1 to 10 scale
  stressFactor  Int       @default(3)   // 1 to 10 scale
  symptoms      String[]  // e.g., ["Cramps", "Headache", "Bloating"]
  hydrationCups Int       @default(4)   // 1 to 8 cups
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([userId, date]) // Ensures a user can only have one diagnostic log per day
}

// Partner Real-Time Sharing
model PartnerSync {
  id              String      @id @default(uuid())
  initiatorId     String
  receiverId      String?
  initiator       User        @relation("UserInitiated", fields: [initiatorId], references: [id], onDelete: Cascade)
  receiver        User?       @relation("UserReceived", fields: [receiverId], references: [id], onDelete: Cascade)
  syncCode        String      @unique // Generated 6-digit code for quick pairing
  status          SyncStatus  @default(PENDING)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

// Real-Time Notification Log
model Notification {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        String    // e.g., "PERIOD_REMINDER", "OVULATION_ALERT", "WELLNESS_TIP"
  message     String
  read        Boolean   @default(false)
  triggerTime DateTime
  createdAt   DateTime  @default(now())
}

// Enums
enum Mood {
  Radiant
  Balanced
  Sensitive
  LowEnergy  @map("Low Energy")
  Anxious
}

enum SleepType {
  Restorative
  Fragmented
  Insufficient
}

enum StressType {
  Low
  Moderate
  High
}

enum ActivityType {
  Sedentary
  Active
  Athletic
}

enum HydrationType {
  Optimal
  Average
  Low
}

enum SyncStatus {
  PENDING
  ACCEPTED
  REVOKED
}
```

### Apply Migration to Neon:
Create your `.env` file inside the `backend` folder:
```env
DATABASE_URL="postgresql://alex:password@ep-cool-glade-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://alex:password@ep-cool-glade-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="YOUR_SUPER_SECRET_KEY_FOR_WEB_SIGNATURES"
PORT=5000
```
Run the migrations to create the tables in Neon:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## 📂 3. Backend Folder Architecture

Maintain this directory structure for clean concerns separation:

```text
backend/
├── prisma/
│   ├── schema.prisma       # Database model layout
│   └── migrations/         # Database migrations history
├── src/
│   ├── controllers/
│   │   ├── authController.ts       # Registration, Verification & Login logic
│   │   ├── logController.ts        # Telemetry updates & logs fetching
│   │   ├── onboardingController.ts # Calibration profile setup
│   │   └── partnerController.ts    # Pairing and partner-sharing logic
│   ├── middleware/
│   │   └── authMiddleware.ts       # Token checking & Websocket socket security
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── logRoutes.ts
│   │   ├── onboardingRoutes.ts
│   │   └── partnerRoutes.ts
│   ├── services/
│   │   ├── notificationEngine.ts   # Scheduled notifications cron
│   │   └── cycleEngine.ts          # Bayesian cycle predictive algorithms
│   ├── sockets/
│   │   └── syncSocket.ts           # Socket.io handlers & broadcasts
│   └── server.ts           # Express + HTTP WebSockets gateway
├── .env
├── package.json
└── tsconfig.json
```

---

## ⚡ 4. Real-time Express & WebSockets Server

A high-performance entry point is required to handle concurrent WebSocket connections and feed REST API requests.

### Dependencies Installation:
```bash
npm install express socket.io cors jsonwebtoken bcryptjs
npm install @types/express @types/cors @types/jsonwebtoken @types/bcryptjs -D
```

### Server Entrypoint (`backend/src/server.ts`)
This combines Express and Socket.io using the Node `http` server module, allowing them to share the same port (crucial for hosting options like Render or Railway).

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import logRoutes from './routes/logRoutes';
import partnerRoutes from './routes/partnerRoutes';
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
```

---

## 🔒 5. Real-Time Socket Middleware & Event Routing

To protect biometrics and sync health records safely, users must authenticate before establishing a WebSocket channel.

### Token Verification Middleware (`backend/src/middleware/authMiddleware.ts`)
```typescript
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
}

export const verifySocketToken = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication Error: Bearer token required.'));
  }

  try {
    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, secret) as DecodedToken;
    socket.data.userId = decoded.userId; // Embed user ID within socket session metadata
    next();
  } catch (error) {
    return next(new Error('Authentication Error: Invalid signature token.'));
  }
};
```

### Real-Time Sockets Coordinator (`backend/src/sockets/syncSocket.ts`)
This coordinates real-time cross-device syncs (e.g. tablet syncs when phone updates logs) and updates partner streams.

```typescript
import { Server, Socket } from 'socket.io';
import { verifySocketToken } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registerSocketHandlers = (io: Server) => {
  // Attach token authentication security check
  io.use(verifySocketToken);

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`📡 Device connected. User Session: ${userId}`);

    // Join a private, single-user room for multi-device sync
    socket.join(`user:${userId}`);

    // Locate active partner syncs to join shared updates stream
    const syncRelation = await prisma.partnerSync.findFirst({
      where: {
        OR: [
          { initiatorId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
        ]
      }
    });

    if (syncRelation) {
      const roomName = `shared:${syncRelation.id}`;
      socket.join(roomName);
      console.log(`🔗 Joined partner sync channel: ${roomName}`);
    }

    // EVENT 1: Telemetry Data Updated (Emitted by frontend when logging mood, symptoms, or sleep)
    socket.on('log:save', async (data: { date: string; mood: string; symptoms: string[]; sleep: number; energy: number; stress: number }) => {
      try {
        // Broadcast telemetry data to other devices active on the same profile
        socket.to(`user:${userId}`).emit('log:sync', {
          date: data.date,
          log: data
        });

        // Broadcast to partner if sync connection is active
        if (syncRelation) {
          socket.to(`shared:${syncRelation.id}`).emit('partner:log_update', {
            partnerId: userId,
            date: data.date,
            mood: data.mood,
            symptoms: data.symptoms
          });
        }
      } catch (error) {
        socket.emit('error', 'Failed to broadcast real-time telemetry update.');
      }
    });

    // EVENT 2: Partner Typing/Interacting alert
    socket.on('partner:active_action', (data: { action: string }) => {
      if (syncRelation) {
        socket.to(`shared:${syncRelation.id}`).emit('partner:active_notification', {
          partnerId: userId,
          action: data.action
        });
      }
    });

    // EVENT 3: Clear session
    socket.on('disconnect', () => {
      console.log(`🔌 Session ended. Connection closed: ${userId}`);
    });
  });
};
```

---

## 📡 6. Complete REST API Reference

The backend must provide endpoints for Authentication, Profile Onboarding, daily telemetry logs, predictions, and partner sharing.

### 🔐 1. Authentication Router (`/api/auth`)
*   `POST /register`: Registers user details. Hash the password with bcrypt before writing to Neon. Generate a 6-digit OTP code stored in `verificationToken`.
*   `POST /verify`: Compares the user input OTP against the token database value. Updates `isVerified: true`.
*   `POST /login`: Validates password. Returns a JWT containing `{ userId: user.id, email: user.email }` with a 7-day expiration.
*   `POST /forgot-password`: Generates a randomized cryptographic `resetToken` with a 1-hour expiration.
*   `POST /reset-password`: Validates the `resetToken` and replaces the password hash.

### 📊 2. Onboarding Router (`/api/onboarding`)
*   `GET /`: Returns the user onboarding settings profile.
*   `POST /calibrate`: Persists Onboarding properties. Triggers database initialization of the initial 28-day cycle path.
    *   **Payload structure**:
        ```json
        {
          "lastPeriodDate": "2026-06-20",
          "cycleLength": 28,
          "periodLength": 5,
          "healthGoals": ["Predict Ovulation", "Track Periods"],
          "lifestyle": {
            "sleep": "Restorative",
            "stress": "Moderate",
            "activity": "Active",
            "hydration": "Average"
          },
          "notifications": {
            "period": true,
            "ovulation": true,
            "insights": true,
            "wellnessTips": false
          }
        }
        ```

### 📒 3. Daily Logs Router (`/api/logs`)
*   `GET /range?start=YYYY-MM-DD&end=YYYY-MM-DD`: Fetches daily telemetry logs within a calendar span (used to paint monthly grids in the UI).
*   `POST /`: Adds or patches logs for the active user. If a record for that specific `date` already exists, perform a write update (`prisma.dailyLog.upsert`).
    *   **Payload structure**:
        ```json
        {
          "mood": "Radiant",
          "sleepHours": 8.5,
          "energyRate": 9,
          "stressFactor": 2,
          "symptoms": ["Bloating"],
          "hydrationCups": 6
        }
        ```

### 🧠 4. Dynamic Predictions Lab Router (`/api/predictions`)
*   `GET /forecast`: Performs calculation of future menstrual dates.
    *   **Logic Engine**: Instead of simple multiplication, look up the last 3 logged periods. If user records show variations, average the values and adjust standard projections.
    *   **Response payload structure**:
        ```json
        {
          "nextCycleDate": "2026-07-18",
          "daysRemaining": 24,
          "ovulationWindow": {
            "start": "2026-07-02",
            "peak": "2026-07-04",
            "end": "2026-07-05"
          },
          "biometricTrends": {
            "projectedEnergySpike": "2026-07-01",
            "projectedRecoveryHigh": "2026-07-06"
          }
        }
        ```

### 🤝 5. Partner Sync Router (`/api/partner`)
*   `POST /code`: Generates a random, unique 6-digit `syncCode` (valid for 10 minutes) stored in the `PartnerSync` model.
*   `POST /pair`: The secondary user submits the pairing code. Connects both profiles and changes the record status to `ACCEPTED`.
*   `DELETE /unlink`: Revokes the sync connection, clearing entries so both dashboards act privately again.

---

## ⚡ 7. Real-Time Notification Scheduler (`backend/src/services/notificationEngine.ts`)

To generate real-time alerts without draining system memory, implement a background check interval. It calculates users' upcoming phases and sends alert updates directly over active websockets.

```typescript
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const startNotificationScheduler = (io: Server) => {
  // Check alert queues every hour
  setInterval(async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Find users with active onboarding
    const users = await prisma.user.findMany({
      include: { onboarding: true }
    });

    for (const user of users) {
      if (!user.onboarding || !user.onboarding.onboardingCompleted) continue;

      const lastPeriod = new Date(user.onboarding.lastPeriodDate);
      const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const currentCycleDay = (diffDays % user.onboarding.cycleLength) + 1;
      const daysUntilNext = user.onboarding.cycleLength - currentCycleDay;

      // Real-time Push Alert 1: Period starting in 2 days
      if (daysUntilNext === 2 && user.onboarding.notifyPeriod) {
        const msg = "LunaCare Insight: Your cycle reset commencement is projected in 48 hours. Focus on restful recovery.";
        
        // Save to database notification history
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "PERIOD_REMINDER",
            message: msg,
            triggerTime: today
          }
        });

        // Emit instant socket message
        io.to(`user:${user.id}`).emit('notification:push', {
          title: 'Upcoming Period Flow',
          body: msg,
          timestamp: today
        });
      }

      // Real-time Push Alert 2: Ovulation Day Peak
      const ovulationDay = user.onboarding.cycleLength - 14;
      if (currentCycleDay === ovulationDay && user.onboarding.notifyOvulation) {
        const msg = "LunaCare Alert: Estrogen peak and LH hormone surge detected. Peak stamina state active.";

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "OVULATION_ALERT",
            message: msg,
            triggerTime: today
          }
        });

        io.to(`user:${user.id}`).emit('notification:push', {
          title: 'Fertility Horizon Reached',
          body: msg,
          timestamp: today
        });
      }
    }
  }, 3600000); // 1 hour interval check
};
```

---

## ⚡ 8. Connecting the Frontend client

To bridge your premium frontend components to this real-time backend, modify the central state provider:

### Modify `src/context/AppContext.tsx`
Replace client-side mock handlers with backend API endpoints and socket listeners.

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  token?: string;
}

// (Maintain existing types for OnboardingData and DailyLog...)

interface AppContextType {
  user: UserProfile;
  onboarding: OnboardingData;
  dailyLogs: Record<string, DailyLog>;
  isLoading: boolean;
  loginUser: (profile: UserProfile) => void;
  logoutUser: () => void;
  updateOnboarding: (data: Partial<OnboardingData>) => Promise<void>;
  logDay: (log: Omit<DailyLog, 'date'>) => Promise<void>;
  realTimeAlerts: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('lunacare_user');
    return saved ? JSON.parse(saved) : { name: '', email: '', isLoggedIn: false };
  });

  const [onboarding, setOnboarding] = useState<OnboardingData>(defaultOnboarding);
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [realTimeAlerts, setRealTimeAlerts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Socket.io connection when user logs in
  useEffect(() => {
    if (user.isLoggedIn && user.token) {
      // Connect to WebSocket server gateway
      const socketConn = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
        auth: { token: user.token }
      });

      socketConn.on('connect', () => {
        console.log('⚡ Connected to LunaCare live telemetry engine');
      });

      // Synchronize database updates from other devices in real-time
      socketConn.on('log:sync', (data: { date: string; log: DailyLog }) => {
        setDailyLogs((prev) => ({ ...prev, [data.date]: data.log }));
      });

      // Listen for instant server-pushed alerts
      socketConn.on('notification:push', (alert: { title: string; body: string }) => {
        setRealTimeAlerts((prev) => [alert.body, ...prev]);
        
        // Native browser UI alert trigger
        if (Notification.permission === 'granted') {
          new Notification(alert.title, { body: alert.body });
        }
      });

      setSocket(socketConn);

      // Fetch user profile stats and logs on initial render
      const bootstrapStats = async () => {
        try {
          const headers = { Authorization: `Bearer ${user.token}` };
          const [onboardingRes, logsRes] = await Promise.all([
            fetch('/api/onboarding', { headers }),
            fetch('/api/logs/range?start=2026-01-01&end=2026-12-31', { headers })
          ]);
          
          if (onboardingRes.ok) setOnboarding(await onboardingRes.json());
          if (logsRes.ok) {
            const logsArray: DailyLog[] = await logsRes.json();
            const logsMap = logsArray.reduce((acc, log) => ({ ...acc, [log.date]: log }), {});
            setDailyLogs(logsMap);
          }
        } catch (e) {
          console.error("Initialization check failed: Remote fetch failed.");
        } finally {
          setIsLoading(false);
        }
      };

      bootstrapStats();

      return () => {
        socketConn.disconnect();
      };
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loginUser = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('lunacare_user', JSON.stringify(profile));
  };

  const logoutUser = () => {
    setUser({ name: '', email: '', isLoggedIn: false });
    setOnboarding(defaultOnboarding);
    setDailyLogs({});
    localStorage.removeItem('lunacare_user');
    socket?.disconnect();
  };

  const updateOnboarding = async (data: Partial<OnboardingData>) => {
    const updated = { ...onboarding, ...data };
    setOnboarding(updated);

    if (user.isLoggedIn) {
      await fetch('/api/onboarding/calibrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(updated)
      });
    }
  };

  const logDay = async (log: Omit<DailyLog, 'date'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newLog = { ...log, date: todayStr };
    
    // Update local React UI immediately (Optimistic rendering)
    setDailyLogs((prev) => ({ ...prev, [todayStr]: newLog }));

    if (user.isLoggedIn) {
      // 1. Persist to Neon PostgreSQL Database via Express REST route
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(newLog)
      });

      // 2. Broadcast via Socket connection to all other devices in real-time
      socket?.emit('log:save', newLog);
    }
  };

  return (
    <AppContext.Provider value={{ user, onboarding, dailyLogs, isLoading, loginUser, logoutUser, updateOnboarding, logDay, realTimeAlerts }}>
      {children}
    </AppContext.Provider>
  );
};
```

---

## 🚀 9. Server Deployment Plan

To ensure your web app functions in real-time without latency, deploy components as follows:

### 1. Database (Neon Serverless)
*   **Neon** operates online 24/7. No configuration changes are required for production. Use the pooled connection strings for hosting scaling support.

### 2. Real-Time API Server (Railway or Render)
*   **⚠️ Crucial Note on WebSockets**: Standard serverless platforms like *Vercel Functions* or *AWS Lambda* have strict execution timeouts (typically 10-30 seconds), making them unsuitable for persistent WebSockets connections.
*   **Deployment Steps (Render)**:
    1. Log in to [Render](https://render.com/).
    2. Click **New +** and select **Web Service**.
    3. Connect your GitHub repository. Select the `/backend` folder.
    4. Set runtime environment: **Node**.
    5. Set build command: `npm install && npm run build`.
    6. Set start command: `node dist/server.js`.
    7. Add environment variables from your `.env` (including `DATABASE_URL` and `DIRECT_URL`).
    8. Click **Deploy Web Service**. Render provides an HTTP URL (e.g. `https://lunacare-backend.onrender.com`) which also acts as your WebSocket connection path (`wss://lunacare-backend.onrender.com`).
