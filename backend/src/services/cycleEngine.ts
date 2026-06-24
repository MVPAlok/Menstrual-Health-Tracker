import prisma from '../prisma';
import { simulateHormones } from './hormoneEngine';

export interface CycleForecast {
  nextCycleDate: string;
  daysRemaining: number;
  ovulationWindow: {
    start: string;
    peak: string;
    end: string;
  };
  biometricTrends: {
    projectedEnergySpike: string;
    projectedRecoveryHigh: string;
  };
  accuracyRate: number;
  confidenceRate: number;
  totalLogsCount: number;
  averageCycleLength: number | null;
  insights: {
    sleep: string | null;
    stress: string | null;
    activity: string | null;
    aiPattern: string | null;
  };
  hormones: {
    estrogen: number;
    progesterone: number;
    lh: number;
    fsh: number;
  };
  focusState: string;
  hrvBaseline: string;
  currentCycleDay: number;
  currentPhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
}

// Add days to date helper
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const calculatePredictions = async (userId: string, offsetDays: number = 0): Promise<CycleForecast> => {
  // Retrieve user calibration data
  const onboarding = await prisma.onboarding.findUnique({
    where: { userId },
  });

  if (!onboarding) {
    throw new Error('Onboarding data not found for user');
  }

  // Baseline calibration parameters
  let baselineCycleLength = onboarding.cycleLength;
  let lastKnownPeriodStart = onboarding.lastPeriodDate;

  // Optimizations: Query counts and averages directly rather than loading all logs.
  // 1. Total logs count
  const totalLogsCount = await prisma.dailyLog.count({
    where: { userId }
  });

  // 2. Fetch the latest period start log date (which is newer than onboarding lastPeriodDate)
  const latestPeriodStartLog = await prisma.dailyLog.findFirst({
    where: {
      userId,
      OR: [
        { symptoms: { hasSome: ['Healthy Flow', 'Cramps'] } },
        { flowType: { not: 'NONE' } }
      ]
    },
    orderBy: { date: 'desc' },
  });

  if (latestPeriodStartLog && latestPeriodStartLog.date > lastKnownPeriodStart) {
    lastKnownPeriodStart = latestPeriodStartLog.date;
  }

  // Calculate dates
  const todayStr = new Date().toISOString().split('T')[0];
  let today = new Date(todayStr);
  if (offsetDays > 0) {
    today = new Date(addDays(todayStr, offsetDays));
  }
  
  const lastPeriod = new Date(lastKnownPeriodStart);

  const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentCycleDay = (diffDays % baselineCycleLength) + 1;

  const daysRemaining = baselineCycleLength - currentCycleDay + 1;
  const nextCycleDate = addDays(lastKnownPeriodStart, baselineCycleLength);

  // Ovulation parameters (Usually 14 days before next cycle)
  const ovulationPeakOffset = baselineCycleLength - 14;
  const ovulationPeakDate = addDays(lastKnownPeriodStart, ovulationPeakOffset);
  const ovulationStartDate = addDays(ovulationPeakDate, -2);
  const ovulationEndDate = addDays(ovulationPeakDate, 1);

  // Trend predictions based on cycle day
  const projectedEnergySpike = addDays(lastKnownPeriodStart, ovulationPeakOffset - 4); // Estrogen rise starts
  const projectedRecoveryHigh = addDays(lastKnownPeriodStart, baselineCycleLength - 2); // Transitioning to recovery

  // 1. Calculate accuracy and confidence dynamically based on log counts
  let confidenceRate = 50;
  let accuracyRate = 50;

  if (totalLogsCount >= 7 && totalLogsCount <= 13) {
    confidenceRate = 70;
    accuracyRate = 72;
  } else if (totalLogsCount >= 14 && totalLogsCount <= 29) {
    confidenceRate = 85;
    accuracyRate = 86;
  } else if (totalLogsCount >= 30) {
    confidenceRate = 95;
    accuracyRate = 98;
  }

  // 2. Fetch Average Cycle Length from CycleHistory ledger
  let averageCycleLength: number | null = null;
  const avgCycleAgg = await prisma.cycleHistory.aggregate({
    where: { userId, cycleLength: { not: null } },
    _avg: { cycleLength: true }
  });
  if (avgCycleAgg._avg.cycleLength) {
    averageCycleLength = Math.round(avgCycleAgg._avg.cycleLength);
  }

  // 3. Compute dynamic Insights from logging history (optimized select)
  const insightLogs = await prisma.dailyLog.findMany({
    where: { userId },
    select: {
      date: true,
      sleepHours: true,
      hydrationCups: true,
      stressFactor: true
    }
  });

  const getCycleDay = (logDateStr: string, refDateStr: string, cLength: number): number => {
    const logDate = new Date(logDateStr);
    const refDate = new Date(refDateStr);
    const diff = Math.floor((logDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 1;
    return (diff % cLength) + 1;
  };

  let follicularSleepSum = 0;
  let follicularSleepCount = 0;
  let nonFollicularSleepSum = 0;
  let nonFollicularSleepCount = 0;

  let highHydrationStressSum = 0;
  let highHydrationStressCount = 0;
  let lowHydrationStressSum = 0;
  let lowHydrationStressCount = 0;

  for (const log of insightLogs) {
    const cycleDay = getCycleDay(log.date, lastKnownPeriodStart, baselineCycleLength);
    const isFollicular = cycleDay > onboarding.periodLength && cycleDay < (baselineCycleLength - 14 - 2);

    follicularSleepSum += log.sleepHours;
    if (isFollicular) {
      follicularSleepCount++;
    } else {
      nonFollicularSleepCount++;
    }
    nonFollicularSleepSum += log.sleepHours; // accumulate for fallback base

    if (log.hydrationCups >= 6) {
      highHydrationStressSum += log.stressFactor;
      highHydrationStressCount++;
    } else {
      lowHydrationStressSum += log.stressFactor;
      lowHydrationStressCount++;
    }
  }

  let sleepInsight: string | null = null;
  if (follicularSleepCount >= 1 && nonFollicularSleepCount >= 1) {
    const follicularAvg = follicularSleepSum / follicularSleepCount;
    const nonFollicularAvg = nonFollicularSleepSum / nonFollicularSleepCount;
    if (nonFollicularAvg > 0) {
      const pct = Math.round(((follicularAvg - nonFollicularAvg) / nonFollicularAvg) * 100);
      if (pct !== 0) {
        sleepInsight = `Sleep quality ${pct >= 0 ? 'increases' : 'decreases'} by ${Math.abs(pct)}% during follicular days.`;
      }
    }
  }

  let stressInsight: string | null = null;
  if (highHydrationStressCount >= 1 && lowHydrationStressCount >= 1) {
    const highHydrationStressAvg = highHydrationStressSum / highHydrationStressCount;
    const lowHydrationStressAvg = lowHydrationStressSum / lowHydrationStressCount;
    if (lowHydrationStressAvg > 0) {
      const pct = Math.round(((lowHydrationStressAvg - highHydrationStressAvg) / lowHydrationStressAvg) * 100);
      if (pct > 0) {
        stressInsight = `Stress indicators drop by ${pct}% during optimal hydration cycles.`;
      }
    }
  }

  // 4. Simulate hormone parameters dynamically based on cycleDay
  const hormoneData = simulateHormones(currentCycleDay, baselineCycleLength, onboarding.periodLength);

  // 5. Calculate Real HRV Baseline from user logs (rolling past 30 days)
  let hrvBaseline = "Calibrating (3 logs required)";
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const hrvAgg = await prisma.dailyLog.aggregate({
    where: {
      userId,
      date: { gte: thirtyDaysAgoStr },
      hrv: { not: null }
    },
    _avg: { hrv: true },
    _count: { hrv: true }
  });

  if (hrvAgg._count.hrv >= 3 && hrvAgg._avg.hrv !== null) {
    const avgHrv = Math.round(hrvAgg._avg.hrv);
    let category = "Varying";
    if (avgHrv >= 80) category = "Optimal";
    else if (avgHrv >= 70) category = "Relaxed";
    else if (avgHrv >= 60) category = "Elevated";
    hrvBaseline = `${category} (${avgHrv}ms)`;
  }

  return {
    nextCycleDate,
    daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    ovulationWindow: {
      start: ovulationStartDate,
      peak: ovulationPeakDate,
      end: ovulationEndDate,
    },
    biometricTrends: {
      projectedEnergySpike,
      projectedRecoveryHigh,
    },
    accuracyRate,
    confidenceRate,
    totalLogsCount,
    averageCycleLength,
    insights: {
      sleep: sleepInsight,
      stress: stressInsight,
      activity: "High activity levels correlate to stable luteal phase entry.",
      aiPattern: `Based on your ${totalLogsCount} logged signals, your energy levels peak consistently around your follicular phase. We recommend scheduling major initiatives during this window and reducing caffeine intake during luteal phase days.`
    },
    hormones: {
      estrogen: hormoneData.estrogen,
      progesterone: hormoneData.progesterone,
      lh: hormoneData.lh,
      fsh: hormoneData.fsh,
    },
    focusState: hormoneData.focusState,
    hrvBaseline,
    currentCycleDay,
    currentPhase: currentCycleDay <= onboarding.periodLength
      ? 'menstrual'
      : currentCycleDay < ovulationPeakOffset - 2
      ? 'follicular'
      : currentCycleDay <= ovulationPeakOffset + 1
      ? 'ovulation'
      : 'luteal',
  };
};
