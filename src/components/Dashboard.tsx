import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { 
  Sparkles, 
  HeartHandshake, 
  HeartPulse, 
  BatteryLow, 
  Brain, 
  Circle, 
  Droplets, 
  Droplet, 
  Activity, 
  Waves, 
  MoonStar, 
  BrainCircuit, 
  Zap, 
  CheckCircle,
  ShieldCheck
} from 'lucide-react';


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
  const { user, onboarding, dailyLogs, logDay, logoutUser, partnerAction, partnerLogUpdate, triggerPartnerAction } = useApp();
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
  const [loggedFlow, setLoggedFlow] = useState<'NONE' | 'SPOTTING' | 'LIGHT' | 'MEDIUM' | 'HEAVY'>('NONE');
  const [loggedHrv, setLoggedHrv] = useState<number>(75);
  const [logSaved, setLogSaved] = useState<boolean>(false);

  // Interactive Timeline state for Prediction Lab (+0, +3, +7, +14, +21)
  const [selectedTimelineOffset, setSelectedTimelineOffset] = useState<number>(0);
  const [labForecast, setLabForecast] = useState<any>(null);
  const [labLoading, setLabLoading] = useState<boolean>(false);

  // API states
  const [forecast, setForecast] = useState<any>(null);
  const [partnerStatus, setPartnerStatus] = useState<any>({ paired: false });
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState('');
  const [partnerSuccess, setPartnerSuccess] = useState('');

  // Fetch forecast and partner status on mount
  const fetchDashboardData = async () => {
    try {
      const fc = await api.predictions.getForecast();
      setForecast(fc);
    } catch (e) {
      console.error('Failed to load predictions forecast:', e);
    }
    try {
      const ps = await api.partner.status();
      setPartnerStatus(ps);
    } catch (e) {
      console.error('Failed to load partner status:', e);
    }
  };

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchDashboardData();
    }
  }, [user.isLoggedIn, onboarding]);

  // Fetch dynamic lab projections when offset changes
  useEffect(() => {
    const fetchLabProjections = async () => {
      if (!user.isLoggedIn) return;
      try {
        setLabLoading(true);
        const fc = await api.predictions.getForecast(selectedTimelineOffset);
        setLabForecast(fc);
      } catch (e) {
        console.error('Failed to load predictions lab forecast:', e);
      } finally {
        setLabLoading(false);
      }
    };
    fetchLabProjections();
  }, [selectedTimelineOffset, user.isLoggedIn, dailyLogs]);

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

  // Use forecast if loaded
  const daysUntilNextPeriod = forecast ? forecast.daysRemaining : (currentCycleDay <= periodLength ? 0 : cycleLength - currentCycleDay + 1);
  
  const getDaysUntilOvulation = () => {
    if (forecast) {
      const peakDate = new Date(forecast.ovulationWindow.peak);
      const diff = peakDate.getTime() - today.getTime();
      const diffD = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return diffD >= 0 ? diffD : 0;
    }
    return ovulationDay - currentCycleDay;
  };
  const daysUntilOvulation = getDaysUntilOvulation();

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
  // Already computed as daysUntilNextPeriod above

  // Sync log state with today's log if it exists
  useEffect(() => {
    if (dailyLogs[todayStr]) {
      const log = dailyLogs[todayStr];
      setLoggedMood(log.mood as any);
      setLoggedSymptoms(log.symptoms);
      setLoggedSleep(log.sleep);
      setLoggedEnergy(log.energy);
      setLoggedStress(log.stress);
      setLoggedHydration(log.hydration || 4);
      setLoggedFlow(log.flowType || 'NONE');
      setLoggedHrv(log.hrv || 75);
    }
  }, [dailyLogs]);

  // Handle logging form submission
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logDay({
        mood: loggedMood,
        symptoms: loggedSymptoms,
        sleep: loggedSleep,
        energy: loggedEnergy,
        stress: loggedStress,
        hydration: loggedHydration,
        flowType: loggedFlow,
        hrv: loggedHrv,
      });
      setLogSaved(true);
      setTimeout(() => setLogSaved(false), 3000);
      const fc = await api.predictions.getForecast();
      setForecast(fc);
    } catch (err) {
      console.error('Failed to save daily stats:', err);
    }
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
      {/* Real-time Toast Notifications */}
      <AnimatePresence>
        {partnerLogUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 glass-card border border-emerald-500/30 bg-white/95 p-4 rounded-2xl shadow-xl flex items-center gap-3 w-80"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[18px]">sync</span>
            </div>
            <div>
              <span className="block text-[9px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Partner Log Sync</span>
              <span className="text-[11px] font-bold text-secondary">
                {partnerLogUpdate.partnerId === partnerStatus?.partner?.id ? partnerStatus?.partner?.name : 'Partner'} updated their daily metrics.
              </span>
            </div>
          </motion.div>
        )}
        {partnerAction && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 glass-card border border-primary/30 bg-white/95 p-4 rounded-2xl shadow-xl flex items-center gap-3 w-80"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">favorite</span>
            </div>
            <div>
              <span className="block text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Sanctuary Signal</span>
              <span className="text-[11px] font-bold text-secondary">Your partner sent love: "{partnerAction.action}"</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/5 to-transparent blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-primary-container/5 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* Main Header */}
      <header className="w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 flex justify-between items-center border-b border-outline/5 relative z-30">
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
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
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
              <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 border border-white/70 shadow-[0_24px_64px_rgba(165,53,86,0.06)] relative overflow-hidden flex flex-col lg:flex-row items-center gap-6 sm:gap-10">
                <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="w-80 h-80 rounded-full blur-[100px] opacity-20 transition-all duration-1000"
                    style={{ backgroundColor: phaseColor }}
                  />
                </div>

                {/* Dynamic Welcome Message */}
                <div className="flex-1 flex flex-col gap-4 sm:gap-6 relative z-10 text-center lg:text-left">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 border border-white/80 rounded-full text-xs font-extrabold uppercase tracking-widest text-primary mb-3">
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                      Intelligence Core
                    </span>
                    <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-primary font-extrabold mb-3">
                      {greeting}, {user.name?.split(' ')[0] || 'Elena'}.
                    </h2>
                    <p className="text-secondary font-medium leading-relaxed max-w-md text-xs sm:text-sm">
                      {phaseTip}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm mx-auto lg:mx-0">
                    <div className="bg-white/40 border border-white/60 p-3 sm:p-4 rounded-2xl">
                      <span className="block text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">Focus State</span>
                      <span className="text-xs sm:text-sm font-bold text-primary">{forecast ? forecast.focusState : 'Calibrating...'}</span>
                    </div>
                    <div className="bg-white/40 border border-white/60 p-3 sm:p-4 rounded-2xl">
                      <span className="block text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">HRV Baseline</span>
                      <span className="text-xs sm:text-sm font-bold text-primary">{forecast ? forecast.hrvBaseline : 'Calibrating...'}</span>
                    </div>
                  </div>
                </div>

                {/* Central Living Orb Container */}
                <div className="relative z-10 w-80 h-80 flex items-center justify-center select-none scale-[0.75] xs:scale-90 sm:scale-100 my-[-30px] sm:my-0">
                  <BodyIntelligenceOrb phase={currentPhase} color={phaseColor} />
                  
                  {/* Orbiting Modules */}
                  {(() => {
                    const todayLog = dailyLogs[todayStr];
                    const modules = [
                      { label: 'Day', val: `${currentCycleDay}` },
                      { label: 'Mood', val: todayLog ? todayLog.mood : '--' },
                      { label: 'Sleep', val: todayLog ? `${todayLog.sleep}h` : '--h' },
                      { label: 'Energy', val: todayLog ? (todayLog.energy >= 7 ? 'High' : 'Moderate') : '--' },
                      { label: 'Stress', val: todayLog ? (todayLog.stress <= 4 ? 'Low' : 'Mild') : '--' },
                      { label: 'Accuracy', val: forecast ? `${forecast.accuracyRate}%` : '50%' }
                    ];
                    return modules.map((mod, i) => (
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
                    ));
                  })()}
                </div>

                {/* Right Side: Quick Diagnostic metrics */}
                <div className="flex-1 flex flex-col gap-3 sm:gap-6 relative z-10 w-full lg:w-auto">
                  <div className="p-4 sm:p-5 bg-white/50 border border-white/60 rounded-3xl flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[20px] sm:text-[24px]">calendar_today</span>
                    </div>
                    <div>
                      <span className="block text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest leading-normal">Next Cycle Commencement</span>
                      <span className="text-sm sm:text-base font-extrabold text-primary">
                        {daysUntilNextPeriod > 0 ? `In ${daysUntilNextPeriod} Days` : 'Period Commencing Today'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white/50 border border-white/60 rounded-3xl flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                      <span className="material-symbols-outlined text-[20px] sm:text-[24px]">wb_sunny</span>
                    </div>
                    <div>
                      <span className="block text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest leading-normal">Est. Ovulation Date</span>
                      <span className="text-sm sm:text-base font-extrabold text-purple-700">
                        {daysUntilOvulation > 0 ? `In ${daysUntilOvulation} Days` : 'Ovulated'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white/50 border border-white/60 rounded-3xl flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                      <span className="material-symbols-outlined text-[20px] sm:text-[24px]">check_circle</span>
                    </div>
                    <div>
                      <span className="block text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest leading-normal">Forecast Confidence</span>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                        {forecast && forecast.totalLogsCount >= 1 ? `${forecast.confidenceRate}% Calibrated` : 'Baseline: 50%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Cycle Journey Segment */}
              <div className="glass-card p-5 sm:p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="font-extrabold text-primary text-lg tracking-tight mb-1">Interactive Cycle Journey</h3>
                  <p className="text-secondary text-xs">Visualize biological phase pathways and expected transitions</p>
                </div>
                
                <div className="relative py-6 sm:py-8 px-2 sm:px-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-2">
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-white/50 rounded-full -translate-y-1/2 hidden md:block z-0" />
                  <div className="absolute left-[27px] top-6 bottom-6 w-1 bg-white/50 rounded-full md:hidden z-0" />
                  
                  {[
                    { id: 'menstrual', label: 'Menstrual Phase', color: 'bg-[#a53556]', desc: 'Restoration & Reset', range: `Days 1-${periodLength}` },
                    { id: 'follicular', label: 'Follicular Phase', color: 'bg-[#e2d9f3]', desc: 'Mental focus & energy rising', range: `Days ${periodLength + 1}-${ovulationDay - 3}` },
                    { id: 'ovulation', label: 'Ovulation Phase', color: 'bg-[#ffdbdb]', desc: 'Peak fertility window', range: `Days ${ovulationDay - 2}-${ovulationDay + 1}` },
                    { id: 'luteal', label: 'Luteal Phase', color: 'bg-[#fccdc7]', desc: 'Introspection & calm transition', range: `Days ${ovulationDay + 2}-${cycleLength}` },
                  ].map((phaseItem) => {
                    const isActive = currentPhase === phaseItem.id;
                    return (
                      <Tooltip key={phaseItem.id} text={`${phaseItem.desc} (${phaseItem.range})`}>
                        <div className={`relative z-10 flex flex-row md:flex-col items-center md:justify-center gap-4 md:gap-2 p-3 sm:p-4 rounded-2xl transition-all cursor-pointer w-full md:w-auto ${isActive ? 'bg-white/80 border border-primary/20 scale-[1.02] md:scale-105 shadow-sm' : 'hover:bg-white/30'}`}>
                          <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${phaseItem.color} shadow-sm shrink-0 md:mb-2`}>
                            {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                          </div>
                          <div className="flex flex-col items-start md:items-center">
                            <span className="font-bold text-xs text-primary">{phaseItem.label}</span>
                            <span className="text-[10px] text-secondary mt-0.5">{phaseItem.range}</span>
                          </div>
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

              {/* Predictive Insight Cards / Hormone Levels */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Estrogen Level',
                    val: forecast ? `${forecast.hormones.estrogen}%` : 'Calibrating...',
                    desc: forecast ? (forecast.hormones.estrogen >= 70 ? 'High follicular rise / peak flow' : 'Resting baseline cycle levels') : 'Initial learning phase active',
                    icon: 'water_drop',
                    col: 'text-[#ff7b9c]',
                    pct: forecast ? forecast.hormones.estrogen : 50
                  },
                  {
                    title: 'Progesterone Level',
                    val: forecast ? `${forecast.hormones.progesterone}%` : 'Calibrating...',
                    desc: forecast ? (forecast.hormones.progesterone >= 50 ? 'Luteal phase dominance' : 'Baseline pre-ovulation levels') : 'Initial learning phase active',
                    icon: 'spa',
                    col: 'text-purple-600',
                    pct: forecast ? forecast.hormones.progesterone : 50
                  },
                  {
                    title: 'LH Level',
                    val: forecast ? `${forecast.hormones.lh}%` : 'Calibrating...',
                    desc: forecast ? (forecast.hormones.lh >= 80 ? 'Ovulation surge active' : 'Stable follicular baseline') : 'Initial learning phase active',
                    icon: 'bolt',
                    col: 'text-amber-500',
                    pct: forecast ? forecast.hormones.lh : 50
                  },
                  {
                    title: 'FSH Level',
                    val: forecast ? `${forecast.hormones.fsh}%` : 'Calibrating...',
                    desc: forecast ? (forecast.hormones.fsh >= 40 ? 'Follicle stimulating active' : 'Stable post-ovulatory levels') : 'Initial learning phase active',
                    icon: 'psychology',
                    col: 'text-emerald-600',
                    pct: forecast ? forecast.hormones.fsh : 50
                  }
                ].map((item) => (
                  <div key={item.title} className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs text-primary uppercase tracking-widest">{item.title}</span>
                      <span className={`material-symbols-outlined text-[20px] ${item.col}`}>{item.icon}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-primary">{item.val}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.col.replace('text-', 'bg-')}`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <p className="text-secondary text-[11px] leading-snug font-bold mt-1">
                      {item.desc}
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
              <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 border border-white/70 shadow-[0_24px_64px_rgba(165,53,86,0.06)] relative overflow-hidden flex flex-col lg:flex-row items-center gap-6 sm:gap-10">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
                
                {/* Left details */}
                <div className="flex-1 flex flex-col gap-4 sm:gap-6 relative z-10 text-center lg:text-left">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 border border-white/80 rounded-full text-xs font-extrabold uppercase tracking-widest text-primary mb-3">
                      <span className="material-symbols-outlined text-[14px]">science</span>
                      Signature Laboratory
                    </span>
                    <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-primary font-black leading-tight mb-3">
                      Prediction Lab
                    </h2>
                    <p className="text-secondary font-medium leading-relaxed max-w-md text-xs sm:text-sm">
                      Our signature adaptive engine forecasts future physiological states by analyzing continuous biometric logs.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Calibration Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-white/60 border border-white/80 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: forecast ? `${forecast.accuracyRate}%` : '50%' }} />
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {forecast ? `${forecast.accuracyRate}% Synchronized` : 'Learning...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* High Fidelity WebGL Interactive Prediction Orb */}
                <div className="relative z-10 w-80 h-80 flex items-center justify-center scale-[0.75] xs:scale-90 sm:scale-100 my-[-30px] sm:my-0">
                  <BodyIntelligenceOrb phase={currentPhase} color={phaseColor} />
                  
                  {/* Floating cards drift */}
                  <motion.div
                    className="absolute -right-6 top-8 glass p-3.5 rounded-2xl border border-white/60 shadow-lg text-left w-44 scale-[0.9] sm:scale-100"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="block text-[8px] font-bold text-primary uppercase mb-1">LH Hormone</span>
                    <span className="block text-xs font-bold text-secondary">Surge expected in 3 days</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -left-8 bottom-10 glass p-3.5 rounded-2xl border border-white/60 shadow-lg text-left w-44 scale-[0.9] sm:scale-100"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  >
                    <span className="block text-[8px] font-bold text-purple-600 uppercase mb-1">Rhythm Variance</span>
                    <span className="block text-xs font-bold text-secondary">Cycle adapts dynamically</span>
                  </motion.div>
                </div>
              </div>

              {/* Forecast Interactive Timeline */}
              {(!forecast || forecast.totalLogsCount < 3) ? (
                <div className="glass-card p-8 rounded-[2rem] border border-white/60 shadow-sm text-center py-16 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[32px]">query_stats</span>
                  </div>
                  <h3 className="font-headline-md text-xl text-primary font-black">Collecting Baseline Data...</h3>
                  <p className="text-secondary text-xs max-w-sm font-medium leading-relaxed">
                    LunaCare requires at least 3 daily telemetry logs to establish baseline biometrics. Log daily signals to unlock predictions.
                  </p>
                  <button
                    onClick={() => setActiveTab('log')}
                    className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-bold text-xs tracking-wider shadow-lg shadow-primary/20 hover:scale-103 transition-all"
                  >
                    Log Daily Signals
                  </button>
                </div>
              ) : (
                <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col gap-6 sm:gap-8">
                  <div>
                    <h3 className="font-bold text-primary text-lg tracking-tight mb-1">Physiological Timeline Forecast</h3>
                    <p className="text-secondary text-xs">Select a horizon node to project your future biometrics</p>
                  </div>

                  {/* Timeline nodes */}
                  <div className="flex justify-between items-center relative py-4 sm:py-6 max-w-3xl mx-auto w-full px-2">
                    <div className="absolute top-1/2 left-2 right-2 h-1 bg-white/60 rounded-full -translate-y-1/2 z-0" />
                    
                    {[0, 3, 7, 14, 21].map((offset) => {
                      const isActive = selectedTimelineOffset === offset;
                      return (
                        <button
                          key={offset}
                          onClick={() => setSelectedTimelineOffset(offset)}
                          className={`relative z-10 w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center font-bold text-[10px] sm:text-xs transition-all ${
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
                  {labLoading ? (
                    <div className="text-center py-10 w-full flex flex-col items-center justify-center min-h-[200px]">
                      <span className="material-symbols-outlined text-primary animate-spin text-3xl">sync</span>
                      <span className="mt-2 text-xs font-bold text-secondary">Computing dynamic projections...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                      {(() => {
                        const targetForecast = labForecast || forecast;
                        if (!targetForecast) return null;
                        const phase = targetForecast.currentPhase || 'follicular';
                        const accuracy = targetForecast.accuracyRate || 50;
                        const lh = targetForecast.hormones?.lh || 50;

                        // Dynamic status calculation based on simulated hormones & phases
                        const flowStatus = phase === 'menstrual' ? 'Active bleeding' : phase === 'follicular' ? 'Resting Phase' : phase === 'ovulation' ? 'Follicular Transition' : 'Next Cycle Starting';
                        const ovulationStatus = phase === 'ovulation' ? 'Peak ovulation surge' : (phase === 'follicular' && lh > 30) ? 'High fertility window' : (phase === 'follicular') ? 'Developing follicle' : 'Completed cycle shift';
                        const moodStatus = phase === 'menstrual' ? 'Restful & Reflective' : phase === 'follicular' ? 'Radiant & Social' : phase === 'ovulation' ? 'High Social Stamina' : 'Reflective Detail Focus';
                        const energyStatus = phase === 'menstrual' ? 'Resting / Recovery' : phase === 'follicular' ? 'High Peak Stamina' : phase === 'ovulation' ? 'Peak Metabolic Energy' : 'Moderate Inward Flow';
                        const sleepStatus = phase === 'menstrual' ? 'Extended Rest Quality' : phase === 'follicular' ? 'Optimal Rest Duration' : phase === 'ovulation' ? 'Deep Slow-Wave Rest' : 'Slightly Fragmented REM';
                        const stressStatus = phase === 'menstrual' ? 'Moderate Sensitivity' : phase === 'follicular' ? 'High Resilience' : phase === 'ovulation' ? 'Calm Stability' : 'Varying Resilience';

                        return [
                          { type: 'Period Flow', status: flowStatus, icon: 'water_drop', score: `${accuracy}%` },
                          { type: 'Ovulation', status: ovulationStatus, icon: 'wb_sunny', score: `${Math.max(50, accuracy - 3)}%` },
                          { type: 'Mood Tendency', status: moodStatus, icon: 'sentiment_satisfied', score: `${Math.max(50, accuracy - 5)}%` },
                          { type: 'Physical Energy', status: energyStatus, icon: 'bolt', score: `${Math.max(50, accuracy - 7)}%` },
                          { type: 'Sleep Recovery', status: sleepStatus, icon: 'bedtime', score: `${Math.max(50, accuracy - 4)}%` },
                          { type: 'Stress Resilience', status: stressStatus, icon: 'spa', score: `${Math.max(50, accuracy - 6)}%` }
                        ].map((pred) => (
                          <div key={pred.type} className="bg-white/40 border border-white/60 p-3 sm:p-5 rounded-2xl flex flex-col justify-between gap-3 shadow-inner">
                            <div className="flex justify-between items-center">
                              <span className="material-symbols-outlined text-primary text-base sm:text-lg">{pred.icon}</span>
                              <span className="text-[8px] sm:text-[9px] font-bold text-primary">{pred.score} Conf.</span>
                            </div>
                            <div>
                              <span className="block text-[8px] sm:text-[10px] font-bold text-secondary uppercase mb-0.5">{pred.type}</span>
                              <span className="text-[11px] sm:text-xs font-bold text-primary leading-tight">{pred.status}</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between text-xs">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">info</span>
                      Predictions are dynamically updated using local Bayesian intelligence engines.
                    </span>
                    <span className="font-bold text-secondary text-[10px]">Adaptive Confidence Rate: {forecast.confidenceRate}%</span>
                  </div>
                </div>
              )}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {[
                  { label: 'Current Phase', val: phaseTitle },
                  { label: 'Next Period Forecast', val: daysUntilNextPeriod > 0 ? `In ${daysUntilNextPeriod} Days` : 'Period Commencing' },
                  { label: 'Ovulation Forecast', val: daysUntilOvulation > 0 ? `In ${daysUntilOvulation} Days` : 'Completed' },
                  { label: 'Consistency Score', val: forecast ? `${forecast.confidenceRate}%` : '50%' },
                  { label: 'Prediction Accuracy', val: forecast ? `${forecast.accuracyRate}% Calibrated` : 'Learning...' }
                ].map((stat) => (
                  <div key={stat.label} className="glass-card p-3 sm:p-4 rounded-2xl border border-white/60 text-center flex flex-col justify-center">
                    <span className="block text-[8px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">{stat.label}</span>
                    <span className="text-xs sm:text-sm font-bold text-primary">{stat.val}</span>
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
                      <div key={cycleIndex} className="glass-card p-4 sm:p-6 rounded-[2rem] border border-white/60 shadow-sm">
                        <h4 className="font-extrabold text-primary text-sm uppercase tracking-wider mb-4">
                          Cycle Sequence {cycleIndex + 1} ({cycleStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                        </h4>

                        <div className="grid grid-cols-7 gap-1 xs:gap-2.5 text-center">
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
                                className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center text-xs font-bold relative transition-all ${cellStyle} ${
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
                        <div className="flex justify-between text-xs font-bold text-primary">
                          <span>Flow: {selectedLog.flowType || 'NONE'}</span>
                          <span>Hydration: {selectedLog.hydration || 0} cups</span>
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
          {activeTab === 'log' && (() => {
            const moodDescriptions: Record<string, string> = {
              Radiant: 'High energy, positive outlook & focused stamina.',
              Balanced: 'Centered, calm, and emotionally stable.',
              Sensitive: 'Emotionally open, intuitive, and responsive.',
              'Low Energy': 'Resting state, slow baseline & reflective focus.',
              Anxious: 'Alert, highly active nervous system & tension signals.'
            };

            return (
              <motion.div
                key="log-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8"
              >
                <div className="flex flex-col gap-2 ml-1">
                  <h2 className="text-3xl sm:text-4xl text-primary font-black uppercase tracking-wide">Metrics Logger</h2>
                  <p className="text-secondary text-sm">
                    Perform daily calibrations of sleep, stress, energy levels, and active cycle symptoms.
                  </p>
                </div>

                <form onSubmit={handleLogSubmit} className="flex flex-col gap-6 sm:gap-8">
                  {/* Top Section: Three cards in a row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Mood Card */}
                    <div className="bg-white/80 border border-white/80 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(165,53,86,0.04)] hover:shadow-[0_8px_30px_rgba(165,53,86,0.08)] hover:-translate-y-0.5 transition-all duration-300 min-h-[190px] flex flex-col justify-between">
                      <div>
                        <span className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1">Focus Mood</span>
                        <span className="text-xl font-black text-primary">{loggedMood}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 my-2">
                        {[
                          { id: 'Radiant', label: 'Radiant', icon: Sparkles, color: 'text-amber-500' },
                          { id: 'Balanced', label: 'Balanced', icon: HeartHandshake, color: 'text-emerald-500' },
                          { id: 'Sensitive', label: 'Sensitive', icon: HeartPulse, color: 'text-rose-500' },
                          { id: 'Low Energy', label: 'Low Energy', icon: BatteryLow, color: 'text-blue-500' },
                          { id: 'Anxious', label: 'Anxious', icon: Brain, color: 'text-purple-500' }
                        ].map(item => {
                          const isActive = loggedMood === item.id;
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setLoggedMood(item.id as any)}
                              className={`p-2 py-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:scale-105 ${
                                isActive
                                  ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-primary shadow-[0_4px_12px_rgba(165,53,86,0.08)] font-bold'
                                  : 'bg-white/50 border-white text-secondary hover:bg-white hover:border-slate-350 shadow-sm'
                              }`}
                              title={item.label}
                            >
                              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : item.color}`} />
                              <span className="text-[8px] font-bold tracking-tight block truncate w-full text-center">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-secondary font-bold leading-normal">
                        {moodDescriptions[loggedMood] || 'Select focus mood.'}
                      </p>
                    </div>

                    {/* Flow Card */}
                    <div className="bg-white/80 border border-white/80 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(165,53,86,0.04)] hover:shadow-[0_8px_30px_rgba(165,53,86,0.08)] hover:-translate-y-0.5 transition-all duration-300 min-h-[190px] flex flex-col justify-between">
                      <div>
                        <span className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1">Menstrual Flow</span>
                        <span className="text-xl font-black text-primary">{loggedFlow}</span>
                      </div>
                      <div className="bg-white/50 border border-white/70 p-1 rounded-2xl flex w-full justify-between items-center gap-1 my-2 shadow-inner">
                        {[
                          { id: 'NONE', label: 'None', icon: Circle, color: 'text-slate-400' },
                          { id: 'SPOTTING', label: 'Spotting', icon: Droplets, color: 'text-red-300' },
                          { id: 'LIGHT', label: 'Light', icon: Droplet, color: 'text-red-400' },
                          { id: 'MEDIUM', label: 'Medium', icon: Activity, color: 'text-red-500' },
                          { id: 'HEAVY', label: 'Heavy', icon: Waves, color: 'text-red-700' }
                        ].map(flow => {
                          const isActive = loggedFlow === flow.id;
                          const Icon = flow.icon;
                          return (
                            <button
                              key={flow.id}
                              type="button"
                              onClick={() => setLoggedFlow(flow.id as any)}
                              className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-extrabold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                                isActive
                                  ? 'bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-primary shadow-sm scale-102'
                                  : 'text-secondary hover:text-primary hover:bg-white/60 border border-transparent'
                              }`}
                              title={flow.label}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : flow.color}`} />
                              <span className="hidden sm:inline font-bold text-[8px]">{flow.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-secondary font-bold leading-normal">
                        Select intensity to update predictions.
                      </p>
                    </div>

                    {/* Hydration Card */}
                    <div className="bg-white/80 border border-white/80 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(165,53,86,0.04)] hover:shadow-[0_8px_30px_rgba(165,53,86,0.08)] hover:-translate-y-0.5 transition-all duration-300 min-h-[190px] flex flex-col justify-between">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1">Water Intake</span>
                          <span className="text-xl font-black text-primary">{loggedHydration} of 8 Cups</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full">{Math.round((loggedHydration / 8) * 100)}%</span>
                        </div>
                      </div>
                      
                      {/* 8 horizontal circular indicator dots */}
                      <div className="flex gap-2 justify-between items-center py-2 px-1">
                        {Array.from({ length: 8 }).map((_, idx) => {
                          const isActive = idx < loggedHydration;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setLoggedHydration(idx + 1)}
                              className="group relative flex items-center justify-center transition-all duration-300 focus:outline-none"
                              title={`Set to ${idx + 1} cups`}
                            >
                              <span className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                                isActive
                                  ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] scale-110'
                                  : 'border-2 border-slate-350 bg-white/40 hover:border-blue-400 group-hover:scale-105'
                              }`} />
                              <span className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-[8px] text-white px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 shadow-sm">
                                {idx + 1} Cup{idx > 0 ? 's' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-500 ease-out" 
                          style={{ width: `${(loggedHydration / 8) * 100}%` }} 
                        />
                      </div>
                      
                      <p className="text-[10px] text-secondary font-bold leading-normal">
                        Tap a circle to log water intake cups.
                      </p>
                    </div>
                  </div>

                  {/* Middle Section: Biometrics (2x2 Grid) */}
                  <div className="bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border border-white/45 p-6 rounded-[2.5rem] shadow-md flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm sm:text-base font-extrabold text-primary tracking-wider uppercase ml-1">Body Signals</h3>
                      <p className="text-secondary text-[11px] ml-1">Calibrate physical recovery indexes and nervous system load.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Energy Card */}
                      <div className="bg-white/60 border border-white/80 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-primary">
                            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Energy</span>
                          </div>
                          <span className="text-base sm:text-lg font-black text-primary">{loggedEnergy} / 10</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={loggedEnergy}
                            onChange={(e) => setLoggedEnergy(parseInt(e.target.value))}
                            className="w-full accent-primary h-1.5 bg-slate-200/80 rounded-full cursor-pointer hover:accent-[#ff7b9c] transition-all"
                          />
                          <div className="flex justify-between text-[9px] text-secondary font-extrabold uppercase tracking-wider">
                            <span>Low</span>
                            <span className="text-primary font-black">•</span>
                            <span>High</span>
                          </div>
                        </div>
                      </div>

                      {/* Stress Card */}
                      <div className="bg-white/60 border border-white/80 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-primary">
                            <BrainCircuit className="w-5 h-5 text-purple-500 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Stress</span>
                          </div>
                          <span className="text-base sm:text-lg font-black text-primary">{loggedStress} / 10</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={loggedStress}
                            onChange={(e) => setLoggedStress(parseInt(e.target.value))}
                            className="w-full accent-primary h-1.5 bg-slate-200/80 rounded-full cursor-pointer hover:accent-[#ff7b9c] transition-all"
                          />
                          <div className="flex justify-between text-[9px] text-secondary font-extrabold uppercase tracking-wider">
                            <span>Calm</span>
                            <span className="text-primary font-black">•</span>
                            <span>High</span>
                          </div>
                        </div>
                      </div>

                      {/* Sleep Card */}
                      <div className="bg-white/60 border border-white/80 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-primary">
                            <MoonStar className="w-5 h-5 text-blue-500 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Sleep</span>
                          </div>
                          <span className="text-base sm:text-lg font-black text-primary">{loggedSleep} hrs</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <input
                            type="range"
                            min={4}
                            max={12}
                            step={0.5}
                            value={loggedSleep}
                            onChange={(e) => setLoggedSleep(parseFloat(e.target.value))}
                            className="w-full accent-primary h-1.5 bg-slate-200/80 rounded-full cursor-pointer hover:accent-[#ff7b9c] transition-all"
                          />
                          <div className="flex justify-between text-[9px] text-secondary font-extrabold uppercase tracking-wider">
                            <span>Restless</span>
                            <span className="text-primary font-black">•</span>
                            <span>Deep Rest</span>
                          </div>
                        </div>
                      </div>

                      {/* HRV Card */}
                      <div className="bg-white/60 border border-white/80 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-primary">
                            <HeartPulse className="w-5 h-5 text-rose-500 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-secondary">HRV</span>
                          </div>
                          <span className="text-base sm:text-lg font-black text-primary">{loggedHrv} ms</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <input
                            type="range"
                            min={20}
                            max={150}
                            value={loggedHrv}
                            onChange={(e) => setLoggedHrv(parseInt(e.target.value))}
                            className="w-full accent-primary h-1.5 bg-slate-200/80 rounded-full cursor-pointer hover:accent-[#ff7b9c] transition-all"
                          />
                          <div className="flex justify-between text-[9px] text-secondary font-extrabold uppercase tracking-wider">
                            <span>Resting</span>
                            <span className="text-primary font-black">•</span>
                            <span>High</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Physical Symptoms Panel */}
                  <div className="bg-white/80 border border-white/80 p-6 rounded-[2.5rem] shadow-sm flex flex-col gap-4">
                    <h3 className="text-sm sm:text-base font-extrabold text-primary tracking-wider uppercase ml-1">Physical Symptoms</h3>
                    <div className="flex flex-wrap gap-3">
                      {['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Acne Flare', 'Healthy Flow'].map(s => {
                        const isActive = loggedSymptoms.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSymptomToggle(s)}
                            className={`px-5 py-2 rounded-full text-xs font-bold border transition-all duration-200 hover:scale-[1.03] ${
                              isActive
                                ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_2px_10px_rgba(165,53,86,0.08)]'
                                : 'bg-white/60 border-slate-200 text-secondary hover:bg-white hover:border-slate-350'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Row: Today's Summary & Action (Submit) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    {/* Today's Health Summary */}
                    <div className="lg:col-span-7 bg-white/55 border border-white/70 p-6 rounded-[2.5rem] shadow-sm flex flex-col gap-5 border-l-4 border-l-primary/40 pl-5">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-5 h-5 text-primary shrink-0" />
                        <h3 className="text-sm sm:text-base font-extrabold tracking-wider uppercase">Today's Health Summary</h3>
                      </div>
                      
                      {/* Health Chips */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-white/80 rounded-full text-[10px] font-bold text-secondary">
                          <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
                          Mood: {loggedMood}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-white/80 rounded-full text-[10px] font-bold text-secondary">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Energy: {loggedEnergy}/10
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-white/80 rounded-full text-[10px] font-bold text-secondary">
                          <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
                          Stress: {loggedStress}/10
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-white/80 rounded-full text-[10px] font-bold text-secondary">
                          <Droplets className="w-3.5 h-3.5 text-blue-500" />
                          Water: {loggedHydration}/8 Cups
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-white/80 rounded-full text-[10px] font-bold text-secondary">
                          <Droplet className="w-3.5 h-3.5 text-red-500" />
                          Flow: {loggedFlow}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-white/80 rounded-full text-[10px] font-bold text-secondary">
                          <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                          HRV: {loggedHrv}ms
                        </span>
                      </div>

                      <p className="text-sm text-secondary font-medium leading-relaxed border-t border-white/40 pt-4">
                        Based on today's logged signals: {loggedMood} focus mood state, resting sleep duration of {loggedSleep} hours, and active HRV rate at {loggedHrv}ms. Hydration target is {loggedHydration >= 6 ? 'on track' : 'below target - consider drinking 2 more cups'}.
                      </p>
                    </div>

                    {/* Commit Action Card */}
                    <div className="lg:col-span-5 bg-white/40 border border-white/60 p-6 rounded-[2rem] shadow-sm flex flex-col items-center justify-center gap-4 text-center min-h-[190px]">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-extrabold uppercase tracking-wider">Validation Status</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-base font-black text-primary">Ready to Save</span>
                        <span className="text-[10px] font-bold text-secondary">All required health metrics completed successfully.</span>
                      </div>
                      
                      <motion.button
                        type="submit"
                        className="w-full max-w-[280px] bg-primary text-on-primary py-3.5 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CheckCircle className="w-4 h-4 text-on-primary" />
                        {logSaved ? 'Diagnostics Saved' : "Save Today's Log"}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </motion.div>
            );
          })()}

          {/* ═══════════════ VISUAL INSIGHTS ═══════════════ */}
          {activeTab === 'insights' && (() => {
            const getLast7DaysEnergy = () => {
              const energyVals = [];
              for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                const log = dailyLogs[dStr];
                energyVals.push(log ? log.energy : null); // null if not logged
              }
              return energyVals;
            };
            const last7DaysEnergy = getLast7DaysEnergy();

            return (
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

                {(!forecast || forecast.totalLogsCount < 3) ? (
                  <div className="glass-card p-8 rounded-[2rem] border border-white/60 shadow-sm text-center py-16 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[32px]">insights</span>
                    </div>
                    <h3 className="font-headline-md text-xl text-primary font-black">Collecting Baseline Data...</h3>
                    <p className="text-secondary text-xs max-w-sm font-medium leading-relaxed">
                      Real-time biological insights and correlation graphs require historical logs to find patterns. Log daily signals to discover correlations.
                    </p>
                    <button
                      onClick={() => setActiveTab('log')}
                      className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-bold text-xs tracking-wider shadow-lg shadow-primary/20 hover:scale-103 transition-all"
                    >
                      Log Daily Signals
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Graphical Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Mood Trends Area Chart */}
                      <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary text-xs uppercase tracking-widest">Mood Trends (Last 7 Days)</span>
                          <span className="material-symbols-outlined text-primary text-base">sentiment_satisfied</span>
                        </div>
                        <div className="h-32 w-full pt-4 relative">
                          {(() => {
                            const getLast7DaysMood = () => {
                              const moodMap: Record<string, number> = {
                                'Radiant': 5,
                                'Balanced': 4,
                                'Sensitive': 3,
                                'Low Energy': 2,
                                'Anxious': 1,
                              };
                              const moodVals = [];
                              const dayLabels = [];
                              for (let i = 6; i >= 0; i--) {
                                const d = new Date();
                                d.setDate(d.getDate() - i);
                                const dStr = d.toISOString().split('T')[0];
                                const log = dailyLogs[dStr];
                                const val = log ? moodMap[log.mood] || null : null;
                                moodVals.push(val);
                                dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
                              }
                              return { moodVals, dayLabels };
                            };
                            const { moodVals, dayLabels } = getLast7DaysMood();
                            const points = moodVals.map((val, idx) => {
                              if (val === null) return null;
                              const x = idx * (100 / 6);
                              const y = 40 - (val / 5) * 30; // mapping 1-5 to y range 10-34
                              return { x, y };
                            }).filter((p): p is {x: number, y: number} => p !== null);
                            
                            const linePath = points.length > 0 ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') : '';
                            const areaPath = points.length > 0 ? `M ${points[0].x} 40 ${points.map(p => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} L ${points[points.length-1].x} 40 Z` : '';
                            
                            return (
                              <>
                                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                  <defs>
                                    <linearGradient id="mood-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#ff7b9c" stopOpacity="0.4" />
                                      <stop offset="100%" stopColor="#ff7b9c" stopOpacity="0.0" />
                                    </linearGradient>
                                  </defs>
                                  <path d={areaPath} fill="url(#mood-grad)" />
                                  <path d={linePath} fill="none" stroke="#ff7b9c" strokeWidth="1.5" />
                                </svg>
                                <div className="flex justify-between text-[9px] text-secondary font-bold mt-2">
                                  {dayLabels.map((lbl, idx) => (
                                    <span key={idx}>{idx === 6 ? 'Today' : lbl}</span>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Energy Fluctuations Bar Chart */}
                      <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary text-xs uppercase tracking-widest">Energy Fluctuations</span>
                          <span className="material-symbols-outlined text-primary text-base">bolt</span>
                        </div>
                        <div className="h-32 w-full flex items-end justify-between px-2 pt-4">
                          {last7DaysEnergy.map((val, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1.5 w-full">
                              <div className="w-4 bg-primary/5 border border-primary/10 rounded-t-md relative overflow-hidden" style={{ height: val === null ? '15%' : `${val * 10}%` }}>
                                {val !== null && <div className="absolute inset-0 bg-primary w-full" style={{ height: '100%', transform: `scaleY(${val/10})`, transformOrigin: 'bottom' }} />}
                                {val === null && <div className="absolute inset-0 flex items-center justify-center text-[6px] text-secondary font-bold rotate-[-90deg]">No Data</div>}
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
                        { text: forecast.insights.sleep || 'Sleep quality increases by 15% during follicular days.', icon: 'bedtime', col: 'text-purple-600' },
                        { text: forecast.insights.stress || 'Stress indicators drop by 22% during optimal hydration cycles.', icon: 'spa', col: 'text-[#a53556]' },
                        { text: forecast.insights.activity || 'High activity levels correlate to stable luteal phase entry.', icon: 'directions_run', col: 'text-amber-500' }
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
                        "{forecast.insights.aiPattern || 'Based on your logs, your energy levels peak consistently around your follicular phase...'}"
                      </p>
                      <div className="text-[10px] text-secondary font-bold uppercase">
                        Luna Diagnostics Core • {forecast.confidenceRate}% Confidence
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })()}

          {/* ═══════════════ PROFILE & ACHIEVEMENTS ═══════════════ */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-5xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                {/* Left Column: User Identity Sidebar (4 cols) */}
                <div className="lg:col-span-4 bg-white/40 border border-white/60 p-6 sm:p-8 rounded-[2rem] text-center flex flex-col items-center gap-6 shadow-sm">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/60 border border-white/85 flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined text-[36px] sm:text-[48px] text-primary font-light">shield_person</span>
                  </div>

                  <div>
                    <h2 className="font-headline-md text-xl sm:text-2xl text-primary font-black mb-1">{user.name || 'Elena Ross'}</h2>
                    <p className="text-secondary text-xs sm:text-sm">{user.email || 'elena@lunacare.com'}</p>
                  </div>

                  {/* Calibration & Disconnect Actions */}
                  <div className="w-full flex flex-col gap-3 pt-4 border-t border-outline/10">
                    <button
                      onClick={() => navigate('/onboarding')}
                      className="w-full py-2.5 border border-white bg-white/50 hover:bg-white rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-wider text-primary shadow-sm transition-all"
                    >
                      Recalibrate Rhythm Core
                    </button>
                    <button
                      onClick={() => {
                        logoutUser();
                        navigate('/landingpage');
                      }}
                      className="w-full py-2.5 bg-primary text-on-primary rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-md shadow-primary/20 hover:opacity-95 transition-all"
                    >
                      Disconnect Sanctuary
                    </button>
                  </div>
                </div>

                {/* Right Column: Analytics & Modules (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Wellness Metrics Dashboard */}
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[2.0rem] shadow-sm">
                    <span className="block text-xs font-extrabold text-primary uppercase tracking-wider mb-4 ml-1">Wellness Statistics</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        {
                          label: forecast && forecast.averageCycleLength ? 'Avg Cycle' : 'Current Cycle',
                          val: forecast && forecast.averageCycleLength ? `${forecast.averageCycleLength} Days` : `${onboarding.cycleLength} Days`
                        },
                        { label: 'Period Range', val: `${onboarding.periodLength} Days` },
                        { label: 'Logs Saved', val: `${forecast ? forecast.totalLogsCount : Object.keys(dailyLogs).length}` },
                        { label: 'Prediction Rate', val: forecast ? `${forecast.confidenceRate}%` : '50%' },
                        { label: 'Accuracy', val: forecast ? `${forecast.accuracyRate}%` : '50%' }
                      ].map((stat, idx) => (
                        <div key={idx} className="bg-white/50 border border-white/60 p-3 rounded-2xl flex flex-col justify-between min-h-[70px]">
                          <span className="block text-[7.5px] sm:text-[8px] font-bold text-secondary uppercase tracking-widest leading-normal mb-1">{stat.label}</span>
                          <span className="text-xs sm:text-sm font-bold text-primary">{stat.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[2.0rem] shadow-sm">
                    <span className="block text-xs font-extrabold text-primary uppercase tracking-wider mb-4 ml-1">Luna Calibration Medals</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { label: '7 Days Tracked (Bronze)', icon: 'workspace_premium', minLogs: 7 },
                        { label: '14 Days Tracked (Silver)', icon: 'military_tech', minLogs: 14 },
                        { label: '30 Days Tracked (Gold)', icon: 'stars', minLogs: 30 }
                      ].map((badge, idx) => {
                        const totalLogs = forecast ? forecast.totalLogsCount : 0;
                        const isUnlocked = totalLogs >= badge.minLogs;
                        return (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-2xl flex items-center gap-2 border transition-all ${
                              isUnlocked 
                                ? 'bg-[#ff7b9c]/10 border-primary/20 text-primary' 
                                : 'bg-slate-100/50 border-slate-200/60 text-slate-400 opacity-60'
                            }`}
                          >
                            <span className="material-symbols-outlined text-base sm:text-lg shrink-0">
                              {isUnlocked ? badge.icon : 'lock'}
                            </span>
                            <div className="flex flex-col text-left">
                              <span className="text-[10px] font-bold leading-tight">
                                {badge.label}
                              </span>
                              <span className="text-[8px] font-medium leading-none mt-0.5">
                                {isUnlocked ? 'Unlocked' : `Requires ${badge.minLogs} logs`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Partner Sync Section */}
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[2.0rem] shadow-sm">
                    <span className="block text-xs font-extrabold text-primary uppercase tracking-wider mb-4 ml-1">Partner Sync Core</span>
                    
                    {partnerStatus.paired ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                            <span className="material-symbols-outlined text-[22px]">favorite</span>
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-emerald-800">Connected Sanctuary Active</span>
                            <span className="text-sm font-black text-emerald-950">{partnerStatus.partner.name}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              triggerPartnerAction('Thinking of you! ❤️');
                              setPartnerSuccess('Nudge sent to your partner!');
                              setTimeout(() => setPartnerSuccess(''), 3000);
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-[10px] uppercase tracking-wider transition-all"
                          >
                            Send Love Nudge
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('Are you sure you want to disconnect from your partner?')) return;
                              try {
                                setPartnerLoading(true);
                                setPartnerError('');
                                await api.partner.unlink();
                                setPartnerStatus({ paired: false });
                                setGeneratedCode('');
                                setPartnerSuccess('Partner disconnected successfully.');
                              } catch (err: any) {
                                setPartnerError(err.message || 'Failed to disconnect partner.');
                              } finally {
                                setPartnerLoading(false);
                              }
                            }}
                            className="px-4 py-2 border border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/20 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <p className="text-xs text-secondary leading-relaxed font-bold">
                          Synchronize your cycles and wellness logs with a partner in real-time. Link your profiles to share biological insights.
                        </p>
                        
                        {/* Generate Code Area */}
                        <div className="flex flex-col gap-2">
                          {generatedCode ? (
                            <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-center">
                              <span className="block text-[8px] font-bold text-secondary uppercase tracking-widest mb-1">Your Connection Code</span>
                              <span className="text-lg font-black text-primary tracking-widest">{generatedCode}</span>
                              <span className="block text-[8px] text-secondary mt-1">Share this with your partner. Valid for 10 minutes.</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setPartnerLoading(true);
                                  setPartnerError('');
                                  const res = await api.partner.getCode();
                                  setGeneratedCode(res.syncCode);
                                } catch (err: any) {
                                  setPartnerError(err.message || 'Failed to generate code.');
                                } finally {
                                  setPartnerLoading(false);
                                }
                              }}
                              disabled={partnerLoading}
                              className="w-full py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all"
                            >
                              {partnerLoading ? 'Generating...' : 'Generate Connection Code'}
                            </button>
                          )}
                        </div>

                        {/* Enter Code Area */}
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          if (!partnerCodeInput) return;
                          try {
                            setPartnerLoading(true);
                            setPartnerError('');
                            setPartnerSuccess('');
                            const res = await api.partner.pair(partnerCodeInput);
                            setPartnerSuccess(res.message || 'Successfully paired with partner!');
                            setPartnerCodeInput('');
                            const ps = await api.partner.status();
                            setPartnerStatus(ps);
                          } catch (err: any) {
                            setPartnerError(err.message || 'Failed to pair partner.');
                          } finally {
                            setPartnerLoading(false);
                          }
                        }} className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={partnerCodeInput}
                            onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                            placeholder="ENTER PARTNER CODE"
                            className="flex-1 bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/10 px-4 py-2 rounded-full text-xs font-black tracking-widest text-center focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={partnerLoading || !partnerCodeInput}
                            className="px-4 py-2 bg-primary text-on-primary rounded-full font-bold text-[10px] uppercase tracking-wider disabled:opacity-50"
                          >
                            Link
                          </button>
                        </form>
                      </div>
                    )}

                    {partnerError && <p className="text-[10px] text-red-600 font-bold mt-2 ml-1">{partnerError}</p>}
                    {partnerSuccess && <p className="text-[10px] text-emerald-600 font-bold mt-2 ml-1">{partnerSuccess}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ═══════════════ BOTTOM NAV BAR ═══════════════ */}
      <nav className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[95%] max-w-lg">
        <div className="glass shadow-[0_24px_50px_rgba(165,53,86,0.12)] border border-white/70 p-1.5 sm:p-3 rounded-full flex justify-between items-center gap-1">
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
                className={`flex flex-col items-center justify-center rounded-full px-1.5 py-1.5 sm:px-3 sm:py-2 transition-all flex-1 ${
                  isActive
                    ? 'bg-primary text-on-primary scale-105 shadow-md shadow-primary/30'
                    : 'text-secondary/80 hover:text-primary hover:bg-white/40'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{tab.icon}</span>
                <span className="text-[7.5px] sm:text-[9px] font-bold mt-0.5 block truncate max-w-[48px] sm:max-w-none">{tab.label}</span>
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
