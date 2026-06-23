import prisma from '../prisma';

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
}

// Add days to date helper
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const calculatePredictions = async (userId: string): Promise<CycleForecast> => {
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

  // Query actual daily log history to adjust predictions dynamically
  // Find logs where symptoms contains 'Healthy Flow' or 'Cramps' (indicating start of menstruation)
  // Or look at logs that marked a mood shift on dates far from onboarding.lastPeriodDate.
  // For standard calculations, we fetch the actual latest daily log to see current progression.
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 30, // Last 30 logs
  });

  // Dynamic Calculation: If the user has logged a period flow recently, adapt to it
  // Look for logs containing 'Healthy Flow' or 'Cramps'
  const periodStartLogs = logs
    .filter((log: any) => log.symptoms.includes('Healthy Flow') || log.symptoms.includes('Cramps'))
    .sort((a: any, b: any) => b.date.localeCompare(a.date));

  if (periodStartLogs.length > 0) {
    // If the latest logged period is newer than onboarding baseline, use it as baseline
    if (periodStartLogs[0].date > lastKnownPeriodStart) {
      lastKnownPeriodStart = periodStartLogs[0].date;
    }
  }

  // Calculate dates
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);
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
  };
};
