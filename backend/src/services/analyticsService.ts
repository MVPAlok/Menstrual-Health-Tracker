import prisma from '../prisma';

export interface ProfileStats {
  trackingSince: string;
  cyclesRecorded: number;
  averageCycleLength: number;
  averagePeriodLength: number;
  shortestCycleLength: number | null;
  longestCycleLength: number | null;
  currentStreak: number;
  longestStreak: number;
  logsSubmitted: number;
  completionRate: number;
  predictionAccuracy: number;
  averageSleep: number;
  averageStress: number;
  averageHydration: number;
  averageHrv: number;
  moodDistribution: Record<string, number>;
}

export interface CycleComparison {
  current: {
    sleep: number;
    stress: number;
    hydration: number;
    hrv: number;
    cycleLength: number;
    periodLength: number;
    loggedDays: number;
    topSymptoms: string[];
  };
  previous: {
    sleep: number;
    stress: number;
    hydration: number;
    hrv: number;
    cycleLength: number;
    periodLength: number;
    loggedDays: number;
    topSymptoms: string[];
  } | null;
  comparison: {
    sleepDiff: number;
    stressDiff: number;
    hydrationDiff: number;
    hrvDiff: number;
    cycleLengthDiff: number;
    periodLengthDiff: number;
  } | null;
}

// Helper to calculate streaks
export const calculateStreaks = (logDates: string[]): { currentStreak: number; longestStreak: number } => {
  if (logDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Parse and sort unique dates
  const uniqueDates = Array.from(new Set(logDates)).sort();
  const timestamps = uniqueDates.map(d => new Date(d).getTime());

  let longestStreak = 0;
  let currentStreak = 0;
  let activeStreak = 0;
  let lastTimestamp: number | null = null;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (const ts of timestamps) {
    if (lastTimestamp === null) {
      activeStreak = 1;
    } else {
      const diff = Math.round((ts - lastTimestamp) / MS_PER_DAY);
      if (diff === 1) {
        activeStreak++;
      } else if (diff > 1) {
        if (activeStreak > longestStreak) {
          longestStreak = activeStreak;
        }
        activeStreak = 1;
      }
    }
    lastTimestamp = ts;
  }
  if (activeStreak > longestStreak) {
    longestStreak = activeStreak;
  }

  // Check if current streak is active (ends today or yesterday)
  const todayUTC = new Date(new Date().toISOString().split('T')[0]);
  const yesterdayUTC = new Date(todayUTC);
  yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);

  const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);

  if (lastDate.getTime() === todayUTC.getTime() || lastDate.getTime() === yesterdayUTC.getTime()) {
    // Current streak is active and is equal to the last block length
    // Let's count backwards from the last logged date
    let tempCurrent = 1;
    for (let i = uniqueDates.length - 1; i > 0; i--) {
      const d1 = new Date(uniqueDates[i]).getTime();
      const d2 = new Date(uniqueDates[i - 1]).getTime();
      const diff = Math.round((d1 - d2) / MS_PER_DAY);
      if (diff === 1) {
        tempCurrent++;
      } else {
        break;
      }
    }
    currentStreak = tempCurrent;
  } else {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
};

export const getProfileStats = async (userId: string): Promise<ProfileStats> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true }
  });

  if (!user) throw new Error('User not found');

  const onboarding = await prisma.onboarding.findUnique({
    where: { userId }
  });

  if (!onboarding) throw new Error('Onboarding settings not found');

  // 1. Fetch completed cycles
  const completedCycles = await prisma.cycleHistory.findMany({
    where: { userId, cycleLength: { not: null } },
    orderBy: { startDate: 'asc' }
  });

  const cyclesRecorded = completedCycles.length;
  
  let averageCycleLength = onboarding.cycleLength;
  let shortestCycleLength: number | null = null;
  let longestCycleLength: number | null = null;

  if (cyclesRecorded > 0) {
    const lengths = completedCycles.map(c => c.cycleLength as number);
    averageCycleLength = Math.round(lengths.reduce((a, b) => a + b, 0) / cyclesRecorded);
    shortestCycleLength = Math.min(...lengths);
    longestCycleLength = Math.max(...lengths);
  }

  // 2. Fetch all logs
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { date: 'asc' }
  });

  const logsSubmitted = logs.length;

  // Streaks
  const logDates = logs.map(l => l.date);
  const { currentStreak, longestStreak } = calculateStreaks(logDates);

  // Completion Rate
  const registrationDate = new Date(user.createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - registrationDate.getTime());
  const daysSinceStart = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const completionRate = Math.min(100, Math.round((logsSubmitted / daysSinceStart) * 100));

  // Biometric Averages
  let averageSleep = onboarding.sleepQuality === 'Restorative' ? 8.0 : onboarding.sleepQuality === 'Fragmented' ? 6.5 : 5.0;
  let averageStress = onboarding.stressLevel === 'Low' ? 2 : onboarding.stressLevel === 'Moderate' ? 5 : 8;
  let averageHydration = onboarding.hydrationLevel === 'Optimal' ? 8 : onboarding.hydrationLevel === 'Average' ? 5 : 3;
  let averageHrv = 70;

  if (logsSubmitted > 0) {
    averageSleep = Math.round((logs.reduce((acc, l) => acc + l.sleepHours, 0) / logsSubmitted) * 10) / 10;
    averageStress = Math.round((logs.reduce((acc, l) => acc + l.stressFactor, 0) / logsSubmitted) * 10) / 10;
    averageHydration = Math.round((logs.reduce((acc, l) => acc + l.hydrationCups, 0) / logsSubmitted) * 10) / 10;
    
    const hrvLogs = logs.filter(l => l.hrv !== null && l.hrv !== undefined);
    if (hrvLogs.length > 0) {
      averageHrv = Math.round(hrvLogs.reduce((acc, l) => acc + (l.hrv as number), 0) / hrvLogs.length);
    }
  }

  // Mood Distribution
  const moodDistribution: Record<string, number> = {
    Radiant: 0,
    Balanced: 0,
    Sensitive: 0,
    'Low Energy': 0,
    Anxious: 0
  };

  logs.forEach(l => {
    // Mood map
    const moodStr = l.mood === 'LowEnergy' ? 'Low Energy' : l.mood;
    if (moodStr in moodDistribution) {
      moodDistribution[moodStr]++;
    }
  });

  // Convert distribution to percentages if logs exist
  if (logsSubmitted > 0) {
    Object.keys(moodDistribution).forEach(k => {
      moodDistribution[k] = Math.round((moodDistribution[k] / logsSubmitted) * 100);
    });
  } else {
    moodDistribution['Balanced'] = 100;
  }

  // Prediction accuracy based on consistency and logs count
  let predictionAccuracy = 50;
  if (logsSubmitted >= 7 && logsSubmitted <= 13) predictionAccuracy = 72;
  else if (logsSubmitted >= 14 && logsSubmitted <= 29) predictionAccuracy = 86;
  else if (logsSubmitted >= 30) predictionAccuracy = 98;

  return {
    trackingSince: registrationDate.toISOString().split('T')[0],
    cyclesRecorded,
    averageCycleLength,
    averagePeriodLength: onboarding.periodLength,
    shortestCycleLength,
    longestCycleLength,
    currentStreak,
    longestStreak,
    logsSubmitted,
    completionRate,
    predictionAccuracy,
    averageSleep,
    averageStress,
    averageHydration,
    averageHrv,
    moodDistribution
  };
};

export const getCycleComparison = async (userId: string): Promise<CycleComparison> => {
  const onboarding = await prisma.onboarding.findUnique({
    where: { userId }
  });
  if (!onboarding) throw new Error('Onboarding record not found');

  // Fetch cycles
  const cycles = await prisma.cycleHistory.findMany({
    where: { userId },
    orderBy: { startDate: 'desc' },
    take: 2
  });

  const todayStr = new Date().toISOString().split('T')[0];

  let currentCycleStart = onboarding.lastPeriodDate;
  let currentCycleEnd = todayStr;
  let prevCycleStart = '';
  let prevCycleEnd = '';
  let prevCycleLength = onboarding.cycleLength;

  if (cycles.length > 0) {
    currentCycleStart = cycles[0].startDate;
    // Current cycle may have ended or still ongoing
    currentCycleEnd = cycles[0].endDate || todayStr;

    if (cycles.length > 1) {
      prevCycleStart = cycles[1].startDate;
      prevCycleEnd = cycles[1].endDate || cycles[0].startDate;
      prevCycleLength = cycles[1].cycleLength || onboarding.cycleLength;
    }
  }

  // If no previous cycle exists in ledger, project one based on onboarding
  if (!prevCycleStart) {
    const defaultCycleDays = onboarding.cycleLength;
    const prevStart = new Date(currentCycleStart);
    prevStart.setDate(prevStart.getDate() - defaultCycleDays);
    prevCycleStart = prevStart.toISOString().split('T')[0];
    prevCycleEnd = currentCycleStart;
    prevCycleLength = defaultCycleDays;
  }

  // Fetch logs for current cycle
  const currentLogs = await prisma.dailyLog.findMany({
    where: {
      userId,
      date: { gte: currentCycleStart, lte: currentCycleEnd }
    }
  });

  // Fetch logs for previous cycle
  const prevLogs = await prisma.dailyLog.findMany({
    where: {
      userId,
      date: { gte: prevCycleStart, lte: prevCycleEnd }
    }
  });

  // Calculate stats helper
  const computeStats = (cycleLogs: any[], cycleDays: number, onboardingPeriod: number) => {
    const loggedCount = cycleLogs.length;
    if (loggedCount === 0) {
      return {
        sleep: 7.5,
        stress: 3,
        hydration: 4,
        hrv: 70,
        cycleLength: cycleDays,
        periodLength: onboardingPeriod,
        loggedDays: 0,
        topSymptoms: [] as string[]
      };
    }

    const sleep = Math.round((cycleLogs.reduce((sum, l) => sum + l.sleepHours, 0) / loggedCount) * 10) / 10;
    const stress = Math.round((cycleLogs.reduce((sum, l) => sum + l.stressFactor, 0) / loggedCount) * 10) / 10;
    const hydration = Math.round((cycleLogs.reduce((sum, l) => sum + l.hydrationCups, 0) / loggedCount) * 10) / 10;
    
    const hrvLogs = cycleLogs.filter(l => l.hrv !== null);
    const hrv = hrvLogs.length > 0
      ? Math.round(hrvLogs.reduce((sum, l) => sum + l.hrv, 0) / hrvLogs.length)
      : 70;

    const periodLength = cycleLogs.filter(l => l.flowType && l.flowType !== 'NONE').length || onboardingPeriod;

    // Top symptoms
    const symptomMap: Record<string, number> = {};
    cycleLogs.forEach(l => {
      l.symptoms.forEach((s: string) => {
        symptomMap[s] = (symptomMap[s] || 0) + 1;
      });
    });
    const topSymptoms = Object.entries(symptomMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    return {
      sleep,
      stress,
      hydration,
      hrv,
      cycleLength: cycleDays,
      periodLength,
      loggedDays: loggedCount,
      topSymptoms
    };
  };

  const getDaysDiff = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    return Math.max(1, Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));
  };

  const currentCycleDaysCount = getDaysDiff(currentCycleStart, currentCycleEnd);
  const prevCycleDaysCount = prevCycleEnd ? getDaysDiff(prevCycleStart, prevCycleEnd) : prevCycleLength;

  const currentStats = computeStats(currentLogs, currentCycleDaysCount, onboarding.periodLength);
  const prevStats = computeStats(prevLogs, prevCycleDaysCount, onboarding.periodLength);

  const comparison = {
    sleepDiff: Math.round((currentStats.sleep - prevStats.sleep) * 10) / 10,
    stressDiff: Math.round((currentStats.stress - prevStats.stress) * 10) / 10,
    hydrationDiff: Math.round((currentStats.hydration - prevStats.hydration) * 10) / 10,
    hrvDiff: currentStats.hrv - prevStats.hrv,
    cycleLengthDiff: currentStats.cycleLength - prevStats.cycleLength,
    periodLengthDiff: currentStats.periodLength - prevStats.periodLength
  };

  return {
    current: currentStats,
    previous: prevStats,
    comparison
  };
};

export interface RecentChanges {
  stressDiffPct: number;
  hydrationDiffPct: number;
  sleepDiffPct: number;
  confidenceDiffPct: number;
  streakIncrement: number;
}

export const getRecentChanges = async (userId: string): Promise<RecentChanges> => {
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 2
  });

  const stats = await getProfileStats(userId);

  if (logs.length < 2) {
    return {
      stressDiffPct: 0,
      hydrationDiffPct: 0,
      sleepDiffPct: 0,
      confidenceDiffPct: 0,
      streakIncrement: stats.currentStreak > 0 ? 1 : 0
    };
  }

  const latest = logs[0];
  const preceding = logs[1];

  const computePctDiff = (val1: number, val2: number) => {
    if (val2 === 0) return val1 > 0 ? 100 : 0;
    return Math.round(((val1 - val2) / val2) * 100);
  };

  const stressDiffPct = computePctDiff(latest.stressFactor, preceding.stressFactor);
  const hydrationDiffPct = computePctDiff(latest.hydrationCups, preceding.hydrationCups);
  const sleepDiffPct = computePctDiff(latest.sleepHours, preceding.sleepHours);

  const getConfidenceForLogsCount = (count: number) => {
    if (count >= 30) return 95;
    if (count >= 14) return 85;
    if (count >= 7) return 70;
    return 50;
  };

  const prevConfidence = getConfidenceForLogsCount(stats.logsSubmitted - 1);
  const currentConfidence = getConfidenceForLogsCount(stats.logsSubmitted);
  const confidenceDiffPct = currentConfidence - prevConfidence;

  return {
    stressDiffPct,
    hydrationDiffPct,
    sleepDiffPct,
    confidenceDiffPct,
    streakIncrement: stats.currentStreak > 0 ? 1 : 0
  };
};
