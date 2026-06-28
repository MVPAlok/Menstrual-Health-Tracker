import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Trash2, 
  Check, 
  Search, 
  Sparkles, 
  Calendar, 
  Activity, 
  Award, 
  Shield, 
  Edit3, 
  X,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'DAILY_REMINDERS':
      return <Edit3 className="w-4 h-4 text-primary" />;
    case 'CYCLE_NOTIFICATIONS':
      return <Calendar className="w-4 h-4 text-pink-500" />;
    case 'HEALTH_NOTIFICATIONS':
      return <Activity className="w-4 h-4 text-rose-500" />;
    case 'AI_NOTIFICATIONS':
      return <Sparkles className="w-4 h-4 text-indigo-500" />;
    case 'ACHIEVEMENT_NOTIFICATIONS':
      return <Award className="w-4 h-4 text-amber-500" />;
    case 'SYSTEM_NOTIFICATIONS':
      return <Shield className="w-4 h-4 text-teal-500" />;
    default:
      return <Bell className="w-4 h-4 text-slate-400" />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'DAILY_REMINDERS':
      return 'Reminders';
    case 'CYCLE_NOTIFICATIONS':
      return 'Cycles';
    case 'HEALTH_NOTIFICATIONS':
      return 'Biometrics';
    case 'AI_NOTIFICATIONS':
      return 'AI Core';
    case 'ACHIEVEMENT_NOTIFICATIONS':
      return 'Badges';
    case 'SYSTEM_NOTIFICATIONS':
      return 'System';
    default:
      return 'Alerts';
  }
};

const timeAgo = (dateStr: string) => {
  const now = new Date();
  const past = new Date(dateStr);
  const ms = now.getTime() - past.getTime();
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (secs < 60) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const NotificationCenter: React.FC = () => {
  const { 
    notificationsList, 
    unreadCount, 
    markNotificationRead, 
    markAllNotificationsRead, 
    deleteNotification, 
    clearNotifications 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const categories = ['ALL', 'DAILY_REMINDERS', 'CYCLE_NOTIFICATIONS', 'HEALTH_NOTIFICATIONS', 'AI_NOTIFICATIONS', 'ACHIEVEMENT_NOTIFICATIONS', 'SYSTEM_NOTIFICATIONS'];

  // Filter list locally
  const filteredNotifications = notificationsList.filter(n => {
    const matchesTab = activeTab === 'ALL' || n.category === activeTab;
    const matchesSearch = searchQuery === '' || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="relative z-30" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center relative bg-white/40 hover:bg-white/60 border border-white/60 transition-all shadow-sm select-none"
      >
        <Bell className="w-5 h-5 text-primary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-primary text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border border-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Volumetric Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-[-50px] sm:right-0 mt-3 w-[calc(100vw-20px)] max-w-[360px] sm:w-96 sm:max-w-none rounded-3xl border border-slate-200 shadow-[0_24px_50px_rgba(165,53,86,0.18)] bg-white overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[500px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-primary" />
                <span className="font-extrabold text-primary text-xs uppercase tracking-wider">Sanctuary Stream</span>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[9px] font-black text-primary hover:opacity-80 uppercase tracking-widest flex items-center gap-0.5"
                    title="Mark all as read"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Read All
                  </button>
                )}
                {notificationsList.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[9px] font-black text-red-500 hover:opacity-80 uppercase tracking-widest flex items-center gap-0.5"
                    title="Clear all history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Local Search Bar */}
            <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-secondary" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-primary placeholder-secondary focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-secondary hover:text-primary">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div data-lenis-prevent="true" className="flex gap-1.5 overflow-x-auto p-2 border-b border-slate-100 bg-slate-50/50 no-scrollbar select-none">
              {categories.map((cat) => {
                const isActive = activeTab === cat;
                const count = cat === 'ALL' 
                  ? notificationsList.length 
                  : notificationsList.filter(n => n.category === cat).length;

                if (count === 0 && cat !== 'ALL') return null;

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-slate-200/50 text-secondary hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : getCategoryLabel(cat)} ({count})
                  </button>
                );
              })}
            </div>

            {/* Notifications Scrollable List */}
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto max-h-[360px] divide-y divide-slate-100 custom-scrollbar">
              <AnimatePresence initial={false}>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => {
                    const isUnread = !notification.isRead;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-3.5 relative transition-all flex gap-3 border-l-2 ${
                          isUnread
                            ? 'bg-primary/5 border-primary'
                            : 'bg-transparent border-transparent'
                        }`}
                      >
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-full bg-white/65 flex items-center justify-center shadow-inner shrink-0 mt-0.5">
                          {getCategoryIcon(notification.category)}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[11px] font-extrabold text-primary ${isUnread ? 'font-black' : ''}`}>
                              {notification.title}
                            </span>
                            {notification.priority === 'HIGH' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" title="High Priority" />
                            )}
                          </div>
                          <p className="text-[10px] text-secondary leading-normal mt-0.5 break-words">
                            {notification.message}
                          </p>
                          <span className="text-[8px] font-bold text-slate-400 mt-1 block uppercase">
                            {timeAgo(notification.createdAt)} • {getCategoryLabel(notification.category)}
                          </span>
                        </div>

                        {/* Hover Actions Panel */}
                        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity bg-white/90 p-0.5 rounded-full border border-slate-100 shadow-sm">
                          {isUnread && (
                            <button
                              onClick={() => markNotificationRead(notification.id)}
                              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-slate-100 text-primary transition-all"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-slate-100 text-red-500 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2 select-none">
                    <div className="w-12 h-12 rounded-full bg-slate-150 flex items-center justify-center text-slate-350">
                      <Bell className="w-5 h-5" />
                    </div>
                    <span className="block text-xs font-extrabold text-primary uppercase tracking-wider">Sanctuary is Quiet</span>
                    <span className="block text-[10px] text-secondary leading-normal max-w-[200px] mx-auto">No notifications found matching your search.</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
