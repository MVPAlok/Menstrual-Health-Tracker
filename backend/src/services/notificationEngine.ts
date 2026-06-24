import { Server } from 'socket.io';
import prisma from '../prisma';

export const startNotificationScheduler = (io: Server) => {
  // Check alert queues every hour
  console.log('⏰ LunaCare Notification Scheduler initialized.');
  
  setInterval(async () => {
    const today = new Date();

    try {
      let skip = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        // Fetch only the needed fields for completed onboarding records in batches
        const onboardings = await prisma.onboarding.findMany({
          where: {
            onboardingCompleted: true,
            OR: [
              { notifyPeriod: true },
              { notifyOvulation: true }
            ]
          },
          select: {
            userId: true,
            lastPeriodDate: true,
            cycleLength: true,
            notifyPeriod: true,
            notifyOvulation: true
          },
          take: batchSize,
          skip: skip
        });

        if (onboardings.length === 0) {
          hasMore = false;
          break;
        }

        // Optimize N+1: Query all notifications sent today for the batch of users at once
        const userIdsInBatch = onboardings.map(o => o.userId);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const sentNotificationsToday = await prisma.notification.findMany({
          where: {
            userId: { in: userIdsInBatch },
            createdAt: { gte: todayStart }
          },
          select: {
            userId: true,
            type: true
          }
        });

        // Set lookup structure: O(1) lookup in memory instead of database queries
        const sentSet = new Set(sentNotificationsToday.map(n => `${n.userId}:${n.type}`));

        for (const onboarding of onboardings) {
          const lastPeriod = new Date(onboarding.lastPeriodDate);
          const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const currentCycleDay = (diffDays % onboarding.cycleLength) + 1;
          const daysUntilNext = onboarding.cycleLength - currentCycleDay;

          // Push Alert 1: Period starting in 2 days
          if (daysUntilNext === 2 && onboarding.notifyPeriod) {
            const hasSent = sentSet.has(`${onboarding.userId}:PERIOD_REMINDER`);

            if (!hasSent) {
              const msg = 'LunaCare Insight: Your cycle reset commencement is projected in 48 hours. Focus on restful recovery.';
              await prisma.notification.create({
                data: {
                  userId: onboarding.userId,
                  type: 'PERIOD_REMINDER',
                  message: msg,
                  triggerTime: today,
                },
              });

              // Emit instant socket message
              io.to(`user:${onboarding.userId}`).emit('notification:push', {
                title: 'Upcoming Period Flow',
                body: msg,
                timestamp: today,
              });
              console.log(`✉️ Alert dispatched to user:${onboarding.userId} - Period starting in 2 days.`);
            }
          }

          // Push Alert 2: Ovulation Day Peak
          const ovulationDay = onboarding.cycleLength - 14;
          if (currentCycleDay === ovulationDay && onboarding.notifyOvulation) {
            const hasSent = sentSet.has(`${onboarding.userId}:OVULATION_ALERT`);

            if (!hasSent) {
              const msg = 'LunaCare Alert: Estrogen peak and LH hormone surge detected. Peak stamina state active.';
              await prisma.notification.create({
                data: {
                  userId: onboarding.userId,
                  type: 'OVULATION_ALERT',
                  message: msg,
                  triggerTime: today,
                },
              });

              io.to(`user:${onboarding.userId}`).emit('notification:push', {
                title: 'Fertility Horizon Reached',
                body: msg,
                timestamp: today,
              });
              console.log(`✉️ Alert dispatched to user:${onboarding.userId} - Ovulation day reached.`);
            }
          }
        }

        skip += batchSize;
        if (onboardings.length < batchSize) {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error running notification scheduler check:', error);
    }
  }, 3600000); // 1 hour interval check
};
