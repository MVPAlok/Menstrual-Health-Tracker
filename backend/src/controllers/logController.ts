import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { Mood, MenstrualFlow } from '@prisma/client';
import { triggerNotification } from '../services/notificationService';

export const getLogsRange = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { start, end } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!start || !end) {
    return res.status(400).json({ error: 'Query parameters start and end (YYYY-MM-DD) are required.' });
  }

  try {
    const logs = await prisma.dailyLog.findMany({
      where: {
        userId,
        date: {
          gte: String(start),
          lte: String(end),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Map DB logs structure back to Frontend representation
    const mappedLogs = logs.map((log: any) => ({
      date: log.date,
      mood: log.mood,
      sleep: log.sleepHours,
      energy: log.energyRate,
      stress: log.stressFactor,
      symptoms: log.symptoms,
      hydration: log.hydrationCups,
      flowType: log.flowType,
      hrv: log.hrv,
    }));

    return res.status(200).json(mappedLogs);
  } catch (error) {
    return res.status(500).json({ error: 'Server error retrieving logs range.' });
  }
};

export const saveLog = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { date, mood, sleep, energy, stress, symptoms, hydration, flowType, hrv } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!date) {
    return res.status(400).json({ error: 'Log date parameter is required.' });
  }

  try {
    // Map standard spacing to mapped db values e.g. "Low Energy" -> LowEnergy enum
    let resolvedMood: Mood = Mood.Balanced;
    if (mood === 'Low Energy') {
      resolvedMood = Mood.LowEnergy;
    } else if (Object.values(Mood).includes(mood)) {
      resolvedMood = mood as Mood;
    }

    // Map flowType string to MenstrualFlow enum value safely
    let resolvedFlow: MenstrualFlow = MenstrualFlow.NONE;
    if (flowType && Object.values(MenstrualFlow).includes(flowType)) {
      resolvedFlow = flowType as MenstrualFlow;
    }

    const log = await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        mood: resolvedMood,
        sleepHours: sleep !== undefined ? Number(sleep) : 7.0,
        energyRate: energy !== undefined ? Number(energy) : 7,
        stressFactor: stress !== undefined ? Number(stress) : 3,
        symptoms: symptoms || [],
        hydrationCups: hydration !== undefined ? Number(hydration) : 4,
        flowType: resolvedFlow,
        hrv: hrv !== undefined && hrv !== null ? Number(hrv) : null,
      },
      create: {
        userId,
        date,
        mood: resolvedMood,
        sleepHours: sleep !== undefined ? Number(sleep) : 7.0,
        energyRate: energy !== undefined ? Number(energy) : 7,
        stressFactor: stress !== undefined ? Number(stress) : 3,
        symptoms: symptoms || [],
        hydrationCups: hydration !== undefined ? Number(hydration) : 4,
        flowType: resolvedFlow,
        hrv: hrv !== undefined && hrv !== null ? Number(hrv) : null,
      },
    });

    // Trigger dynamic notifications based on log metrics
    try {
      const totalLogsCount = await prisma.dailyLog.count({ where: { userId } });

      // Achievement Notifications
      if (totalLogsCount === 1) {
        await triggerNotification(
          userId,
          'First Log Completed',
          'Congratulations on registering your first health telemetry log! Your journey begins.',
          'ACHIEVEMENT_NOTIFICATIONS',
          'FIRST_LOG_COMPLETED',
          { icon: 'workspace_premium', priority: 'HIGH' }
        );
      } else if (totalLogsCount === 7) {
        await triggerNotification(
          userId,
          '7-Day Streak Active',
          'Consistent logging unlocked! 7 days of biological history mapped.',
          'ACHIEVEMENT_NOTIFICATIONS',
          'STREAK_7_DAY',
          { icon: 'military_tech', priority: 'HIGH' }
        );
      } else if (totalLogsCount === 14) {
        await triggerNotification(
          userId,
          '14-Day Streak Achieved',
          'Excellent habit! 14 days of cycle intelligence calibration complete.',
          'ACHIEVEMENT_NOTIFICATIONS',
          'STREAK_14_DAY',
          { icon: 'stars', priority: 'HIGH' }
        );
      } else if (totalLogsCount === 30) {
        await triggerNotification(
          userId,
          '30-Day Consistency Unlocked',
          'True sanctuary alignment! 30 days of data calibration.',
          'ACHIEVEMENT_NOTIFICATIONS',
          'STREAK_30_DAY',
          { icon: 'shield_heart', priority: 'HIGH' }
        );
      }

      // AI Calibration Notifications
      if (totalLogsCount === 3) {
        await triggerNotification(
          userId,
          'AI Calibration Calibrated',
          "Luna Care's neural engine has successfully established your biological baseline.",
          'AI_NOTIFICATIONS',
          'AI_CALIBRATION_IMPROVED',
          { icon: 'psychology', priority: 'HIGH' }
        );
      }

      // Health Notifications
      if (log.hydrationCups < 5) {
        await triggerNotification(
          userId,
          'Hydration Below Goal',
          `Your water intake is below today's target (${log.hydrationCups} / 8 cups). Consider drinking 2 more cups.`,
          'HEALTH_NOTIFICATIONS',
          'HYDRATION_BELOW_GOAL',
          { icon: 'water_drop', priority: 'MEDIUM' }
        );
      } else if (log.hydrationCups >= 8) {
        await triggerNotification(
          userId,
          'Hydration Target Met',
          'Excellent! You met your hydration goal of 8 cups today.',
          'HEALTH_NOTIFICATIONS',
          'RECOVERY_IMPROVEMENT',
          { icon: 'local_drink', priority: 'LOW' }
        );
      }

      if (log.sleepHours < 7.0) {
        await triggerNotification(
          userId,
          'Low Sleep Duration',
          `Sleep duration registered at ${log.sleepHours} hours is below the recommended 7 hours. Rest is advised.`,
          'HEALTH_NOTIFICATIONS',
          'LOW_SLEEP_QUALITY',
          { icon: 'bedtime', priority: 'MEDIUM' }
        );
      }

      if (log.stressFactor >= 7) {
        await triggerNotification(
          userId,
          'High Stress Detected',
          'Nervous system load indicators register high stress levels. Prioritize grounding routines.',
          'HEALTH_NOTIFICATIONS',
          'HIGH_STRESS_TREND',
          { icon: 'bolt', priority: 'HIGH' }
        );
      }

      if (log.hrv && log.hrv < 50) {
        await triggerNotification(
          userId,
          'Low HRV Baseline',
          `HRV baseline dropped to ${log.hrv}ms today. Your body is calling for active recovery.`,
          'HEALTH_NOTIFICATIONS',
          'LOW_HRV',
          { icon: 'heart_pulse', priority: 'HIGH' }
        );
      }

    } catch (err) {
      console.error('Failed to trigger log-related notifications:', err);
    }

    // CycleHistory Completion Ledger Hook
    if (resolvedFlow === MenstrualFlow.LIGHT || resolvedFlow === MenstrualFlow.MEDIUM || resolvedFlow === MenstrualFlow.HEAVY) {
      const fifteenDaysAgo = new Date(new Date(date).getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const recentCycle = await prisma.cycleHistory.findFirst({
        where: {
          userId,
          startDate: { gte: fifteenDaysAgo },
        },
      });

      if (!recentCycle) {
        // Close active cycle
        const openCycle = await prisma.cycleHistory.findFirst({
          where: { userId, endDate: null },
        });

        if (openCycle) {
          const startDateObj = new Date(openCycle.startDate);
          const logDateObj = new Date(date);
          const diffDays = Math.max(1, Math.round((logDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)));

          await prisma.cycleHistory.update({
            where: { id: openCycle.id },
            data: {
              endDate: date,
              cycleLength: diffDays,
            },
          });
        }

        // Open new cycle
        await prisma.cycleHistory.create({
          data: {
            userId,
            startDate: date,
          },
        });
      }
    }

    return res.status(200).json({
      message: 'Daily telemetry log saved successfully.',
      log: {
        date: log.date,
        mood: log.mood,
        sleep: log.sleepHours,
        energy: log.energyRate,
        stress: log.stressFactor,
        symptoms: log.symptoms,
        hydration: log.hydrationCups,
        flowType: log.flowType,
        hrv: log.hrv,
      },
    });
  } catch (error) {
    console.error('Error saving log:', error);
    return res.status(500).json({ error: 'Server error saving daily metrics.' });
  }
};

export const deleteLog = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { date } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required.' });
  }

  try {
    await prisma.dailyLog.delete({
      where: {
        userId_date: {
          userId,
          date
        }
      }
    });

    return res.status(200).json({ message: 'Daily telemetry log deleted successfully.' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'No log record found for this date.' });
    }
    console.error('Error deleting log:', error);
    return res.status(500).json({ error: 'Server error deleting daily metrics.' });
  }
};

export const duplicateLog = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { date } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!date) {
    return res.status(400).json({ error: 'Target date parameter is required.' });
  }

  try {
    const precedingLog = await prisma.dailyLog.findFirst({
      where: {
        userId,
        date: { lt: date }
      },
      orderBy: { date: 'desc' }
    });

    if (!precedingLog) {
      return res.status(404).json({ error: 'No preceding telemetry logs found to duplicate.' });
    }

    const duplicated = await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId,
          date
        }
      },
      update: {
        mood: precedingLog.mood,
        sleepHours: precedingLog.sleepHours,
        energyRate: precedingLog.energyRate,
        stressFactor: precedingLog.stressFactor,
        symptoms: precedingLog.symptoms,
        hydrationCups: precedingLog.hydrationCups,
        flowType: precedingLog.flowType,
        hrv: precedingLog.hrv
      },
      create: {
        userId,
        date,
        mood: precedingLog.mood,
        sleepHours: precedingLog.sleepHours,
        energyRate: precedingLog.energyRate,
        stressFactor: precedingLog.stressFactor,
        symptoms: precedingLog.symptoms,
        hydrationCups: precedingLog.hydrationCups,
        flowType: precedingLog.flowType,
        hrv: precedingLog.hrv
      }
    });

    return res.status(200).json({
      message: 'Telemetry duplicated successfully.',
      log: {
        date: duplicated.date,
        mood: duplicated.mood,
        sleep: duplicated.sleepHours,
        energy: duplicated.energyRate,
        stress: duplicated.stressFactor,
        symptoms: duplicated.symptoms,
        hydration: duplicated.hydrationCups,
        flowType: duplicated.flowType,
        hrv: duplicated.hrv
      }
    });
  } catch (error: any) {
    console.error('Error duplicating log:', error);
    return res.status(500).json({ error: 'Server error duplicating daily metrics.' });
  }
};
