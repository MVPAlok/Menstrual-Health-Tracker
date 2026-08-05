import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Configure Redis with fallback & disable offline queuing to prevent hanging requests when Redis is down
export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  enableOfflineQueue: false, // Instantly fails calls when Redis is offline so try/catch fallbacks work immediately
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

export let isRedisConnected = false;

redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log('⚡ [Redis] Client connected successfully to', redisUrl);
});

redisClient.on('ready', () => {
  isRedisConnected = true;
});

redisClient.on('close', () => {
  isRedisConnected = false;
});

redisClient.on('end', () => {
  isRedisConnected = false;
});

redisClient.on('error', () => {
  isRedisConnected = false;
});
