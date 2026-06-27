import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, mapDbOnboardingToFrontend } from '../utils/api';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  profileImage?: string;
}

export interface OnboardingData {
  lastPeriodDate: string; // YYYY-MM-DD
  cycleLength: number; // 21 - 35
  periodLength: number; // 2 - 10
  healthGoals: string[];
  lifestyle: {
    sleep: string; // 'Restorative' | 'Fragmented' | 'Insufficient'
    stress: string; // 'Low' | 'Moderate' | 'High'
    activity: string; // 'Sedentary' | 'Active' | 'Athletic'
    hydration: string; // 'Optimal' | 'Average' | 'Low'
  };
  notifications: {
    period: boolean;
    ovulation: boolean;
    insights: boolean;
    wellnessTips: boolean;
  };
  onboardingCompleted: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  mood: string; // 'Radiant' | 'Balanced' | 'Sensitive' | 'Low Energy' | 'Anxious'
  symptoms: string[];
  sleep: number; // 1 to 10
  energy: number; // 1 to 10
  stress: number; // 1 to 10
  hydration?: number; // cups (1 to 8)
  flowType?: 'NONE' | 'SPOTTING' | 'LIGHT' | 'MEDIUM' | 'HEAVY';
  hrv?: number; // Heart Rate Variability (ms)
}

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

export interface RecentChanges {
  stressDiffPct: number;
  hydrationDiffPct: number;
  sleepDiffPct: number;
  confidenceDiffPct: number;
  streakIncrement: number;
}

interface AppContextType {
  user: UserProfile;
  onboarding: OnboardingData;
  dailyLogs: Record<string, DailyLog>;
  partnerAction: { partnerId: string; action: string } | null;
  partnerLogUpdate: { partnerId: string; date: string; mood: string; symptoms: string[] } | null;
  profileStats: ProfileStats | null;
  cycleComparison: CycleComparison | null;
  recentChanges: RecentChanges | null;
  isLoadingAnalytics: boolean;
  loginUser: (firstName: string, lastName: string, password: string) => Promise<any>;
  registerUser: (firstName: string, lastName: string, password: string) => Promise<any>;
  logoutUser: () => void;
  updateOnboarding: (data: Partial<OnboardingData>) => Promise<void>;
  logDay: (log: Omit<DailyLog, 'date'>, date?: string) => Promise<void>;
  deleteLog: (date: string) => Promise<void>;
  duplicateLog: (date: string) => Promise<void>;
  triggerPartnerAction: (action: string) => void;
  updateProfileImage: (image: string) => void;
  refreshAnalytics: () => Promise<void>;
  downloadReport: (format: 'csv' | 'pdf') => Promise<void>;
}

const defaultOnboarding: OnboardingData = {
  lastPeriodDate: new Date().toISOString().split('T')[0],
  cycleLength: 28,
  periodLength: 5,
  healthGoals: [],
  lifestyle: {
    sleep: 'Restorative',
    stress: 'Moderate',
    activity: 'Active',
    hydration: 'Average',
  },
  notifications: {
    period: true,
    ovulation: true,
    insights: true,
    wellnessTips: false,
  },
  onboardingCompleted: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('lunacare_user');
    return saved ? JSON.parse(saved) : { name: '', email: '', isLoggedIn: false };
  });

  const [onboarding, setOnboarding] = useState<OnboardingData>(() => {
    const saved = localStorage.getItem('lunacare_onboarding');
    return saved ? JSON.parse(saved) : defaultOnboarding;
  });

  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});
  const [partnerAction, setPartnerAction] = useState<{ partnerId: string; action: string } | null>(null);
  const [partnerLogUpdate, setPartnerLogUpdate] = useState<{ partnerId: string; date: string; mood: string; symptoms: string[] } | null>(null);
  
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [cycleComparison, setCycleComparison] = useState<CycleComparison | null>(null);
  const [recentChanges, setRecentChanges] = useState<RecentChanges | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);

  const refreshAnalytics = async () => {
    if (!localStorage.getItem('lunacare_token')) return;
    try {
      setIsLoadingAnalytics(true);
      const [stats, comparison, changes] = await Promise.all([
        api.predictions.getProfileStats(),
        api.predictions.getCycleComparison(),
        api.predictions.getRecentChanges()
      ]);
      setProfileStats(stats);
      setCycleComparison(comparison);
      setRecentChanges(changes);
    } catch (err) {
      console.error('Failed to refresh analytics statistics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const downloadReport = async (format: 'csv' | 'pdf') => {
    try {
      const { blob, filename } = await api.predictions.exportReport(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf' ? `${filename}.html` : filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to generate downloadable report.');
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const today = new Date();
      const past30Days = new Date();
      past30Days.setDate(today.getDate() - 30);
      const startStr = past30Days.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];

      const logs = await api.logs.getRange(startStr, endStr);
      const mappedLogs: Record<string, DailyLog> = {};
      logs.forEach((log: any) => {
        mappedLogs[log.date] = {
          date: log.date,
          mood: log.mood,
          symptoms: log.symptoms,
          sleep: log.sleepHours,
          energy: log.energyRate,
          stress: log.stressFactor,
          hydration: log.hydrationCups,
          flowType: log.flowType || 'NONE',
          hrv: log.hrv,
        };
      });
      setDailyLogs(mappedLogs);
    } catch (err) {
      console.error('Failed to fetch recent daily logs: ', err);
    }
  };

  const connectSocket = (token: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('📡 Live sync WebSockets active.');
    });

    socket.on('log:sync', (data: { date: string; log: any }) => {
      setDailyLogs((prev) => ({
        ...prev,
        [data.date]: {
          date: data.date,
          mood: data.log.mood,
          symptoms: data.log.symptoms,
          sleep: data.log.sleep,
          energy: data.log.energy,
          stress: data.log.stress,
          hydration: data.log.hydration,
          flowType: data.log.flowType || 'NONE',
          hrv: data.log.hrv,
        }
      }));
      refreshAnalytics();
    });

    socket.on('partner:log_update', (data: any) => {
      setPartnerLogUpdate(data);
      setTimeout(() => setPartnerLogUpdate(null), 8000);
      refreshAnalytics();
    });

    socket.on('partner:active_notification', (data: any) => {
      setPartnerAction(data);
      setTimeout(() => setPartnerAction(null), 4000);
    });

    socketRef.current = socket;
  };

  // Check token on mount
  useEffect(() => {
    const token = localStorage.getItem('lunacare_token');
    if (token && user.isLoggedIn) {
      connectSocket(token);
      api.onboarding.get()
        .then((data) => {
          if (data) {
            setOnboarding(data);
            localStorage.setItem('lunacare_onboarding', JSON.stringify(data));
          }
        })
        .catch((err) => {
          if (err.status === 401) {
            logoutUser();
          }
        });
      fetchRecentLogs();
      refreshAnalytics();
    } else if (!token && user.isLoggedIn) {
      logoutUser();
    }
  }, []);

  const loginUser = async (firstName: string, lastName: string, password: string) => {
    const res = await api.auth.login({ firstName, lastName, password });
    localStorage.setItem('lunacare_token', res.token);
    localStorage.setItem('lunacare_user', JSON.stringify(res.user));
    
    setUser(res.user);
    if (res.onboarding) {
      const resolved = mapDbOnboardingToFrontend(res.onboarding);
      if (resolved) {
        setOnboarding(resolved);
        localStorage.setItem('lunacare_onboarding', JSON.stringify(resolved));
      }
    }
    
    connectSocket(res.token);
    const today = new Date();
    const past30Days = new Date();
    past30Days.setDate(today.getDate() - 30);
    const startStr = past30Days.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    const logs = await api.logs.getRange(startStr, endStr);
    const mappedLogs: Record<string, DailyLog> = {};
    logs.forEach((log: any) => {
      mappedLogs[log.date] = {
        date: log.date,
        mood: log.mood,
        symptoms: log.symptoms,
        sleep: log.sleepHours,
        energy: log.energyRate,
        stress: log.stressFactor,
        hydration: log.hydrationCups,
        flowType: log.flowType || 'NONE',
        hrv: log.hrv,
      };
    });
    setDailyLogs(mappedLogs);
    await refreshAnalytics();
    return res;
  };

  const registerUser = async (firstName: string, lastName: string, password: string) => {
    const res = await api.auth.register({ firstName, lastName, password });
    localStorage.setItem('lunacare_token', res.token);
    localStorage.setItem('lunacare_user', JSON.stringify(res.user));
    
    setUser(res.user);
    if (res.onboarding) {
      const resolved = mapDbOnboardingToFrontend(res.onboarding);
      if (resolved) {
        setOnboarding(resolved);
        localStorage.setItem('lunacare_onboarding', JSON.stringify(resolved));
      }
    }
    
    connectSocket(res.token);
    setDailyLogs({});
    await refreshAnalytics();
    return res;
  };

  const logoutUser = () => {
    setUser({ name: '', email: '', isLoggedIn: false });
    setOnboarding(defaultOnboarding);
    setDailyLogs({});
    setPartnerAction(null);
    setPartnerLogUpdate(null);
    setProfileStats(null);
    setCycleComparison(null);
    setRecentChanges(null);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    localStorage.removeItem('lunacare_token');
    localStorage.removeItem('lunacare_user');
    localStorage.removeItem('lunacare_onboarding');
  };

  const updateOnboarding = async (data: Partial<OnboardingData>) => {
    const updated = { ...onboarding, ...data };
    const res = await api.onboarding.calibrate(updated);
    setOnboarding(res.onboarding);
    localStorage.setItem('lunacare_onboarding', JSON.stringify(res.onboarding));
    await refreshAnalytics();
  };

  const logDay = async (log: Omit<DailyLog, 'date'>, date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const dbPayload = {
      date: targetDate,
      mood: log.mood,
      sleep: log.sleep,
      energy: log.energy,
      stress: log.stress,
      symptoms: log.symptoms,
      hydration: log.hydration || 4,
      flowType: log.flowType || 'NONE',
      hrv: log.hrv,
    };
    
    await api.logs.save(dbPayload);

    setDailyLogs((prev) => ({
      ...prev,
      [targetDate]: {
        ...log,
        date: targetDate,
      },
    }));

    if (socketRef.current) {
      socketRef.current.emit('log:save', dbPayload);
    }
    
    await refreshAnalytics();
  };

  const deleteLog = async (date: string) => {
    await api.logs.delete(date);
    setDailyLogs((prev) => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
    await refreshAnalytics();
  };

  const duplicateLog = async (date: string) => {
    const res = await api.logs.duplicate(date);
    if (res.log) {
      setDailyLogs((prev) => ({
        ...prev,
        [date]: {
          date: res.log.date,
          mood: res.log.mood,
          sleep: res.log.sleep,
          energy: res.log.energy,
          stress: res.log.stress,
          symptoms: res.log.symptoms,
          hydration: res.log.hydration,
          flowType: res.log.flowType,
          hrv: res.log.hrv,
        }
      }));
    }
    await refreshAnalytics();
  };

  const triggerPartnerAction = (action: string) => {
    if (socketRef.current) {
      socketRef.current.emit('partner:active_action', { action });
    }
  };

  const updateProfileImage = (image: string) => {
    const updatedUser = { ...user, profileImage: image };
    setUser(updatedUser);
    localStorage.setItem('lunacare_user', JSON.stringify(updatedUser));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        onboarding,
        dailyLogs,
        partnerAction,
        partnerLogUpdate,
        profileStats,
        cycleComparison,
        recentChanges,
        isLoadingAnalytics,
        loginUser,
        registerUser,
        logoutUser,
        updateOnboarding,
        logDay,
        deleteLog,
        duplicateLog,
        triggerPartnerAction,
        updateProfileImage,
        refreshAnalytics,
        downloadReport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
