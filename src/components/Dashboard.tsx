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
  const [activeTab, setActiveTab] = useState<'home' | 'lab' | 'calendar' | 'log' | 'insights' | 'profile'>('home');

  // Interactive Selected Day for Calendar
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Logging values (interactive state)
  const [loggedMood, setLoggedMood] = useState<'Radiant' | 'Balanced' | 'Sensitive' | 'Low Energy' | 'Anxious'>('Balanced');
  const [loggedSymptoms, setLoggedSymptoms] = useState<string[]>([]);
  const [loggedSleep, setLoggedSleep] = useState<number>(7);
  const [loggedEnergy, setLoggedEnergy] = useState<number>(7);
  const [loggedStress, setLoggedStress] = useState<number>(3);
  const [loggedHydration, setLoggedHydration] = useState<number>(4); // cups (1-8)
  const [logSaved, setLogSaved] = useState<boolean>(false);

  // Interactive Timeline state for Prediction Lab (+0, +3, +7, +14, +21)
  const [selectedTimelineOffset, setSelectedTimelineOffset] = useState<number>(0);

  // Calculate cycle parameters
  const today = new Date();
  const lastPeriod = new Date(onboarding.lastPeriodDate);
  const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentCycleDay = (diffDays % onboarding.cycleLength) + 1;

  const periodLength = onboarding.periodLength;
  const cycleLength = onboarding.cycleLength;
  const ovulationDay = cycleLength - 14;
  const fertilityStart = ovulationDay - 4;
  const fertilityEnd = ovulationDay + 1;

  // Determine current cycle phase
  let currentPhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' = 'follicular';
  let phaseTitle = 'Follicular Phase';
  let phaseColor = '#e2d9f3'; // lavender default

  if (currentCycleDay <= periodLength) {
    currentPhase = 'menstrual';
    phaseTitle = 'Menstrual Phase';
    phaseColor = '#a53556'; // crimson
  } else if (currentCycleDay < ovulationDay - 2) {
    currentPhase = 'follicular';
    phaseTitle = 'Follicular Phase';
    phaseColor = '#e2d9f3'; // lavender
  } else if (currentCycleDay <= ovulationDay + 1) {
    currentPhase = 'ovulation';
    phaseTitle = 'Ovulation Phase';
    phaseColor = '#ffdbdb'; // soft rose
  } else {
    currentPhase = 'luteal';
    phaseTitle = 'Luteal Phase';
    phaseColor = '#fccdc7'; // peach
  }

  // Dynamic greeting based on cycle phase and time of day
  const [greeting, setGreeting] = useState('Welcome back');
  const [phaseTip, setPhaseTip] = useState('');

  useEffect(() => {
    const hrs = new Date().getHours();
    let greetStr = 'Welcome back';
    if (hrs < 12) greetStr = 'Good Morning';
    else if (hrs < 18) greetStr = 'Good Afternoon';
    else greetStr = 'Good Evening';
    setGreeting(greetStr);

    // Contextual Phase Message
    if (currentPhase === 'menstrual') {
      setPhaseTip('Your body is in a restoration phase. Prioritize light movement and high magnesium intake today.');
    } else if (currentPhase === 'follicular') {
      setPhaseTip('Your body is entering a high-energy window. Cognitive focus is expected to increase over the next 48 hours.');
    } else if (currentPhase === 'ovulation') {
      setPhaseTip('You are in your peak ovulation phase. Stamina, confidence, and metabolic output are fully optimized.');
    } else {
      setPhaseTip('Energy is gently turning inward. Grounding exercises and analytical tasks are highly favored today.');
    }
  }, [currentPhase]);

  // Days until next period
  const daysUntilNextPeriod = currentCycleDay <= periodLength
    ? 0
    : cycleLength - currentCycleDay + 1;

  // Sync log state with today's log if it exists
  useEffect(() => {
    if (dailyLogs[todayStr]) {
      const log = dailyLogs[todayStr];
      setLoggedMood(log.mood as any);
      setLoggedSymptoms(log.symptoms);
      setLoggedSleep(log.sleep);
      setLoggedEnergy(log.energy);
      setLoggedStress(log.stress);
    }
  }, [dailyLogs]);

  // Handle logging form submission
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logDay({
      mood: loggedMood,
      symptoms: loggedSymptoms,
      sleep: loggedSleep,
      energy: loggedEnergy,
      stress: loggedStress,
    });
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 3000);
  };

  const handleSymptomToggle = (symptom: string) => {
    if (loggedSymptoms.includes(symptom)) {
      setLoggedSymptoms(loggedSymptoms.filter(s => s !== symptom));
    } else {
      setLoggedSymptoms([...loggedSymptoms, symptom]);
    }
  };

  // Helper for rendering calendar cell indicators
  const getDayIndicator = (cellDateStr: string) => {
    const log = dailyLogs[cellDateStr];
    if (!log) return null;
    return (
      <div className="flex gap-1 justify-center mt-1">
        <span className={`w-1 h-1 rounded-full ${log.mood === 'Radiant' ? 'bg-[#ff7b9c]' : 'bg-[#ae9fc4]'}`} />
        {log.symptoms.length > 0 && <span className="w-1 h-1 rounded-full bg-[#a53556]" />}
        {log.sleep >= 8 && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
      </div>
    );
  };

  // Right Panel Calendar Data Context
  const selectedLog = dailyLogs[selectedDateStr];

  return (
    <div className="min-h-screen w-full bg-background pb-32 relative text-on-background selection:bg-primary/20">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/5 to-transparent blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-primary-container/5 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* Main Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-outline/5 relative z-30">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">spa</span>
          </span>
          <span className="font-extrabold text-xl text-primary tracking-tight">LunaCare</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-secondary">Body Calibrated</span>
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
          
          {/* ═══════════════ DASHBOARD HOME ═══════════════ */}
          {activeTab === 'home' && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-10"
            >
              {/* Living Intelligence Hero */}
              <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/70 shadow-[0_24px_64px_rgba(165,53,86,0.06)] relative overflow-hidden flex flex-col lg:flex-row items-center gap-10">
                <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="w-80 h-80 rounded-full blur-[100px] opacity-20 transition-all duration-1000"
                    style={{ backgroundColor: phaseColor }}
                  />
                </div>

                {/* Dynamic Welcome Message */}
                <div className="flex-1 flex flex-col gap-6 relative z-10 text-center lg:text-left">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 border border-white/80 rounded-full text-xs font-extrabold uppercase tracking-widest text-primary mb-3">
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                      Intelligence Core
                    </span>
                    <h2 className="font-headline-lg text-3xl md:text-4xl text-primary font-extrabold mb-3">
                      {greeting}, {user.name?.split(' ')[0] || 'Elena'}.
                    </h2>
                    <p className="text-secondary font-medium leading-relaxed max-w-md">
                      {phaseTip}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto lg:mx-0">
                    <div className="bg-white/40 border border-white/60 p-4 rounded-2xl">
                      <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">Focus State</span>
                      <span className="text-sm font-bold text-primary">Estrogen Peak Flow</span>
                    </div>
                    <div className="bg-white/40 border border-white/60 p-4 rounded-2xl">
                      <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">HRV Baseline</span>
                      <span className="text-sm font-bold text-primary">Stable (64ms)</span>
                    </div>
                  </div>
                </div>

                {/* Central Living Orb Container */}
                <div className="relative z-10 w-80 h-80 flex items-center justify-center select-none">
                  <BodyIntelligenceOrb phase={currentPhase} color={phaseColor} />
                  
                  {/* Orbiting Modules */}
                  {[
                    { label: 'Day', val: `${currentCycleDay}` },
                    { label: 'Mood', val: loggedMood },
                    { label: 'Sleep', val: `${loggedSleep}h` },
                    { label: 'Energy', val: loggedEnergy >= 7 ? 'High' : 'Moderate' },
                    { label: 'Stress', val: loggedStress <= 4 ? 'Low' : 'Mild' },
                    { label: 'Accuracy', val: '98%' }
                  ].map((mod, i) => (
                    <motion.div
                      key={mod.label}
                      className="absolute glass px-3 py-1.5 rounded-full border border-white/50 text-[10px] font-bold text-primary shadow-sm flex items-center gap-1.5 whitespace-nowrap z-20"
                      animate={{
                        x: [
                          Math.cos((i / 6) * 2 * Math.PI) * 135,
                          Math.cos((i / 6) * 2 * Math.PI + Math.PI) * 135,
                          Math.cos((i / 6) * 2 * Math.PI + 2 * Math.PI) * 135,
                        ],
                        y: [
                          Math.sin((i / 6) * 2 * Math.PI) * 135,
                          Math.sin((i / 6) * 2 * Math.PI + Math.PI) * 135,
                          Math.sin((i / 6) * 2 * Math.PI + 2 * Math.PI) * 135,
                        ],
                      }}
                      transition={{
                        duration: 35,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <span className="text-secondary/70">{mod.label}</span>
                      <span className="font-extrabold">{mod.val}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Right Side: Quick Diagnostic metrics */}
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

              {/* Connected Cycle Journey Segment */}
              <div className="glass-card p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="font-extrabold text-primary text-lg tracking-tight mb-1">Interactive Cycle Journey</h3>
                  <p className="text-secondary text-xs">Visualize biological phase pathways and expected transitions</p>
                </div>
                
                <div className="relative py-8 px-4 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2">
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-white/50 rounded-full -translate-y-1/2 hidden md:block z-0" />
                  
                  {[
                    { id: 'menstrual', label: 'Menstrual Phase', color: 'bg-[#a53556]', desc: 'Restoration & Reset', range: `Days 1-${periodLength}` },
                    { id: 'follicular', label: 'Follicular Phase', color: 'bg-[#e2d9f3]', desc: 'Mental focus & energy rising', range: `Days ${periodLength + 1}-${ovulationDay - 3}` },
                    { id: 'ovulation', label: 'Ovulation Phase', color: 'bg-[#ffdbdb]', desc: 'Peak fertility window', range: `Days ${ovulationDay - 2}-${ovulationDay + 1}` },
                    { id: 'luteal', label: 'Luteal Phase', color: 'bg-[#fccdc7]', desc: 'Introspection & calm transition', range: `Days ${ovulationDay + 2}-${cycleLength}` },
                  ].map((phaseItem) => {
                    const isActive = currentPhase === phaseItem.id;
                    return (
                      <Tooltip key={phaseItem.id} text={`${phaseItem.desc} (${phaseItem.range})`}>
                        <div className={`relative z-10 flex flex-col items-center p-4 rounded-2xl transition-all cursor-pointer ${isActive ? 'bg-white/80 border border-primary/20 scale-105 shadow-sm' : 'hover:bg-white/30'}`}>
                          <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${phaseItem.color} shadow-sm mb-2`}>
                            {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                          </div>
                          <span className="font-bold text-xs text-primary">{phaseItem.label}</span>
                          <span className="text-[10px] text-secondary mt-0.5">{phaseItem.range}</span>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>

                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                  <span className="text-xs font-bold text-primary">
                    Micro-Insight: You are {currentCycleDay <= ovulationDay ? `${ovulationDay - currentCycleDay} days away from peak ovulation` : 'moving towards hormonal recovery'}. Sleep quality and focus duration should peak soon.
                  </span>
                </div>
              </div>

              {/* Predictive Insight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Energy Rising', val: 'Estrogen spike projected in 48h. Stamina levels will peak.', icon: 'bolt', col: 'text-amber-500' },
                  { title: 'Mood Stable', val: 'Neurotransmitter balance active. Cognitive resilience is high.', icon: 'spa', col: 'text-[#a53556]' },
                  { title: 'Recovery Active', val: 'HRV calibration successful. Deep sleep cycle is stable.', icon: 'bedtime', col: 'text-purple-600' },
                  { title: 'Cycle Adapting', val: 'Adaptive tracking synchronization active. Variance under 1.2d.', icon: 'rotate_right', col: 'text-emerald-600' }
                ].map((item) => (
                  <div key={item.title} className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs text-primary uppercase tracking-widest">{item.title}</span>
                      <span className={`material-symbols-outlined text-[20px] ${item.col}`}>{item.icon}</span>
                    </div>
                    <p className="text-secondary text-xs leading-relaxed font-bold">
                      "{item.val}"
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════ SIGNATURE: PREDICTION LAB ═══════════════ */}
          {activeTab === 'lab' && (
            <motion.div
              key="lab-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-10"
            >
              {/* Hero Banner with large WebGL Prediction Orb */}
              <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/70 shadow-[0_24px_64px_rgba(165,53,86,0.06)] relative overflow-hidden flex flex-col lg:flex-row items-center gap-10">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
                
                {/* Left details */}
                <div className="flex-1 flex flex-col gap-6 relative z-10 text-center lg:text-left">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 border border-white/80 rounded-full text-xs font-extrabold uppercase tracking-widest text-primary mb-3">
                      <span className="material-symbols-outlined text-[14px]">science</span>
                      Signature Laboratory
                    </span>
                    <h2 className="font-headline-lg text-4xl text-primary font-black leading-tight mb-3">
                      Prediction Lab
                    </h2>
                    <p className="text-secondary font-medium leading-relaxed max-w-md text-sm">
                      Our signature adaptive engine forecasts future physiological states by analyzing continuous biometric logs.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Calibration Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-white/60 border border-white/80 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[98%]" />
                      </div>
                      <span className="text-xs font-bold text-primary">98% Synchronized</span>
                    </div>
                  </div>
                </div>

                {/* High Fidelity WebGL Interactive Prediction Orb */}
                <div className="relative z-10 w-80 h-80 flex items-center justify-center">
                  <BodyIntelligenceOrb phase={currentPhase} color={phaseColor} />
                  
                  {/* Floating cards drift */}
                  <motion.div
                    className="absolute -right-6 top-8 glass p-3.5 rounded-2xl border border-white/60 shadow-lg text-left w-44"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="block text-[8px] font-bold text-primary uppercase mb-1">LH Hormone</span>
                    <span className="block text-xs font-bold text-secondary">Surge expected in 3 days</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -left-8 bottom-10 glass p-3.5 rounded-2xl border border-white/60 shadow-lg text-left w-44"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  >
                    <span className="block text-[8px] font-bold text-purple-600 uppercase mb-1">Rhythm Variance</span>
                    <span className="block text-xs font-bold text-secondary">Cycle adapts dynamically</span>
                  </motion.div>
                </div>
              </div>

              {/* Forecast Interactive Timeline */}
              <div className="glass-card p-8 rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col gap-8">
                <div>
                  <h3 className="font-bold text-primary text-lg tracking-tight mb-1">Physiological Timeline Forecast</h3>
                  <p className="text-secondary text-xs">Select a horizon node to project your future biometrics</p>
                </div>

                {/* Timeline nodes */}
                <div className="flex justify-between items-center relative py-6 max-w-3xl mx-auto w-full">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/60 rounded-full -translate-y-1/2 z-0" />
                  
                  {[0, 3, 7, 14, 21].map((offset) => {
                    const isActive = selectedTimelineOffset === offset;
                    return (
                      <button
                        key={offset}
                        onClick={() => setSelectedTimelineOffset(offset)}
                        className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                          isActive
                            ? 'bg-primary border-primary text-on-primary shadow-lg scale-110'
                            : 'bg-white border-white text-secondary hover:bg-slate-50'
                        }`}
                      >
                        {offset === 0 ? 'Today' : `+${offset}d`}
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Projections */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { type: 'Period Flow', status: selectedTimelineOffset === 0 ? 'Active bleeding' : selectedTimelineOffset < 5 ? 'Resting Phase' : selectedTimelineOffset < 20 ? 'Follicular Transition' : 'Next Cycle Starting', icon: 'water_drop', score: '98%' },
                    { type: 'Ovulation', status: selectedTimelineOffset < 5 ? 'Developing follicle' : selectedTimelineOffset < 10 ? 'High fertility window' : 'Completed cycle shift', icon: 'wb_sunny', score: '95%' },
                    { type: 'Mood Tendency', status: selectedTimelineOffset < 7 ? 'Radiant & Social' : 'Reflective & Grounded', icon: 'sentiment_satisfied', score: '92%' },
                    { type: 'Physical Energy', status: selectedTimelineOffset < 7 ? 'High Peak Stamina' : 'Moderate Inward Flow', icon: 'bolt', score: '88%' },
                    { type: 'Sleep Recovery', status: selectedTimelineOffset < 14 ? 'Optimal Rest Duration' : 'Slightly Fragmented REM', icon: 'bedtime', score: '94%' },
                    { type: 'Stress Resilience', status: selectedTimelineOffset < 7 ? 'High Resilience' : 'Moderate Sensitivity', icon: 'spa', score: '90%' }
                  ].map((pred) => (
                    <div key={pred.type} className="bg-white/40 border border-white/60 p-5 rounded-2xl flex flex-col justify-between gap-3 shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="material-symbols-outlined text-primary text-lg">{pred.icon}</span>
                        <span className="text-[9px] font-bold text-primary">{pred.score} Conf.</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-secondary uppercase mb-0.5">{pred.type}</span>
                        <span className="text-xs font-bold text-primary leading-tight">{pred.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between text-xs">
                  <span className="font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">info</span>
                    Predictions are dynamically updated using local Bayesian intelligence engines.
                  </span>
                  <span className="font-bold text-secondary text-[10px]">Adaptive Confidence Rate: 94.2%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ CALENDAR TAB ═══════════════ */}
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-8"
            >
              {/* Calendar Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Current Phase', val: phaseTitle },
                  { label: 'Next Period Forecast', val: daysUntilNextPeriod > 0 ? `In ${daysUntilNextPeriod} Days` : 'Period Commencing' },
                  { label: 'Ovulation Forecast', val: currentCycleDay <= ovulationDay ? `In ${ovulationDay - currentCycleDay} Days` : 'Completed' },
                  { label: 'Consistency Score', val: '98% (Stable)' },
                  { label: 'Prediction Accuracy', val: '97% Calibrated' }
                ].map((stat) => (
                  <div key={stat.label} className="glass-card p-4 rounded-2xl border border-white/60 text-center flex flex-col justify-center">
                    <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">{stat.label}</span>
                    <span className="text-xs md:text-sm font-bold text-primary">{stat.val}</span>
                  </div>
                ))}
              </div>

              {/* Main Calendar View with Side Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: 2 Cycles visual grids */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {[0, 1].map((cycleIndex) => {
                    const cycleStart = new Date(lastPeriod.getTime() + cycleIndex * cycleLength * 24 * 60 * 60 * 1000);
                    return (
                      <div key={cycleIndex} className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm">
                        <h4 className="font-extrabold text-primary text-sm uppercase tracking-wider mb-4">
                          Cycle Sequence {cycleIndex + 1} ({cycleStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                        </h4>

                        <div className="grid grid-cols-7 gap-2.5 text-center">
                          {Array.from({ length: cycleLength }).map((_, dayIndex) => {
                            const dayNum = dayIndex + 1;
                            const targetDate = new Date(cycleStart.getTime() + dayIndex * 24 * 60 * 60 * 1000);
                            const cellDateStr = targetDate.toISOString().split('T')[0];
                            const isSelected = selectedDateStr === cellDateStr;

                            let cellStyle = 'bg-white/30 text-secondary border border-transparent';
                            if (dayNum <= periodLength) {
                              cellStyle = 'bg-primary/20 text-[#a53556] border border-primary/20';
                            } else if (dayNum >= fertilityStart && dayNum <= fertilityEnd) {
                              cellStyle = 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold';
                            } else if (dayNum === ovulationDay) {
                              cellStyle = 'bg-purple-100 border border-purple-300 text-purple-800 font-extrabold';
                            }

                            return (
                              <button
                                key={dayNum}
                                onClick={() => setSelectedDateStr(cellDateStr)}
                                className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex flex-col items-center justify-center text-xs font-bold relative transition-all ${cellStyle} ${
                                  isSelected ? 'ring-2 ring-primary scale-110 shadow-sm bg-white' : 'hover:scale-105'
                                }`}
                              >
                                {dayNum}
                                {getDayIndicator(cellDateStr)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Selected Day Intelligence Panel */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6">
                  <div>
                    <span className="block text-[10px] font-extrabold text-primary uppercase tracking-widest mb-1">Diagnostic Ledger</span>
                    <h4 className="font-extrabold text-primary text-base">
                      {new Date(selectedDateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h4>
                  </div>

                  {selectedLog ? (
                    <div className="flex flex-col gap-4">
                      <div className="bg-white/50 border border-white/60 p-4 rounded-2xl flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Logged Signals</span>
                        <div className="flex justify-between text-xs font-bold text-primary">
                          <span>Mood: {selectedLog.mood}</span>
                          <span>Sleep: {selectedLog.sleep}h</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-primary">
                          <span>Energy: {selectedLog.energy}/10</span>
                          <span>Stress: {selectedLog.stress}/10</span>
                        </div>
                        {selectedLog.symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {selectedLog.symptoms.map(s => (
                              <span key={s} className="bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary px-2 py-0.5 rounded-full">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                        <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">AI Recommendation</span>
                        <p className="text-xs text-emerald-800 leading-relaxed font-bold">
                          "Historically, your focus peaking capacity occurs around this phase day. Recommended scheduling of complex tasks is advised."
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-4">
                      <span className="material-symbols-outlined text-[48px] text-secondary/30">analytics</span>
                      <p className="text-secondary text-xs leading-relaxed">
                        No telemetry logs registered for this date. Click below to register indicators.
                      </p>
                      <button
                        onClick={() => setActiveTab('log')}
                        className="px-5 py-2.5 bg-primary text-on-primary rounded-full text-xs font-bold shadow-sm"
                      >
                        Register Log
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ TACTILE LOGGING ═══════════════ */}
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
                Perform daily calibrations of sleep, stress, energy levels, and active cycle symptoms.
              </p>

              <form onSubmit={handleLogSubmit} className="flex flex-col gap-8">
                {/* Tactile Mood Selection */}
                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-3.5 ml-1">Today's Focus Mood</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { id: 'Radiant', emoji: '✨' },
                      { id: 'Balanced', emoji: '🌿' },
                      { id: 'Sensitive', emoji: '🤍' },
                      { id: 'Low Energy', emoji: '🔋' },
                      { id: 'Anxious', emoji: '🌪' }
                    ].map(item => {
                      const isActive = loggedMood === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setLoggedMood(item.id as any)}
                          className={`p-4 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                            isActive
                              ? 'bg-primary text-on-primary border-primary shadow-md scale-105'
                              : 'bg-white/40 border-white text-secondary hover:bg-white'
                          }`}
                        >
                          <span className="text-xl">{item.emoji}</span>
                          <span>{item.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Energy & Stress Tactiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Energy Rate ({loggedEnergy}/10)</label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={loggedEnergy}
                      onChange={(e) => setLoggedEnergy(parseInt(e.target.value))}
                      className="w-full accent-primary h-2 bg-white/60 rounded-full"
                    />
                    <div className="flex justify-between text-[10px] text-secondary font-bold mt-1.5">
                      <span>Resting</span>
                      <span>Moderate</span>
                      <span>High Stamina</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-2 ml-1">Stress Factor ({loggedStress}/10)</label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={loggedStress}
                      onChange={(e) => setLoggedStress(parseInt(e.target.value))}
                      className="w-full accent-primary h-2 bg-white/60 rounded-full"
                    />
                    <div className="flex justify-between text-[10px] text-secondary font-bold mt-1.5">
                      <span>Calm</span>
                      <span>Manageable</span>
                      <span>High Alert</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Sleep Ring Simulation */}
                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-3 ml-1">Sleep Quality ({loggedSleep} hrs)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={4}
                      max={12}
                      step={0.5}
                      value={loggedSleep}
                      onChange={(e) => setLoggedSleep(parseFloat(e.target.value))}
                      className="flex-1 accent-primary h-2 bg-white/60 rounded-full"
                    />
                    <div className="w-14 h-14 rounded-full border-2 border-primary flex items-center justify-center text-xs font-black text-primary bg-white/60">
                      {loggedSleep}h
                    </div>
                  </div>
                </div>

                {/* Symptom Chips */}
                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-3 ml-1">Physical Symptoms</label>
                  <div className="flex flex-wrap gap-2">
                    {['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Acne Flare', 'Healthy Flow'].map(s => {
                      const isActive = loggedSymptoms.includes(s);
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

                {/* Hydration Tracker */}
                <div>
                  <label className="block text-xs font-bold text-primary tracking-wider uppercase mb-3 ml-1">Hydration Intensity ({loggedHydration} / 8 cups)</label>
                  <div className="flex gap-2">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const isActive = idx < loggedHydration;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLoggedHydration(idx + 1)}
                          className={`w-9 h-10 border rounded-xl flex items-center justify-center transition-all ${
                            isActive ? 'bg-[#ff7b9c]/10 border-primary text-primary' : 'bg-white/40 border-white text-secondary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">water_drop</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Living Summary Feedback Block */}
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                  <span className="block text-[10px] font-bold text-primary uppercase mb-1">Today's signals indicate</span>
                  <p className="text-xs font-bold text-secondary">
                    {loggedMood} mood • {loggedSleep}h rest quality • {loggedEnergy >= 7 ? 'High energy capacity' : 'Slight energy rest'} • {loggedStress <= 4 ? 'Low baseline stress' : 'Mild alert triggers'} • {loggedHydration >= 6 ? 'Optimal hydration' : 'Need more water'}
                  </p>
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 mt-4"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165,53,86,0.35)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {logSaved ? 'Diagnostics Saved Successfully' : 'Commit Logger Signals'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ═══════════════ VISUAL INSIGHTS ═══════════════ */}
          {activeTab === 'insights' && (
            <motion.div
              key="insights-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-10"
            >
              {/* Insight Summary Banner */}
              <div>
                <h2 className="font-headline-md text-headline-md text-primary font-black mb-1">Biological Insights Dashboard</h2>
                <p className="text-secondary font-body-md">
                  Curated telemetry correlations processed by Luna's deep pattern recognition engine.
                </p>
              </div>

              {/* Graphical Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mood Trends Area Chart */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary text-xs uppercase tracking-widest">Mood Trends (Last 7 Days)</span>
                    <span className="material-symbols-outlined text-primary text-base">sentiment_satisfied</span>
                  </div>
                  <div className="h-32 w-full pt-4 relative">
                    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="mood-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ff7b9c" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#ff7b9c" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 30 Q 15 10, 30 18 T 60 25 T 90 12 L 100 12 L 100 40 L 0 40 Z" fill="url(#mood-grad)" />
                      <path d="M 0 30 Q 15 10, 30 18 T 60 25 T 90 12 L 100 12" fill="none" stroke="#ff7b9c" strokeWidth="1.5" />
                    </svg>
                    <div className="flex justify-between text-[9px] text-secondary font-bold mt-2">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>

                {/* Energy Fluctuations Bar Chart */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary text-xs uppercase tracking-widest">Energy Fluctuations</span>
                    <span className="material-symbols-outlined text-primary text-base">bolt</span>
                  </div>
                  <div className="h-32 w-full flex items-end justify-between px-2 pt-4">
                    {[5, 6, 8, 4, 7, 8, 9].map((val, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 w-full">
                        <div className="w-4 bg-primary/20 border border-primary/10 rounded-t-md relative overflow-hidden" style={{ height: `${val * 10}%` }}>
                          <div className="absolute inset-0 bg-primary w-full" style={{ height: '100%', transform: `scaleY(${val/10})`, transformOrigin: 'bottom' }} />
                        </div>
                        <span className="text-[9px] text-secondary font-bold">D{idx+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Correlations and Pattern Discovery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { text: 'Sleep quality increases by 15% during follicular days.', icon: 'bedtime', col: 'text-purple-600' },
                  { text: 'Stress indicators drop by 22% during optimal hydration cycles.', icon: 'spa', col: 'text-[#a53556]' },
                  { text: 'High activity levels correlate to stable luteal phase entry.', icon: 'directions_run', col: 'text-amber-500' }
                ].map((pattern, idx) => (
                  <div key={idx} className="bg-white/40 border border-white/60 p-5 rounded-2xl flex items-start gap-3 shadow-inner">
                    <span className={`material-symbols-outlined ${pattern.col} text-lg`}>{pattern.icon}</span>
                    <p className="text-xs text-secondary font-bold leading-normal">
                      {pattern.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* AI Insight Card */}
              <div className="glass-card p-8 rounded-[2rem] border border-white/60 shadow-sm bg-gradient-to-tr from-primary/5 via-transparent to-[#ae9fc4]/10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-xl animate-bounce">auto_awesome</span>
                  <h4 className="font-extrabold text-primary text-sm uppercase tracking-wider">AI Pattern Discovery</h4>
                </div>
                <p className="text-secondary text-sm leading-relaxed mb-4">
                  "Based on 90 days of tracking, your energy levels peak consistently between cycle days 12 and 15. We recommend scheduling major initiatives during this window and reducing caffeine intake during luteal phase days 21–25."
                </p>
                <div className="text-[10px] text-secondary font-bold uppercase">Luna Diagnostics Core • 98.4% Confidence</div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ PROFILE & ACHIEVEMENTS ═══════════════ */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-10"
            >
              {/* Wellness Profile Center */}
              <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/70 max-w-2xl mx-auto shadow-sm text-center w-full">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined text-[48px] text-primary">shield_person</span>
                  </div>
                </div>

                <h2 className="font-headline-md text-headline-md text-primary font-black mb-2">{user.name || 'Elena Ross'}</h2>
                <p className="text-secondary font-body-md mb-8">{user.email || 'elena@lunacare.com'}</p>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                  {[
                    { label: 'Avg Cycle', val: '28 Days' },
                    { label: 'Period Range', val: '5 Days' },
                    { label: 'Logs Saved', val: `${Object.keys(dailyLogs).length}` },
                    { label: 'Prediction Rate', val: '97%' },
                    { label: 'Accuracy', val: '98%' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white/50 border border-white/60 p-3 rounded-2xl">
                      <span className="block text-[8px] font-bold text-secondary uppercase tracking-widest mb-1">{stat.label}</span>
                      <span className="text-xs font-bold text-primary">{stat.val}</span>
                    </div>
                  ))}
                </div>

                {/* Achievements */}
                <div className="text-left mb-8">
                  <span className="block text-xs font-extrabold text-primary uppercase tracking-wider mb-4">Luna Calibration Medals</span>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '30 Days Tracked', icon: 'verified' },
                      { label: '90 Days Sync', icon: 'settings_backup_restore' },
                      { label: 'Insight Master', icon: 'auto_awesome' }
                    ].map((badge, idx) => (
                      <div key={idx} className="bg-[#ff7b9c]/10 border border-primary/20 p-3 rounded-2xl flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">{badge.icon}</span>
                        <span className="text-[10px] font-bold text-primary leading-tight">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calibration Controls */}
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
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ═══════════════ BOTTOM NAV BAR ═══════════════ */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[95%] max-w-lg">
        <div className="glass shadow-[0_24px_50px_rgba(165,53,86,0.12)] border border-white/70 p-3 rounded-full flex justify-between items-center">
          {[
            { id: 'home', label: 'Home', icon: 'space_dashboard' },
            { id: 'lab', label: 'Lab', icon: 'science' },
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
                className={`flex flex-col items-center justify-center rounded-full px-3 py-2 transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary scale-105 shadow-md shadow-primary/30'
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

    // Fragment Shader - highly refined pulsing organic orb with breathing effects, noise waves, and particles
    const fs = `precision highp float;
    varying vec2 v_texCoord;
    uniform float u_time;
    uniform vec3 u_phase_color;
    uniform vec2 u_mouse;
    uniform vec2 u_res;

    // Simplex noise-like helper
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = v_texCoord;
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(uv, center);
      
      // Heartbeat pulse calculation
      float pulse = 1.0 + sin(u_time * 2.8) * 0.04;
      
      // Distortion noise for breathing
      float n1 = snoise(uv * 3.5 + vec2(u_time * 0.3, -u_time * 0.1)) * 0.05;
      float n2 = snoise(uv * 8.0 - vec2(u_time * 0.4, u_time * 0.2)) * 0.02;
      
      float orbRadius = 0.26 * pulse + n1 + n2;
      
      // Mouse interaction glow influence
      vec2 mouseNorm = u_mouse / u_res;
      float mouseDist = distance(uv, mouseNorm);
      float hoverGlow = smoothstep(0.4, 0.0, mouseDist) * 0.08;
      
      // Edge glow and fill glow
      float edgeGlow = smoothstep(orbRadius + 0.1, orbRadius - 0.1, dist);
      float fillGlow = smoothstep(orbRadius, 0.0, dist);
      
      // Core inner glow (particles)
      float innerGlow = smoothstep(orbRadius * 0.6, 0.0, dist) * 0.25;
      
      vec3 col = u_phase_color;
      col += vec3(0.08, 0.04, 0.12) * sin(u_time * 0.5);
      col += vec3(0.1, 0.02, 0.05) * innerGlow;
      
      // Ambient particle light points inside the orb
      float particleNoise = snoise(uv * 12.0 + vec2(0.0, u_time * 1.5));
      float particles = smoothstep(0.7, 0.9, particleNoise) * fillGlow * 0.15;
      
      vec3 finalCol = col * fillGlow + vec3(1.0, 0.9, 0.95) * (edgeGlow - fillGlow) * 0.35;
      finalCol += u_phase_color * hoverGlow;
      finalCol += vec3(1.0, 1.0, 1.0) * particles;
      
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
