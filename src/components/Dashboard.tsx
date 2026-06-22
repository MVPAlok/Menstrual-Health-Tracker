import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

// Simple tooltip component
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-slate-900/90 backdrop-blur-md rounded-lg whitespace-nowrap z-50 shadow-md">
          {text}
        </div>
      )}
    </div>
  );
};

/* ═══════════════ MAIN DASHBOARD SCREEN ═══════════════ */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, onboarding, dailyLogs, logDay, logoutUser } = useApp();
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'log' | 'insights' | 'profile'>('home');

  // Logs state
  const [todayMood, setTodayMood] = useState('Balanced');
  const [todaySymptoms, setTodaySymptoms] = useState<string[]>([]);
  const [todaySleep, setTodaySleep] = useState(7);
  const [todayEnergy, setTodayEnergy] = useState(7);
  const [todayStress, setTodayStress] = useState(4);
  const [logSuccess, setLogSuccess] = useState(false);

  // Calculate cycle parameters
  const today = new Date();
  const lastPeriod = new Date(onboarding.lastPeriodDate);
  const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentCycleDay = (diffDays % onboarding.cycleLength) + 1;

  // Determine current cycle phase
  // 1 to periodLength -> Menstrual
  // periodLength + 1 to ovulationDay - 3 -> Follicular
  // ovulationDay - 2 to ovulationDay + 1 -> Ovulation
  // ovulationDay + 2 to cycleLength -> Luteal
  const periodLength = onboarding.periodLength;
  const cycleLength = onboarding.cycleLength;
  const ovulationDay = cycleLength - 14;
  const fertilityStart = ovulationDay - 4;
  const fertilityEnd = ovulationDay + 1;

  let currentPhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' = 'follicular';
  let phaseTitle = 'Follicular Phase';
  let phaseDesc = 'Rising estrogen enhances cognitive focus and physical energy.';
  let phaseDaysLeft = 0;
  let phaseColor = '#e2d9f3'; // lavender default

  if (currentCycleDay <= periodLength) {
    currentPhase = 'menstrual';
    phaseTitle = 'Menstrual Phase';
    phaseDesc = 'Introspection and restoration. Hormonal baseline is at its lowest.';
    phaseDaysLeft = periodLength - currentCycleDay + 1;
    phaseColor = '#a53556'; // crimson
  } else if (currentCycleDay < ovulationDay - 2) {
    currentPhase = 'follicular';
    phaseTitle = 'Follicular Phase';
    phaseDesc = 'Rising estrogen enhances cognitive focus and physical energy.';
    phaseDaysLeft = (ovulationDay - 2) - currentCycleDay;
    phaseColor = '#e2d9f3'; // lavender
  } else if (currentCycleDay <= ovulationDay + 1) {
    currentPhase = 'ovulation';
    phaseTitle = 'Ovulation Phase';
    phaseDesc = 'Estrogen peaks, triggering ovulation. Stamina and confidence are elevated.';
    phaseDaysLeft = (ovulationDay + 1) - currentCycleDay + 1;
    phaseColor = '#ffdbdb'; // soft rose
  } else {
    currentPhase = 'luteal';
    phaseTitle = 'Luteal Phase';
    phaseDesc = 'Progesterone dominates, moving energy inward. Ideal for detail tasks.';
    phaseDaysLeft = cycleLength - currentCycleDay + 1;
    phaseColor = '#fccdc7'; // peach
  }

  // Days until next period
  const daysUntilNextPeriod = currentCycleDay <= periodLength
    ? 0
    : cycleLength - currentCycleDay + 1;

  // Sync log state with today's log if it exists
  useEffect(() => {
    const todayStr = today.toISOString().split('T')[0];
    if (dailyLogs[todayStr]) {
      const log = dailyLogs[todayStr];
      setTodayMood(log.mood);
      setTodaySymptoms(log.symptoms);
      setTodaySleep(log.sleep);
      setTodayEnergy(log.energy);
      setTodayStress(log.stress);
    }
  }, [dailyLogs]);

  // Handle logging form submission
  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logDay({
      mood: todayMood,
      symptoms: todaySymptoms,
      sleep: todaySleep,
      energy: todayEnergy,
      stress: todayStress,
    });
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 3000);
  };

  const handleSymptomToggle = (symptom: string) => {
    if (todaySymptoms.includes(symptom)) {
      setTodaySymptoms(todaySymptoms.filter(s => s !== symptom));
    } else {
      setTodaySymptoms([...todaySymptoms, symptom]);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background pb-32 relative text-on-background selection:bg-primary/20">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/5 to-transparent blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-primary-container/5 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* Main Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-outline/5">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">spa</span>
          </span>
          <span className="font-extrabold text-xl text-primary tracking-tight">LunaCare</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-secondary">Logged in as</span>
            <span className="text-sm font-bold text-primary">{user.name || 'Elena Ross'}</span>
          </div>
          <button
            onClick={() => {
              logoutUser();
              navigate('/landingpage');
            }}
            className="w-10 h-10 rounded-full bg-white/60 hover:bg-white border border-white/80 flex items-center justify-center text-secondary hover:text-primary transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </header>

      {/* TAB CONTENT VIEWS */}
      <main className="w-full max-w-7xl mx-auto px-6 pt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-10"
            >
              {/* ═══════════════ HERO SECTION ═══════════════ */}
              <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/70 shadow-[0_24px_64px_rgba(165,53,86,0.06)] relative overflow-hidden flex flex-col lg:flex-row items-center gap-10">
                
                {/* Visual Glow behind Orb */}
                <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="w-80 h-80 rounded-full blur-[100px] opacity-20 transition-all duration-1000"
                    style={{ backgroundColor: phaseColor }}
                  />
                </div>

                {/* Left Side: Parameters / Diagnostics */}
                <div className="flex-1 flex flex-col gap-6 relative z-10 text-center lg:text-left">
                  <div>
                    <span className="inline-block px-3 py-1 bg-white/70 border border-white/80 rounded-full text-xs font-extrabold uppercase tracking-widest text-primary mb-3">
                      Cycle Diagnostic
                    </span>
                    <h2 className="font-headline-lg text-headline-lg text-primary leading-none mb-4">
                      Day {currentCycleDay} <span className="text-secondary/50 font-normal">/ {cycleLength}</span>
                    </h2>
                    <p className="font-body-md text-secondary max-w-md">
                      Currently navigating your <span className="font-bold text-primary">{phaseTitle}</span>. {phaseDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto lg:mx-0">
                    <div className="bg-white/40 border border-white/60 p-4 rounded-2xl">
                      <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">Mood Trend</span>
                      <span className="text-sm font-bold text-primary">Balanced Focus</span>
                    </div>
                    <div className="bg-white/40 border border-white/60 p-4 rounded-2xl">
                      <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">Energy Forecast</span>
                      <span className="text-sm font-bold text-primary">Moderate Peak</span>
                    </div>
                  </div>
                </div>

                {/* Center: Premium Interactive Body Intelligence Orb */}
                <div className="relative z-10 w-72 h-72 flex items-center justify-center">
                  <BodyIntelligenceOrb phase={currentPhase} color={phaseColor} />
                </div>

                {/* Right Side: Prediction Indexes */}
                <div className="flex-1 flex flex-col gap-6 relative z-10 w-full lg:w-auto">
                  <div className="p-5 bg-white/50 border border-white/60 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[24px]">calendar_today</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest">Next Cycle Commencement</span>
                      <span className="text-base font-extrabold text-primary">
                        {daysUntilNextPeriod > 0 ? `In ${daysUntilNextPeriod} Days` : 'Period Commencing Today'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 bg-white/50 border border-white/60 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                      <span className="material-symbols-outlined text-[24px]">wb_sunny</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest">Est. Ovulation Date</span>
                      <span className="text-base font-extrabold text-purple-700">
                        {currentCycleDay <= ovulationDay ? `In ${ovulationDay - currentCycleDay} Days` : 'Ovulated'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 bg-white/50 border border-white/60 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <span className="material-symbols-outlined text-[24px]">check_circle</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest">Forecast Confidence</span>
                      <span className="text-base font-extrabold text-emerald-700">92% Calibrated</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════ SIX PRIMARY MODULES GRID ═══════════════ */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Module 1: Cycle Overview */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Cycle Overview</h3>
                    <span className="material-symbols-outlined text-[20px] text-secondary">rotate_right</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-secondary">Cycle Chronology:</span>
                    {/* Visual phase line */}
                    <div className="w-full h-2.5 bg-white/40 border border-white/80 rounded-full overflow-hidden flex">
                      <div className="h-full bg-primary" style={{ width: `${(periodLength / cycleLength) * 100}%` }} />
                      <div className="h-full bg-purple-300" style={{ width: `${((ovulationDay - periodLength - 2) / cycleLength) * 100}%` }} />
                      <div className="h-full bg-pink-300" style={{ width: `${(4 / cycleLength) * 100}%` }} />
                      <div className="h-full bg-amber-200" style={{ width: `${((cycleLength - ovulationDay - 2) / cycleLength) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-secondary mt-1">
                      <span>Bleed</span>
                      <span>Follicle</span>
                      <span>Ovulate</span>
                      <span>Luteal</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="bg-white/40 p-2.5 rounded-2xl border border-white/80 flex items-center justify-between text-xs">
                      <span className="font-bold text-secondary">Remaining Days in Phase</span>
                      <span className="font-extrabold text-primary">{phaseDaysLeft} Days</span>
                    </div>
                    <div className="bg-white/40 p-2.5 rounded-2xl border border-white/80 flex items-center justify-between text-xs">
                      <span className="font-bold text-secondary">Cycle Consistency</span>
                      <span className="font-extrabold text-primary">High (±1.2d)</span>
                    </div>
                  </div>
                </div>

                {/* Module 2: Prediction Engine */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Prediction Engine</h3>
                    <span className="material-symbols-outlined text-[20px] text-secondary">biotech</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-outline/5 pb-2">
                      <span className="text-xs font-bold text-secondary">Next Period Start</span>
                      <span className="text-xs font-extrabold text-primary">
                        {new Date(lastPeriod.getTime() + cycleLength * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline/5 pb-2">
                      <span className="text-xs font-bold text-secondary">Ovulation Shift Window</span>
                      <span className="text-xs font-extrabold text-purple-700">
                        {new Date(lastPeriod.getTime() + (ovulationDay - 2) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(lastPeriod.getTime() + (ovulationDay + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-secondary">Fertility Horizon</span>
                      <span className="text-xs font-extrabold text-emerald-700">Optimal Phase</span>
                    </div>
                  </div>
                </div>

                {/* Module 3: Today's Insight */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Today's Insight</h3>
                    <span className="material-symbols-outlined text-[20px] text-secondary">lightbulb</span>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col gap-2">
                    <p className="text-xs text-primary leading-relaxed font-bold">
                      "Your cognitive focus is projected to increase over the next 48 hours. Rising estrogen encourages social clarity, making this a prime window for strategic tasks."
                    </p>
                    <span className="text-[10px] text-secondary font-bold">Luna Diagnostics • Real-Time</span>
                  </div>
                </div>

                {/* Module 4: Quick Logging */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4 md:col-span-2 lg:col-span-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Quick Log</h3>
                    <span className="material-symbols-outlined text-[20px] text-secondary">edit_note</span>
                  </div>
                  <form onSubmit={handleQuickLogSubmit} className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {['Radiant', 'Balanced', 'Sensitive', 'Low Energy', 'Anxious'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTodayMood(m)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            todayMood === m
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'bg-white/50 border border-white text-secondary hover:bg-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-secondary">Symptom Track:</span>
                      <div className="flex gap-1.5">
                        {['Cramps', 'Headache', 'Bloating'].map(s => {
                          const isActive = todaySymptoms.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleSymptomToggle(s)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
                                isActive
                                  ? 'bg-primary/20 border-primary text-primary'
                                  : 'bg-white/30 border-white/80 text-secondary'
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-white hover:bg-slate-50 border border-outline/10 text-primary font-bold text-xs rounded-full shadow-sm flex items-center justify-center gap-1.5 transition-all mt-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">done</span>
                      {logSuccess ? 'Metrics Saved' : 'Confirm Today\'s Metrics'}
                    </button>
                  </form>
                </div>

                {/* Module 5: Body Intelligence Correlation */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4 md:col-span-1 lg:col-span-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Body Correlations</h3>
                    <span className="material-symbols-outlined text-[20px] text-secondary">analytics</span>
                  </div>
                  <div className="h-28 relative flex items-end justify-between px-2 pt-4">
                    {/* Simple Wave Correlation Graphics */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      {/* Energy wave */}
                      <path
                        d="M 0 60 Q 20 20, 40 40 T 80 30 T 100 50"
                        fill="none"
                        stroke="#a53556"
                        strokeWidth="3"
                        strokeOpacity="0.85"
                      />
                      {/* Sleep wave */}
                      <path
                        d="M 0 80 Q 25 50, 50 70 T 100 30"
                        fill="none"
                        stroke="#8a7fb9"
                        strokeWidth="2"
                        strokeOpacity="0.5"
                        strokeDasharray="4 4"
                      />
                    </svg>

                    <div className="flex justify-between w-full text-[9px] font-bold text-secondary/60 relative z-10">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Today</span>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-center text-[10px] font-bold text-secondary">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary" /> Energy Peaks</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-[#8a7fb9]" /> Sleep Restorative Duration</span>
                  </div>
                </div>

                {/* Module 6: Health Trends */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4 md:col-span-1 lg:col-span-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Calibrated Shifts</h3>
                    <span className="material-symbols-outlined text-[20px] text-secondary">query_stats</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/40 p-4 rounded-2xl border border-white/60 flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">Cycle Continuity</span>
                      <span className="text-xl font-bold text-primary">98.2%</span>
                      <span className="text-[9px] text-emerald-700 font-bold">Stable variance over 90 days</span>
                    </div>
                    <div className="bg-white/40 p-4 rounded-2xl border border-white/60 flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">Sleep Efficiency</span>
                      <span className="text-xl font-bold text-primary">7.8 hrs Avg</span>
                      <span className="text-[9px] text-primary font-bold">Correlates to low stress phases</span>
                    </div>
                    <div className="bg-white/40 p-4 rounded-2xl border border-white/60 flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">Hormonal Resilience</span>
                      <span className="text-xl font-bold text-primary">Optimal</span>
                      <span className="text-[9px] text-emerald-700 font-bold">Estrogen parameters matched</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/70 max-w-4xl mx-auto shadow-sm"
            >
              <h2 className="font-headline-md text-headline-md text-primary mb-3">Cycle Calendar</h2>
              <p className="text-secondary font-body-md mb-8">
                Interactive forecasting representing menstrual phases and fertility windows.
              </p>

              {/* Render 3 consecutive cycles forecast */}
              <div className="flex flex-col gap-8">
                {[0, 1, 2].map((cycleIndex) => {
                  const cycleStart = new Date(lastPeriod.getTime() + cycleIndex * cycleLength * 24 * 60 * 60 * 1000);
                  
                  return (
                    <div key={cycleIndex} className="p-5 bg-white/40 border border-white/60 rounded-3xl shadow-sm">
                      <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-4">
                        Cycle {cycleIndex + 1} ({cycleStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                      </h4>

                      {/* Display days list */}
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {Array.from({ length: cycleLength }).map((_, dayIndex) => {
                          const dayNum = dayIndex + 1;
                          let dayBg = 'bg-white/30 text-secondary border border-transparent';
                          let tooltipText = `Day ${dayNum}: Normal Day`;

                          if (dayNum <= periodLength) {
                            dayBg = 'bg-primary text-on-primary shadow-sm shadow-primary/20';
                            tooltipText = `Day ${dayNum}: Menstrual Flow`;
                          } else if (dayNum >= fertilityStart && dayNum <= fertilityEnd) {
                            dayBg = 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold';
                            tooltipText = `Day ${dayNum}: Peak Fertile Window`;
                          } else if (dayNum === ovulationDay) {
                            dayBg = 'bg-purple-100 border border-purple-300 text-purple-800 font-extrabold';
                            tooltipText = `Day ${dayNum}: Ovulation Day`;
                          }

                          return (
                            <Tooltip key={dayNum} text={tooltipText}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs cursor-help transition-all hover:scale-110 ${dayBg}`}>
                                {dayNum}
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB LOG VIEW */}
          {activeTab === 'log' && (
            <motion.div
              key="log-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/70 max-w-2xl mx-auto shadow-sm"
            >
              <h2 className="font-headline-md text-headline-md text-primary mb-2">Metrics Logger</h2>
              <p className="text-secondary font-body-md mb-8">
                Daily calibration of sleep efficiency, physical fatigue, stress logs, and mood shifts.
              </p>

              <form onSubmit={handleQuickLogSubmit} className="flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-3 ml-1">Today's Focus Mood</label>
                  <div className="flex flex-wrap gap-2">
                    {['Radiant', 'Balanced', 'Sensitive', 'Low Energy', 'Anxious', 'Productive', 'Reflective'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTodayMood(m)}
                        className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                          todayMood === m
                            ? 'bg-primary text-on-primary border-primary shadow-md'
                            : 'bg-white/40 border-white text-secondary hover:bg-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-3 ml-1">Physical Symptoms</label>
                  <div className="flex flex-wrap gap-2">
                    {['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Backache', 'Acne Flare', 'Healthy Flow'].map(s => {
                      const isActive = todaySymptoms.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSymptomToggle(s)}
                          className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${
                            isActive
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-white/40 border-white text-secondary hover:bg-white'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Sleep (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={todaySleep}
                      onChange={(e) => setTodaySleep(parseInt(e.target.value) || 7)}
                      className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-3 rounded-2xl text-on-surface text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Energy (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={todayEnergy}
                      onChange={(e) => setTodayEnergy(parseInt(e.target.value) || 7)}
                      className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-3 rounded-2xl text-on-surface text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Stress (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={todayStress}
                      onChange={(e) => setTodayStress(parseInt(e.target.value) || 4)}
                      className="w-full bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-4 py-3 rounded-2xl text-on-surface text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 mt-4"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {logSuccess ? 'Diagnostics Saved Successfully' : 'Commit Logger Signals'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* TAB INSIGHTS VIEW */}
          {activeTab === 'insights' && (
            <motion.div
              key="insights-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/70 max-w-4xl mx-auto shadow-sm"
            >
              <h2 className="font-headline-md text-headline-md text-primary mb-3">Biological Intelligence Reports</h2>
              <p className="text-secondary font-body-md mb-8">
                Analytical breakdown of your cycle indicators compiled by Luna Intelligence Core.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-white/50 border border-white/60 rounded-3xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-[10px] font-extrabold uppercase text-primary rounded-full">
                      Hormonal Calibration
                    </span>
                    <span className="text-[10px] text-secondary font-bold">Shift Report</span>
                  </div>
                  <h4 className="font-bold text-primary text-base">Follicular Estrogen Phase</h4>
                  <p className="text-xs text-secondary leading-relaxed">
                    Estrogen levels are steadily rising, supporting serotonin synthesis. This is a vital phase for high physical resilience, cardiovascular stamina, and neural plasticity. Consider high-intensity workouts and complex cognitive assignments.
                  </p>
                </div>

                <div className="p-5 bg-white/50 border border-white/60 rounded-3xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 bg-purple-100 border border-purple-200 text-[10px] font-extrabold uppercase text-purple-700 rounded-full">
                      Sleep Recovery
                    </span>
                    <span className="text-[10px] text-secondary font-bold">Continuity Diagnostic</span>
                  </div>
                  <h4 className="font-bold text-primary text-base">Deep Rest Correlation</h4>
                  <p className="text-xs text-secondary leading-relaxed">
                    Based on logged data, sleep efficiency increases by 14% during your follicular phase. As progesterone begins to build in your upcoming luteal phase, core temperature increases slightly, which may impact sleep onset. We recommend cooling your room 2 degrees.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB PROFILE VIEW */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/70 max-w-xl mx-auto shadow-sm text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-primary shadow-inner">
                  <span className="material-symbols-outlined text-[48px] text-primary">shield_person</span>
                </div>
              </div>

              <h2 className="font-headline-md text-headline-md text-primary mb-2">{user.name || 'Elena Ross'}</h2>
              <p className="text-secondary font-body-md mb-8">{user.email || 'elena@lunacare.com'}</p>

              <div className="p-5 bg-white/40 border border-white/60 rounded-3xl flex flex-col gap-3 text-left mb-8">
                <span className="font-bold text-xs text-primary uppercase tracking-wider">Calibration Indexes</span>
                <div className="flex justify-between border-b border-outline/5 pb-2 text-sm font-medium text-secondary">
                  <span>Cycle Length Range</span>
                  <span className="font-bold text-primary">{onboarding.cycleLength} Days</span>
                </div>
                <div className="flex justify-between border-b border-outline/5 pb-2 text-sm font-medium text-secondary">
                  <span>Bleeding Period Range</span>
                  <span className="font-bold text-primary">{onboarding.periodLength} Days</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-secondary">
                  <span>Baseline Calibration Date</span>
                  <span className="font-bold text-primary">{onboarding.lastPeriodDate}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => navigate('/onboarding')}
                  className="w-full py-3.5 border border-white bg-white/50 hover:bg-white rounded-full font-bold text-xs uppercase tracking-wider text-primary shadow-sm"
                >
                  Recalibrate Rhythm Core
                </button>
                <button
                  onClick={() => {
                    logoutUser();
                    navigate('/landingpage');
                  }}
                  className="w-full py-3.5 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20"
                >
                  Disconnect Sanctuary
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ═══════════════ BOTTOM NAV BAR ═══════════════ */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[90%] max-w-md">
        <div className="glass shadow-[0_24px_50px_rgba(165,53,86,0.12)] border border-white/70 p-3 rounded-full flex justify-between items-center">
          {[
            { id: 'home', label: 'Home', icon: 'space_dashboard' },
            { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
            { id: 'log', label: 'Log', icon: 'edit_note' },
            { id: 'insights', label: 'Insights', icon: 'insights' },
            { id: 'profile', label: 'Profile', icon: 'person' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center rounded-full p-2.5 transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary scale-110 shadow-md shadow-primary/30'
                    : 'text-secondary/80 hover:text-primary hover:bg-white/40'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                <span className="text-[9px] font-bold mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

/* ═══════════════ BODY INTELLIGENCE ORB WEBGL COMPONENT ═══════════════ */
const BodyIntelligenceOrb: React.FC<{ phase: string; color: string }> = ({ phase, color }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;
    const activeGl = gl;
    let renderId: number;

    const vs = `attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;

    // Fragment Shader - beautiful pulsing orb colored according to phase
    const fs = `precision highp float;
    varying vec2 v_texCoord;
    uniform float u_time;
    uniform vec3 u_phase_color;
    uniform vec2 u_mouse;
    uniform vec2 u_res;

    void main() {
      vec2 uv = v_texCoord;
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(uv, center);
      
      // Heartbeat pulse calculation
      float pulse = 1.0 + sin(u_time * 3.8) * 0.05;
      
      // Distortion noise
      float distortion = sin(uv.x * 12.0 + u_time) * cos(uv.y * 12.0 - u_time) * 0.04;
      float orbRadius = 0.28 * pulse + distortion;
      
      // Mouse interaction glow influence
      vec2 mouseNorm = u_mouse / u_res;
      float mouseDist = distance(uv, mouseNorm);
      float hoverGlow = smoothstep(0.35, 0.0, mouseDist) * 0.05;
      
      float edgeGlow = smoothstep(orbRadius + 0.08, orbRadius - 0.08, dist);
      float fillGlow = smoothstep(orbRadius, 0.0, dist);
      
      vec3 col = u_phase_color;
      // Add dynamic internal colors
      col += vec3(0.15, 0.08, 0.15) * sin(u_time * 0.8);
      
      // Soft ambient background
      vec3 finalCol = col * fillGlow + vec3(1.0, 1.0, 1.0) * (edgeGlow - fillGlow) * 0.3;
      finalCol += u_phase_color * hoverGlow;
      
      // Ambient shadow masking
      float alpha = edgeGlow;
      
      gl_FragColor = vec4(finalCol, alpha);
    }`;

    function compileShader(type: number, src: string): WebGLShader | null {
      const s = activeGl.createShader(type);
      if (!s) return null;
      activeGl.shaderSource(s, src);
      activeGl.compileShader(s);
      return s;
    }

    const prog = activeGl.createProgram();
    if (!prog) return;

    const vsShader = compileShader(activeGl.VERTEX_SHADER, vs);
    const fsShader = compileShader(activeGl.FRAGMENT_SHADER, fs);

    if (vsShader && fsShader) {
      activeGl.attachShader(prog, vsShader);
      activeGl.attachShader(prog, fsShader);
      activeGl.linkProgram(prog);
      activeGl.useProgram(prog);

      const buf = activeGl.createBuffer();
      activeGl.bindBuffer(activeGl.ARRAY_BUFFER, buf);
      activeGl.bufferData(activeGl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), activeGl.STATIC_DRAW);

      const pos = activeGl.getAttribLocation(prog, 'a_position');
      activeGl.enableVertexAttribArray(pos);
      activeGl.vertexAttribPointer(pos, 2, activeGl.FLOAT, false, 0, 0);

      const uTime = activeGl.getUniformLocation(prog, 'u_time');
      const uPhaseCol = activeGl.getUniformLocation(prog, 'u_phase_color');
      const uMouse = activeGl.getUniformLocation(prog, 'u_mouse');
      const uRes = activeGl.getUniformLocation(prog, 'u_res');

      // Convert hex color to rgb normalized
      const parseHexToRgb = (hex: string) => {
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) {
          cleanHex = cleanHex.split('').map(c => c + c).join('');
        }
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        return [r, g, b];
      };

      const rgbColor = parseHexToRgb(color);
      const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

      const handleMouse = (e: MouseEvent) => {
        const r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = r.height - (e.clientY - r.top);
      };
      window.addEventListener('mousemove', handleMouse);

      function draw(t: number) {
        if (!canvas) return;
        activeGl.viewport(0, 0, canvas.width, canvas.height);
        activeGl.clearColor(0, 0, 0, 0);
        activeGl.clear(activeGl.COLOR_BUFFER_BIT);

        if (uTime) activeGl.uniform1f(uTime, t * 0.001);
        if (uPhaseCol) activeGl.uniform3fv(uPhaseCol, new Float32Array(rgbColor));
        if (uMouse) activeGl.uniform2f(uMouse, mouse.x, mouse.y);
        if (uRes) activeGl.uniform2f(uRes, canvas.width, canvas.height);

        activeGl.drawArrays(activeGl.TRIANGLE_STRIP, 0, 4);
        renderId = requestAnimationFrame(draw);
      }
      draw(0);

      return () => {
        cancelAnimationFrame(renderId);
        window.removeEventListener('mousemove', handleMouse);
      };
    }
  }, [phase, color]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-auto cursor-pointer">
      {/* Outer Pulse rings */}
      <motion.div
        className="w-56 h-56 rounded-full border border-primary/10 absolute z-0"
        animate={{ scale: [1.0, 1.25, 1.0], opacity: [0.35, 0.1, 0.35] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      />
      <motion.div
        className="w-64 h-64 rounded-full border border-primary/5 absolute z-0"
        animate={{ scale: [1.1, 1.45, 1.1], opacity: [0.2, 0.0, 0.2] }}
        transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}
      />
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="w-full h-full relative z-10 block"
      />
      <div className="absolute z-20 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary/80">Est. Status</span>
        <span className="text-xl font-extrabold text-primary drop-shadow-sm capitalize">{phase}</span>
        <span className="text-[9px] font-bold text-secondary mt-1">Glow correlates to rhythm</span>
      </div>
    </div>
  );
};
