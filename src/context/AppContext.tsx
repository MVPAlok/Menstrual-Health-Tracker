import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, mapDbOnboardingToFrontend } from '../utils/api';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
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

interface AppContextType {
  user: UserProfile;
  onboarding: OnboardingData;
  dailyLogs: Record<string, DailyLog>;
  partnerAction: { partnerId: string; action: string } | null;
  partnerLogUpdate: { partnerId: string; date: string; mood: string; symptoms: string[] } | null;
  loginUser: (firstName: string, lastName: string, password: string) => Promise<any>;
  registerUser: (firstName: string, lastName: string, password: string) => Promise<any>;
  logoutUser: () => void;
  updateOnboarding: (data: Partial<OnboardingData>) => Promise<void>;
  logDay: (log: Omit<DailyLog, 'date'>) => Promise<void>;
  triggerPartnerAction: (action: string) => void;
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
  
  const socketRef = useRef<Socket | null>(null);

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

    const socket = io('http://localhost:5000', {
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
    });

    socket.on('partner:log_update', (data: any) => {
      setPartnerLogUpdate(data);
      // Auto clear partner log update banner after 8s
      setTimeout(() => setPartnerLogUpdate(null), 8000);
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
        .catch(() => {
          // Token expired or invalid
          logoutUser();
        });
      fetchRecentLogs();
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
    // Fetch logs
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
    return res;
  };

  const logoutUser = () => {
    setUser({ name: '', email: '', isLoggedIn: false });
    setOnboarding(defaultOnboarding);
    setDailyLogs({});
    setPartnerAction(null);
    setPartnerLogUpdate(null);
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
  };

  const logDay = async (log: Omit<DailyLog, 'date'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Save to server
    const dbPayload = {
      date: todayStr,
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

    // Update local state
    setDailyLogs((prev) => ({
      ...prev,
      [todayStr]: {
        ...log,
        date: todayStr,
      },
    }));

    // Broadcast update via WebSockets
    if (socketRef.current) {
      socketRef.current.emit('log:save', dbPayload);
    }
  };

  const triggerPartnerAction = (action: string) => {
    if (socketRef.current) {
      socketRef.current.emit('partner:active_action', { action });
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        onboarding,
        dailyLogs,
        partnerAction,
        partnerLogUpdate,
        loginUser,
        registerUser,
        logoutUser,
        updateOnboarding,
        logDay,
        triggerPartnerAction,
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
