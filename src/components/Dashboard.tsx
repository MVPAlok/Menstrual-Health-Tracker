import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { NotificationCenter } from './NotificationCenter';
import { NotificationSettings } from './NotificationSettings';
import { 
  Sparkles, 
  HeartPulse, 
  MoonStar, 
  BrainCircuit, 
  Zap, 
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  FileText,
  TrendingUp,
  FileSpreadsheet,
  Trash2,
  Copy,
  Edit3,
  ChevronRight,
  Activity
} from 'lucide-react';

/* ═══════════════ MAIN DASHBOARD SCREEN ═══════════════ */
export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const symptomKeyMap: Record<string, string> = {
    'Cramps': 'symptoms.cramps',
    'Headache': 'symptoms.headache',
    'Bloating': 'symptoms.bloating',
    'Fatigue': 'symptoms.fatigue',
    'Acne Flare': 'symptoms.acneFlare',
    'Healthy Flow': 'symptoms.healthyFlow'
  };

  const { 
    user, 
    onboarding, 
    dailyLogs, 
    logDay, 
    deleteLog,
    duplicateLog,
    logoutUser, 
    partnerAction, 
    partnerLogUpdate, 
    triggerPartnerAction,
    profileStats,
    recentChanges,
    downloadReport,
    refreshAnalytics,
    updateProfileImage
  } = useApp();

  const [activeTab, setActiveTab] = useState<'home' | 'lab' | 'calendar' | 'log' | 'insights' | 'profile'>('home');
  const [insightsTimeframe, setInsightsTimeframe] = useState<'7days' | '30days' | 'all'>('7days');

  // Local date helpers to avoid UTC timezone off-by-one shifts
  const getLocalDateString = (dateObj: Date = new Date()) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Interactive Selected Day for Calendar
  const todayStr = getLocalDateString();
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

  // Calendar timeline navigation
  const [calendarMode, setCalendarMode] = useState<'months' | 'cycles'>('months');
  const [calendarMonthOffset, setCalendarMonthOffset] = useState<number>(0);

  // Fetch forecast and partner status on mount
  const fetchDashboardData = async () => {
    try {
      const [fc, ps] = await Promise.all([
        api.predictions.getForecast(),
        api.partner.status()
      ]);
      setForecast(fc);
      setPartnerStatus(ps);
    } catch (e) {
      console.error('Failed to load predictions forecast:', e);
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

  // Sync log state with selectedDateStr log if it exists
  useEffect(() => {
    if (dailyLogs[selectedDateStr]) {
      const log = dailyLogs[selectedDateStr];
      setLoggedMood(log.mood as any);
      setLoggedSymptoms(log.symptoms);
      setLoggedSleep(log.sleep);
      setLoggedEnergy(log.energy);
      setLoggedStress(log.stress);
      setLoggedHydration(log.hydration || 4);
      setLoggedFlow(log.flowType || 'NONE');
      setLoggedHrv(log.hrv || 75);
    } else {
      // Default fallback inputs
      setLoggedMood('Balanced');
      setLoggedSymptoms([]);
      setLoggedSleep(7.0);
      setLoggedEnergy(7);
      setLoggedStress(3);
      setLoggedHydration(4);
      setLoggedFlow('NONE');
      setLoggedHrv(75);
    }
  }, [selectedDateStr, dailyLogs]);

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
      }, selectedDateStr);
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

  // Helper to determine cycle parameters based on dates
  const getCycleStatsForDate = (dateStr: string) => {
    const lastPeriod = new Date(onboarding.lastPeriodDate);
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - lastPeriod.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const cycleLen = profileStats?.averageCycleLength || onboarding.cycleLength;
    const periodLen = profileStats?.averagePeriodLength || onboarding.periodLength;
    const currentDay = ((diffDays % cycleLen) + cycleLen) % cycleLen + 1;
    
    const ovulationDay = cycleLen - 14;
    const fertilityStart = ovulationDay - 4;
    const fertilityEnd = ovulationDay + 1;

    let phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' = 'follicular';
    let color = '#e2d9f3'; // lavender default

    if (currentDay <= periodLen) {
      phase = 'menstrual';
      color = '#a53556'; // crimson
    } else if (currentDay < ovulationDay - 2) {
      phase = 'follicular';
      color = '#ae9fc4'; // soft purple
    } else if (currentDay <= ovulationDay + 1) {
      phase = 'ovulation';
      color = '#ff7b9c'; // pink rose
    } else {
      phase = 'luteal';
      color = '#fccdc7'; // peach
    }

    return {
      currentCycleDay: currentDay,
      currentPhase: phase,
      phaseColor: color,
      isFertile: currentDay >= fertilityStart && currentDay <= fertilityEnd,
      isOvulation: currentDay === ovulationDay
    };
  };

  const todayStats = getCycleStatsForDate(todayStr);
  const currentPhase = todayStats.currentPhase;
  const phaseColor = todayStats.phaseColor;
  const currentCycleDay = todayStats.currentCycleDay;

  const cycleLength = profileStats?.averageCycleLength || onboarding.cycleLength;
  const periodLength = profileStats?.averagePeriodLength || onboarding.periodLength;
  const ovulationDay = cycleLength - 14;

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
  const today = new Date();
  const daysUntilOvulation = getDaysUntilOvulation();

  // Dynamic greeting based on cycle phase and time of day
  const [greeting, setGreeting] = useState('Welcome back');
  const [phaseTip, setPhaseTip] = useState('');

  useEffect(() => {
    const hrs = new Date().getHours();
    let greetKey = 'dashboard.welcome';
    if (hrs < 12) greetKey = 'dashboard.greetingMorning';
    else if (hrs < 18) greetKey = 'dashboard.greetingAfternoon';
    else greetKey = 'dashboard.greetingEvening';
    setGreeting(t(greetKey));

    if (currentPhase === 'menstrual') {
      setPhaseTip(t('rhythms.menstrualDesc'));
    } else if (currentPhase === 'follicular') {
      setPhaseTip(t('rhythms.follicularDesc'));
    } else if (currentPhase === 'ovulation') {
      setPhaseTip(t('rhythms.ovulationDesc'));
    } else {
      setPhaseTip(t('rhythms.lutealDesc'));
    }
  }, [currentPhase, i18n.language]);

  // Calendar Month Helper
  const getDaysForMonthOffset = (offset: number) => {
    const d = new Date();
    d.setDate(1); 
    d.setMonth(d.getMonth() + offset);
    
    const year = d.getFullYear();
    const month = d.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthName = d.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
    
    const daysArray = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      daysArray.push({ day, dateStr: dayStr });
    }
    
    return { days: daysArray, monthName };
  };

  const currentMonthData = getDaysForMonthOffset(calendarMonthOffset);

  // Helper for rendering calendar cell indicators
  const getDayIndicator = (cellDateStr: string) => {
    const log = dailyLogs[cellDateStr];
    const cellStats = getCycleStatsForDate(cellDateStr);
    
    // Check past missed days (earlier than today and not logged and not flow phase)
    const isPast = new Date(cellDateStr).getTime() < new Date(todayStr).getTime();
    const isMissed = isPast && !log && cellStats.currentPhase !== 'menstrual';

    if (!log) {
      if (isMissed) {
        return (
          <div className="flex justify-center items-center h-4 w-full">
            <span className="text-[10px] text-slate-350" title="Missed log">⚪</span>
          </div>
        );
      }
      return (
        <div className="flex justify-center items-center h-4 w-full">
          <span className="text-[8px] text-slate-300" title="No log">•</span>
        </div>
      );
    }

    const icons: { icon: string; title: string }[] = [];

    // 1. Logged Day
    icons.push({ icon: '❤️', title: 'Logged Day' });

    // 2. Period Days (flowType logged or currentPhase menstrual)
    if (log.flowType && log.flowType !== 'NONE') {
      icons.push({ icon: '🩸', title: 'Period Flow' });
    } else if (cellStats.currentPhase === 'menstrual') {
      icons.push({ icon: '🩸', title: 'Period Days' });
    }

    // 3. Ovulation / Fertile
    if (cellStats.isOvulation) {
      icons.push({ icon: '🌸', title: 'Ovulation' });
    } else if (cellStats.isFertile) {
      icons.push({ icon: '🌿', title: 'Fertile Window' });
    }

    // 4. Stress
    if (log.stress >= 7) {
      icons.push({ icon: '⚡', title: 'High Stress' });
    }

    // 5. Sleep
    if (log.sleep >= 8) {
      icons.push({ icon: '🌙', title: 'Good Sleep' });
    }

    // 6. Hydration
    if (log.hydration && log.hydration >= 6) {
      icons.push({ icon: '💧', title: 'Optimal Hydration' });
    }

    // 7. Symptoms
    if (log.symptoms && log.symptoms.length > 0) {
      icons.push({ icon: '📝', title: 'Logged Symptoms' });
    }

    // 8. Partner Sync
    if (partnerStatus.paired) {
      icons.push({ icon: '🤝', title: 'Partner Sync Active' });
    }

    // 9. AI Insight / Anomaly
    if (log.hrv && log.hrv > 85) {
      icons.push({ icon: '✨', title: 'High Vagal Recovery' });
    }

    const visibleIcons = icons.slice(0, 4);
    const extraCount = icons.length - 4;

    return (
      <div className="flex gap-0.5 justify-center items-center w-full overflow-hidden h-4 select-none">
        {visibleIcons.map((item, idx) => (
          <span key={idx} className="text-[10px]" title={item.title}>{item.icon}</span>
        ))}
        {extraCount > 0 && (
          <span className="text-[7.5px] font-black text-secondary leading-none bg-slate-100 border border-slate-200 px-0.5 rounded" title={`${extraCount} more indicators`}>
            +{extraCount}
          </span>
        )}
      </div>
    );
  };

  // Selected Day Details for Diagnostics
  const selectedLog = dailyLogs[selectedDateStr];
  const selectedDayStats = getCycleStatsForDate(selectedDateStr);

  // Recovery Score Calculation
  const calculateRecoveryScore = (log: any) => {
    if (!log) return null;
    const sleepWeight = Math.min(10, log.sleep) * 6; // up to 60 pts
    const stressWeight = (10 - log.stress) * 3; // up to 30 pts
    const hydrationWeight = Math.min(8, log.hydration || 4) * 1.25; // up to 10 pts
    return Math.round(sleepWeight + stressWeight + hydrationWeight);
  };

  // Dynamic biological recommendations for Diagnostic Ledger
  const getBioRecommendation = (dayNum: number, phase: string, log: any) => {
    const defaultRecs = {
      menstrual: "Estrogen and Progesterone reside at baseline levels. Rest is highly recommended. Limit high-impact strain.",
      follicular: "Estrogen levels are scaling up. Autonomic recovery is stable. Peak cognitive drive is unlocked.",
      ovulation: "LH hormone surges to trigger follicle release. Autonomic resilience is at its absolute maximum.",
      luteal: "Progesterone dominates, increasing resting heart rate and suppressing sleep efficiency. Rest is critical."
    };

    let interpretation = defaultRecs[phase as keyof typeof defaultRecs] || "";
    let suggestion = "Log telemetry daily to build dynamic AI observations.";

    if (log) {
      if (phase === 'menstrual') {
        interpretation = `Estrogen and Progesterone are at their cycle nadir. Autonomic recovery score is ${calculateRecoveryScore(log)}/100, matching a restorative rest phase.`;
        if (log.symptoms.includes('Cramps')) {
          suggestion = `Prostaglandin surges are causing physical cramping. Increasing hydration (currently at ${log.hydration} cups) supports vascular clearance. Avoid caffeine and intense cardio today.`;
        } else {
          suggestion = "autonomic parameters are stable. Prioritize steady-state recovery and warm hydration.";
        }
      } else if (phase === 'follicular') {
        interpretation = "Follicle stimulation is rising, yielding high executive capacity. Your stress levels are stable at " + log.stress + "/10.";
        suggestion = "Optimal energy and drive. Engage in collaborative or complex problem-solving. Maintain steady nutrition to support the upcoming follicle release.";
      } else if (phase === 'ovulation') {
        interpretation = `Peak Estrogen release triggers the LH surge. Energy rate is high at ${log.energy}/10 and autonomic HRV registers at ${log.hrv}ms.`;
        suggestion = "Maximum physical capacity. Perfect window for high-intensity physical output or key presentations. Autonomic reserve is highly resilient today.";
      } else if (phase === 'luteal') {
        interpretation = `Progesterone peaks on Cycle Day ${dayNum}, increasing resting heart rate by 8-10% and suppressing slow-wave sleep.`;
        if (log.stress > 6) {
          suggestion = `Autonomic stress is elevated at ${log.stress}/10, which suppresses progesterone stability. Prioritize sleep hygiene and lower caffeine intake before 11 AM.`;
        } else {
          suggestion = "Autonomic shifts favor detail-oriented analysis. Reserve high-intensity focus for early morning and wind down with magnesium-rich foods.";
        }
      }
    } else {
      if (phase === 'menstrual') {
        suggestion = "No telemetry logged. Standard menstrual recovery protocol: Track flow intensity to establish cycle accuracy.";
      } else if (phase === 'follicular') {
        suggestion = "No telemetry logged. Monitoring sleep during this phase helps verify the cognitive boost from rising estrogen.";
      } else if (phase === 'ovulation') {
        suggestion = "No telemetry logged. Establishing ovulation markers is vital to map cycle regularity and fertile windows.";
      } else if (phase === 'luteal') {
        suggestion = "No telemetry logged. Luteal telemetry provides critical alerts on pre-menstrual physical regressions.";
      }
    }

    return { interpretation, recommendation: suggestion };
  };

  const bioLedger = getBioRecommendation(selectedDayStats.currentCycleDay, selectedDayStats.currentPhase, selectedLog);

  const recoveryScore = calculateRecoveryScore(selectedLog);

  // Today's Actionable Priority Action
  const getPriorityAction = () => {
    const todayLog = dailyLogs[todayStr];
    if (!todayLog) {
      return {
        title: "Telemetry Missing",
        desc: "Complete today's health log to calibrate predictions.",
        actionText: "Record Daily Signals",
        tab: "log" as const
      };
    }
    if (todayLog.stress >= 7) {
      return {
        title: "High Stress Load",
        desc: "Autonomic stress index is elevated. Sleep recovery and hydration are highly advised.",
        actionText: "Review Predictions Lab",
        tab: "lab" as const
      };
    }
    if (daysUntilOvulation <= 1 && daysUntilOvulation > 0) {
      return {
        title: "Ovulation Looming",
        desc: "Estrogen peak surge is active. Peak stamina window unlocked.",
        actionText: "View Predictions Lab",
        tab: "lab" as const
      };
    }
    if ((todayLog.hydration || 4) < 6) {
      return {
        title: "Low Hydration cups",
        desc: "Hydration is below optimal benchmark. Drink 2 cups of water.",
        actionText: "Update Hydration",
        tab: "log" as const
      };
    }
    return {
      title: "Autonomic Balance Stable",
      desc: "Hormone baseline is progressing normally. Review cycle insights.",
      actionText: "View Insights",
      tab: "insights" as const
    };
  };

  const priorityAction = getPriorityAction();

  // Learning Level Progression Calculations
  const totalLogs = profileStats ? profileStats.logsSubmitted : 0;
  const getLearningLevel = (count: number) => {
    if (count >= 30) return { level: 4, name: 'Personalized Expert', logsLeft: 0, nextUnlock: 'Full Clinical Maturity' };
    if (count >= 14) return { level: 3, name: 'Pattern Detection', logsLeft: 30 - count, nextUnlock: 'Advanced AI Forecasts' };
    if (count >= 7) return { level: 2, name: 'Weekly Trends', logsLeft: 14 - count, nextUnlock: 'Pattern Detection' };
    return { level: 1, name: 'Basic Predictions', logsLeft: 7 - count, nextUnlock: 'Weekly Trends' };
  };
  const learningLevel = getLearningLevel(totalLogs);

  // AI Confidence reasons
  const getConfidenceReason = (rate: number) => {
    if (rate >= 90) return { status: 'Excellent Confidence', reason: 'Large biometric dataset established.', rec: 'Predictions are highly calibrated.' };
    if (rate >= 80) return { status: 'High Confidence', reason: 'Symptom patterns and streaks matched.', rec: 'Maintain logging to secure calibrations.' };
    if (rate >= 70) return { status: 'Moderate Confidence', reason: 'Limited hydration and HRV history.', rec: 'Continue logging for four more days.' };
    return { status: 'Calibrating Baseline', reason: 'Insufficient logs collected yet.', rec: 'Submit logs daily to calibrate engines.' };
  };
  const confidenceDetails = getConfidenceReason(profileStats?.predictionAccuracy || 50);

  return (
    <div className="min-h-screen w-full bg-background pb-40 relative text-on-background selection:bg-primary/20">
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
              <span className="block text-[9px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">{t('dashboardExtra.partnerLogSync')}</span>
              <span className="text-[11px] font-bold text-secondary">
                {t('dashboardExtra.partnerUpdatedMetrics', {
                  name: partnerStatus?.partner?.name || t('dashboardExtra.partner')
                })}
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
              <span className="block text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">{t('dashboardExtra.sanctuarySignal')}</span>
              <span className="text-[11px] font-bold text-secondary">
                {t('dashboardExtra.partnerSentLove', { action: partnerAction.action })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background elements wrapped to prevent overflow-x without breaking sticky */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-[-100px] sm:right-0 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-gradient-to-bl from-primary/5 to-transparent blur-[100px] sm:blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-[-100px] sm:left-0 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-gradient-to-tr from-primary-container/5 to-transparent blur-[100px] sm:blur-[120px] rounded-full" />
      </div>

      {/* Main Header */}
      <header className="sticky top-0 w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 flex justify-between items-center border-b border-outline/5 z-50 bg-background/90 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">spa</span>
          </span>
          <span className="font-extrabold text-xl text-primary tracking-tight">LunaCare</span>
        </div>
        <div className="flex items-center gap-4">
          {user.profileImage && (
            <img 
              src={user.profileImage} 
              alt="Profile" 
              className="w-9 h-9 rounded-full object-cover border border-primary/20 shadow-sm"
            />
          )}
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-secondary">{t('dashboard.bodyCalibrated')}</span>
            <span className="text-sm font-bold text-primary">{user.name || 'Elena Ross'}</span>
          </div>
          <NotificationCenter />
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
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* ═══════════════ DASHBOARD HOME ═══════════════ */}
          {activeTab === 'home' && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-8"
            >
              {/* Biological Overview Section */}
              <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 border border-white/70 shadow-[0_24px_64px_rgba(165,53,86,0.06)] relative overflow-hidden flex flex-col lg:flex-row items-center gap-6 sm:gap-10">
                <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="w-80 h-80 rounded-full blur-[100px] opacity-20 transition-all duration-1000"
                    style={{ backgroundColor: phaseColor }}
                  />
                </div>

                {/* Left side details */}
                <div className="flex-1 flex flex-col gap-4 sm:gap-6 relative z-10 text-center lg:text-left">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 border border-white/80 rounded-full text-xs font-extrabold uppercase tracking-widest text-primary mb-3">
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                      {t('dashboard.intelCore')}
                    </span>
                    <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-primary font-extrabold mb-3">
                      {greeting}, {user.name?.split(' ')[0] || 'Elena'}.
                    </h2>
                    <p className="text-secondary font-medium leading-relaxed max-w-md text-xs sm:text-sm">
                      {phaseTip}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto lg:mx-0 w-full sm:w-auto">
                    <div className="bg-white/40 border border-white/60 p-3 sm:p-4 rounded-2xl w-full">
                      <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">{t('dashboard.focusState')}</span>
                      <span className="text-xs sm:text-sm font-bold text-primary leading-tight block">{forecast ? forecast.focusState : t('dashboard.calibrating')}</span>
                    </div>
                    <div className="bg-white/40 border border-white/60 p-3 sm:p-4 rounded-2xl w-full">
                      <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-0.5">{t('dashboard.hrvBaseline')}</span>
                      <span className="text-xs sm:text-sm font-bold text-primary leading-tight block">{forecast ? forecast.hrvBaseline : t('dashboard.calibrating')}</span>
                    </div>
                  </div>
                </div>

                {/* Central Living Orb */}
                <div className="relative z-10 w-80 h-80 flex items-center justify-center select-none scale-[0.8] sm:scale-100 my-[-30px] sm:my-0">
                  <BodyIntelligenceOrb phase={currentPhase} color={phaseColor} />
                  
                  {/* Orbiting Modules */}
                  {(() => {
                    const todayLog = dailyLogs[todayStr];
                    const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640;
                    const orbitRadius = isMobileView ? 115 : 135;
                    const modules = [
                      { label: "Cycle Day", val: `${currentCycleDay}` },
                      { label: "Mood", val: todayLog ? t('moods.' + todayLog.mood.toLowerCase().replace(' ', '')) : '--' },
                      { label: "Sleep", val: (todayLog && todayLog.sleep !== undefined) ? `${todayLog.sleep}h` : '--h' },
                      { label: "Hydration", val: (todayLog && todayLog.hydration !== undefined) ? `${todayLog.hydration}c` : '--c' },
                      { label: "HRV", val: todayLog ? `${todayLog.hrv || 70}ms` : '--' },
                      { label: "AI Conf", val: profileStats ? `${profileStats.predictionAccuracy}%` : '50%' }
                    ];
                    return modules.map((mod, i) => (
                      <motion.div
                        key={i}
                        className="absolute glass px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/50 text-[9px] sm:text-[10px] font-bold text-primary shadow-sm flex items-center gap-1.5 whitespace-nowrap z-20"
                        animate={{
                          x: [
                            Math.cos((i / 6) * 2 * Math.PI) * orbitRadius,
                            Math.cos((i / 6) * 2 * Math.PI + Math.PI) * orbitRadius,
                            Math.cos((i / 6) * 2 * Math.PI + 2 * Math.PI) * orbitRadius,
                          ],
                          y: [
                            Math.sin((i / 6) * 2 * Math.PI) * orbitRadius,
                            Math.sin((i / 6) * 2 * Math.PI + Math.PI) * orbitRadius,
                            Math.sin((i / 6) * 2 * Math.PI + 2 * Math.PI) * orbitRadius,
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
                      <span className="block text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest leading-normal">{t('dashboard.nextPeriodForecast')}</span>
                      <span className="text-sm sm:text-base font-extrabold text-primary">
                        {daysUntilNextPeriod > 0 ? t('dashboard.inDays', { days: daysUntilNextPeriod }) : t('dashboard.periodCommencing')}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white/50 border border-white/60 rounded-3xl flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                      <span className="material-symbols-outlined text-[20px] sm:text-[24px]">wb_sunny</span>
                    </div>
                    <div>
                      <span className="block text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest leading-normal">{t('dashboard.ovulationForecast')}</span>
                      <span className="text-sm sm:text-base font-extrabold text-purple-700">
                        {daysUntilOvulation > 0 ? t('dashboard.inDays', { days: daysUntilOvulation }) : t('dashboard.completed')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Action Widget & Recent Changes Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority Action Card */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
                    <h3 className="font-extrabold text-primary text-sm uppercase tracking-widest">Today's Priority Action</h3>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-primary mb-1">{priorityAction.title}</h4>
                    <p className="text-xs text-secondary font-medium leading-relaxed">{priorityAction.desc}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab(priorityAction.tab)}
                    className="w-full py-2.5 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all text-center flex items-center justify-center gap-1 shadow-md shadow-primary/20"
                  >
                    {priorityAction.actionText}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Recent Changes Card */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">trending_up</span>
                    <h3 className="font-extrabold text-primary text-sm uppercase tracking-widest">Biometric Drift (Since Last Log)</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Autonomic Stress', val: recentChanges?.stressDiffPct, downGood: true },
                      { label: 'Hydration Intake', val: recentChanges?.hydrationDiffPct, downGood: false },
                      { label: 'Sleep Recovery', val: recentChanges?.sleepDiffPct, downGood: false },
                      { label: 'AI Calibrations', val: recentChanges?.confidenceDiffPct, downGood: false }
                    ].map((item, idx) => {
                      const value = item.val || 0;
                      const isZero = value === 0;
                      // Determine if change is positive/favorable
                      const isGood = item.downGood ? value < 0 : value > 0;
                      return (
                        <div key={idx} className="bg-white/40 border border-white/60 p-2.5 rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-secondary uppercase leading-none">{item.label}</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            {isZero ? (
                              <span className="text-xs font-black text-secondary">No Drift</span>
                            ) : (
                              <>
                                <span className={`material-symbols-outlined text-base ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {value > 0 ? 'trending_up' : 'trending_down'}
                                </span>
                                <span className={`text-xs font-black ${isGood ? 'text-emerald-700' : 'text-red-650'}`}>
                                  {Math.abs(value)}% {value > 0 ? 'Increase' : 'Decrease'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[9px] text-secondary font-bold pl-1">
                    *Streaks change: <span className="text-primary font-black">+{recentChanges?.streakIncrement || 0} days</span> completed.
                  </p>
                </div>
              </div>

              {/* Connected Cycle Journey Track */}
              <div className="glass-card p-5 sm:p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="font-extrabold text-primary text-lg tracking-tight mb-1">Health Journey Progression</h3>
                  <p className="text-secondary text-xs">LunaCare automatically unlocks advanced pattern metrics as you build logs history.</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                  {[
                    { id: 1, label: 'Profile Calibrated', checked: onboarding.onboardingCompleted, desc: 'Cycle length settings parsed.' },
                    { id: 2, label: 'Logs Baseline', checked: totalLogs >= 3, desc: `${totalLogs}/3 logs submitted.` },
                    { id: 3, label: 'AI Trend Mapping', checked: totalLogs >= 7, desc: `${totalLogs >= 7 ? 'Unlocked' : `${totalLogs}/7 logs.`}` },
                    { id: 4, label: 'Full Insights Engine', checked: totalLogs >= 14, desc: 'Locked: Requires 14 logs.' }
                  ].map((step) => (
                    <div key={step.id} className={`p-4 rounded-2xl border transition-all flex flex-col gap-1.5 ${step.checked ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-950 shadow-sm' : 'bg-slate-50/50 border-slate-200/50 opacity-60'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step.checked ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          <span className="material-symbols-outlined text-[12px]">{step.checked ? 'check' : 'lock'}</span>
                        </div>
                        <span className="font-black text-xs">{step.label}</span>
                      </div>
                      <p className="text-[10px] text-secondary font-medium pl-7 leading-tight">{step.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 items-center justify-between border-t border-slate-100 pt-4 flex-wrap">
                  <span className="text-xs font-bold text-secondary">Next milestone target: Unlock weekly correlations.</span>
                  <button 
                    onClick={() => setActiveTab('log')}
                    className="px-5 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-full font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Log Daily Signals
                  </button>
                </div>
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
              {/* Learning Progression and Calibration Card */}
              <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-4 xs:p-6 sm:p-10 border border-white/70 shadow-sm flex flex-col lg:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
                
                <div className="flex-1 flex flex-col gap-5 sm:gap-6 relative z-10 w-full">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 border border-white/80 rounded-full text-xs font-extrabold uppercase tracking-widest text-primary mb-3">
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                      AI Calibration Engine
                    </span>
                    <h2 className="font-headline-lg text-xl sm:text-2xl md:text-3xl text-primary font-black mb-2">
                      Model learning status
                    </h2>
                    <p className="text-secondary font-medium leading-relaxed max-w-md text-xs sm:text-sm">
                      Each logged day trains our Bayesian models to map cycle drifts, hormone surges, and personal biometrics.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white/50 p-4 rounded-2xl border border-white/75">
                      <span className="block text-[8px] font-black text-secondary uppercase tracking-widest">Calibration Level</span>
                      <span className="text-sm font-black text-primary">Level {learningLevel.level}: {learningLevel.name}</span>
                    </div>

                    <div className="bg-white/50 p-4 rounded-2xl border border-white/75">
                      <span className="block text-[8px] font-black text-secondary uppercase tracking-widest">Next Unlock target</span>
                      <span className="text-sm font-black text-primary">{learningLevel.nextUnlock}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-bold text-secondary uppercase">
                      <span>Telemetry Logs Collected</span>
                      <span>{totalLogs} logs ({learningLevel.logsLeft > 0 ? `${learningLevel.logsLeft} left for Level ${learningLevel.level + 1}` : 'Maximum level achieved'})</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, (totalLogs / 30) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Explanation of confidence */}
                <div className="w-full lg:w-80 bg-white/50 border border-white/75 p-4 sm:p-6 rounded-3xl flex flex-col gap-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                    <span className="text-xs font-black text-primary uppercase tracking-widest">Confidence status</span>
                    <span className="text-sm font-black text-primary">{profileStats?.predictionAccuracy || 50}%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-secondary uppercase">Condition:</span>
                    <span className="text-xs font-bold text-primary">{confidenceDetails.status}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-secondary uppercase">Reason:</span>
                    <p className="text-xs text-secondary font-medium leading-relaxed mt-0.5">{confidenceDetails.reason}</p>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-secondary uppercase">Recommendation:</span>
                    <p className="text-xs text-secondary font-medium leading-relaxed mt-0.5">{confidenceDetails.rec}</p>
                  </div>
                </div>
              </div>

              {/* Unlock Timeline Map */}
              <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6">
                <span className="block text-xs font-extrabold text-primary uppercase tracking-wider ml-1">Learning Levels Roadmap</span>
                <div className="relative py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-2">
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 rounded-full -translate-y-1/2 hidden md:block z-0" />
                  
                  {[
                    { count: 3, label: 'Basic Predictions', desc: 'Est. cycle days' },
                    { count: 7, label: 'Weekly Trends', desc: 'HRV and Sleep correlations' },
                    { count: 14, label: 'Pattern Detection', desc: 'AI cycle drift mapping' },
                    { count: 30, label: 'Advanced AI Forecasts', desc: 'Dynamic hormone simulations' }
                  ].map((lvl, idx) => {
                    const isUnlocked = totalLogs >= lvl.count;
                    return (
                      <div key={idx} className={`relative z-10 flex flex-row md:flex-col items-center md:justify-center gap-4 md:gap-2 p-4 rounded-2xl border transition-all w-full md:w-44 ${isUnlocked ? 'bg-white/80 border-primary/20 shadow-sm' : 'bg-slate-50/50 border-slate-200/50 opacity-60'}`}>
                        <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm shrink-0 ${isUnlocked ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                          <span className="text-[10px] font-bold">{lvl.count}L</span>
                        </div>
                        <div className="flex flex-col items-start md:items-center text-left md:text-center">
                          <span className="font-bold text-xs text-primary">{lvl.label}</span>
                          <span className="text-[9px] text-secondary mt-0.5 leading-tight">{lvl.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline nodes for Future projections */}
              {totalLogs < 3 ? (
                <div className="glass-card p-8 rounded-[2rem] border border-white/60 shadow-sm text-center py-16 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[32px]">query_stats</span>
                  </div>
                  <h3 className="font-headline-md text-xl text-primary font-black">{t('dashboard.collectingBaseline')}</h3>
                  <p className="text-secondary text-xs max-w-sm font-medium leading-relaxed">
                    {t('dashboard.telemetryLogsRequired')}
                  </p>
                  <button
                    onClick={() => setActiveTab('log')}
                    className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-bold text-xs tracking-wider shadow-lg shadow-primary/20 hover:scale-103 transition-all"
                  >
                    {t('dashboard.logDailySignals')}
                  </button>
                </div>
              ) : (
                <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col gap-6 sm:gap-8">
                  <div>
                    <h3 className="font-bold text-primary text-lg tracking-tight mb-1">{t('dashboard.timelineTitle')}</h3>
                    <p className="text-secondary text-xs">{t('dashboard.timelineSubtitle')}</p>
                  </div>

                  {/* Offset Nodes */}
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
                          {offset === 0 ? t('dashboardExtra.today') : `+${offset}d`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Projections grids */}
                  {labLoading ? (
                    <div className="text-center py-10 w-full flex flex-col items-center justify-center min-h-[200px]">
                      <span className="material-symbols-outlined text-primary animate-spin text-3xl">sync</span>
                      <span className="mt-2 text-xs font-bold text-secondary">{t('dashboard.computingProjections')}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                      {(() => {
                        const targetForecast = labForecast || forecast;
                        if (!targetForecast) return null;
                        const phase = targetForecast.currentPhase || 'follicular';
                        const accuracy = targetForecast.accuracyRate || 50;

                        const flowStatus = phase === 'menstrual' ? 'Active bleeding' : phase === 'follicular' ? 'Resting Phase' : phase === 'ovulation' ? 'Follicular Transition' : 'Next Cycle Starting';
                        const ovulationStatus = phase === 'ovulation' ? 'Peak ovulation surge' : (phase === 'follicular' && targetForecast.hormones.lh > 30) ? 'High fertility window' : (phase === 'follicular') ? 'Developing follicle' : 'Completed cycle shift';
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
                              <span className="text-[8px] sm:text-[9px] font-bold text-primary">Conf: {pred.score}</span>
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
              {/* Monthly summary ledger */}
              <div className="glass-card p-6 rounded-[2.0rem] border border-white/60 shadow-sm flex flex-col gap-4">
                <span className="block text-xs font-extrabold text-primary uppercase tracking-wider ml-1">Monthly summary metrics</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Average Cycle', val: `${profileStats?.averageCycleLength || onboarding.cycleLength} days` },
                    { label: 'Average Period', val: `${profileStats?.averagePeriodLength || onboarding.periodLength} days` },
                    { label: 'Total Logs', val: `${profileStats?.logsSubmitted || 0} logs` },
                    { label: 'Consistency', val: `${profileStats?.completionRate || 0}%` },
                    { label: 'Average Sleep', val: `${profileStats?.averageSleep || 0} hrs` },
                    { label: 'Average Stress', val: `${profileStats?.averageStress || 0}/10` },
                    { label: 'Average Hydration', val: `${profileStats?.averageHydration || 0} cups` },
                    { label: 'Average HRV', val: `${profileStats?.averageHrv || 0} ms` },
                    { label: 'Accuracy Score', val: `${profileStats?.predictionAccuracy || 50}%` },
                    { label: 'Cycle Drift Range', val: profileStats?.shortestCycleLength ? `${profileStats.shortestCycleLength}-${profileStats.longestCycleLength}d` : '--' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white/50 border border-white/60 p-3 rounded-2xl text-center flex flex-col justify-center min-h-[60px]">
                      <span className="block text-[8px] font-bold text-secondary uppercase tracking-widest mb-0.5 leading-normal">{stat.label}</span>
                      <span className="text-xs sm:text-sm font-black text-primary">{stat.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation grids */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {/* switcher and controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 glass-card px-5 py-3 rounded-3xl border border-white/60">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCalendarMode('months')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${calendarMode === 'months' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-white/50'}`}
                      >
                        Monthly Grid
                      </button>
                      <button 
                        onClick={() => setCalendarMode('cycles')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${calendarMode === 'cycles' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-white/50'}`}
                      >
                        Cycle Ledger
                      </button>
                    </div>

                    {calendarMode === 'months' && (
                      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                        <button 
                          onClick={() => setCalendarMonthOffset(prev => prev - 1)}
                          className="px-2 sm:px-3 py-1.5 bg-white/60 hover:bg-white rounded-full text-[8.5px] sm:text-[10px] font-black uppercase text-primary border border-slate-200 transition-all flex items-center justify-center gap-0.5 sm:gap-1 shadow-sm flex-1 sm:flex-none"
                        >
                          <span className="material-symbols-outlined text-[12px]">chevron_left</span>
                          <span className="hidden xs:inline">Prev Month</span>
                          <span className="inline xs:hidden">Prev</span>
                        </button>
                        <span className="text-xs font-black text-primary min-w-[90px] sm:min-w-[110px] text-center capitalize shrink-0">{currentMonthData.monthName}</span>
                        <button
                          onClick={() => setCalendarMonthOffset(0)}
                          className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-full text-[8.5px] sm:text-[10px] font-black uppercase transition-all shadow-sm shrink-0"
                        >
                          Today
                        </button>
                        <button 
                          onClick={() => setCalendarMonthOffset(prev => prev + 1)}
                          className="px-2 sm:px-3 py-1.5 bg-white/60 hover:bg-white rounded-full text-[8.5px] sm:text-[10px] font-black uppercase text-primary border border-slate-200 transition-all flex items-center justify-center gap-0.5 sm:gap-1 shadow-sm flex-1 sm:flex-none"
                        >
                          <span className="hidden xs:inline">Next Month</span>
                          <span className="inline xs:hidden">Next</span>
                          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {calendarMode === 'months' ? (
                    /* Monthly Grid */
                    <div className="flex flex-col gap-6">
                      <div className="glass-card p-3 sm:p-5 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-3 sm:gap-4">
                        <div className="grid grid-cols-7 gap-1 text-center font-black text-[9px] sm:text-[10px] text-secondary tracking-wider uppercase border-b border-outline/5 pb-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-2.5 text-center">
                          {currentMonthData.days.map((cell, idx) => {
                            if (cell === null) {
                              return <div key={`empty-${idx}`} className="aspect-square opacity-0 pointer-events-none" />;
                            }

                            const { day, dateStr } = cell;
                            const isSelected = selectedDateStr === dateStr;
                            const dayStats = getCycleStatsForDate(dateStr);
                            const isFuture = dateStr > todayStr;
                            const cellLog = dailyLogs[dateStr];

                            let cellStyle = 'bg-white text-secondary border border-slate-100';

                            if (dayStats.currentPhase === 'menstrual') {
                              if (isFuture) {
                                cellStyle = 'bg-[#FFF3E6] text-amber-800 border border-[#FFF3E6]/60';
                              } else {
                                cellStyle = 'bg-[#FBEBEC] text-[#a53556] border border-[#FBEBEC]/60';
                              }
                            } else if (dayStats.isOvulation) {
                              cellStyle = 'bg-[#EDE7FF] text-purple-800 border border-[#EDE7FF]/60';
                            } else if (dayStats.isFertile) {
                              cellStyle = 'bg-[#E8F9EF] text-emerald-800 border border-[#E8F9EF]/60';
                            } else {
                              cellStyle = 'bg-slate-50/50 text-secondary border border-slate-100';
                            }

                            // Today check
                            if (dateStr === todayStr) {
                              cellStyle += ' border border-primary ring-1 ring-primary/30';
                            }

                            // Selected check
                            if (isSelected) {
                              cellStyle += ' border-2 border-primary shadow-md scale-105 bg-white z-10';
                            }

                            // Missed Log check
                            const isPastDay = dateStr < todayStr;
                            const isMissedDay = isPastDay && !cellLog && dayStats.currentPhase !== 'menstrual';
                            if (isMissedDay) {
                              cellStyle += ' border border-dashed border-slate-350';
                            }

                            return (
                              <button
                                key={`day-${day}`}
                                onClick={() => setSelectedDateStr(dateStr)}
                                className={`aspect-square min-h-[44px] rounded-[1.25rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center gap-0.5 sm:gap-1.5 p-1 text-xs font-bold relative transition-all ${cellStyle}`}
                                title={`Date: ${dateStr}, Phase: ${dayStats.currentPhase}, Cycle Day: ${dayStats.currentCycleDay}`}
                              >
                                <span className="text-[6.5px] sm:text-[8px] font-black text-secondary/60 leading-none">CD{dayStats.currentCycleDay}</span>
                                <span className={`text-[12px] sm:text-[16px] font-extrabold leading-none ${dateStr === todayStr ? 'bg-primary text-white w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md' : 'text-secondary/90'}`}>
                                  {day}
                                </span>
                                <div className="h-2 sm:h-3 flex items-center justify-center transform-gpu scale-75 sm:scale-100">
                                  {getDayIndicator(dateStr)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Legend underneath */}
                      <CalendarLegend />
                    </div>
                  ) : (
                    /* Side-By-Side Cycle Grids */
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-6">
                        {[0, 1].map((cycleIndex) => {
                          const lastPeriod = parseLocalDate(onboarding.lastPeriodDate);
                          const cycleStart = new Date(lastPeriod);
                          cycleStart.setDate(lastPeriod.getDate() + cycleIndex * cycleLength);
                          return (
                            <div key={cycleIndex} className="glass-card p-3 sm:p-5 md:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-white/60 shadow-sm">
                              <h4 className="font-extrabold text-primary text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
                                Cycle sequence {cycleIndex + 1} ({cycleStart.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })})
                              </h4>

                              <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-2.5 text-center">
                                {Array.from({ length: cycleLength }).map((_, dayIndex) => {
                                  const dayNum = dayIndex + 1;
                                  const targetDate = new Date(cycleStart);
                                  targetDate.setDate(cycleStart.getDate() + dayIndex);
                                  const cellDateStr = getLocalDateString(targetDate);
                                  const isSelected = selectedDateStr === cellDateStr;
                                  const isFuture = cellDateStr > todayStr;
                                  const dayStats = getCycleStatsForDate(cellDateStr);
                                  const cellLog = dailyLogs[cellDateStr];

                                  let cellStyle = 'bg-white text-secondary border border-slate-100';

                                  if (dayStats.currentPhase === 'menstrual') {
                                    if (isFuture) {
                                      cellStyle = 'bg-[#FFF3E6] text-amber-800 border border-[#FFF3E6]/60';
                                    } else {
                                      cellStyle = 'bg-[#FBEBEC] text-[#a53556] border border-[#FBEBEC]/60';
                                    }
                                  } else if (dayStats.isOvulation) {
                                    cellStyle = 'bg-[#EDE7FF] text-purple-800 border border-[#EDE7FF]/60';
                                  } else if (dayStats.isFertile) {
                                    cellStyle = 'bg-[#E8F9EF] text-emerald-800 border border-[#E8F9EF]/60';
                                  } else {
                                    cellStyle = 'bg-slate-50/50 text-secondary border border-slate-100';
                                  }

                                  // Today check
                                  if (cellDateStr === todayStr) {
                                    cellStyle += ' border border-primary ring-1 ring-primary/30';
                                  }

                                  // Selected check
                                  if (isSelected) {
                                    cellStyle += ' border-2 border-primary shadow-md scale-105 bg-white z-10';
                                  }

                                  // Missed Log check
                                  const isPastDay = cellDateStr < todayStr;
                                  const isMissedDay = isPastDay && !cellLog && dayStats.currentPhase !== 'menstrual';
                                  if (isMissedDay) {
                                    cellStyle += ' border border-dashed border-slate-350';
                                  }

                                  return (
                                    <button
                                      key={dayNum}
                                      onClick={() => setSelectedDateStr(cellDateStr)}
                                      className={`aspect-square min-h-[44px] rounded-[1.25rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center gap-0.5 sm:gap-1.5 p-1 text-xs font-bold relative transition-all ${cellStyle}`}
                                      title={`Cycle Day: ${dayNum}, Date: ${cellDateStr}`}
                                    >
                                      <span className="text-[6.5px] sm:text-[8px] font-black text-secondary/60 leading-none">CD{dayNum}</span>
                                      <span className={`text-[12px] sm:text-[16px] font-extrabold leading-none ${cellDateStr === todayStr ? 'bg-primary text-white w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md' : 'text-secondary/90'}`}>
                                        {dayNum}
                                      </span>
                                      <div className="h-2 sm:h-3 flex items-center justify-center transform-gpu scale-75 sm:scale-100">
                                        {getDayIndicator(cellDateStr)}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend underneath */}
                      <CalendarLegend />
                    </div>
                  )}
                </div>

                {/* Right: Selected Day Diagnostic Ledger with duplicated / delete actions */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6">
                  {/* Section 1: Date & Cycle Info */}
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest leading-none">Diagnostic Ledger</span>
                    <h3 className="font-extrabold text-primary text-xl tracking-tight mt-1">
                      {parseLocalDate(selectedDateStr).toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 mt-2 bg-primary/10 border border-primary/20 text-primary font-black text-[10px] px-2.5 py-0.5 rounded-full w-fit">
                      Cycle Day {selectedDayStats.currentCycleDay}
                    </div>
                  </div>

                  {/* Section 2: Current Phase */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-secondary uppercase tracking-wider">Hormonal Phase</span>
                    <div className="flex items-center gap-3 p-3 bg-white/50 border border-white/80 rounded-2xl">
                      <div className="w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center text-primary shrink-0" style={{ backgroundColor: selectedDayStats.phaseColor + '20' }}>
                        <span className="material-symbols-outlined text-[16px] text-primary">spa</span>
                      </div>
                      <div>
                        <span className="text-xs font-black text-primary capitalize leading-none">{selectedDayStats.currentPhase} Phase</span>
                        <span className="block text-[9px] text-secondary font-medium leading-tight mt-0.5">
                          {selectedDayStats.currentPhase === 'menstrual' && "Rest and recovery focused. Hormone baselines low."}
                          {selectedDayStats.currentPhase === 'follicular' && "Estrogen rising. Mental energy and stamina climbing."}
                          {selectedDayStats.currentPhase === 'ovulation' && "Peak fertile window. LH hormone surges."}
                          {selectedDayStats.currentPhase === 'luteal' && "Progesterone dominates. Resting heart rate climbing."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Logged Metrics */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-secondary uppercase tracking-wider">Physiological Log</span>
                    {selectedLog ? (
                      <div className="bg-white/50 border border-white/60 p-4 rounded-2xl flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2.5 text-xs text-primary font-bold">
                          <div className="flex flex-col p-2.5 bg-white/50 border border-white/80 rounded-xl">
                            <span className="text-[8.5px] text-secondary font-medium uppercase mb-0.5">Mood State</span>
                            <span>{t('moods.' + selectedLog.mood.toLowerCase().replace(' ', ''))}</span>
                          </div>
                          <div className="flex flex-col p-2.5 bg-white/50 border border-white/80 rounded-xl">
                            <span className="text-[8.5px] text-secondary font-medium uppercase mb-0.5">Sleep Recovery</span>
                            <span>{selectedLog.sleep} hrs</span>
                          </div>
                          <div className="flex flex-col p-2.5 bg-white/50 border border-white/80 rounded-xl">
                            <span className="text-[8.5px] text-secondary font-medium uppercase mb-0.5">Stress Index</span>
                            <span>{selectedLog.stress} / 10</span>
                          </div>
                          <div className="flex flex-col p-2.5 bg-white/50 border border-white/80 rounded-xl">
                            <span className="text-[8.5px] text-secondary font-medium uppercase mb-0.5">Energy Score</span>
                            <span>{selectedLog.energy} / 10</span>
                          </div>
                          <div className="flex flex-col p-2.5 bg-white/50 border border-white/80 rounded-xl">
                            <span className="text-[8.5px] text-secondary font-medium uppercase mb-0.5">Hydration cups</span>
                            <span>{selectedLog.hydration || 4} cups</span>
                          </div>
                          <div className="flex flex-col p-2.5 bg-white/50 border border-white/80 rounded-xl">
                            <span className="text-[8.5px] text-secondary font-medium uppercase mb-0.5">Autonomic HRV</span>
                            <span>{selectedLog.hrv ? `${selectedLog.hrv} ms` : 'N/A'}</span>
                          </div>
                        </div>

                        {/* Section 4: Symptoms */}
                        {selectedLog.symptoms.length > 0 && (
                          <div className="flex flex-col gap-1.5 border-t border-white/80 pt-3">
                            <span className="text-[9px] font-black text-secondary uppercase">Reported Symptoms</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedLog.symptoms.map(s => (
                                <span key={s} className="bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary px-2.5 py-0.5 rounded-full">
                                  {t(symptomKeyMap[s] || s)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 border border-slate-200/50 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">No Telemetry Logs Submitted</span>
                      </div>
                    )}
                  </div>

                  {/* Section 5: Quick Actions */}
                  {selectedDateStr <= todayStr && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-black text-secondary uppercase tracking-wider">Quick Actions</span>
                      <div className="grid grid-cols-3 gap-2 bg-white/40 p-2 rounded-2xl border border-white/80">
                        <button
                          onClick={() => {
                            setActiveTab('log');
                          }}
                          className="py-2.5 bg-white hover:bg-slate-50 text-primary border border-slate-200 rounded-xl font-bold text-[9px] uppercase tracking-wider flex flex-col items-center gap-1 shadow-sm transition-all"
                          title="Edit Log"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Log
                        </button>

                        <button
                          onClick={async () => {
                            if (selectedLog) {
                              if (!window.confirm('Delete daily log details?')) return;
                              await deleteLog(selectedDateStr);
                            }
                          }}
                          disabled={!selectedLog}
                          className="py-2.5 bg-white hover:bg-red-50 text-red-650 border border-red-200 rounded-xl font-bold text-[9px] uppercase tracking-wider flex flex-col items-center gap-1 shadow-sm disabled:opacity-40 transition-all"
                          title="Delete Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Log
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              await duplicateLog(selectedDateStr);
                            } catch (e) {
                              alert('No preceding logs found to duplicate.');
                            }
                          }}
                          className="py-2.5 bg-white hover:bg-blue-50 text-blue-650 border border-blue-200 rounded-xl font-bold text-[9px] uppercase tracking-wider flex flex-col items-center gap-1 shadow-sm transition-all"
                          title="Duplicate last logged day details"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section 6: Recovery Score */}
                  {recoveryScore !== null && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-black text-secondary uppercase tracking-wider">Recovery Index</span>
                      <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-lg font-black text-emerald-950 leading-none">{recoveryScore} / 100</span>
                          <span className="block text-[8px] font-bold text-emerald-800 uppercase tracking-widest mt-1">Biometric Recovery</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 font-black text-xs">
                          {recoveryScore >= 75 ? 'Opt' : recoveryScore >= 50 ? 'Med' : 'Rest'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 7: AI Interpretation */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-secondary uppercase tracking-wider">Biological Interpretation</span>
                    <div className="bg-white/40 border border-white/60 p-4 rounded-2xl flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">science</span>
                        Physiology Analysis
                      </span>
                      <p className="text-[11px] text-secondary leading-relaxed font-bold">
                        {bioLedger.interpretation}
                      </p>
                    </div>
                  </div>

                  {/* Section 8: Personalized Recommendation */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-secondary uppercase tracking-wider">Personalized Recommendation</span>
                    <div className="bg-[#ff7b9c]/5 border border-[#ff7b9c]/20 p-4 rounded-2xl flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        AI Recommendation
                      </span>
                      <p className="text-[11px] text-secondary leading-relaxed font-bold">
                        "{bioLedger.recommendation}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ LOGGING FORM TAB ═══════════════ */}
          {activeTab === 'log' && (
            <motion.div
              key="log-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-4xl mx-auto"
            >
              <form onSubmit={handleLogSubmit} className="flex flex-col gap-8">
                {/* Header and Progress Indicator */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary font-black mb-1">{t('logger.title')}</h2>
                    <p className="text-secondary font-body-md">
                      {selectedDateStr === todayStr ? "Record today's physical biometrics." : `Editing log details for date: ${selectedDateStr}`}
                    </p>
                  </div>

                  {/* Progress Milestone Indicator */}
                  <div className="bg-white/50 border border-white/80 p-4 rounded-2xl min-w-[200px] flex flex-col gap-2">
                    <div className="flex justify-between text-[9px] font-black text-secondary uppercase leading-none">
                      <span>Logs Recorded</span>
                      <span>{totalLogs} logs</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, (totalLogs / 7) * 100)}%` }} />
                    </div>
                    <span className="text-[8px] font-medium text-secondary">
                      {totalLogs < 7 ? `${7 - totalLogs} more logs needed to unlock Weekly trends.` : 'Weekly trends unlocked!'}
                    </span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {/* Mood Selector Card */}
                  <div className="bg-white/80 border border-white/80 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(165,53,86,0.04)] min-h-[190px] flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">{t('science.mood')}</span>
                      <div className="flex flex-wrap gap-2.5">
                        {[
                          { id: 'Radiant', label: t('moods.radiant'), icon: 'sentiment_very_satisfied' },
                          { id: 'Balanced', label: t('moods.balanced'), icon: 'sentiment_satisfied' },
                          { id: 'Sensitive', label: t('moods.sensitive'), icon: 'sentiment_neutral' },
                          { id: 'Low Energy', label: t('moods.lowenergy'), icon: 'sentiment_dissatisfied' },
                          { id: 'Anxious', label: t('moods.anxious'), icon: 'sentiment_very_dissatisfied' }
                        ].map((m) => {
                          const isSel = loggedMood === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setLoggedMood(m.id as any)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                                isSel
                                  ? 'bg-[#ff7b9c]/15 border-primary/30 text-primary shadow-sm'
                                  : 'bg-white/60 border-slate-200 text-secondary hover:bg-white hover:border-slate-350'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Flow Intensity */}
                  <div className="bg-white/80 border border-white/80 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(165,53,86,0.04)] min-h-[190px] flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">{t('dashboardExtra.periodFlow')}</span>
                      <div className="flex gap-2 justify-between w-full">
                        {[
                          { id: 'NONE', label: t('flow.none') },
                          { id: 'SPOTTING', label: t('flow.spotting') },
                          { id: 'LIGHT', label: t('flow.light') },
                          { id: 'MEDIUM', label: t('flow.medium') },
                          { id: 'HEAVY', label: t('flow.heavy') }
                        ].map((flow) => {
                          const isSel = loggedFlow === flow.id;
                          return (
                            <button
                              key={flow.id}
                              type="button"
                              onClick={() => setLoggedFlow(flow.id as any)}
                              className={`flex-1 flex flex-col items-center justify-center p-2 rounded-2xl border text-[9px] font-black transition-all ${
                                isSel
                                  ? 'bg-[#a53556]/10 border-[#a53556]/30 text-[#a53556] shadow-sm'
                                  : 'bg-white/60 border-slate-200 text-secondary hover:bg-white hover:border-slate-350'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px] mb-1">water_drop</span>
                              <span className="hidden sm:inline font-bold text-[8px]">{flow.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Hydration Card */}
                  <div className="bg-white/80 border border-white/80 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(165,53,86,0.04)] min-h-[190px] flex flex-col justify-between">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1">{t('onboarding.hydration')}</span>
                        <span className="text-xl font-black text-primary">{loggedHydration} {t('logger.cups')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-between items-center py-2 px-1">
                      {Array.from({ length: 8 }).map((_, idx) => {
                        const isActive = idx < loggedHydration;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setLoggedHydration(idx + 1)}
                            className="group relative flex items-center justify-center transition-all duration-300 focus:outline-none"
                          >
                            <span className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                              isActive
                                ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] scale-110'
                                : 'border-2 border-slate-300 bg-white/40 hover:border-blue-400 group-hover:scale-105'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Biometrics */}
                  <div className="bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border border-white/45 p-6 rounded-[2.5rem] shadow-md flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Energy */}
                      <div className="bg-white/60 border border-white/80 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:bg-white/80 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-primary">
                            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Energy Rate</span>
                          </div>
                          <span className="text-base sm:text-lg font-black text-primary">{loggedEnergy} / 10</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={loggedEnergy}
                          onChange={(e) => setLoggedEnergy(parseInt(e.target.value))}
                          className="w-full accent-primary h-1.5 bg-slate-200/80 rounded-full cursor-pointer"
                        />
                      </div>

                      {/* Stress */}
                      <div className="bg-white/60 border border-white/80 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:bg-white/80 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-primary">
                            <BrainCircuit className="w-5 h-5 text-purple-500 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Stress Factor</span>
                          </div>
                          <span className="text-base sm:text-lg font-black text-primary">{loggedStress} / 10</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={loggedStress}
                          onChange={(e) => setLoggedStress(parseInt(e.target.value))}
                          className="w-full accent-primary h-1.5 bg-slate-200/80 rounded-full cursor-pointer"
                        />
                      </div>

                      {/* Sleep */}
                      <div className="bg-white/60 border border-white/80 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:bg-white/80 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-primary">
                            <MoonStar className="w-5 h-5 text-blue-500 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Sleep Duration</span>
                          </div>
                          <span className="text-base sm:text-lg font-black text-primary">{loggedSleep} hrs</span>
                        </div>
                        <input
                          type="range"
                          min={4}
                          max={12}
                          step={0.5}
                          value={loggedSleep}
                          onChange={(e) => setLoggedSleep(parseFloat(e.target.value))}
                          className="w-full accent-primary h-1.5 bg-slate-200/80 rounded-full cursor-pointer"
                        />
                      </div>

                      {/* HRV */}
                      <div className="bg-white/60 border border-white/80 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:bg-white/80 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-primary">
                            <HeartPulse className="w-5 h-5 text-rose-500 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Autonomic HRV</span>
                          </div>
                          <span className="text-base sm:text-lg font-black text-primary">{loggedHrv} ms</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={150}
                          value={loggedHrv}
                          onChange={(e) => setLoggedHrv(parseInt(e.target.value))}
                          className="w-full accent-primary h-1.5 bg-slate-200/80 rounded-full cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Symptoms Panel */}
                <div className="bg-white/80 border border-white/80 p-6 rounded-[2.5rem] shadow-sm flex flex-col gap-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-primary tracking-wider uppercase ml-1">{t('logger.physicalSymptoms')}</h3>
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
                          {t(symptomKeyMap[s] || s)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                  <div className="lg:col-span-7 bg-white/55 border border-white/70 p-6 rounded-[2.5rem] shadow-sm flex flex-col gap-5 border-l-4 border-l-primary/40 pl-5">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-5 h-5 text-primary shrink-0" />
                      <h3 className="text-sm sm:text-base font-extrabold tracking-wider uppercase">{t('logger.healthSummaryTitle')}</h3>
                    </div>
                    <p className="text-sm text-secondary font-medium leading-relaxed border-t border-white/40 pt-4">
                      {t('logger.healthSummaryDesc', {
                        mood: t('moods.' + loggedMood.toLowerCase().replace(' ', '')),
                        sleep: loggedSleep,
                        hrv: loggedHrv,
                        hydrationStatus: loggedHydration >= 6 ? t('logger.hydrationOnTrack') : t('logger.hydrationBelow')
                      })}
                    </p>
                  </div>

                  <div className="lg:col-span-5 bg-white/40 border border-white/60 p-6 rounded-[2rem] shadow-sm flex flex-col items-center justify-center gap-4 text-center min-h-[190px]">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-extrabold uppercase tracking-wider">{t('logger.validationStatus')}</span>
                    </div>
                    <motion.button
                      type="submit"
                      className="w-full max-w-[280px] bg-primary text-on-primary py-3.5 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CheckCircle className="w-4 h-4 text-on-primary" />
                      {logSaved ? t('logger.diagnosticsSaved') : t('logger.saveLog')}
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* ═══════════════ VISUAL INSIGHTS TAB ═══════════════ */}
          {activeTab === 'insights' && (() => {
            // Get cut-off date string for selected timeframe
            const logsArray = Object.values(dailyLogs).sort((a, b) => b.date.localeCompare(a.date));

            let cutOffDateStr = '';
            if (insightsTimeframe === '7days') {
              const d = new Date();
              d.setDate(d.getDate() - 6);
              cutOffDateStr = getLocalDateString(d);
            } else if (insightsTimeframe === '30days') {
              const d = new Date();
              d.setDate(d.getDate() - 29);
              cutOffDateStr = getLocalDateString(d);
            }

            const filteredLogs = cutOffDateStr 
              ? logsArray.filter(log => log.date >= cutOffDateStr)
              : logsArray;

            const totalLoggedDays = filteredLogs.length;

            // Biometric Averages
            const avgSleep = totalLoggedDays > 0 
              ? Math.round((filteredLogs.reduce((acc, log) => acc + log.sleep, 0) / totalLoggedDays) * 10) / 10 
              : (onboarding?.lifestyle?.sleep === 'Restorative' ? 8.0 : onboarding?.lifestyle?.sleep === 'Fragmented' ? 6.5 : 5.0);

            const avgStress = totalLoggedDays > 0 
              ? Math.round((filteredLogs.reduce((acc, log) => acc + log.stress, 0) / totalLoggedDays) * 10) / 10 
              : (onboarding?.lifestyle?.stress === 'Low' ? 2 : onboarding?.lifestyle?.stress === 'Moderate' ? 5 : 8);

            const avgEnergy = totalLoggedDays > 0 
              ? Math.round((filteredLogs.reduce((acc, log) => acc + log.energy, 0) / totalLoggedDays) * 10) / 10 
              : 7.0;

            const avgHydration = totalLoggedDays > 0 
              ? Math.round((filteredLogs.reduce((acc, log) => acc + (log.hydration || 0), 0) / totalLoggedDays) * 10) / 10 
              : (onboarding?.lifestyle?.hydration === 'Optimal' ? 8 : onboarding?.lifestyle?.hydration === 'Average' ? 5 : 3);

            const hrvLogs = filteredLogs.filter(log => log.hrv);
            const avgHrv = hrvLogs.length > 0 
              ? Math.round(hrvLogs.reduce((acc, log) => acc + (log.hrv || 0), 0) / hrvLogs.length) 
              : 72;

            // Mood Distribution
            const moodDistribution: Record<string, number> = {
              Radiant: 0,
              Balanced: 0,
              Sensitive: 0,
              'Low Energy': 0,
              Anxious: 0
            };
            filteredLogs.forEach(log => {
              const m = log.mood === 'LowEnergy' ? 'Low Energy' : log.mood;
              if (m in moodDistribution) {
                moodDistribution[m]++;
              }
            });
            const moodTotal = Object.values(moodDistribution).reduce((a, b) => a + b, 0);
            const moodPercentages = Object.entries(moodDistribution).map(([mood, count]) => {
              const pct = moodTotal > 0 ? Math.round((count / moodTotal) * 100) : 0;
              return { mood, pct };
            });

            // Symptoms Frequency
            const symptomCounts: Record<string, number> = {};
            filteredLogs.forEach(log => {
              log.symptoms.forEach(sym => {
                symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
              });
            });
            const sortedSymptoms = Object.entries(symptomCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);
            const maxSymptomCount = sortedSymptoms.length > 0 ? Math.max(...sortedSymptoms.map(s => s[1])) : 1;

            // Correlation Computations
            const highStressLogs = filteredLogs.filter(log => log.stress >= 6);
            const lowStressLogs = filteredLogs.filter(log => log.stress < 6);
            const avgSleepHighStress = highStressLogs.length > 0 ? (highStressLogs.reduce((acc, l) => acc + l.sleep, 0) / highStressLogs.length) : null;
            const avgSleepLowStress = lowStressLogs.length > 0 ? (lowStressLogs.reduce((acc, l) => acc + l.sleep, 0) / lowStressLogs.length) : null;
            const sleepDiff = (avgSleepHighStress !== null && avgSleepLowStress !== null) ? (avgSleepLowStress - avgSleepHighStress).toFixed(1) : null;

            const highHydrationLogs = filteredLogs.filter(log => (log.hydration || 0) >= 6);
            const lowHydrationLogs = filteredLogs.filter(log => (log.hydration || 0) < 6);
            const avgEnergyHighHyd = highHydrationLogs.length > 0 ? (highHydrationLogs.reduce((acc, l) => acc + l.energy, 0) / highHydrationLogs.length) : null;
            const avgEnergyLowHyd = lowHydrationLogs.length > 0 ? (lowHydrationLogs.reduce((acc, l) => acc + l.energy, 0) / lowHydrationLogs.length) : null;
            const energyDiffPct = (avgEnergyHighHyd !== null && avgEnergyLowHyd !== null && avgEnergyLowHyd > 0) ? Math.round(((avgEnergyHighHyd - avgEnergyLowHyd) / avgEnergyLowHyd) * 100) : null;

            const highSleepLogs = filteredLogs.filter(log => log.sleep >= 7.5 && log.hrv);
            const lowSleepLogs = filteredLogs.filter(log => log.sleep < 7.5 && log.hrv);
            const avgHrvHighSleep = highSleepLogs.length > 0 ? Math.round(highSleepLogs.reduce((acc, l) => acc + (l.hrv || 0), 0) / highSleepLogs.length) : null;
            const avgHrvLowSleep = lowSleepLogs.length > 0 ? Math.round(lowSleepLogs.reduce((acc, l) => acc + (l.hrv || 0), 0) / lowSleepLogs.length) : null;
            const hrvDiff = (avgHrvHighSleep !== null && avgHrvLowSleep !== null) ? (avgHrvHighSleep - avgHrvLowSleep) : null;

            // SVG Hormone Curve Calculations
            const getHormoneCurvePoints = () => {
              const estrogenPts: {x: number, y: number}[] = [];
              const progesteronePts: {x: number, y: number}[] = [];
              const lhPts: {x: number, y: number}[] = [];
              const cycleLen = onboarding?.cycleLength || 28;
              const periodLen = onboarding?.periodLength || 5;
              const ovulationDay = cycleLen - 14;

              for (let day = 1; day <= cycleLen; day++) {
                let estrogen = 10;
                let progesterone = 5;
                let lh = 10;

                if (day <= periodLen) {
                  const t = day / periodLen;
                  estrogen = 10 + t * 8;
                  progesterone = 5 + t * 2;
                  lh = 8 + t * 4;
                } else if (day < ovulationDay - 2) {
                  const startDay = periodLen + 1;
                  const endDay = ovulationDay - 3;
                  const t = (day - startDay) / Math.max(1, endDay - startDay);
                  estrogen = 18 + t * 62;
                  progesterone = 7 + t * 5;
                  lh = 12 + t * 18;
                } else if (day <= ovulationDay + 1) {
                  const t = (day - (ovulationDay - 2)) / 3;
                  estrogen = 85 + Math.sin(t * Math.PI) * 10;
                  progesterone = 12 + t * 13;
                  if (day === ovulationDay) {
                    lh = 100;
                  } else {
                    lh = 70 + Math.sin(t * Math.PI) * 15;
                  }
                } else {
                  const startDay = ovulationDay + 2;
                  const t = (day - startDay) / Math.max(1, cycleLen - startDay);
                  estrogen = 30 + Math.sin(t * Math.PI) * 20 - t * 20;
                  progesterone = 15 + Math.sin(t * Math.PI) * 70;
                  lh = Math.max(5, 10 - t * 8);
                }

                const x = ((day - 1) / (cycleLen - 1)) * 100;
                const yEst = 35 - (estrogen / 100) * 30;
                const yProg = 35 - (progesterone / 100) * 30;
                const yLh = 35 - (lh / 100) * 30;

                estrogenPts.push({ x, y: yEst });
                progesteronePts.push({ x, y: yProg });
                lhPts.push({ x, y: yLh });
              }

              return { estrogenPts, progesteronePts, lhPts, cycleLen };
            };

            const { estrogenPts, progesteronePts, lhPts, cycleLen } = getHormoneCurvePoints();

            const buildPath = (pts: {x: number, y: number}[]) => {
              return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            };

            const estrogenPath = buildPath(estrogenPts);
            const progesteronePath = buildPath(progesteronePts);
            const lhPath = buildPath(lhPts);

            const currentCycleDay = forecast?.currentCycleDay || 1;
            const markerX = ((currentCycleDay - 1) / (cycleLen - 1)) * 100;

            return (
              <motion.div
                key="insights-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-10"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary font-black mb-1">{t('dashboardExtra.bioInsightsTitle')}</h2>
                    <p className="text-secondary font-body-md">{t('dashboardExtra.bioInsightsDesc')}</p>
                  </div>

                  {/* Timeframe Selector */}
                  {forecast && forecast.totalLogsCount >= 3 && (
                    <div className="flex bg-white/40 border border-white/60 p-1 rounded-full w-fit gap-1 select-none shadow-sm">
                      {[
                        { id: '7days', label: 'Last 7 Days' },
                        { id: '30days', label: 'Last 30 Days' },
                        { id: 'all', label: 'All-Time Stats' }
                      ].map(tf => (
                        <button
                          key={tf.id}
                          onClick={() => setInsightsTimeframe(tf.id as any)}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                            insightsTimeframe === tf.id
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'text-secondary hover:text-primary hover:bg-white/40'
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(!forecast || forecast.totalLogsCount < 3) ? (
                  <div className="glass-card p-8 rounded-[2rem] border border-white/60 shadow-sm text-center py-16 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[32px]">insights</span>
                    </div>
                    <h3 className="font-headline-md text-xl text-primary font-black">{t('dashboard.collectingBaseline')}</h3>
                    <p className="text-secondary text-xs max-w-sm font-medium leading-relaxed">
                      {t('dashboard.telemetryLogsRequired')}
                    </p>
                    <button
                      onClick={() => setActiveTab('log')}
                      className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-bold text-xs tracking-wider shadow-lg shadow-primary/20 hover:scale-103 transition-all"
                    >
                      {t('dashboard.logDailySignals')}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Biometrics Summary Grid */}
                    <div className="glass-card p-6 sm:p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <h3 className="font-extrabold text-primary text-xs uppercase tracking-widest">
                          Biometric Averages ({insightsTimeframe === '7days' ? 'Last 7 Days' : insightsTimeframe === '30days' ? 'Last 30 Days' : 'All-Time'})
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {[
                          { label: 'Sleep Duration', val: `${avgSleep} hrs`, desc: 'Target: 7-9 hrs', icon: 'bedtime' },
                          { label: 'Stress Level', val: `${avgStress}/10`, desc: avgStress >= 7 ? 'High Stress' : avgStress >= 4 ? 'Moderate' : 'Low Stress', icon: 'psychology' },
                          { label: 'Physical Energy', val: `${avgEnergy}/10`, desc: avgEnergy >= 7 ? 'Vibrant' : avgEnergy >= 4 ? 'Moderate' : 'Low Energy', icon: 'bolt' },
                          { label: 'Hydration Intake', val: `${avgHydration} cups`, desc: 'Target: 8 cups', icon: 'water_drop' },
                          { label: 'Autonomic HRV', val: `${avgHrv} ms`, desc: 'Autonomic balance', icon: 'favorite' }
                        ].map((item, idx) => (
                          <div key={idx} className="bg-white/50 border border-white/60 p-4 rounded-2xl flex flex-col justify-between min-h-[105px]">
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-black text-secondary uppercase tracking-wider">{item.label}</span>
                              <span className="material-symbols-outlined text-[16px] text-primary/70">{item.icon}</span>
                            </div>
                            <div className="mt-3">
                              <span className="text-xl font-black text-primary block leading-none">{item.val}</span>
                              <span className="text-[9px] text-slate-400 font-bold block mt-1">{item.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Mood Distribution Card */}
                      <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="font-extrabold text-primary text-xs uppercase tracking-wider">Mood Distribution</span>
                          <span className="material-symbols-outlined text-primary text-base">sentiment_satisfied</span>
                        </div>
                        <div className="flex flex-col gap-3 mt-2">
                          {moodPercentages.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-xs">
                              <span className="w-20 font-bold text-secondary text-[10px] uppercase tracking-wider">{item.mood}</span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-500" 
                                  style={{ width: `${item.pct}%` }} 
                                />
                              </div>
                              <span className="w-8 text-right font-black text-primary">{item.pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Symptoms Frequency Card */}
                      <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="font-extrabold text-primary text-xs uppercase tracking-wider">Top Logged Symptoms</span>
                          <span className="material-symbols-outlined text-primary text-base">healing</span>
                        </div>
                        <div className="flex flex-col gap-3 mt-2">
                          {sortedSymptoms.length > 0 ? (
                            sortedSymptoms.map(([symptom, count], idx) => {
                              const pct = Math.round((count / maxSymptomCount) * 100);
                              return (
                                <div key={idx} className="flex items-center gap-3 text-xs">
                                  <span className="w-24 font-bold text-secondary text-[10px] uppercase tracking-wider truncate" title={symptom}>{symptom}</span>
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-rose-400 transition-all duration-500" 
                                      style={{ width: `${pct}%` }} 
                                    />
                                  </div>
                                  <span className="w-10 text-right font-black text-primary">{count}x</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-8 text-center text-xs text-secondary font-medium italic">
                              No symptoms logged in this timeframe.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Correlations Panel */}
                    <div className="glass-card p-6 sm:p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="font-extrabold text-primary text-xs uppercase tracking-widest">Telemetry Correlations & Discoveries</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Correlation 1: Sleep vs Stress */}
                        <div className="bg-white/50 border border-white/60 p-4 rounded-2xl flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-indigo-500">bedtime</span>
                            <span className="text-[10px] font-black text-secondary uppercase tracking-wider">Sleep & Stress Correlation</span>
                          </div>
                          {(avgSleepHighStress !== null && avgSleepLowStress !== null) ? (
                            <div>
                              <p className="text-[11px] text-secondary font-medium leading-relaxed">
                                On high stress days, your sleep averages <strong className="text-primary font-bold">{avgSleepHighStress.toFixed(1)} hrs</strong>, compared to <strong className="text-primary font-bold">{avgSleepLowStress.toFixed(1)} hrs</strong> on lower stress days.
                              </p>
                              {Number(sleepDiff) > 0 && (
                                <span className="inline-block mt-2 px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded text-[9px] font-black uppercase">
                                  -{sleepDiff} hrs sleep drop under stress
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Log more days with varying stress to see correlation details.</p>
                          )}
                        </div>

                        {/* Correlation 2: Hydration vs Energy */}
                        <div className="bg-white/50 border border-white/60 p-4 rounded-2xl flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-sky-500">water_drop</span>
                            <span className="text-[10px] font-black text-secondary uppercase tracking-wider">Hydration & Energy Correlation</span>
                          </div>
                          {(avgEnergyHighHyd !== null && avgEnergyLowHyd !== null) ? (
                            <div>
                              <p className="text-[11px] text-secondary font-medium leading-relaxed">
                                Drinking 6+ cups of water averages <strong className="text-primary font-bold">{avgEnergyHighHyd.toFixed(1)}/10 energy</strong>, compared to <strong className="text-primary font-bold">{avgEnergyLowHyd.toFixed(1)}/10</strong> on lower hydration days.
                              </p>
                              {energyDiffPct !== null && energyDiffPct > 0 && (
                                <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-black uppercase">
                                  +{energyDiffPct}% higher energy with hydration
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Log water intake and physical energy to map this trend.</p>
                          )}
                        </div>

                        {/* Correlation 3: HRV vs Sleep */}
                        <div className="bg-white/50 border border-white/60 p-4 rounded-2xl flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-emerald-500">favorite</span>
                            <span className="text-[10px] font-black text-secondary uppercase tracking-wider">HRV & Sleep Resilience</span>
                          </div>
                          {(avgHrvHighSleep !== null && avgHrvLowSleep !== null) ? (
                            <div>
                              <p className="text-[11px] text-secondary font-medium leading-relaxed">
                                After getting 7.5+ hrs of restorative sleep, your HRV average is <strong className="text-primary font-bold">{avgHrvHighSleep} ms</strong>, compared to <strong className="text-primary font-bold">{avgHrvLowSleep} ms</strong>.
                              </p>
                              {hrvDiff !== null && hrvDiff > 0 && (
                                <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-black uppercase">
                                  +{hrvDiff} ms autonomic recovery surge
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Log sleep hours and HRV to calibrate heart rate recovery trends.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Predicted Hormone Cycles Visualization */}
                    <div className="glass-card p-6 sm:p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <h3 className="font-extrabold text-primary text-xs uppercase tracking-widest">Hormonal Profile & Surge Forecast</h3>
                        </div>
                        <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider select-none">
                          Day {currentCycleDay} of {cycleLen}
                        </span>
                      </div>

                      <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
                        <div className="h-44 w-full relative">
                          <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                            {/* Grids */}
                            <line x1="0" y1="35" x2="100" y2="35" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
                            <line x1="0" y1="20" x2="100" y2="20" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
                            <line x1="0" y1="5" x2="100" y2="5" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />

                            {/* Estrogen Area & Path */}
                            <path d={estrogenPath} fill="none" stroke="#ff7b9c" strokeWidth="1.5" strokeLinecap="round" />
                            {/* Progesterone Path */}
                            <path d={progesteronePath} fill="none" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
                            {/* LH Path */}
                            <path d={lhPath} fill="none" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 1" />

                            {/* You Are Here vertical marker */}
                            <line x1={markerX} y1="0" x2={markerX} y2="40" stroke="#a53556" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
                            <circle cx={markerX} cy="20" r="1.5" fill="#a53556" />
                          </svg>

                          {/* Dotted indicator label */}
                          <div 
                            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center select-none" 
                            style={{ left: `${markerX}%` }}
                          >
                            <span className="text-[8px] bg-primary text-on-primary px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest leading-none shadow-sm mt-1">
                              You
                            </span>
                          </div>
                        </div>

                        {/* Custom Legend */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-[10px] font-bold text-secondary mt-3 select-none">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-[#ff7b9c] rounded-full inline-block" />
                            <span>Estrogen (Estradiol)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-[#c084fc] rounded-full inline-block" />
                            <span>Progesterone (Luteal Peak)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 border-t border-dashed border-[#6366f1] inline-block" />
                            <span>LH (Ovulatory Surge)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Clinical Insights */}
                    {forecast?.insights && (forecast.insights.stress || forecast.insights.sleep) && (
                      <div className="flex flex-col gap-4">
                        {forecast.insights.stress && (
                          <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4 bg-gradient-to-tr from-primary/5 via-transparent to-blue-500/5">
                            <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                              <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                              <h4 className="font-extrabold text-primary text-xs uppercase tracking-widest">Clinical Insight: Hydration & Stress</h4>
                            </div>
                            <div className="bg-white/60 p-4 rounded-2xl border border-white/80">
                              <span className="text-[9px] font-black text-secondary uppercase block mb-1">AI Observation</span>
                              <p className="text-primary font-bold leading-normal">{forecast.insights.stress}</p>
                            </div>
                          </div>
                        )}
                        {forecast.insights.sleep && (
                          <div className="glass-card p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-4 bg-gradient-to-tr from-primary/5 via-transparent to-purple-500/5">
                            <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                              <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                              <h4 className="font-extrabold text-primary text-xs uppercase tracking-widest">Clinical Insight: Hormones & Sleep</h4>
                            </div>
                            <div className="bg-white/60 p-4 rounded-2xl border border-white/80">
                              <span className="text-[9px] font-black text-secondary uppercase block mb-1">AI Observation</span>
                              <p className="text-primary font-bold leading-normal">{forecast.insights.sleep}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            );
          })()}

          {/* ═══════════════ PROFILE TAB ═══════════════ */}
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
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/60 border border-white/85 flex items-center justify-center text-primary shadow-inner overflow-hidden relative group">
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[36px] sm:text-[48px] text-primary font-light">shield_person</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-center">
                    <label className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all shadow-sm">
                      Upload Avatar
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                updateProfileImage(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {user.profileImage && (
                      <button
                        onClick={() => updateProfileImage('')}
                        className="text-[9px] font-black text-red-500 hover:text-red-750 hover:underline uppercase tracking-wider transition-all"
                      >
                        Remove Avatar
                      </button>
                    )}
                  </div>

                  <div>
                    <h2 className="font-headline-md text-xl sm:text-2xl text-primary font-black mb-1">{user.name || 'Elena Ross'}</h2>
                    <p className="text-secondary text-xs sm:text-sm">Account Active since: {profileStats?.trackingSince || '--'}</p>
                  </div>

                  <div className="w-full flex flex-col gap-3 pt-4 border-t border-outline/10">
                    <button
                      onClick={() => navigate('/onboarding')}
                      className="w-full py-2.5 border border-white bg-white/50 hover:bg-white rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-wider text-primary shadow-sm transition-all"
                    >
                      {t('profile.recalibrate')}
                    </button>
                    <button
                      onClick={() => {
                        logoutUser();
                        navigate('/landingpage');
                      }}
                      className="w-full py-2.5 bg-primary text-on-primary rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-md shadow-primary/20 hover:opacity-95 transition-all"
                    >
                      {t('profile.disconnect')}
                    </button>
                  </div>
                </div>

                {/* Right Column: Analytics & Modules (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Wellness Stats */}
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[2.0rem] shadow-sm">
                    <span className="block text-xs font-extrabold text-primary uppercase tracking-wider mb-4 ml-1">Biological Statistics</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { label: 'Avg Cycle Length', val: `${profileStats?.averageCycleLength || onboarding.cycleLength} days` },
                        { label: 'Avg Period Flow', val: `${profileStats?.averagePeriodLength || onboarding.periodLength} days` },
                        { label: 'Total Logs Saved', val: `${profileStats?.logsSubmitted || 0}` },
                        { label: 'Calendar Sync Rate', val: `${profileStats?.completionRate || 0}%` },
                        { label: 'Autonomic HRV Avg', val: `${profileStats?.averageHrv || 0} ms` }
                      ].map((stat, idx) => (
                        <div key={idx} className="bg-white/50 border border-white/60 p-3 rounded-2xl flex flex-col justify-between min-h-[70px]">
                          <span className="block text-[7.5px] sm:text-[8px] font-bold text-secondary uppercase tracking-widest leading-normal mb-1">{stat.label}</span>
                          <span className="text-xs sm:text-sm font-bold text-primary">{stat.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Averages and Streaks Ledger */}
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[2.0rem] shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/50 p-4 rounded-2xl flex flex-col gap-2">
                      <span className="text-[10px] font-black text-secondary uppercase">Autonomic Streaks</span>
                      <div className="flex justify-between items-center text-xs text-primary font-bold">
                        <span>Current Logging Streak:</span>
                        <span>{profileStats?.currentStreak || 0} days</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-primary font-bold">
                        <span>Longest Logging Streak:</span>
                        <span>{profileStats?.longestStreak || 0} days</span>
                      </div>
                    </div>

                    <div className="bg-white/50 p-4 rounded-2xl flex flex-col gap-2">
                      <span className="text-[10px] font-black text-secondary uppercase">Cycle Drift Analytics</span>
                      <div className="flex justify-between items-center text-xs text-primary font-bold">
                        <span>Recorded Cycles Count:</span>
                        <span>{profileStats?.cyclesRecorded || 0} cycles</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-primary font-bold">
                        <span>Cycle Length Range (Min-Max):</span>
                        <span>{profileStats?.shortestCycleLength ? `${profileStats.shortestCycleLength} - ${profileStats.longestCycleLength} days` : 'Calibrating'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Achievements Progression Milestones */}
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[2.0rem] shadow-sm">
                    <span className="block text-xs font-extrabold text-primary uppercase tracking-wider mb-4 ml-1">Journey Achievements</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { label: 'First Log Submitted', checked: totalLogs >= 1, icon: 'workspace_premium' },
                        { label: '7-Day Streak Active', checked: (profileStats?.longestStreak || 0) >= 7, icon: 'military_tech' },
                        { label: 'Consistency Unlocked', checked: (profileStats?.completionRate || 0) >= 80, icon: 'stars' },
                        { label: 'AI Confidence 80%', checked: (profileStats?.predictionAccuracy || 50) >= 80, icon: 'psychology' },
                        { label: '3 Complete Cycles', checked: (profileStats?.cyclesRecorded || 0) >= 3, icon: 'shield_heart' }
                      ].map((badge, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-2xl flex items-center gap-2 border transition-all ${
                            badge.checked 
                              ? 'bg-[#ff7b9c]/10 border-primary/20 text-primary' 
                              : 'bg-slate-100/50 border-slate-200/60 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base sm:text-lg shrink-0">
                            {badge.checked ? badge.icon : 'lock'}
                          </span>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold leading-tight">{badge.label}</span>
                            <span className="text-[8px] font-medium leading-none mt-0.5">{badge.checked ? 'Earned' : 'Locked'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reports Download Trigger */}
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[2.0rem] shadow-sm flex flex-col gap-4">
                    <div>
                      <span className="block text-xs font-extrabold text-primary uppercase tracking-wider mb-1">Health Reports & Exports</span>
                      <p className="text-secondary text-[11px] font-medium leading-normal">Compile your physical biometrics and symptom ledger for medical consults or partners.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => downloadReport('csv')}
                        className="flex-1 py-2.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export CSV Telemetry
                      </button>

                      <button
                        onClick={() => downloadReport('pdf')}
                        className="flex-1 py-2.5 bg-primary text-on-primary rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md shadow-primary/15"
                      >
                        <FileText className="w-4 h-4" />
                        Export Doctor HTML/PDF Report
                      </button>
                    </div>
                  </div>

                  {/* Partner Sync */}
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[2.0rem] shadow-sm">
                    <span className="block text-xs font-extrabold text-primary uppercase tracking-wider mb-4 ml-1">{t('profile.partnerSyncTitle')}</span>
                    
                    {partnerStatus.paired ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                            <span className="material-symbols-outlined text-[22px]">favorite</span>
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-emerald-800">{t('profile.pairedActive')}</span>
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
                            {t('profile.sendLove')}
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
                            {t('profile.disconnectPartner')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <p className="text-xs text-secondary leading-relaxed font-bold">
                          {t('profile.syncDescription')}
                        </p>
                        
                        {/* Generate Code Area */}
                        <div className="flex flex-col gap-2">
                          {generatedCode ? (
                            <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-center">
                              <span className="block text-[8px] font-bold text-secondary uppercase tracking-widest mb-1">{t('profile.partnerCodeTitle')}</span>
                              <span className="text-lg font-black text-primary tracking-widest">{generatedCode}</span>
                              <span className="block text-[8px] text-secondary mt-1">{t('profile.partnerCodeShare')}</span>
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
                              {partnerLoading ? t('profile.generating') : t('profile.generateCode')}
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
                            placeholder={t('profile.enterCodePlaceholder')}
                            className="flex-1 bg-white/50 border border-outline/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/10 px-4 py-2 rounded-full text-xs font-black tracking-widest text-center focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={partnerLoading || !partnerCodeInput}
                            className="px-4 py-2 bg-primary text-on-primary rounded-full font-bold text-[10px] uppercase tracking-wider disabled:opacity-50"
                          >
                            {t('profile.link')}
                          </button>
                        </form>
                      </div>
                    )}

                    {partnerError && <p className="text-[10px] text-red-600 font-bold mt-2 ml-1">{partnerError}</p>}
                    {partnerSuccess && <p className="text-[10px] text-emerald-600 font-bold mt-2 ml-1">{partnerSuccess}</p>}
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-white/40 border border-white/60 p-6 rounded-[2.0rem] shadow-sm">
                    <NotificationSettings />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ═══════════════ BOTTOM NAV BAR ═══════════════ */}
      <nav className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[95%] max-w-lg">
        <div className="bg-white/95 backdrop-blur-3xl shadow-[0_24px_50px_rgba(165,53,86,0.12)] border border-white/70 p-1.5 sm:p-3 rounded-full flex justify-between items-center gap-1">
          {[
            { id: 'home', label: t('nav.home'), icon: 'space_dashboard' },
            { id: 'lab', label: t('nav.lab'), icon: 'science' },
            { id: 'calendar', label: t('nav.calendar'), icon: 'calendar_month' },
            { id: 'log', label: t('nav.log'), icon: 'edit_note' },
            { id: 'insights', label: t('nav.insights'), icon: 'insights' },
            { id: 'profile', label: t('nav.profile'), icon: 'person' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'log') {
                    setSelectedDateStr(todayStr);
                  }
                  if (tab.id === 'profile' || tab.id === 'calendar' || tab.id === 'insights' || tab.id === 'home') {
                    refreshAnalytics();
                  }
                }}
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

    const fs = `precision highp float;
    varying vec2 v_texCoord;
    uniform float u_time;
    uniform vec3 u_phase_color;
    uniform vec2 u_mouse;
    uniform vec2 u_res;

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
      
      float pulse = 1.0 + sin(u_time * 2.8) * 0.04;
      
      float n1 = snoise(uv * 3.5 + vec2(u_time * 0.3, -u_time * 0.1)) * 0.05;
      float n2 = snoise(uv * 8.0 - vec2(u_time * 0.4, u_time * 0.2)) * 0.02;
      
      float orbRadius = 0.26 * pulse + n1 + n2;
      
      vec2 mouseNorm = u_mouse / u_res;
      float mouseDist = distance(uv, mouseNorm);
      float hoverGlow = smoothstep(0.4, 0.0, mouseDist) * 0.08;
      
      float edgeGlow = smoothstep(orbRadius + 0.1, orbRadius - 0.1, dist);
      float fillGlow = smoothstep(orbRadius, 0.0, dist);
      
      float innerGlow = smoothstep(orbRadius * 0.6, 0.0, dist) * 0.25;
      
      vec3 col = u_phase_color;
      col += vec3(0.08, 0.04, 0.12) * sin(u_time * 0.5);
      col += vec3(0.1, 0.02, 0.05) * innerGlow;
      
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

/* ═══════════════ CALENDAR LEGEND COMPONENT ═══════════════ */
const CalendarLegend: React.FC = () => {
  return (
    <div className="glass-card p-4 rounded-2xl border border-white/60 shadow-sm mt-2 w-full">
      <span className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-3">Calendar Legend</span>
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 text-[10px] text-secondary font-bold">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-[#FBEBEC] border border-[#FBEBEC]/60 inline-block shrink-0" />
          <span>🩸 Period</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-[#E8F9EF] border border-[#E8F9EF]/60 inline-block shrink-0" />
          <span>🌿 Fertile Window</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-[#EDE7FF] border border-[#EDE7FF]/60 inline-block shrink-0" />
          <span>🌸 Ovulation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-[#FFF3E6] border border-[#FFF3E6]/60 inline-block shrink-0" />
          <span>🔴 Predicted Period</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">❤️</span>
          <span>Logged Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">⚪</span>
          <span>Missed Log</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">⚡</span>
          <span>High Stress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">💧</span>
          <span>Low Hydration</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">🌙</span>
          <span>Good Sleep</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">📝</span>
          <span>Notes/Symptoms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">💊</span>
          <span>Medication</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">🤝</span>
          <span>Partner Shared</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">✨</span>
          <span>AI Insight</span>
        </div>
      </div>
    </div>
  );
};

