export interface HormoneLevels {
  estrogen: number;
  progesterone: number;
  lh: number;
  fsh: number;
  focusState: string;
  hrvBaseline: string;
}

export const simulateHormones = (
  currentCycleDay: number,
  cycleLength: number,
  periodLength: number,
  userState?: {
    avgSleep: number;
    avgStress: number;
    avgHydration: number;
    avgEnergy: number;
    baseActivity: number;
  }
): HormoneLevels => {
  const ovulationDay = cycleLength - 14;
  const fertilityStart = ovulationDay - 4;
  const fertilityEnd = ovulationDay + 1;

  const avgSleep = userState?.avgSleep ?? 7.5;
  const avgStress = userState?.avgStress ?? 3.0;
  const avgHydration = userState?.avgHydration ?? 6.0;
  const avgEnergy = userState?.avgEnergy ?? 6.0;
  const baseActivity = userState?.baseActivity ?? 5.0;

  // Modifiers based on user health metrics
  // Stress (high cortisol) suppresses progesterone and flattens estrogen peaks
  const progesteroneStressModifier = Math.max(0.4, 1 - (avgStress - 3) * 0.08);
  const estrogenStressModifier = Math.max(0.5, 1 - (avgStress - 3) * 0.05 - (avgSleep < 6.5 ? 0.1 : 0));
  // Sleep deprivation dampens LH and FSH surges
  const sleepModifier = avgSleep < 6.5 ? 0.8 : (avgSleep > 8.0 ? 1.05 : 1.0);

  let estrogen = 10;
  let progesterone = 5;
  let lh = 10;
  let fsh = 25;
  let focusState = "Cognitive Rest & Reflection";
  let hrvBaseline = "Relaxed (78ms)";

  // Phase 1: Menstrual Phase (Bleeding days)
  if (currentCycleDay <= periodLength) {
    const t = currentCycleDay / periodLength;
    estrogen = Math.round((10 + t * 8) * estrogenStressModifier); // 10% to 18% base
    progesterone = Math.round((5 + t * 2) * progesteroneStressModifier); // 5% to 7% base
    lh = Math.round((8 + t * 4) * sleepModifier); // 8% to 12% base
    fsh = Math.round((30 - t * 10) * sleepModifier); // Starts high to stimulate follicles (30% down to 20%)
    
    if (avgSleep < 6.0) {
      focusState = "Exhausted Reflection";
    } else if (avgStress > 7) {
      focusState = "Overwhelmed Reflection";
    } else {
      focusState = "Cognitive Rest & Reflection";
    }
    hrvBaseline = "Relaxed (78ms)";
  }
  // Phase 2: Follicular Phase (Pre-ovulation, estrogen rise)
  else if (currentCycleDay < ovulationDay - 2) {
    const startDay = periodLength + 1;
    const endDay = ovulationDay - 3;
    const t = (currentCycleDay - startDay) / Math.max(1, endDay - startDay);
    
    estrogen = Math.round((18 + t * 62) * estrogenStressModifier); // 18% to 80% base
    progesterone = Math.round((7 + t * 5) * progesteroneStressModifier); // 7% to 12% base
    lh = Math.round((12 + t * 18) * sleepModifier); // 12% to 30% base
    fsh = Math.round((20 - t * 8) * sleepModifier); // Dips down to 12%
    
    if (avgSleep >= 7.5 && avgStress <= 4) {
      focusState = "Optimal Executive Flow";
    } else if (avgStress > 7) {
      focusState = "Tension-Impacted Drive";
    } else {
      focusState = "High Creativity & Action";
    }
    hrvBaseline = "Elevated (72ms)";
  }
  // Phase 3: Ovulation Phase (LH surge + Estrogen peak)
  else if (currentCycleDay <= ovulationDay + 1) {
    const t = (currentCycleDay - (ovulationDay - 2)) / 3; // 3 days window
    
    // Estrogen peaks just before ovulation and stays high
    estrogen = Math.round((85 + Math.sin(t * Math.PI) * 10) * estrogenStressModifier); // Peaks at 95% base
    progesterone = Math.round((12 + t * 13) * progesteroneStressModifier); // 12% to 25% base
    
    // LH surges to 100% on the ovulation day
    if (Math.round(currentCycleDay) === ovulationDay) {
      lh = Math.round(100 * sleepModifier);
      fsh = Math.round(60 * sleepModifier);
    } else {
      lh = Math.round((70 + Math.sin(t * Math.PI) * 15) * sleepModifier);
      fsh = Math.round((40 + Math.sin(t * Math.PI) * 10) * sleepModifier);
    }
    
    if (avgStress > 7) {
      focusState = "Social Exhaustion Alert";
    } else if (avgSleep >= 7.0 && avgHydration >= 7) {
      focusState = "Peak Communicative Focus";
    } else {
      focusState = "Estrogen Peak Flow";
    }
    hrvBaseline = "Optimal (85ms)";
  }
  // Phase 4: Luteal Phase (Post-ovulation, progesterone dominant)
  else {
    const startDay = ovulationDay + 2;
    const t = (currentCycleDay - startDay) / Math.max(1, cycleLength - startDay);
    
    // Estrogen drops and has a secondary lower surge, then drops
    estrogen = Math.round((30 + Math.sin(t * Math.PI) * 20 - t * 20) * estrogenStressModifier); // Secondary peak ~50% base
    
    // Progesterone dominant - peaks midway through luteal (around day 21)
    const progT = Math.sin(t * Math.PI);
    progesterone = Math.round((15 + progT * 70) * progesteroneStressModifier); // Peaks at 85% base
    
    lh = Math.max(5, Math.round((10 - t * 8) * sleepModifier)); // Dips very low (5% base)
    fsh = Math.max(5, Math.round((12 - t * 10) * sleepModifier)); // Dips low base
    
    const isLateLuteal = currentCycleDay > cycleLength - 5;
    if (isLateLuteal && (avgStress > 6 || avgSleep < 6.5)) {
      focusState = "Pre-Menstrual Brain Fog";
    } else if (avgStress > 7) {
      focusState = "Anxious Detail Focus";
    } else if (avgSleep >= 7.5) {
      focusState = "Deep Analytical Detail Focus";
    } else {
      focusState = "Reflective Detail Focus";
    }
    hrvBaseline = "Varying (64ms)";
  }

  return {
    estrogen,
    progesterone,
    lh,
    fsh,
    focusState,
    hrvBaseline,
  };
};
