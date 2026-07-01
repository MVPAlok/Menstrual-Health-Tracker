import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { SleepType, StressType, ActivityType, HydrationType } from '@prisma/client';

export const getOnboarding = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const onboarding = await prisma.onboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding records not found for this user.' });
    }

    return res.status(200).json(onboarding);
  } catch (error) {
    return res.status(500).json({ error: 'Server error retrieving onboarding data.' });
  }
};

export const calibrate = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const {
    lastPeriodDate,
    cycleLength,
    periodLength,
    healthGoals,
    lifestyle,
    notifications,
    onboardingCompleted,
  } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!lastPeriodDate || !cycleLength || !periodLength) {
    return res.status(400).json({ error: 'Required fields missing: lastPeriodDate, cycleLength, periodLength.' });
  }

  try {
    // Map string values to schema enum keys (safety match)
    const sleep = (lifestyle?.sleep || 'Restorative') as SleepType;
    const stress = (lifestyle?.stress || 'Moderate') as StressType;
    const activity = (lifestyle?.activity || 'Active') as ActivityType;
    const hydration = (lifestyle?.hydration || 'Average') as HydrationType;

    const onboarding = await prisma.onboarding.upsert({
      where: { userId },
      update: {
        lastPeriodDate,
        cycleLength: Number(cycleLength),
        periodLength: Number(periodLength),
        healthGoals: healthGoals || [],
        sleepQuality: sleep,
        stressLevel: stress,
        activityLevel: activity,
        hydrationLevel: hydration,
        notifyPeriod: notifications?.period !== false,
        notifyOvulation: notifications?.ovulation !== false,
        notifyInsights: notifications?.insights !== false,
        notifyWellnessTips: notifications?.wellnessTips === true,
        onboardingCompleted: onboardingCompleted === true,
      },
      create: {
        userId,
        lastPeriodDate,
        cycleLength: Number(cycleLength),
        periodLength: Number(periodLength),
        healthGoals: healthGoals || [],
        sleepQuality: sleep,
        stressLevel: stress,
        activityLevel: activity,
        hydrationLevel: hydration,
        notifyPeriod: notifications?.period !== false,
        notifyOvulation: notifications?.ovulation !== false,
        notifyInsights: notifications?.insights !== false,
        notifyWellnessTips: notifications?.wellnessTips === true,
        onboardingCompleted: onboardingCompleted === true,
      },
    });

    return res.status(200).json({
      message: 'Onboarding profile successfully calibrated.',
      onboarding,
    });
  } catch (error) {
    console.error('Calibration error: ', error);
    return res.status(500).json({ error: 'Server error persisting calibration data.' });
  }
};
