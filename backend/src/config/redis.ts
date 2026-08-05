import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Configure Redis with fallback / error handling to prevent backend crash if Redis server is down
export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
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

redisClient.on('error', (err) => {
  if (isRedisConnected) {
    console.error('❌ [Redis] Error:', err.message);
  } else {
    // Silent initial connection retry log to prevent spamming if Redis isn't running locally yet
  }
});
