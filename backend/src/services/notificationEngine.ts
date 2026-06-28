import { Server } from 'socket.io';
import prisma from '../prisma';
import { triggerNotification, getOrCreatePreferences } from './notificationService';

// Function to format current date safely as YYYY-MM-DD in UTC/local
const getTodayDateStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

// Helper to determine current local time (hour and minute) in a given timezone
const getUserLocalTime = (timezone: string) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hourPart = parts.find(p => p.type === 'hour')?.value || '0';
    const minutePart = parts.find(p => p.type === 'minute')?.value || '0';
    return { hour: parseInt(hourPart), minute: parseInt(minutePart) };
  } catch (e) {
    const d = new Date();
    return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  }
};

export const startNotificationScheduler = (io: Server) => {
  console.log('⏰ LunaCare Notification Scheduler engine initialized.');

  // Run scheduler check every 30 minutes
  setInterval(async () => {
    const today = new Date();
    const todayStr = getTodayDateStr();

    try {
      // 1. Clean up expired notifications
      const deletedCount = await prisma.notification.deleteMany({
        where: {
          expiresAt: { lt: today }
        }
      });
      if (deletedCount.count > 0) {
        console.log(`🧹 Auto-cleaned ${deletedCount.count} expired notifications from database.`);
      }

      // 2. Fetch all users who completed onboarding
      let skip = 0;
      const batchSize = 500;
      let hasMore = true;

      while (hasMore) {
        const onboardings = await prisma.onboarding.findMany({
          where: { onboardingCompleted: true },
          select: {
            userId: true,
            lastPeriodDate: true,
            cycleLength: true,
            periodLength: true
          },
          take: batchSize,
          skip: skip
        });

        if (onboardings.length === 0) {
          hasMore = false;
          break;
        }

        const userIdsInBatch = onboardings.map(o => o.userId);
        
        // Fetch preferences for the batch of users
        const preferences = await prisma.notificationPreference.findMany({
          where: { userId: { in: userIdsInBatch } }
        });

        const preferencesMap = new Map(preferences.map(p => [p.userId, p]));

        // Fetch logs logged today for this batch of users
        const logsToday = await prisma.dailyLog.findMany({
          where: {
            userId: { in: userIdsInBatch },
            date: todayStr
          },
          select: { userId: true }
        });

        const loggedUserIds = new Set(logsToday.map(l => l.userId));

        // Fetch notifications created today to prevent duplicates
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const sentNotificationsToday = await prisma.notification.findMany({
          where: {
            userId: { in: userIdsInBatch },
            createdAt: { gte: todayStart }
          },
          select: { userId: true, type: true }
        });

        const sentSet = new Set(sentNotificationsToday.map(n => `${n.userId}:${n.type}`));

        for (const onboarding of onboardings) {
          const userId = onboarding.userId;
          let prefs = preferencesMap.get(userId);
          
          if (!prefs) {
            prefs = await getOrCreatePreferences(userId);
          }

          const localTime = getUserLocalTime(prefs.timezone);
          const [prefHour, prefMin] = prefs.preferredReminderTime.split(':').map(Number);

          // Calculate Cycle Status
          const lastPeriod = new Date(onboarding.lastPeriodDate);
          const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const currentCycleDay = (diffDays % onboarding.cycleLength) + 1;
          const daysUntilNext = onboarding.cycleLength - currentCycleDay;

          // ----------------------------------------------------
          // CRON ALERT 1: Daily log reminder (at preferred hour)
          // ----------------------------------------------------
          if (localTime.hour === (prefHour || 9) && !loggedUserIds.has(userId) && prefs.dailyReminder) {
            const hasSent = sentSet.has(`${userId}:DAILY_LOG_REMINDER`);
            if (!hasSent) {
              await triggerNotification(
                userId,
                'Daily Calibration Reminder',
                "Time to log today's health metrics. Keep your cycle models calibrated!",
                'DAILY_REMINDERS',
                'DAILY_LOG_REMINDER',
                { icon: 'edit_note', priority: 'MEDIUM' }
              );
            }
          }

          // ----------------------------------------------------
          // CRON ALERT 2: Evening missed log reminder (at 8:00 PM local time)
          // ----------------------------------------------------
          if (localTime.hour === 20 && !loggedUserIds.has(userId) && prefs.dailyReminder) {
            const hasSent = sentSet.has(`${userId}:EVENING_MISSED_LOG_REMINDER`);
            if (!hasSent) {
              await triggerNotification(
                userId,
                'Evening Sync Warning',
                'Your daily log is missing. Log now to prevent model calibration drift.',
                'DAILY_REMINDERS',
                'EVENING_MISSED_LOG_REMINDER',
                { icon: 'warning', priority: 'HIGH' }
              );
            }
          }

          // ----------------------------------------------------
          // CRON ALERT 3: Cycle phase reminders (Period starting, Ovulation, Fertile)
          // ----------------------------------------------------
          if (prefs.cycleReminder) {
            // Period starting tomorrow (1 day left)
            if (daysUntilNext === 1) {
              const hasSent = sentSet.has(`${userId}:PERIOD_STARTING_TOMORROW`);
              if (!hasSent) {
                await triggerNotification(
                  userId,
                  'Cycle Update Alert',
                  'Your next cycle is estimated to commence tomorrow. Ensure you are prepared.',
                  'CYCLE_NOTIFICATIONS',
                  'PERIOD_STARTING_TOMORROW',
                  { icon: 'calendar_month', priority: 'HIGH' }
                );
              }
            }

            // Period starts today
            if (currentCycleDay === 1) {
              const hasSent = sentSet.has(`${userId}:PERIOD_STARTED`);
              if (!hasSent) {
                await triggerNotification(
                  userId,
                  'New Cycle Commenced',
                  'Your menstrual phase is marked as active. Logging signals is recommended.',
                  'CYCLE_NOTIFICATIONS',
                  'PERIOD_STARTED',
                  { icon: 'water_drop', priority: 'HIGH' }
                );
              }
            }

            // Ovulation window starting
            const ovulationDay = onboarding.cycleLength - 14;
            if (currentCycleDay === ovulationDay - 4) {
              const hasSent = sentSet.has(`${userId}:OVULATION_WINDOW_BEGINS`);
              if (!hasSent) {
                await triggerNotification(
                  userId,
                  'Fertile Horizon Opening',
                  'Your estimated ovulation fertile window opens today. Projections are synchronized.',
                  'CYCLE_NOTIFICATIONS',
                  'OVULATION_WINDOW_BEGINS',
                  { icon: 'spa', priority: 'MEDIUM' }
                );
              }
            }

            // Peak Ovulation today
            if (currentCycleDay === ovulationDay) {
              const hasSent = sentSet.has(`${userId}:PEAK_OVULATION_TODAY`);
              if (!hasSent) {
                await triggerNotification(
                  userId,
                  'Peak Ovulation Forecast',
                  'Estrogen surge reached. Uterine indicators mark peak fertile day today.',
                  'CYCLE_NOTIFICATIONS',
                  'PEAK_OVULATION_TODAY',
                  { icon: 'sparkles', priority: 'HIGH' }
                );
              }
            }
          }
        }

        skip += batchSize;
        if (onboardings.length < batchSize) {
          hasMore = false;
        }
      }
    } catch (err) {
      console.error('Error running notification background checks:', err);
    }
  }, 1800000); // 30 minutes intervals
};
