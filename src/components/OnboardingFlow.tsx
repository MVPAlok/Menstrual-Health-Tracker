import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundShader } from './BackgroundShader';
import { useApp } from '../context/AppContext';

export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { onboarding, updateOnboarding } = useApp();
  const [step, setStep] = useState(1);

  // Calendar State for Step 2
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleNext = () => {
    if (step < 8) {
      setStep(step + 1);
    } else {
      updateOnboarding({ onboardingCompleted: true });
      navigate('/dashboard');
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Calendar Helper Functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const selectDate = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    const dateStr = selectedDate.toISOString().split('T')[0];
    updateOnboarding({ lastPeriodDate: dateStr });
  };

  const changeMonth = (offset: number) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const formattedSelectedDate = () => {
    if (!onboarding.lastPeriodDate) return 'No date selected';
    const d = new Date(onboarding.lastPeriodDate);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // SVG Visualizer calculations for Step 3
  const cycleDays = onboarding.cycleLength;
  const periodDays = onboarding.periodLength;



  const getStrokeDash = (percent: number) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeLength = (percent / 100) * circumference;
    return `${strokeLength} ${circumference - strokeLength}`;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <BackgroundShader canvasId="onboarding-shader-canvas" />
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] z-0 pointer-events-none" />

      {/* Progress Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 max-w-7xl mx-auto">
        <span className="font-extrabold text-xl text-primary tracking-tight">LunaCare</span>
        <div className="flex items-center gap-4">
          <div className="w-48 h-1.5 bg-white/40 border border-white/60 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary-container"
              animate={{ width: `${(step / 8) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs font-bold text-primary">Step {step} of 8</span>
        </div>
      </div>

      {/* Onboarding Wizard Card */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl relative z-10 glass-card p-8 md:p-12 rounded-[2.5rem] border border-white/70 shadow-[0_32px_80px_rgba(165,53,86,0.08)] mt-12"
      >
        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <span className="material-symbols-outlined text-[64px] text-primary animate-pulse">
                  insights
                </span>
              </div>
              <h2 className="font-hero-display-mobile md:font-headline-lg text-headline-lg text-primary mb-4 leading-tight">
                Let's Understand Your Rhythm.
              </h2>
              <p className="text-secondary font-body-lg max-w-md mx-auto mb-10 leading-relaxed">
                Answer a few questions so we can personalize your experience and calibrate our predictive algorithms.
              </p>
              <motion.button
                onClick={handleNext}
                className="bg-primary text-on-primary px-10 py-4.5 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Begin Personalization
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: LAST PERIOD DATE */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="font-headline-md text-headline-md text-primary mb-2">Last Period Date</h3>
              <p className="text-secondary font-body-md mb-8">
                Select the day your last menstrual flow commenced.
              </p>

              <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                {/* Custom Glassmorphic Calendar */}
                <div className="w-full max-w-sm bg-white/40 border border-white/70 rounded-3xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/60 hover:bg-white text-primary"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    <span className="font-bold text-primary text-sm tracking-wider uppercase">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={() => changeMonth(1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/60 hover:bg-white text-primary"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-secondary mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                      <span key={day} className="py-1">{day}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }).map((_, i) => (
                      <span key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }).map((_, i) => {
                      const dayNum = i + 1;
                      const cellDate = new Date(currentYear, currentMonth, dayNum);
                      const cellDateStr = cellDate.toISOString().split('T')[0];
                      const isSelected = onboarding.lastPeriodDate === cellDateStr;

                      return (
                        <button
                          key={`day-${dayNum}`}
                          onClick={() => selectDate(dayNum)}
                          className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/30 scale-110'
                              : 'bg-white/30 text-secondary hover:bg-white/80'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Date Visualization */}
                <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start gap-4">
                  <div className="p-5 bg-white/50 border border-white/60 rounded-3xl w-full text-center">
                    <span className="block text-xs font-bold text-outline-variant uppercase tracking-widest mb-1">
                      Selected Period Start
                    </span>
                    <span className="text-xl font-bold text-primary">{formattedSelectedDate()}</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    LunaCare utilizes this baseline to forecast follicular, luteal, and ovulation milestones.
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 rounded-full font-bold text-xs uppercase tracking-wider text-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CYCLE LENGTH */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="font-headline-md text-headline-md text-primary mb-2">Cycle Length</h3>
              <p className="text-secondary font-body-md mb-8">
                What is the typical interval between the start of one period and the next?
              </p>

              <div className="flex flex-col md:flex-row gap-10 items-center justify-between">
                {/* Wheel / Slider */}
                <div className="w-full max-w-xs flex flex-col gap-6">
                  <div className="text-center bg-white/40 border border-white/70 rounded-3xl p-6 shadow-sm">
                    <span className="text-6xl font-extrabold text-primary">{onboarding.cycleLength}</span>
                    <span className="block text-xs font-bold uppercase tracking-widest text-secondary mt-2">
                      Days
                    </span>
                  </div>
                  <input
                    type="range"
                    min={21}
                    max={35}
                    value={onboarding.cycleLength}
                    onChange={(e) => updateOnboarding({ cycleLength: parseInt(e.target.value) })}
                    className="w-full accent-primary h-2 bg-white/50 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-secondary px-1">
                    <span>21 Days</span>
                    <span>28 Days (Avg)</span>
                    <span>35 Days</span>
                  </div>
                </div>

                {/* Live Cycle Preview Orb */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-44 h-44 rounded-full border border-white/60 bg-white/40 shadow-inner relative flex items-center justify-center">
                    {/* Ring Segments SVG */}
                    <svg className="w-40 h-40 transform -rotate-90">
                      {/* Luteal Segment */}
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                        stroke="#fccdc7" // Light Peach
                        strokeWidth="12"
                        className="transition-all duration-300"
                      />
                      {/* Follicular Segment */}
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                        stroke="#e2d9f3" // Lavender
                        strokeWidth="12"
                        strokeDasharray={getStrokeDash(((cycleDays - periodDays - 4) / cycleDays) * 100)}
                        strokeDashoffset={-(periodDays / cycleDays) * 2 * Math.PI * 60}
                        className="transition-all duration-300"
                      />
                      {/* Ovulation Segment */}
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                        stroke="#ffdce3" // Soft Rose
                        strokeWidth="12"
                        strokeDasharray={getStrokeDash((4 / cycleDays) * 100)}
                        strokeDashoffset={-((cycleDays - 8) / cycleDays) * 2 * Math.PI * 60}
                        className="transition-all duration-300"
                      />
                      {/* Menstrual Segment */}
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                        stroke="#a53556" // Primary Red/Pink
                        strokeWidth="12"
                        strokeDasharray={getStrokeDash((periodDays / cycleDays) * 100)}
                        strokeDashoffset={0}
                        className="transition-all duration-300"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-secondary">Est. Phases</span>
                      <span className="text-lg font-extrabold text-primary">Calibrated</span>
                    </div>
                  </div>
                  <div className="flex gap-4 flex-wrap justify-center mt-5 text-[10px] font-bold text-secondary">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Menstrual</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#e2d9f3]" /> Follicular</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#ffdce3]" /> Ovulation</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#fccdc7]" /> Luteal</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 rounded-full font-bold text-xs uppercase tracking-wider text-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PERIOD LENGTH */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="font-headline-md text-headline-md text-primary mb-2">Period Length</h3>
              <p className="text-secondary font-body-md mb-8">
                How many days does active menstrual bleeding typically continue?
              </p>

              <div className="flex flex-col gap-8 items-center justify-center py-4">
                <div className="text-center bg-white/40 border border-white/70 rounded-3xl p-6 shadow-sm w-full max-w-xs">
                  <span className="text-6xl font-extrabold text-primary">{onboarding.periodLength}</span>
                  <span className="block text-xs font-bold uppercase tracking-widest text-secondary mt-2">
                    Days Bleeding
                  </span>
                </div>

                <div className="w-full max-w-md">
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={onboarding.periodLength}
                    onChange={(e) => updateOnboarding({ periodLength: parseInt(e.target.value) })}
                    className="w-full accent-primary h-2 bg-white/50 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-secondary px-1 mt-2">
                    <span>2 Days</span>
                    <span>5 Days (Avg)</span>
                    <span>10 Days</span>
                  </div>
                </div>

                {/* Droplets representation */}
                <div className="flex gap-3 justify-center items-center h-12">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const isActive = i < onboarding.periodLength;
                    return (
                      <motion.span
                        key={i}
                        className={`material-symbols-outlined text-[28px] transition-all duration-300 ${
                          isActive ? 'text-primary fill-1 scale-110 drop-shadow-[0_2px_8px_rgba(165,53,86,0.3)]' : 'text-primary/20 fill-0'
                        }`}
                        animate={isActive ? { y: [0, -4, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.15 }}
                      >
                        water_drop
                      </motion.span>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 rounded-full font-bold text-xs uppercase tracking-wider text-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: HEALTH GOALS */}
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="font-headline-md text-headline-md text-primary mb-2">Health Goals</h3>
              <p className="text-secondary font-body-md mb-8">
                Select your focus parameters for cycle tracking.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'Track Periods', label: 'Track Periods', icon: 'calendar_month' },
                  { id: 'Understand Symptoms', label: 'Understand Symptoms', icon: 'psychology' },
                  { id: 'Improve Wellness', label: 'Improve Wellness', icon: 'spa' },
                  { id: 'Learn Body Patterns', label: 'Learn Body Patterns', icon: 'analytics' },
                  { id: 'Predict Ovulation', label: 'Predict Ovulation', icon: 'wb_sunny' },
                  { id: 'Improve Energy', label: 'Improve Energy', icon: 'electric_bolt' }
                ].map((goal) => {
                  const isSelected = onboarding.healthGoals.includes(goal.id);
                  const toggleGoal = () => {
                    let updated: string[];
                    if (isSelected) {
                      updated = onboarding.healthGoals.filter(g => g !== goal.id);
                    } else {
                      updated = [...onboarding.healthGoals, goal.id];
                    }
                    updateOnboarding({ healthGoals: updated });
                  };

                  return (
                    <motion.div
                      key={goal.id}
                      onClick={toggleGoal}
                      className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex flex-col gap-3 select-none ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-[0_12px_24px_rgba(165,53,86,0.06)]'
                          : 'bg-white/40 border-white hover:bg-white/80'
                      }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={`material-symbols-outlined text-[24px] ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                        {goal.icon}
                      </span>
                      <span className={`font-bold text-sm leading-tight ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                        {goal.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex justify-between mt-10">
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 rounded-full font-bold text-xs uppercase tracking-wider text-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: LIFESTYLE INFORMATION */}
          {step === 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="font-headline-md text-headline-md text-primary mb-2">Lifestyle Information</h3>
              <p className="text-secondary font-body-md mb-8">
                Calibrate daily wellness inputs to correlate sleep and mood patterns.
              </p>

              <div className="flex flex-col gap-6">
                {/* Sleep Quality */}
                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Sleep Quality</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Restorative', 'Fragmented', 'Insufficient'].map((option) => (
                      <button
                        key={option}
                        onClick={() => updateOnboarding({ lifestyle: { ...onboarding.lifestyle, sleep: option } })}
                        className={`py-3.5 px-4 rounded-full text-xs font-bold border transition-all ${
                          onboarding.lifestyle.sleep === option
                            ? 'bg-primary text-on-primary shadow-md border-primary'
                            : 'bg-white/40 border-white hover:bg-white/80 text-secondary'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stress Level */}
                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Stress Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Low', 'Moderate', 'High'].map((option) => (
                      <button
                        key={option}
                        onClick={() => updateOnboarding({ lifestyle: { ...onboarding.lifestyle, stress: option } })}
                        className={`py-3.5 px-4 rounded-full text-xs font-bold border transition-all ${
                          onboarding.lifestyle.stress === option
                            ? 'bg-primary text-on-primary shadow-md border-primary'
                            : 'bg-white/40 border-white hover:bg-white/80 text-secondary'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Activity Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Sedentary', 'Active', 'Athletic'].map((option) => (
                      <button
                        key={option}
                        onClick={() => updateOnboarding({ lifestyle: { ...onboarding.lifestyle, activity: option } })}
                        className={`py-3.5 px-4 rounded-full text-xs font-bold border transition-all ${
                          onboarding.lifestyle.activity === option
                            ? 'bg-primary text-on-primary shadow-md border-primary'
                            : 'bg-white/40 border-white hover:bg-white/80 text-secondary'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hydration */}
                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Hydration</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Optimal', 'Average', 'Low'].map((option) => (
                      <button
                        key={option}
                        onClick={() => updateOnboarding({ lifestyle: { ...onboarding.lifestyle, hydration: option } })}
                        className={`py-3.5 px-4 rounded-full text-xs font-bold border transition-all ${
                          onboarding.lifestyle.hydration === option
                            ? 'bg-primary text-on-primary shadow-md border-primary'
                            : 'bg-white/40 border-white hover:bg-white/80 text-secondary'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 rounded-full font-bold text-xs uppercase tracking-wider text-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 7: NOTIFICATIONS */}
          {step === 7 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="font-headline-md text-headline-md text-primary mb-2">Notifications</h3>
              <p className="text-secondary font-body-md mb-8">
                Choose the alerts you'd like to receive on your intelligence stream.
              </p>

              <div className="flex flex-col gap-4">
                {[
                  { key: 'period', label: 'Period Reminders', desc: 'Predictive alert 2 days prior to cycle commencement.' },
                  { key: 'ovulation', label: 'Ovulation Alerts', desc: 'Alerts at peak luteinizing hormone and fertility window opening.' },
                  { key: 'insights', label: 'Insight Updates', desc: 'Weekly biological metrics analysis report.' },
                  { key: 'wellnessTips', label: 'Daily Wellness Tips', desc: 'Personalized wellness recommendations based on current cycle phase.' }
                ].map((item) => {
                  const typedKey = item.key as keyof typeof onboarding.notifications;
                  const isActive = onboarding.notifications[typedKey];
                  const toggle = () => {
                    updateOnboarding({
                      notifications: {
                        ...onboarding.notifications,
                        [typedKey]: !isActive
                      }
                    });
                  };

                  return (
                    <div
                      key={item.key}
                      onClick={toggle}
                      className="p-4 md:p-5 rounded-3xl bg-white/40 border border-white flex justify-between items-center cursor-pointer select-none hover:bg-white/80 transition-all"
                    >
                      <div className="flex-1 pr-4">
                        <span className="block font-bold text-sm text-primary mb-0.5">{item.label}</span>
                        <span className="block text-xs text-secondary leading-normal">{item.desc}</span>
                      </div>
                      {/* Glass Toggle */}
                      <div className={`w-12 h-7 rounded-full p-1 flex items-center transition-all ${isActive ? 'bg-primary' : 'bg-white/60 border border-outline/10'}`}>
                        <motion.div
                          className={`w-5 h-5 rounded-full shadow-md ${isActive ? 'bg-white' : 'bg-secondary/40'}`}
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          style={{ marginLeft: isActive ? 'auto' : '0px' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between mt-10">
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 rounded-full font-bold text-xs uppercase tracking-wider text-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 8: PROFILE READY */}
          {step === 8 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary relative">
                  <span className="material-symbols-outlined text-[36px] text-primary animate-bounce">
                    sparkles
                  </span>
                </div>
              </div>

              <h2 className="font-headline-lg text-headline-lg text-primary mb-3">Profile Calibrated</h2>
              <p className="text-secondary font-body-md mb-8 max-w-md mx-auto">
                Your biological parameters are synchronized. Here is your cycle intelligence core baseline:
              </p>

              <div className="grid grid-cols-3 gap-3 mb-10">
                <div className="bg-white/50 border border-white/60 p-4 rounded-2xl">
                  <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Cycle Length</span>
                  <span className="text-xl font-bold text-primary">{onboarding.cycleLength} Days</span>
                </div>
                <div className="bg-white/50 border border-white/60 p-4 rounded-2xl">
                  <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Period Length</span>
                  <span className="text-xl font-bold text-primary">{onboarding.periodLength} Days</span>
                </div>
                <div className="bg-white/50 border border-white/60 p-4 rounded-2xl">
                  <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Health Focus</span>
                  <span className="text-sm font-bold text-primary truncate max-w-full block">
                    {onboarding.healthGoals.length > 0 ? onboarding.healthGoals[0] : 'Wellness'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <motion.button
                  onClick={handleNext}
                  className="w-full bg-primary text-on-primary py-4.5 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165, 53, 86, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Enter Dashboard
                  <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
