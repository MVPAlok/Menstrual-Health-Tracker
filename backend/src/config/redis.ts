import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Configure Redis with fallback & disable offline queuing to prevent hanging requests when Redis is down
export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: true,
  enableOfflineQueue: false, // Instantly fails calls when Redis is offline so try/catch fallbacks work immediately
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
});

export let isRedisConnected = false;
type ReadyCallback = () => void;
const readyCallbacks: ReadyCallback[] = [];

/**
 * Registers a callback to execute when Redis is connected and ready.
 * If Redis is already connected, executes immediately.
 */
export const onRedisReady = (cb: ReadyCallback) => {
  if (isRedisConnected) {
    try {
      cb();
    } catch (err) {
      console.error('⚠️ [Redis Callback Error]:', err);
    }
  } else {
    readyCallbacks.push(cb);
  }
};

const notifyReady = () => {
  isRedisConnected = true;
  while (readyCallbacks.length > 0) {
    const cb = readyCallbacks.shift();
    if (cb) {
      try {
        cb();
      } catch (err) {
        console.error('⚠️ [Redis Callback Error]:', err);
      }
    }
  }
};

redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log('⚡ [Redis] Client connected successfully to', redisUrl);
});

redisClient.on('ready', () => {
  notifyReady();
});

redisClient.on('close', () => {
  isRedisConnected = false;
});

redisClient.on('end', () => {
  isRedisConnected = false;
});

redisClient.on('error', (err) => {
  isRedisConnected = false;
  // Log error without crashing process
  console.warn('⚠️ [Redis Warning] Connection error:', err.message);
});

