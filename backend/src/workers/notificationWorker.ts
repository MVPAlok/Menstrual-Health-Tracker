import { Worker, Job } from 'bullmq';
import { connectionOptions } from '../queues/notificationQueue';
import { sendPushNotificationDirect } from '../services/notificationService';

export interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  actionUrl?: string;
}

export const startNotificationWorker = () => {
  const worker = new Worker<PushNotificationJobData>(
    'push-notifications',
    async (job: Job<PushNotificationJobData>) => {
      const { userId, title, body, actionUrl } = job.data;
      console.log(`⚙️ [BullMQ Worker] Processing push notification job #${job.id} for user:${userId}`);
      await sendPushNotificationDirect(userId, title, body, actionUrl);
    },
    { connection: connectionOptions }
  );

  worker.on('completed', (job) => {
    console.log(`✅ [BullMQ Worker] Job #${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [BullMQ Worker] Job #${job?.id} failed with error:`, err.message);
  });

  return worker;
};
