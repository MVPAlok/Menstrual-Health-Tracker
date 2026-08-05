# NariCare Backend — Complete Redis Architecture & Setup Guide

This document details the complete Redis integration across the NariCare backend application.

---

## 📌 Overview & Architecture Summary

Redis is used across 5 core layers of the application:
1. **API Rate Limiting** (`express-rate-limit` + `rate-limit-redis`)
2. **Intelligent Query & Analytics Caching** (`ioredis`)
3. **Session & JWT Token Blacklisting** (Revocation on Logout)
4. **Real-time WebSockets Pub/Sub Adapter** (`@socket.io/redis-adapter`)
5. **Asynchronous Background Job Queue** (`bullmq`)

---

## 🚀 Quick Start (Running Redis Locally)

### Option 1: Using Docker (Recommended)
```bash
docker run --name naricare-redis -p 6379:6379 -d redis:alpine
```

### Option 2: Using WSL (Ubuntu on Windows)
```bash
sudo apt update && sudo apt install redis-server
sudo service redis-server start
```

### Option 3: Redis Cloud / Managed Instance
Set the environment variable in `backend/.env`:
```env
REDIS_URL=redis://default:your_password@your_redis_host:6379
```

---

## ⚡ Complete Redis Usage Map

### 1. Data & Query Caching
| Data / Service | Cache Key Pattern | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| **Profile Stats** | `analytics:stats:${userId}` | 24 Hours | Modified/Deleted Daily Log or Calibration |
| **Cycle Comparison** | `analytics:comparison:${userId}` | 24 Hours | Modified/Deleted Daily Log or Calibration |
| **Recent Changes** | `analytics:recent:${userId}` | 24 Hours | Modified/Deleted Daily Log or Calibration |
| **Cycle Predictions** | `predictions:${userId}:${offsetDays}` | 12 Hours | Modified/Deleted Daily Log or Calibration |
| **Onboarding Profile** | `onboarding:${userId}` | 24 Hours | Profile Calibration (`/api/onboarding/calibrate`) |
| **Partner Status** | `partner:status:${userId}` | 1 Hour | Partner Pairing or Unlinking |

### 2. Session & Token Revocation (JWT Blacklist)
- **Key Pattern:** `blacklist:${token}`
- **TTL:** 7 Days (matches JWT Expiry)
- **Flow:**
  - When user hits `POST /api/auth/logout`, their Bearer token is saved in Redis.
  - The `authenticateToken` middleware checks Redis before allowing protected requests. If blacklisted, returns `401 Unauthorized`.

### 3. Background Job Queue (BullMQ)
- **Queue Name:** `push-notifications`
- **Worker File:** `src/workers/notificationWorker.ts`
- **Job Flow:**
  - `triggerNotification` enqueues jobs to `notificationQueue`.
  - Background worker picks up the job and dispatches browser push notifications using `webpush`.
  - Retries: 3 attempts with exponential backoff if push fails.
  - Fallback: If Redis is offline, system automatically falls back to direct synchronous dispatching.

### 4. Real-time Socket.io Scaling
- **Adapter:** `@socket.io/redis-adapter`
- **Functionality:** Synchronizes WebSockets across horizontal server clusters using Redis Pub/Sub channels.

### 5. API Rate Limiting
- **Middleware:** `express-rate-limit` with `rate-limit-redis`
- **Policy:** Max 300 requests per 15-minute window per IP address across all `/api/*` endpoints.

---

## 📂 Key Files & Code Locations

- **Redis Connection Client:** `backend/src/config/redis.ts`
- **Analytics Caching & Invalidation:** `backend/src/services/analyticsService.ts`
- **Prediction Caching:** `backend/src/controllers/predictionsController.ts`
- **Onboarding Caching:** `backend/src/controllers/onboardingController.ts`
- **Partner Status Caching:** `backend/src/controllers/partnerController.ts`
- **Token Blacklisting & Logout:** `backend/src/controllers/authController.ts` & `backend/src/middleware/authMiddleware.ts`
- **BullMQ Queue & Worker:** `backend/src/queues/notificationQueue.ts` & `backend/src/workers/notificationWorker.ts`
- **Server Bootstrapping:** `backend/src/server.ts`

---

## 🛡️ Resilience & Failover

All Redis calls are wrapped in `try...catch` blocks with silent fallback strategies:
- If Redis is down or disconnected, **the application will NOT crash**.
- The app will automatically fall back to direct database reads and synchronous execution.
