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
    }));

    return res.status(200).json(mappedLogs);
  } catch (error) {
    return res.status(500).json({ error: 'Server error retrieving logs range.' });
  }
};

export const saveLog = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { date, mood, sleep, energy, stress, symptoms, hydration, flowType } = req.body;

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
      },
    });

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
      },
    });
  } catch (error) {
    console.error('Error saving log:', error);
    return res.status(500).json({ error: 'Server error saving daily metrics.' });
  }
};
