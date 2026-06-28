const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    const error: any = new Error(data.error || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data as T;
}

// Special fetch helper for raw files (CSV/HTML)
async function requestRaw(endpoint: string, options: RequestInit = {}): Promise<{ blob: Blob; filename: string }> {
  const token = localStorage.getItem('lunacare_token');
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error: any = new Error(data.error || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let filename = 'lunacare_report';
  if (disposition && disposition.indexOf('attachment') !== -1) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }
  return { blob, filename };
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
    updateProfileImage: (image: string) => request<any>('/auth/profile-image', { method: 'PUT', body: JSON.stringify({ image }) }),
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
    delete: (date: string) => request<any>(`/logs/${date}`, { method: 'DELETE' }),
    duplicate: (date: string) => request<any>('/logs/duplicate', { method: 'POST', body: JSON.stringify({ date }) }),
  },
  // Predictions
  predictions: {
    getForecast: (offset?: number) => request<any>(`/predictions/forecast${offset !== undefined ? `?offset=${offset}` : ''}`),
    getProfileStats: () => request<any>('/predictions/profile-stats'),
    getCycleComparison: () => request<any>('/predictions/cycle-comparison'),
    getRecentChanges: () => request<any>('/predictions/recent-changes'),
    exportReport: (format: 'csv' | 'pdf') => requestRaw(`/predictions/export?format=${format}`),
  },
  // Partner Syncing
  partner: {
    status: () => request<any>('/partner/status'),
    getCode: () => request<any>('/partner/code'),
    pair: (code: string) => request<any>('/partner/pair', { method: 'POST', body: JSON.stringify({ code }) }),
    unlink: () => request<any>('/partner/unlink', { method: 'POST' }),
  },
  // Notifications
  notifications: {
    get: (params?: { category?: string; isRead?: boolean; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params) {
        if (params.category) q.append('category', params.category);
        if (params.isRead !== undefined) q.append('isRead', String(params.isRead));
        if (params.limit !== undefined) q.append('limit', String(params.limit));
        if (params.offset !== undefined) q.append('offset', String(params.offset));
      }
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request<any>(`/notifications${queryStr}`);
    },
    getUnread: () => request<any>('/notifications/unread'),
    create: (body: any) => request<any>('/notifications', { method: 'POST', body: JSON.stringify(body) }),
    markRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<any>('/notifications/read-all', { method: 'PATCH' }),
    delete: (id: string) => request<any>(`/notifications/${id}`, { method: 'DELETE' }),
    clear: () => request<any>('/notifications/clear', { method: 'DELETE' }),
    getPreferences: () => request<any>('/notification-preferences'),
    updatePreferences: (body: any) => request<any>('/notification-preferences', { method: 'PATCH', body: JSON.stringify(body) }),
    getVapidKey: () => request<any>('/notifications/vapid-key'),
    subscribePush: (subscription: any) => request<any>('/notifications/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) }),
    unsubscribePush: (endpoint: string) => request<any>('/notifications/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),
  }
};
