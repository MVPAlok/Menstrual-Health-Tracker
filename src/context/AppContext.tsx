import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  isLoggedIn: boolean;
}

export interface OnboardingData {
  lastPeriodDate: string; // ISO string or YYYY-MM-DD
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
  symptoms: string[]; // ['Cramps', 'Headache', 'Bloating', etc.]
  sleep: number; // 1 to 10
  energy: number; // 1 to 10
  stress: number; // 1 to 10
}

interface AppContextType {
  user: UserProfile;
  onboarding: OnboardingData;
  dailyLogs: Record<string, DailyLog>;
  loginUser: (name: string, email: string) => void;
  logoutUser: () => void;
  updateOnboarding: (data: Partial<OnboardingData>) => void;
  logDay: (log: Omit<DailyLog, 'date'>) => void;
}

const getDefaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
};

const defaultOnboarding: OnboardingData = {
  lastPeriodDate: getDefaultDate(),
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
    if (saved) {
      const parsed = JSON.parse(saved);
      // Force update to the 7-days-ago demo date if they haven't completed onboarding
      if (!parsed.onboardingCompleted) {
        parsed.lastPeriodDate = getDefaultDate();
      }
      return parsed;
    }
    return defaultOnboarding;
  });

  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>(() => {
    const saved = localStorage.getItem('lunacare_logs');
    if (saved) return JSON.parse(saved);
    // Seed some mock logs for standard dashboard visualization
    const today = new Date();
    const seed: Record<string, DailyLog> = {};
    const moods = ['Radiant', 'Balanced', 'Sensitive', 'Balanced', 'Radiant', 'Sensitive', 'Low Energy'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      seed[dateString] = {
        date: dateString,
        mood: moods[i % moods.length],
        symptoms: i === 3 ? ['Cramps'] : i === 5 ? ['Bloating'] : [],
        sleep: Math.floor(Math.random() * 3) + 6, // 6 to 9
        energy: Math.floor(Math.random() * 4) + 5, // 5 to 8
        stress: Math.floor(Math.random() * 3) + 3, // 3 to 5
      };
    }
    return seed;
  });

  useEffect(() => {
    localStorage.setItem('lunacare_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('lunacare_onboarding', JSON.stringify(onboarding));
  }, [onboarding]);

  useEffect(() => {
    localStorage.setItem('lunacare_logs', JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  const loginUser = (name: string, email: string) => {
    setUser({ name, email, isLoggedIn: true });
  };

  const logoutUser = () => {
    setUser({ name: '', email: '', isLoggedIn: false });
    setOnboarding(defaultOnboarding);
    localStorage.removeItem('lunacare_user');
    localStorage.removeItem('lunacare_onboarding');
    localStorage.removeItem('lunacare_logs');
  };

  const updateOnboarding = (data: Partial<OnboardingData>) => {
    setOnboarding((prev) => ({ ...prev, ...data }));
  };

  const logDay = (log: Omit<DailyLog, 'date'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDailyLogs((prev) => ({
      ...prev,
      [todayStr]: {
        ...log,
        date: todayStr,
      },
    }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        onboarding,
        dailyLogs,
        loginUser,
        logoutUser,
        updateOnboarding,
        logDay,
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
