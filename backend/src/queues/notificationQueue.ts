import { Queue, ConnectionOptions } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const connectionOptions: ConnectionOptions = {
  url: redisUrl,
  maxRetriesPerRequest: null,
};

let queueInstance: Queue | null = null;

export const getNotificationQueue = () => {
  if (!queueInstance) {
    queueInstance = new Queue('push-notifications', {
      connection: connectionOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });
  }
  return queueInstance;
};

console.log('📦 [BullMQ] Notification queue configuration ready for', redisUrl);

