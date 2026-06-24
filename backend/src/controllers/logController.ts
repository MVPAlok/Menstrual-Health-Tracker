import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { Mood, MenstrualFlow } from '@prisma/client';

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
