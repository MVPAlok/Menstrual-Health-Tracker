import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  Check,
  AlertTriangle,
  Activity,
  Heart
} from 'lucide-react';

const timezones = [
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
];

export const NotificationSettings: React.FC = () => {
  const { 
    notificationPreferences, 
    updatePreferences, 
    subscribeBrowserPush, 
    unsubscribeBrowserPush 
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<string>(
    'default'
  );

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  if (!notificationPreferences) {
    return (
      <div className="p-6 text-center text-xs font-bold text-secondary">
        Loading sanctuary configurations...
      </div>
    );
  }

  const handleToggle = async (key: string, currentValue: boolean) => {
    setLoading(true);
    try {
      await updatePreferences({ [key]: !currentValue });
      showSuccessIndicator();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    try {
      await updatePreferences({ preferredReminderTime: e.target.value });
      showSuccessIndicator();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    try {
      await updatePreferences({ timezone: e.target.value });
      showSuccessIndicator();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessIndicator = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handlePushSubscriptionChange = async () => {
    setLoading(true);
    setErrorMsg(null);
    if (notificationPreferences.browserPushEnabled) {
      await unsubscribeBrowserPush();
      setPermissionState(Notification.permission);
    } else {
      const ok = await subscribeBrowserPush();
      if (ok) {
        setPermissionState('granted');
      } else {
        setErrorMsg('Could not register browser push. Ensure notifications are allowed in browser settings and the server is fully deployed.');
      }
    }
    setLoading(false);
  };

  // Detect local timezone if none exists
  const autoDetectTimezone = async () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && notificationPreferences.timezone !== tz) {
      setLoading(true);
      await updatePreferences({ timezone: tz });
      setLoading(false);
      showSuccessIndicator();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header and save status */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-black text-primary uppercase tracking-wider">Notification Ecosystem</h4>
          <p className="text-[11px] text-secondary">Tune alert parameters for telemetry events, cycle phases, and AI models.</p>
        </div>
        {success && (
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-250 shadow-sm animate-fade-in">
            <Check className="w-3 h-3" /> Auto-Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: DELIVERY CHANNELS */}
        <div className="glass-card p-5 rounded-[1.5rem] border border-white/60 shadow-sm space-y-4">
          <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-outline/5 pb-2">
            <Activity className="w-3.5 h-3.5 text-primary" /> Delivery Channels
          </span>

          <div className="space-y-4">
            {/* In-App Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary block">In-App Sanctuary Stream</span>
                <span className="text-[10px] text-secondary">Live feed updates inside the top navigation bell.</span>
              </div>
              <button
                disabled={true} // In-app is always enabled for app integrity
                className="w-10 h-6 bg-primary/20 rounded-full p-1 cursor-not-allowed flex items-center justify-end"
              >
                <div className="w-4 h-4 bg-primary rounded-full" />
              </button>
            </div>

            {/* Desktop Push Notification Toggle */}
            <div className="flex items-center justify-between border-t border-outline/5 pt-3">
              <div>
                <span className="text-xs font-bold text-primary block">Browser Desktop Push Alerts</span>
                <span className="text-[10px] text-secondary">Receive real-time alerts even when the tab is in the background.</span>
              </div>
              <button
                onClick={handlePushSubscriptionChange}
                disabled={loading}
                className={`w-10 h-6 rounded-full p-1 transition-colors flex items-center ${
                  notificationPreferences.browserPushEnabled
                    ? 'bg-primary justify-end'
                    : 'bg-slate-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {permissionState === 'denied' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-250 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-[10px] text-amber-600 leading-normal font-bold">
                  Browser push permission is currently blocked. To enable, reset notifications permission in your browser address bar settings.
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-[10px] text-rose-600 leading-normal font-bold">
                  {errorMsg}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: NOTIFICATION TRIGGER CATEGORIES */}
        <div className="glass-card p-5 rounded-[1.5rem] border border-white/60 shadow-sm space-y-4">
          <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-outline/5 pb-2">
            <Heart className="w-3.5 h-3.5 text-primary" /> Trigger Categories
          </span>

          <div className="space-y-3">
            {/* Daily Reminders */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <span className="text-xs font-bold text-primary block">Daily Log Reminders</span>
                <span className="text-[10px] text-secondary">Morning and evening logs completion reminders.</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.dailyReminder}
                onChange={() => handleToggle('dailyReminder', notificationPreferences.dailyReminder)}
                className="rounded text-primary focus:ring-primary h-4 w-4 border-slate-350"
              />
            </label>

            {/* Cycle Alerts */}
            <label className="flex items-center justify-between cursor-pointer select-none border-t border-outline/5 pt-2.5">
              <div>
                <span className="text-xs font-bold text-primary block">Cycle Phase Notifications</span>
                <span className="text-[10px] text-secondary">Alerts for period commence and ovulation window thresholds.</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.cycleReminder}
                onChange={() => handleToggle('cycleReminder', notificationPreferences.cycleReminder)}
                className="rounded text-primary focus:ring-primary h-4 w-4 border-slate-350"
              />
            </label>

            {/* Hydration / Sleep / Stress Alerts */}
            <label className="flex items-center justify-between cursor-pointer select-none border-t border-outline/5 pt-2.5">
              <div>
                <span className="text-xs font-bold text-primary block">Health Telemetry Alerts</span>
                <span className="text-[10px] text-secondary">Alerts for high stress, hydration deficits, and low sleep.</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.hydrationReminder}
                onChange={() => {
                  const val = notificationPreferences.hydrationReminder;
                  updatePreferences({
                    hydrationReminder: !val,
                    sleepReminder: !val,
                    stressReminder: !val
                  });
                  showSuccessIndicator();
                }}
                className="rounded text-primary focus:ring-primary h-4 w-4 border-slate-350"
              />
            </label>

            {/* AI Insights */}
            <label className="flex items-center justify-between cursor-pointer select-none border-t border-outline/5 pt-2.5">
              <div>
                <span className="text-xs font-bold text-primary block">AI Prediction Reports</span>
                <span className="text-[10px] text-secondary">Insights, hormone models updates, and pattern discoveries.</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.insightNotification}
                onChange={() => handleToggle('insightNotification', notificationPreferences.insightNotification)}
                className="rounded text-primary focus:ring-primary h-4 w-4 border-slate-350"
              />
            </label>

            {/* Achievement Alerts */}
            <label className="flex items-center justify-between cursor-pointer select-none border-t border-outline/5 pt-2.5">
              <div>
                <span className="text-xs font-bold text-primary block">Streaks & Badges Unlocks</span>
                <span className="text-[10px] text-secondary">Notifications when unlocking Consistency badges or streaks.</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.achievementNotification}
                onChange={() => handleToggle('achievementNotification', notificationPreferences.achievementNotification)}
                className="rounded text-primary focus:ring-primary h-4 w-4 border-slate-350"
              />
            </label>
          </div>
        </div>

        {/* SECTION 3: TIME & REGION SCHEDULING */}
        <div className="glass-card p-5 rounded-[1.5rem] border border-white/60 shadow-sm md:col-span-2 space-y-4">
          <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-outline/5 pb-2">
            <Clock className="w-3.5 h-3.5 text-primary" /> Delivery Scheduler
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preferred Delivery Time */}
            <div>
              <label className="text-[10px] font-extrabold text-primary tracking-wider uppercase block mb-1">Preferred Time</label>
              <div className="relative">
                <select
                  value={notificationPreferences.preferredReminderTime}
                  onChange={handleTimeChange}
                  disabled={loading}
                  className="w-full text-xs font-bold bg-white/50 border border-white/60 p-2.5 rounded-xl text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="07:00">Morning (07:00)</option>
                  <option value="08:00">Morning (08:00)</option>
                  <option value="09:00">Morning (09:00)</option>
                  <option value="12:00">Afternoon (12:00)</option>
                  <option value="14:00">Afternoon (14:00)</option>
                  <option value="17:00">Evening (17:00)</option>
                  <option value="19:00">Evening (19:00)</option>
                  <option value="20:00">Night (20:00)</option>
                  <option value="21:00">Night (21:00)</option>
                </select>
              </div>
            </div>

            {/* Timezone Selection */}
            <div>
              <label className="text-[10px] font-extrabold text-primary tracking-wider uppercase block mb-1 flex justify-between items-center">
                User Region
                <button
                  onClick={autoDetectTimezone}
                  className="text-[9px] font-black text-primary hover:opacity-85 hover:underline"
                  title="Detect browser local timezone"
                >
                  Auto-Detect
                </button>
              </label>
              <div className="relative">
                <select
                  value={notificationPreferences.timezone}
                  onChange={handleTimezoneChange}
                  disabled={loading}
                  className="w-full text-xs font-bold bg-white/50 border border-white/60 p-2.5 rounded-xl text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                  {!timezones.find(t => t.value === notificationPreferences.timezone) && (
                    <option value={notificationPreferences.timezone}>{notificationPreferences.timezone}</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
