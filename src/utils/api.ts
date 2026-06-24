const API_BASE_URL = 'http://localhost:5000/api';

export interface ApiError {
  error: string;
}

// Fetch helper with token handling
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('lunacare_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data as T;
}

// Map database onboarding model shape to frontend interface shape
export function mapDbOnboardingToFrontend(dbOnboarding: any) {
  if (!dbOnboarding) return null;
  return {
    lastPeriodDate: dbOnboarding.lastPeriodDate,
    cycleLength: dbOnboarding.cycleLength,
    periodLength: dbOnboarding.periodLength,
    healthGoals: dbOnboarding.healthGoals || [],
    lifestyle: {
      sleep: dbOnboarding.sleepQuality || 'Restorative',
      stress: dbOnboarding.stressLevel || 'Moderate',
      activity: dbOnboarding.activityLevel || 'Active',
      hydration: dbOnboarding.hydrationLevel || 'Average',
    },
    notifications: {
      period: dbOnboarding.notifyPeriod !== false,
      ovulation: dbOnboarding.notifyOvulation !== false,
      insights: dbOnboarding.notifyInsights !== false,
      wellnessTips: dbOnboarding.notifyWellnessTips === true,
    },
    onboardingCompleted: dbOnboarding.onboardingCompleted || false,
  };
}

export const api = {
  // Authentication
  auth: {
    register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  },
  // Onboarding
  onboarding: {
    get: () => request<any>('/onboarding').then(mapDbOnboardingToFrontend),
    calibrate: (body: any) => request<any>('/onboarding/calibrate', { method: 'POST', body: JSON.stringify(body) }).then(res => ({
      ...res,
      onboarding: mapDbOnboardingToFrontend(res.onboarding)
    })),
  },
  // Logs
  logs: {
    getRange: (start: string, end: string) => request<any[]>(`/logs/range?start=${start}&end=${end}`),
    save: (body: any) => request<any>('/logs', { method: 'POST', body: JSON.stringify(body) }),
  },
  // Predictions
  predictions: {
    getForecast: () => request<any>('/predictions/forecast'),
  },
  // Partner Syncing
  partner: {
    status: () => request<any>('/partner/status'),
    getCode: () => request<any>('/partner/code'),
    pair: (code: string) => request<any>('/partner/pair', { method: 'POST', body: JSON.stringify({ code }) }),
    unlink: () => request<any>('/partner/unlink', { method: 'POST' }),
  }
};
