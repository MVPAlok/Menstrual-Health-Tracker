import { Server } from 'socket.io';
import prisma from '../prisma';

export const startNotificationScheduler = (io: Server) => {
  // Check alert queues every hour
  console.log('⏰ LunaCare Notification Scheduler initialized.');
  
  setInterval(async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    try {
      // Find users with completed onboarding
      const users = await prisma.user.findMany({
        include: { onboarding: true },
      });

      for (const user of users) {
        if (!user.onboarding || !user.onboarding.onboardingCompleted) continue;

        const lastPeriod = new Date(user.onboarding.lastPeriodDate);
        const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const currentCycleDay = (diffDays % user.onboarding.cycleLength) + 1;
        const daysUntilNext = user.onboarding.cycleLength - currentCycleDay;

        // Push Alert 1: Period starting in 2 days
        if (daysUntilNext === 2 && user.onboarding.notifyPeriod) {
          const msg = 'LunaCare Insight: Your cycle reset commencement is projected in 48 hours. Focus on restful recovery.';
          
          // Check if notification already sent today to avoid spamming
          const exists = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'PERIOD_REMINDER',
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          });

          if (!exists) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                type: 'PERIOD_REMINDER',
                message: msg,
                triggerTime: today,
              },
            });

            // Emit instant socket message
            io.to(`user:${user.id}`).emit('notification:push', {
              title: 'Upcoming Period Flow',
              body: msg,
              timestamp: today,
            });
            console.log(`✉️ Alert dispatched to user:${user.id} - Period starting in 2 days.`);
          }
        }

        // Push Alert 2: Ovulation Day Peak
        const ovulationDay = user.onboarding.cycleLength - 14;
        if (currentCycleDay === ovulationDay && user.onboarding.notifyOvulation) {
          const msg = 'LunaCare Alert: Estrogen peak and LH hormone surge detected. Peak stamina state active.';

          const exists = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'OVULATION_ALERT',
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          });

          if (!exists) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                type: 'OVULATION_ALERT',
                message: msg,
                triggerTime: today,
              },
            });

            io.to(`user:${user.id}`).emit('notification:push', {
              title: 'Fertility Horizon Reached',
              body: msg,
              timestamp: today,
            });
            console.log(`✉️ Alert dispatched to user:${user.id} - Ovulation day reached.`);
          }
        }
      }
    } catch (error) {
      console.error('Error running notification scheduler check:', error);
    }
  }, 3600000); // 1 hour interval check
};
