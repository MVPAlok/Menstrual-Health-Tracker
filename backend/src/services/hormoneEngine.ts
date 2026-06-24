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
  periodLength: number
): HormoneLevels => {
  const ovulationDay = cycleLength - 14;
  const fertilityStart = ovulationDay - 4;
  const fertilityEnd = ovulationDay + 1;

  let estrogen = 10;
  let progesterone = 5;
  let lh = 10;
  let fsh = 25;
  let focusState = "Cognitive Rest & Reflection";
  let hrvBaseline = "Relaxed (78ms)";

  // Phase 1: Menstrual Phase (Bleeding days)
  if (currentCycleDay <= periodLength) {
    const t = currentCycleDay / periodLength;
    estrogen = Math.round(10 + t * 8); // 10% to 18%
    progesterone = Math.round(5 + t * 2); // 5% to 7%
    lh = Math.round(8 + t * 4); // 8% to 12%
    fsh = Math.round(30 - t * 10); // Starts high to stimulate follicles (30% down to 20%)
    focusState = "Cognitive Rest & Reflection";
    hrvBaseline = "Relaxed (78ms)";
  }
  // Phase 2: Follicular Phase (Pre-ovulation, estrogen rise)
  else if (currentCycleDay < ovulationDay - 2) {
    const startDay = periodLength + 1;
    const endDay = ovulationDay - 3;
    const t = (currentCycleDay - startDay) / Math.max(1, endDay - startDay);
    
    estrogen = Math.round(18 + t * 62); // 18% to 80%
    progesterone = Math.round(7 + t * 5); // 7% to 12%
    lh = Math.round(12 + t * 18); // 12% to 30%
    fsh = Math.round(20 - t * 8); // Dips down to 12%
    focusState = "High Creativity & Action";
    hrvBaseline = "Elevated (72ms)";
  }
  // Phase 3: Ovulation Phase (LH surge + Estrogen peak)
  else if (currentCycleDay <= ovulationDay + 1) {
    const t = (currentCycleDay - (ovulationDay - 2)) / 3; // 3 days window
    
    // Estrogen peaks just before ovulation and stays high
    estrogen = Math.round(85 + Math.sin(t * Math.PI) * 10); // Peaks at 95%
    progesterone = Math.round(12 + t * 13); // 12% to 25%
    
    // LH surges to 100% on the ovulation day
    if (Math.round(currentCycleDay) === ovulationDay) {
      lh = 100;
      fsh = 60;
    } else {
      lh = Math.round(70 + Math.sin(t * Math.PI) * 15);
      fsh = Math.round(40 + Math.sin(t * Math.PI) * 10);
    }
    focusState = "Estrogen Peak Flow";
    hrvBaseline = "Optimal (85ms)";
  }
  // Phase 4: Luteal Phase (Post-ovulation, progesterone dominant)
  else {
    const startDay = ovulationDay + 2;
    const t = (currentCycleDay - startDay) / Math.max(1, cycleLength - startDay);
    
    // Estrogen drops and has a secondary lower surge, then drops
    estrogen = Math.round(30 + Math.sin(t * Math.PI) * 20 - t * 20); // Secondary peak ~50%
    
    // Progesterone dominant - peaks midway through luteal (around day 21)
    const progT = Math.sin(t * Math.PI);
    progesterone = Math.round(15 + progT * 70); // Peaks at 85%
    
    lh = Math.max(5, Math.round(10 - t * 8)); // Dips very low (5%)
    fsh = Math.max(5, Math.round(12 - t * 10)); // Dips low
    focusState = "Reflective Detail Focus";
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
