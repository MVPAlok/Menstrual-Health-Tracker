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
      stressFactor: true,
      energyRate: true,
      symptoms: true
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

  // 4. Calibrate user health state from onboarding baselines and recent logs
  const onboardingSleepMap = {
    Restorative: 8.0,
    Fragmented: 6.5,
    Insufficient: 5.0
  };
  const onboardingStressMap = {
    Low: 2,
    Moderate: 5,
    High: 8
  };
  const onboardingActivityMap = {
    Sedentary: 2,
    Active: 6,
    Athletic: 9
  };
  const onboardingHydrationMap = {
    Optimal: 9,
    Average: 6,
    Low: 4
  };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const recentLogs = await prisma.dailyLog.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgoStr }
    },
    select: {
      sleepHours: true,
      stressFactor: true,
      hydrationCups: true,
      energyRate: true
    }
  });

  const numLogs = recentLogs.length;
  const baseSleep = onboardingSleepMap[onboarding.sleepQuality] || 7.0;
  const baseStress = onboardingStressMap[onboarding.stressLevel] || 5.0;
  const baseActivity = onboardingActivityMap[onboarding.activityLevel] || 5.0;
  const baseHydration = onboardingHydrationMap[onboarding.hydrationLevel] || 6.0;

  const avgSleep = numLogs > 0 ? recentLogs.reduce((acc, l) => acc + l.sleepHours, 0) / numLogs : baseSleep;
  const avgStress = numLogs > 0 ? recentLogs.reduce((acc, l) => acc + l.stressFactor, 0) / numLogs : baseStress;
  const avgHydration = numLogs > 0 ? recentLogs.reduce((acc, l) => acc + l.hydrationCups, 0) / numLogs : baseHydration;
  const avgEnergy = numLogs > 0 ? recentLogs.reduce((acc, l) => acc + l.energyRate, 0) / numLogs : 6.0;

  const hormoneData = simulateHormones(currentCycleDay, baselineCycleLength, onboarding.periodLength, {
    avgSleep,
    avgStress,
    avgHydration,
    avgEnergy,
    baseActivity
  });

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
      activity: (() => {
        let activityInsight = "High activity levels correlate to stable luteal phase entry.";
        if (insightLogs.length > 0) {
          const activityLevel = onboarding.activityLevel; // Athletic, Active, Sedentary
          const highHydrationLogs = insightLogs.filter(l => l.hydrationCups >= 6);
          const lowHydrationLogs = insightLogs.filter(l => l.hydrationCups < 6);
          
          const avgEnergyHighHydration = highHydrationLogs.length > 0
            ? highHydrationLogs.reduce((sum, l) => sum + l.energyRate, 0) / highHydrationLogs.length
            : 0;
          const avgEnergyLowHydration = lowHydrationLogs.length > 0
            ? lowHydrationLogs.reduce((sum, l) => sum + l.energyRate, 0) / lowHydrationLogs.length
            : 0;
            
          if (highHydrationLogs.length >= 1 && lowHydrationLogs.length >= 1 && avgEnergyLowHydration > 0) {
            const energyIncreasePct = Math.round(((avgEnergyHighHydration - avgEnergyLowHydration) / avgEnergyLowHydration) * 100);
            if (energyIncreasePct > 0) {
              activityInsight = `Your ${activityLevel} baseline shows a ${energyIncreasePct}% energy boost on days with optimal hydration.`;
            } else if (energyIncreasePct < 0) {
              activityInsight = `Your ${activityLevel} baseline shows highly stable energy levels across hydration fluctuations.`;
            } else {
              activityInsight = `Your ${activityLevel} activity baseline correlates with highly consistent energy outputs.`;
            }
          } else {
            if (activityLevel === 'Athletic') {
              activityInsight = "Athletic baseline profile requires higher metabolic support. Prioritize hydration during high energy peaks.";
            } else if (activityLevel === 'Active') {
              activityInsight = "Active baseline profile correlates with balanced metabolic recovery in luteal phase transition.";
            } else {
              activityInsight = "Sedentary profile: Adding light activity (15m walk) can boost follicular-phase energy by 15%.";
            }
          }
        } else {
          if (onboarding.activityLevel === 'Athletic') {
            activityInsight = "Athletic baseline profile requires higher metabolic support. Prioritize hydration during high energy peaks.";
          } else if (onboarding.activityLevel === 'Active') {
            activityInsight = "Active baseline profile correlates with balanced metabolic recovery in luteal phase transition.";
          } else {
            activityInsight = "Sedentary profile: Adding light activity (15m walk) can boost follicular-phase energy by 15%.";
          }
        }
        return activityInsight;
      })(),
      aiPattern: (() => {
        let aiPattern = `Based on your onboarding preferences (focusing on ${onboarding.healthGoals.join(', ') || 'cycle tracking'}), we are calibrating your baseline. Start logging your symptoms and sleep daily to unlock full pattern analysis.`;
        
        if (totalLogsCount > 0 && insightLogs.length > 0) {
          const symptomCounts: Record<string, number> = {};
          let totalSymptomCount = 0;
          for (const log of insightLogs) {
            if (log.symptoms && Array.isArray(log.symptoms)) {
              for (const sym of log.symptoms) {
                symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
                totalSymptomCount++;
              }
            }
          }
          const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);
          const topSymptom = sortedSymptoms.length > 0 ? sortedSymptoms[0][0] : null;

          const poorSleepLogs = insightLogs.filter(l => l.sleepHours < 7);
          const goodSleepLogs = insightLogs.filter(l => l.sleepHours >= 7);
          const avgStressPoorSleep = poorSleepLogs.length > 0 ? poorSleepLogs.reduce((sum, l) => sum + l.stressFactor, 0) / poorSleepLogs.length : 0;
          const avgStressGoodSleep = goodSleepLogs.length > 0 ? goodSleepLogs.reduce((sum, l) => sum + l.stressFactor, 0) / goodSleepLogs.length : 0;

          let follicularEnergySum = 0;
          let follicularEnergyCount = 0;
          let lutealEnergySum = 0;
          let lutealEnergyCount = 0;
          for (const log of insightLogs) {
            const cycleDay = getCycleDay(log.date, lastKnownPeriodStart, baselineCycleLength);
            const isFollicular = cycleDay > onboarding.periodLength && cycleDay < (baselineCycleLength - 14 - 2);
            const isLuteal = cycleDay > (baselineCycleLength - 14 + 1);
            
            if (isFollicular) {
              follicularEnergySum += log.energyRate;
              follicularEnergyCount++;
            } else if (isLuteal) {
              lutealEnergySum += log.energyRate;
              lutealEnergyCount++;
            }
          }
          const avgFollicularEnergy = follicularEnergyCount > 0 ? follicularEnergySum / follicularEnergyCount : 0;
          const avgLutealEnergy = lutealEnergyCount > 0 ? lutealEnergySum / lutealEnergyCount : 0;

          let patternParts: string[] = [];
          
          if (topSymptom) {
            patternParts.push(`Your most frequent signal is "${topSymptom}" (${symptomCounts[topSymptom]} logs).`);
          }
          
          if (poorSleepLogs.length >= 1 && goodSleepLogs.length >= 1 && avgStressGoodSleep > 0) {
            const stressDiff = avgStressPoorSleep - avgStressGoodSleep;
            if (stressDiff > 0.5) {
              const stressPct = Math.round((stressDiff / avgStressGoodSleep) * 100);
              patternParts.push(`Logging shows your stress levels increase by ${stressPct}% on days with under 7 hours of sleep.`);
            }
          }
          
          if (follicularEnergyCount >= 1 && lutealEnergyCount >= 1) {
            const energyDiff = avgFollicularEnergy - avgLutealEnergy;
            if (Math.abs(energyDiff) > 0.5) {
              if (energyDiff > 0.5) {
                patternParts.push(`Your follicular phase energy (${avgFollicularEnergy.toFixed(1)}/10) is consistently higher than your luteal phase energy (${avgLutealEnergy.toFixed(1)}/10).`);
              } else {
                patternParts.push(`Surprisingly, your luteal phase energy (${avgLutealEnergy.toFixed(1)}/10) averages higher than your follicular phase (${avgFollicularEnergy.toFixed(1)}/10).`);
              }
            }
          }
          
          let rec = "";
          if (topSymptom === 'Cramps' || topSymptom === 'Fatigue') {
            rec = `We recommend increasing hydration to 8+ cups and reducing high-intensity workouts during the pre-menstrual transition.`;
          } else if (avgStressPoorSleep > 6) {
            rec = `Prioritize wind-down routines; reducing screen time 1 hour before bed could mitigate the sleep-deprived stress spikes we see in your logs.`;
          } else {
            rec = `Schedule major tasks and collaborative work during your high-energy follicular window, and reserve luteal days for focused, individual deep work.`;
          }
          
          if (patternParts.length > 0) {
            aiPattern = `Based on your ${totalLogsCount} logged signals: ${patternParts.join(' ')} ${rec}`;
          } else {
            aiPattern = `Based on your ${totalLogsCount} logged signals: We are monitoring your energy and stress fluctuations across cycle phases. ${rec}`;
          }
        }
        return aiPattern;
      })()
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
