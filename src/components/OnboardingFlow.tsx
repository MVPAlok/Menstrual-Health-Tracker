import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackgroundShader } from './BackgroundShader';
import { useApp } from '../context/AppContext';
import type { OnboardingData } from '../context/AppContext';
import { 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  Activity, 
  Zap, 
  Moon, 
  Droplets, 
  Bell, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Smile, 
  Brain,
  LineChart,
  HeartPulse,
  Clock,
  Shield,
  LayoutDashboard,
  Award
} from 'lucide-react';

export const OnboardingFlow: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { onboarding, updateOnboarding, user, logoutUser } = useApp();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Local state buffer to prevent API call spam during slide interactions
  const [localOnboarding, setLocalOnboarding] = useState<OnboardingData>(() => onboarding);

  // Sync local buffer when context loads
  useEffect(() => {
    if (onboarding) {
      setLocalOnboarding(onboarding);
    }
  }, [onboarding]);

  // Calendar State for Step 2
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)

  const monthNames = [
    t('months.january'), t('months.february'), t('months.march'), t('months.april'),
    t('months.may'), t('months.june'), t('months.july'), t('months.august'),
    t('months.september'), t('months.october'), t('months.november'), t('months.december')
  ];

  const goalKeyMap: Record<string, string> = {
    'Track Periods': 'onboarding.trackPeriods',
    'Understand Symptoms': 'onboarding.understandSymptoms',
    'Improve Wellness': 'onboarding.improveWellness',
    'Learn Body Patterns': 'onboarding.learnBodyPatterns',
    'Predict Ovulation': 'onboarding.predictOvulation',
    'Improve Energy': 'onboarding.improveEnergy'
  };

  const handleNext = async () => {
    try {
      setIsSaving(true);
      if (step < 8) {
        // Save current step data to database to persist progress
        await updateOnboarding(localOnboarding);
        setStep(step + 1);
      } else {
        // Final step: set onboardingCompleted: true and save
        await updateOnboarding({ ...localOnboarding, onboardingCompleted: true });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
      // Fallback: still let the user progress so they are not blocked by network issues
      if (step === 8) {
        navigate('/dashboard');
      } else {
        setStep(step + 1);
      }
    } finally {
      setIsSaving(false);
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
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    setLocalOnboarding(prev => ({ ...prev, lastPeriodDate: dateStr }));
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
    if (!localOnboarding.lastPeriodDate) return t('onboarding.noDateSelected');
    const d = new Date(localOnboarding.lastPeriodDate);
    const monthKey = monthNames[d.getMonth()];
    return `${monthKey} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // SVG Visualizer calculations for Step 3
  const cycleDays = localOnboarding.cycleLength;
  const periodDays = localOnboarding.periodLength;

  const getStrokeDash = (percent: number) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeLength = (percent / 100) * circumference;
    return `${strokeLength} ${circumference - strokeLength}`;
  };

  // Extract user's first name for personalization
  const firstName = user.name ? user.name.split(' ')[0] : '';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-y-auto bg-background">
      <BackgroundShader canvasId="onboarding-shader-canvas" />
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] z-0 pointer-events-none" />

      {/* Progress Header */}
      <div className="absolute top-0 left-0 right-0 w-full p-4 sm:p-6 md:p-8 flex flex-row justify-between items-center z-20 max-w-7xl mx-auto gap-2">
        <span className="font-extrabold text-lg sm:text-xl text-primary tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-5 h-5 text-primary" />
          LunaCare
        </span>
        <div className="flex items-center gap-2 sm:gap-4 justify-end">
          <button 
            onClick={() => { logoutUser(); navigate('/'); }} 
            className="text-[10px] sm:text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest px-2"
          >
            {t('auth.logout', 'Log Out')}
          </button>
          <div className="w-24 sm:w-48 h-1.5 bg-white/40 border border-white/60 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary-container"
              animate={{ width: `${(step / 8) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-primary whitespace-nowrap">{t('onboarding.stepOf', { step })}</span>
        </div>
      </div>

      {/* Onboarding Wizard Card */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl relative z-10 glass-card p-5 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/70 shadow-[0_32px_80px_rgba(165,53,86,0.08)] mt-20 sm:mt-24 mb-6"
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
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Brain className="w-10 h-10 text-primary animate-pulse" />
                </div>
              </div>
              <h2 className="font-hero-display-mobile md:font-headline-lg text-2xl sm:text-headline-lg text-primary mb-4 leading-tight">
                {t('onboarding.welcomeTitle').replace('.', '')}{firstName ? `, ${firstName}` : ''}.
              </h2>
              <p className="text-secondary font-body-lg max-w-md mx-auto mb-10 leading-relaxed text-sm sm:text-base">
                {t('onboarding.welcomeDesc')}
              </p>
              <motion.button
                onClick={handleNext}
                disabled={isSaving}
                className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 flex items-center justify-center gap-2 mx-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('onboarding.beginButton')}
                <ArrowRight className="w-4 h-4" />
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
              <h3 className="font-headline-md text-xl sm:text-headline-md text-primary mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {t('onboarding.lastPeriodTitle')}
              </h3>
              <p className="text-secondary text-xs sm:text-sm mb-6 sm:mb-8">
                {t('onboarding.lastPeriodDesc')}
              </p>

              <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center justify-between">
                {/* Custom Glassmorphic Calendar */}
                <div className="w-full max-w-sm bg-white/40 border border-white/70 rounded-3xl p-3.5 sm:p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      type="button"
                      onClick={() => changeMonth(-1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/60 hover:bg-white text-primary transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-primary text-xs sm:text-sm tracking-wider uppercase">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeMonth(1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/60 hover:bg-white text-primary transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold text-secondary mb-2">
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
                      const yyyy = cellDate.getFullYear();
                      const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
                      const dd = String(cellDate.getDate()).padStart(2, '0');
                      const cellDateStr = `${yyyy}-${mm}-${dd}`;
                      const isSelected = localOnboarding.lastPeriodDate === cellDateStr;

                      return (
                        <button
                          key={`day-${dayNum}`}
                          type="button"
                          onClick={() => selectDate(dayNum)}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full font-bold text-[11px] sm:text-xs flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/30 scale-110'
                              : 'bg-white/30 text-secondary hover:bg-white/85'
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
                      {t('onboarding.selectedPeriodStart')}
                    </span>
                    <span className="text-xl font-bold text-primary">{formattedSelectedDate()}</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    {t('onboarding.lastPeriodNotice')}
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 hover:bg-white/70 rounded-full font-bold text-xs uppercase tracking-wider text-secondary transition-all"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-on-primary hover:opacity-95 rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
                >
                  {isSaving ? t('nav.calibrating') : t('onboarding.continue')}
                  <ArrowRight className="w-3.5 h-3.5" />
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
              <h3 className="font-headline-md text-xl sm:text-headline-md text-primary mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t('onboarding.cycleLengthTitle')}
              </h3>
              <p className="text-secondary text-xs sm:text-sm mb-6 sm:mb-8">
                {t('onboarding.cycleLengthDesc')}
              </p>

              <div className="flex flex-col md:flex-row gap-6 sm:gap-10 items-center justify-between">
                {/* Wheel / Slider */}
                <div className="w-full max-w-xs flex flex-col gap-4 sm:gap-6">
                  <div className="text-center bg-white/40 border border-white/70 rounded-3xl p-4 sm:p-6 shadow-sm">
                    <span className="text-5xl sm:text-6xl font-extrabold text-primary">{localOnboarding.cycleLength}</span>
                    <span className="block text-xs font-bold uppercase tracking-widest text-secondary mt-2">
                      {t('onboarding.days')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={21}
                    max={35}
                    value={localOnboarding.cycleLength}
                    onChange={(e) => setLocalOnboarding(prev => ({ ...prev, cycleLength: parseInt(e.target.value) }))}
                    className="w-full accent-primary h-2 bg-white/50 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-secondary px-1">
                    <span>21 {t('onboarding.days')}</span>
                    <span>{t('onboarding.daysAvg')}</span>
                    <span>35 {t('onboarding.days')}</span>
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
                        stroke="#a53556" // Primary Crimson
                        strokeWidth="12"
                        strokeDasharray={getStrokeDash((periodDays / cycleDays) * 100)}
                        strokeDashoffset={0}
                        className="transition-all duration-300"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-secondary">{t('onboarding.estPhases')}</span>
                      <span className="text-lg font-extrabold text-primary">{t('onboarding.calibrated')}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 flex-wrap justify-center mt-5 text-[10px] font-bold text-secondary">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> {t('rhythms.menstrualShort')}</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#e2d9f3]" /> {t('rhythms.follicularShort')}</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#ffdce3]" /> {t('rhythms.ovulationShort')}</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#fccdc7]" /> {t('rhythms.lutealShort')}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 hover:bg-white/70 rounded-full font-bold text-xs uppercase tracking-wider text-secondary transition-all"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-on-primary hover:opacity-95 rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
                >
                  {isSaving ? t('nav.calibrating') : t('onboarding.continue')}
                  <ArrowRight className="w-3.5 h-3.5" />
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
              <h3 className="font-headline-md text-xl sm:text-headline-md text-primary mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {t('onboarding.periodLengthTitle')}
              </h3>
              <p className="text-secondary text-xs sm:text-sm mb-6 sm:mb-8">
                {t('onboarding.periodLengthDesc')}
              </p>

              <div className="flex flex-col gap-6 sm:gap-8 items-center justify-center py-2 sm:py-4">
                <div className="text-center bg-white/40 border border-white/70 rounded-3xl p-4 sm:p-6 shadow-sm w-full max-w-xs">
                  <span className="text-5xl sm:text-6xl font-extrabold text-primary">{localOnboarding.periodLength}</span>
                  <span className="block text-xs font-bold uppercase tracking-widest text-secondary mt-2">
                    {t('onboarding.daysBleeding')}
                  </span>
                </div>

                <div className="w-full max-w-md">
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={localOnboarding.periodLength}
                    onChange={(e) => setLocalOnboarding(prev => ({ ...prev, periodLength: parseInt(e.target.value) }))}
                    className="w-full accent-primary h-2 bg-white/50 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-secondary px-1 mt-2">
                    <span>2 {t('onboarding.days')}</span>
                    <span>5 {t('onboarding.daysVal', { days: 5 })} (Avg)</span>
                    <span>10 {t('onboarding.days')}</span>
                  </div>
                </div>

                {/* Droplets representation */}
                <div className="flex gap-2 sm:gap-3 justify-center items-center h-12 flex-wrap max-w-full">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const isActive = i < localOnboarding.periodLength;
                    return (
                      <motion.div
                        key={i}
                        className={`transition-all duration-300 ${
                          isActive ? 'text-primary scale-115 drop-shadow-[0_2px_8px_rgba(165,53,86,0.35)]' : 'text-primary/20'
                        }`}
                        animate={isActive ? { y: [0, -4, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.15 }}
                      >
                        <Droplets className={`w-6 h-6 ${isActive ? 'fill-current' : 'fill-none'}`} />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 hover:bg-white/70 rounded-full font-bold text-xs uppercase tracking-wider text-secondary transition-all"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-on-primary hover:opacity-95 rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
                >
                  {isSaving ? t('nav.calibrating') : t('onboarding.continue')}
                  <ArrowRight className="w-3.5 h-3.5" />
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
              <h3 className="font-headline-md text-xl sm:text-headline-md text-primary mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                {t('onboarding.healthGoalsTitle')}
              </h3>
              <p className="text-secondary text-xs sm:text-sm mb-6 sm:mb-8">
                {t('onboarding.healthGoalsDesc')}
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {[
                  { id: 'Track Periods', label: t('onboarding.trackPeriods'), icon: Calendar },
                  { id: 'Understand Symptoms', label: t('onboarding.understandSymptoms'), icon: Brain },
                  { id: 'Improve Wellness', label: t('onboarding.improveWellness'), icon: HeartPulse },
                  { id: 'Learn Body Patterns', label: t('onboarding.learnBodyPatterns'), icon: LineChart },
                  { id: 'Predict Ovulation', label: t('onboarding.predictOvulation'), icon: Sparkles },
                  { id: 'Improve Energy', label: t('onboarding.improveEnergy'), icon: Zap }
                ].map((goal) => {
                  const isSelected = localOnboarding.healthGoals.includes(goal.id);
                  const Icon = goal.icon;
                  const toggleGoal = () => {
                    let updated: string[];
                    if (isSelected) {
                      updated = localOnboarding.healthGoals.filter(g => g !== goal.id);
                    } else {
                      updated = [...localOnboarding.healthGoals, goal.id];
                    }
                    setLocalOnboarding(prev => ({ ...prev, healthGoals: updated }));
                  };

                  return (
                    <motion.div
                      key={goal.id}
                      onClick={toggleGoal}
                      className={`p-3.5 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border transition-all cursor-pointer flex flex-col gap-2 sm:gap-3 select-none ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-[0_12px_24px_rgba(165,53,86,0.06)]'
                          : 'bg-white/40 border-white/60 hover:bg-white/80'
                      }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-secondary'}`} />
                      <span className={`font-bold text-xs sm:text-sm leading-tight ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                        {goal.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex justify-between mt-10">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 hover:bg-white/70 rounded-full font-bold text-xs uppercase tracking-wider text-secondary transition-all"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-on-primary hover:opacity-95 rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
                >
                  {isSaving ? t('nav.calibrating') : t('onboarding.continue')}
                  <ArrowRight className="w-3.5 h-3.5" />
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
              <h3 className="font-headline-md text-xl sm:text-headline-md text-primary mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {t('onboarding.lifestyleTitle')}
              </h3>
              <p className="text-secondary text-xs sm:text-sm mb-6 sm:mb-8">
                {t('onboarding.lifestyleDesc')}
              </p>

              <div data-lenis-prevent className="flex flex-col gap-4 sm:gap-5 max-h-[380px] overflow-y-auto pr-2">
                {/* Sleep Quality */}
                <div className="glass bg-white/20 p-4 rounded-2xl border border-white/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="w-4 h-4 text-primary" />
                    <label className="text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase">{t('onboarding.sleepQuality')}</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'Restorative', label: t('onboarding.restorative'), icon: Moon, color: 'text-emerald-500' },
                      { value: 'Fragmented', label: t('onboarding.fragmented'), icon: Clock, color: 'text-amber-500' },
                      { value: 'Insufficient', label: t('onboarding.insufficient'), icon: Activity, color: 'text-red-500' }
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = localOnboarding.lifestyle.sleep === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setLocalOnboarding(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, sleep: option.value }
                          }))}
                          className={`py-3 px-2 rounded-2xl text-[10px] sm:text-xs font-bold border transition-all flex flex-col items-center gap-1.5 justify-center ${
                            isSelected
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 border-primary'
                              : 'bg-white/40 border-white/60 hover:bg-white/80 text-secondary'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : option.color}`} />
                          <span className="truncate w-full text-center">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stress Level */}
                <div className="glass bg-white/20 p-4 rounded-2xl border border-white/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <label className="text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase">{t('onboarding.stressLevel')}</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'Low', label: t('onboarding.low'), icon: Smile, color: 'text-emerald-500' },
                      { value: 'Moderate', label: t('onboarding.moderate'), icon: HeartPulse, color: 'text-amber-500' },
                      { value: 'High', label: t('onboarding.high'), icon: Zap, color: 'text-red-500' }
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = localOnboarding.lifestyle.stress === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setLocalOnboarding(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, stress: option.value }
                          }))}
                          className={`py-3 px-2 rounded-2xl text-[10px] sm:text-xs font-bold border transition-all flex flex-col items-center gap-1.5 justify-center ${
                            isSelected
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 border-primary'
                              : 'bg-white/40 border-white/60 hover:bg-white/80 text-secondary'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : option.color}`} />
                          <span className="truncate w-full text-center">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Activity Level */}
                <div className="glass bg-white/20 p-4 rounded-2xl border border-white/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <label className="text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase">{t('onboarding.activityLevel')}</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'Sedentary', label: t('onboarding.sedentary'), icon: Clock, color: 'text-red-500' },
                      { value: 'Active', label: t('onboarding.active'), icon: Zap, color: 'text-emerald-500' },
                      { value: 'Athletic', label: t('onboarding.athletic'), icon: TrendingUp, color: 'text-purple-500' }
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = localOnboarding.lifestyle.activity === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setLocalOnboarding(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, activity: option.value }
                          }))}
                          className={`py-3 px-2 rounded-2xl text-[10px] sm:text-xs font-bold border transition-all flex flex-col items-center gap-1.5 justify-center ${
                            isSelected
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 border-primary'
                              : 'bg-white/40 border-white/60 hover:bg-white/80 text-secondary'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : option.color}`} />
                          <span className="truncate w-full text-center">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hydration */}
                <div className="glass bg-white/20 p-4 rounded-2xl border border-white/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-4 h-4 text-primary" />
                    <label className="text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase">{t('onboarding.hydration')}</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'Optimal', label: t('onboarding.optimal'), icon: Droplets, color: 'text-emerald-500' },
                      { value: 'Average', label: t('onboarding.average'), icon: Droplets, color: 'text-amber-500' },
                      { value: 'Low', label: t('onboarding.low'), icon: Activity, color: 'text-red-500' }
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = localOnboarding.lifestyle.hydration === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setLocalOnboarding(prev => ({
                            ...prev,
                            lifestyle: { ...prev.lifestyle, hydration: option.value }
                          }))}
                          className={`py-3 px-2 rounded-2xl text-[10px] sm:text-xs font-bold border transition-all flex flex-col items-center gap-1.5 justify-center ${
                            isSelected
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 border-primary'
                              : 'bg-white/40 border-white/60 hover:bg-white/80 text-secondary'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : option.color}`} />
                          <span className="truncate w-full text-center">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-10">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 hover:bg-white/70 rounded-full font-bold text-xs uppercase tracking-wider text-secondary transition-all"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-on-primary hover:opacity-95 rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
                >
                  {isSaving ? t('nav.calibrating') : t('onboarding.continue')}
                  <ArrowRight className="w-3.5 h-3.5" />
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
              <h3 className="font-headline-md text-xl sm:text-headline-md text-primary mb-2 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                {t('onboarding.notificationsTitle')}
              </h3>
              <p className="text-secondary text-xs sm:text-sm mb-6 sm:mb-8">
                {t('onboarding.notificationsDesc')}
              </p>

              <div className="flex flex-col gap-3 sm:gap-4">
                {[
                  { key: 'period', label: t('onboarding.periodLabel'), desc: t('onboarding.periodDesc'), icon: Calendar, color: 'text-primary' },
                  { key: 'ovulation', label: t('onboarding.ovulationLabel'), desc: t('onboarding.ovulationDesc'), icon: Sparkles, color: 'text-[#ff7b9c]' },
                  { key: 'insights', label: t('onboarding.insightsLabel'), desc: t('onboarding.insightsDesc'), icon: Brain, color: 'text-indigo-500' },
                  { key: 'wellnessTips', label: t('onboarding.wellnessTipsLabel'), desc: t('onboarding.wellnessTipsDesc'), icon: HeartPulse, color: 'text-emerald-500' }
                ].map((item) => {
                  const typedKey = item.key as keyof typeof localOnboarding.notifications;
                  const isActive = localOnboarding.notifications[typedKey];
                  const Icon = item.icon;
                  const toggle = () => {
                    setLocalOnboarding(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        [typedKey]: !isActive
                      }
                    }));
                  };

                  return (
                    <div
                      key={item.key}
                      onClick={toggle}
                      className="p-3 sm:p-5 rounded-3xl bg-white/40 border border-white flex justify-between items-center cursor-pointer select-none hover:bg-white/80 transition-all gap-3"
                    >
                      <Icon className={`w-5 h-5 ${item.color} shrink-0`} />
                      <div className="flex-1 text-left">
                        <span className="block font-bold text-xs sm:text-sm text-primary mb-0.5">{item.label}</span>
                        <span className="block text-[10px] sm:text-xs text-secondary leading-normal">{item.desc}</span>
                      </div>
                      {/* Glass Toggle */}
                      <div className={`w-10 sm:w-12 h-6 sm:h-7 rounded-full p-1 flex items-center transition-all shrink-0 ${isActive ? 'bg-primary' : 'bg-white/60 border border-outline/10'}`}>
                        <motion.div
                          className={`w-4 sm:w-5 h-4 sm:h-5 rounded-full shadow-md ${isActive ? 'bg-white' : 'bg-secondary/40'}`}
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
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-3 border border-white bg-white/40 hover:bg-white/70 rounded-full font-bold text-xs uppercase tracking-wider text-secondary transition-all"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-on-primary hover:opacity-95 rounded-full font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
                >
                  {isSaving ? t('nav.calibrating') : t('onboarding.continue')}
                  <ArrowRight className="w-3.5 h-3.5" />
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
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-[#ff7b9c]/10 border border-[#ff7b9c]/20 flex items-center justify-center text-primary relative">
                  <Award className="w-10 h-10 text-primary animate-bounce" />
                </div>
              </div>

              <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-primary mb-2">
                {firstName ? `${firstName}'s ` : ''}{t('onboarding.profileReadyTitle')}
              </h2>
              <p className="text-secondary text-xs sm:text-sm mb-6 max-w-md mx-auto">
                {t('onboarding.profileReadyDesc')}
              </p>

              {/* Enhanced Telemetry Summary Grid */}
              <div className="flex flex-col gap-4 mb-8">
                {/* Biological Parameters */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-white/50 border border-white/60 p-3 rounded-2xl flex flex-col justify-between min-h-[75px]">
                    <span className="block text-[8px] sm:text-[9px] font-bold text-secondary uppercase tracking-widest leading-normal mb-1">{t('onboarding.cycleLength')}</span>
                    <span className="text-xs sm:text-base font-extrabold text-primary">{t('onboarding.daysVal', { days: localOnboarding.cycleLength })}</span>
                  </div>
                  <div className="bg-white/50 border border-white/60 p-3 rounded-2xl flex flex-col justify-between min-h-[75px]">
                    <span className="block text-[8px] sm:text-[9px] font-bold text-secondary uppercase tracking-widest leading-normal mb-1">{t('onboarding.periodLength')}</span>
                    <span className="text-xs sm:text-base font-extrabold text-primary">{t('onboarding.daysVal', { days: localOnboarding.periodLength })}</span>
                  </div>
                  <div className="bg-white/50 border border-white/60 p-3 rounded-2xl flex flex-col justify-between min-h-[75px]">
                    <span className="block text-[8px] sm:text-[9px] font-bold text-secondary uppercase tracking-widest leading-normal mb-1">{t('onboarding.healthFocus')}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-primary truncate max-w-full block">
                      {localOnboarding.healthGoals.length > 0 ? t(goalKeyMap[localOnboarding.healthGoals[0]] || 'onboarding.improveWellness') : t('onboarding.improveWellness')}
                    </span>
                  </div>
                </div>

                {/* Lifestyle Calibration Telemetry */}
                <div className="bg-white/40 border border-white/60 p-4 rounded-2xl flex flex-col gap-2.5 text-left">
                  <span className="text-[9px] font-black text-secondary uppercase tracking-wider">Lifestyle Telemetry Calibrated</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-primary font-bold">
                    <div className="flex items-center gap-1 bg-white/60 px-2.5 py-1.5 rounded-full border border-white/80">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-secondary">Sleep:</span>
                      <span className="text-primary font-extrabold">{t(`onboarding.${localOnboarding.lifestyle.sleep.toLowerCase()}` as any) || localOnboarding.lifestyle.sleep}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/60 px-2.5 py-1.5 rounded-full border border-white/80">
                      <Activity className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-secondary">Stress:</span>
                      <span className="text-primary font-extrabold">{t(`onboarding.${localOnboarding.lifestyle.stress.toLowerCase()}` as any) || localOnboarding.lifestyle.stress}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/60 px-2.5 py-1.5 rounded-full border border-white/80">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-secondary">Activity:</span>
                      <span className="text-primary font-extrabold">{t(`onboarding.${localOnboarding.lifestyle.activity.toLowerCase()}` as any) || localOnboarding.lifestyle.activity}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/60 px-2.5 py-1.5 rounded-full border border-white/80">
                      <Droplets className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-secondary">Hydration:</span>
                      <span className="text-primary font-extrabold">{t(`onboarding.${localOnboarding.lifestyle.hydration.toLowerCase()}` as any) || localOnboarding.lifestyle.hydration}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <motion.button
                  onClick={handleNext}
                  disabled={isSaving}
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-primary/30 border border-primary/20 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(165, 53, 86, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSaving ? t('nav.calibrating') : t('onboarding.enterDashboard')}
                  <LayoutDashboard className="w-4.5 h-4.5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
