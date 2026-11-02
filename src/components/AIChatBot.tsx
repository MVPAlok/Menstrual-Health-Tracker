import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  X, 
  Trash2, 
  Copy, 
  Check, 
  CornerDownLeft, 
  ChevronRight, 
  Minus,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

// ═══════════════ SOPHISTICATED ROBOTIC AVATAR ICON ═══════════════
export const RoboticIcon: React.FC<{ 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string; 
  animated?: boolean;
}> = ({ 
  size = 'md', 
  className = '',
  animated = false 
}) => {
  const dim = size === 'sm' ? 18 : size === 'md' ? 24 : size === 'lg' ? 32 : 44;
  
  return (
    <svg 
      width={dim} 
      height={dim} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Robotic AI Avatar"
    >
      <defs>
        {/* Sleek Rose-Burgundy Chassis Gradient matching NariCare */}
        <linearGradient id="nariBotChassis" x1="6" y1="8" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B3395B" />
          <stop offset="0.55" stopColor="#8E2543" />
          <stop offset="1" stopColor="#63142A" />
        </linearGradient>

        {/* High-tech Dark Optic Visor */}
        <linearGradient id="nariBotVisor" x1="10" y1="16" x2="38" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>

        {/* Glowing Cyan Optical Sensor Eyes */}
        <radialGradient id="nariBotEyeCyan" cx="0.4" cy="0.4" r="0.6">
          <stop stopColor="#A5F3FC" />
          <stop offset="0.4" stopColor="#22D3EE" />
          <stop offset="0.85" stopColor="#0891B2" />
          <stop offset="1" stopColor="#0E7490" />
        </radialGradient>

        {/* Metallic Bevel Highlight */}
        <linearGradient id="nariBotHighlight" x1="12" y1="10" x2="36" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FECDD3" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FDA4AF" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      
      {/* ─── Cybernetic Antenna & Optical Beacon ─── */}
      <line x1="24" y1="3" x2="24" y2="9" stroke="#9E2A4B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="3.5" r="2.5" fill="#10B981" />
      {animated && (
        <circle cx="24" cy="3.5" r="4.5" stroke="#34D399" strokeWidth="1" strokeOpacity="0.75" className="animate-ping" />
      )}

      {/* ─── Left & Right Audio Receiver Nodes ─── */}
      <rect x="3" y="18" width="4" height="12" rx="2" fill="#6B182F" stroke="#FDA4AF" strokeWidth="0.75" />
      <rect x="41" y="18" width="4" height="12" rx="2" fill="#6B182F" stroke="#FDA4AF" strokeWidth="0.75" />
      
      {/* ─── Robotic Head Chassis ─── */}
      <rect x="7" y="9" width="34" height="29" rx="8" fill="url(#nariBotChassis)" stroke="#FDA4AF" strokeWidth="1.25" />
      {/* Top metallic bevel light */}
      <rect x="11" y="10.5" width="26" height="1.5" rx="0.75" fill="url(#nariBotHighlight)" />

      {/* ─── Optical Screen Visor ─── */}
      <rect x="11.5" y="16" width="25" height="13.5" rx="4.5" fill="url(#nariBotVisor)" stroke="#475569" strokeWidth="0.8" />

      {/* ─── Dual Optical Sensor Eyes with Glint ─── */}
      <g className={animated ? "animate-pulse" : ""}>
        {/* Left Sensor Eye */}
        <circle cx="18" cy="22.5" r="3.2" fill="url(#nariBotEyeCyan)" />
        <circle cx="17" cy="21.3" r="0.9" fill="#FFFFFF" opacity="0.9" />

        {/* Right Sensor Eye */}
        <circle cx="30" cy="22.5" r="3.2" fill="url(#nariBotEyeCyan)" />
        <circle cx="29" cy="21.3" r="0.9" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* ─── Audio Synthesizer Grill ─── */}
      <g opacity="0.75">
        <rect x="19" y="32" width="10" height="1.5" rx="0.75" fill="#FECDD3" />
        <rect x="21" y="34.5" width="6" height="1.2" rx="0.6" fill="#FECDD3" />
      </g>
    </svg>
  );
};

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  failedQuery?: string;
  suggestedFollowUps?: string[];
  contextSnapshot?: {
    currentCycleDay?: number;
    currentPhase?: string;
    nextCycleDate?: string;
    daysRemaining?: number;
  };
  createdAt?: string;
}

// High-contrast, clear editorial Markdown renderer
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-100 font-normal">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Blockquote / Medical callout
        if (trimmed.startsWith('>')) {
          const content = trimmed.replace(/^>\s*/, '');
          return (
            <div 
              key={idx} 
              className="pl-3.5 py-2 my-2 border-l-3 border-primary bg-rose-50/80 dark:bg-rose-950/40 rounded-r-lg text-[13px] text-slate-800 dark:text-slate-200 italic font-medium shadow-2xs"
            >
              <RenderInline text={content} />
            </div>
          );
        }

        // Bullet list item
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 ring-2 ring-rose-200 dark:ring-rose-900" />
              <div className="flex-1 text-slate-800 dark:text-slate-100">
                <RenderInline text={content} />
              </div>
            </div>
          );
        }

        // Section Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-primary text-[14px] pt-2">
              <RenderInline text={trimmed.substring(4)} />
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-bold text-slate-900 dark:text-white text-[15px] pt-2">
              <RenderInline text={trimmed.replace(/^#+\s*/, '')} />
            </h3>
          );
        }

        // Standard paragraph line
        return (
          <p key={idx}>
            <RenderInline text={line} />
          </p>
        );
      })}
    </div>
  );
};

// Inline parser for bold, italic, code
const RenderInline: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i} className="italic text-slate-800 dark:text-slate-200">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-slate-800 text-primary font-mono text-[12px] font-bold border border-rose-200 dark:border-slate-700">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export const AIChatBot: React.FC = () => {
  const { user, refreshAnalytics } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeCycleSnapshot, setActiveCycleSnapshot] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [messages, isOpen, isMinimized]);

  // Robust Native Wheel Scroll Handler (isolates scroll from Lenis and ensures effortless scrolling)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Always stop propagation so parent page / Lenis never captures this event
      e.stopPropagation();

      const { scrollTop, scrollHeight, clientHeight } = el;
      const isScrollable = scrollHeight > clientHeight;
      if (!isScrollable) return;

      const canScrollUp = scrollTop > 0;
      const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;

      // When the user can scroll, update scrollTop directly and prevent page jump
      if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
        el.scrollTop += e.deltaY;
        e.preventDefault();
      }
    };

    // Attach with passive: false so we can preventDefault when needed
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, isMinimized]);

  // Load persistent chat history from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const res = await api.chat.getHistory();
        if (isMounted && res?.messages) {
          setMessages(res.messages);
          const lastAssistant = [...res.messages].reverse().find(m => m.role === 'assistant' && m.contextSnapshot);
          if (lastAssistant?.contextSnapshot) {
            setActiveCycleSnapshot(lastAssistant.contextSnapshot);
          }
        }
      } catch (err) {
        console.warn('ℹ️ [Nari AI] History check notice:', err);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Optimistic user message
    const tempUserMsg: ChatMessageItem = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await api.chat.sendMessage(query);

      const assistantMsg: ChatMessageItem = {
        id: res.messageId || 'asst-' + Date.now(),
        role: 'assistant',
        content: res.reply,
        suggestedFollowUps: res.suggestedFollowUps || [],
        contextSnapshot: res.contextSnapshot,
        createdAt: res.createdAt || new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (res.contextSnapshot) {
        setActiveCycleSnapshot(res.contextSnapshot);
      }

      if (res.loggedData) {
        refreshAnalytics();
      }
    } catch (err: any) {
      console.error('❌ [Nari AI Service Error]:', err);

      let content = 'Nari AI is temporarily unavailable. Please try again shortly.';
      if (err.status === 401 || err.status === 403 || err.message?.includes('token') || err.message?.includes('signature') || err.message?.includes('Unauthorized')) {
        content = 'Your session has expired or authentication is needed. Please log out and sign back in to continue.';
      } else if (err.status === 429) {
        content = 'Too many requests. Please wait a moment before trying again.';
      }

      const errorMsg: ChatMessageItem = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content,
        isError: true,
        failedQuery: query,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (failedQuery?: string) => {
    if (!failedQuery) return;
    setMessages(prev => prev.filter(m => !m.isError));
    handleSendMessage(failedQuery);
  };

  const handleClearHistory = async () => {
    try {
      await api.chat.clearHistory();
      setMessages([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputPrompt(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const userFirstName = user?.name ? user.name.split(' ')[0] : 'there';

  const suggestedPrompts = [
    { 
      label: "Understand my current cycle", 
      desc: "Get deep clinical phase analysis & hormonal insight",
      prompt: "What phase of my cycle am I in right now, and what should I understand about it?" 
    },
    { 
      label: "Explore my health insights", 
      desc: "Analyze recent biometric patterns & cycle drift",
      prompt: "Can you give me an overview of my health insights and recent biometric trends?" 
    },
    { 
      label: "Help me log today's symptoms", 
      desc: "Converse naturally to log mood, flow, and symptoms",
      prompt: "Help me log today's symptoms, mood, and wellness metrics." 
    },
  ];

  const phaseFormatted = activeCycleSnapshot?.currentPhase 
    ? (activeCycleSnapshot.currentPhase.charAt(0).toUpperCase() + activeCycleSnapshot.currentPhase.slice(1)) 
    : 'Health Core';

  return (
    <>
      {/* ═══════════════ CIRCULAR FLOATING CHATBOT BUTTON ═══════════════ */}
      {!isOpen && (
        <div className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-40 select-none">
          <motion.button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.92 }}
            className="group relative w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-gradient-to-br from-[#9E2A4B] via-[#85223E] to-[#63142A] text-white shadow-[0_10px_28px_rgba(158,42,75,0.4)] hover:shadow-[0_16px_38px_rgba(158,42,75,0.55)] transition-all duration-300 border-2 border-white/30 dark:border-white/20 flex items-center justify-center cursor-pointer"
            aria-label="Open NariBot health companion"
          >
            {/* Ambient pulse halo */}
            <span className="absolute -inset-1 rounded-full bg-primary/25 blur-md group-hover:bg-primary/40 transition -z-10 animate-pulse" />

            {/* Centered Robotic Avatar */}
            <div className="group-hover:rotate-6 transition-transform duration-300 flex items-center justify-center">
              <RoboticIcon size="lg" animated={true} />
            </div>

            {/* Glowing Emerald Online Dot */}
            <span 
              className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center"
              title="NariBot Online"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>

            {/* Tooltip on hover */}
            <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg border border-white/10 backdrop-blur-sm hidden sm:block">
              Chat with NariBot
            </span>
          </motion.button>
        </div>
      )}

      {/* ═══════════════ REFINED ROBOTIC CHAT WINDOW ═══════════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="nari-chat-bot"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '58px' : undefined
            }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent="true"
            className={`fixed z-50 overflow-hidden bg-white dark:bg-[#121824] border border-rose-200/90 dark:border-slate-700/80 shadow-[0_24px_70px_rgba(158,42,75,0.18),0_4px_20px_rgba(0,0,0,0.06)] flex flex-col transition-all duration-200 ${
              isMinimized
                ? 'bottom-24 right-4 sm:bottom-8 sm:right-8 w-[300px] rounded-2xl h-[58px]'
                : 'bottom-20 right-2 sm:bottom-24 sm:right-8 w-[calc(100vw-16px)] sm:w-[415px] h-[590px] max-h-[85vh] rounded-2xl'
            }`}
          >
            {/* ───── Robotic Header ───── */}
            <div className="px-4 py-3 bg-gradient-to-r from-rose-50/70 via-white to-rose-50/40 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-rose-200/80 dark:border-slate-800 flex items-center justify-between select-none shrink-0">
              <div className="flex items-center gap-2.5">
                {/* Robotic AI Identity Mark */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 via-rose-100 to-primary/25 dark:from-rose-950/40 dark:to-slate-800 border border-primary/30 flex items-center justify-center text-primary shadow-2xs relative shrink-0">
                  <RoboticIcon size="md" animated={true} />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="System Online" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-[13.5px] leading-tight">
                    NariBot AI
                  </h3>
                  <p className="text-[10.5px] text-slate-600 dark:text-slate-400 font-medium leading-tight mt-0.5 flex items-center gap-1">
                    <span>Clinical Body Intelligence</span>
                    {activeCycleSnapshot?.currentPhase && (
                      <span className="capitalize text-primary font-bold">
                        • {phaseFormatted} (Day {activeCycleSnapshot.currentCycleDay || 1})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 text-slate-400">
                {!isMinimized && messages.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    title="Clear conversation"
                    className="p-1.5 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Minimize / Expand Button */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Expand" : "Minimize"}
                  className="p-1.5 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Clear Conversation Confirmation Strip */}
            <AnimatePresence>
              {showClearConfirm && !isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200/80 px-3.5 py-2 flex items-center justify-between text-[11.5px] text-slate-800 dark:text-slate-200 shrink-0 font-medium"
                >
                  <span>Clear entire conversation history?</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleClearHistory}
                      className="px-2.5 py-0.5 bg-primary hover:bg-primary/90 text-white rounded text-[10.5px] font-bold transition shadow-xs cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-0.5 text-slate-500 hover:text-slate-700 text-[10.5px] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ───── Body / Message Stream (With Lenis Isolation & Smooth Scrolling) ───── */}
            {!isMinimized && (
              <div 
                ref={scrollContainerRef}
                id="nari-chat-bot-messages"
                data-lenis-prevent="true"
                data-lenis-prevent-wheel="true"
                data-lenis-prevent-touch="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className="flex-1 min-h-0 chat-scroll-container px-4 py-3.5 space-y-4"
                style={{ overscrollBehavior: 'contain' }}
              >
                {/* ───── Thoughtful Robotic Welcome State ───── */}
                {messages.length === 0 && (
                  <div className="py-2 px-1 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/15 via-rose-50 to-primary/25 dark:from-rose-950/40 dark:to-slate-800 border border-primary/25 flex items-center justify-center text-primary mb-3.5 shadow-sm">
                      <RoboticIcon size="lg" animated={true} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        Hello {userFirstName},
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                        NariBot Ready
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      I'm NariBot, your personal health companion. I analyze your cycle trends, hormone phases, and daily wellness logs in real-time.
                    </p>

                    {/* Compact High-Visibility Suggested Inquiries */}
                    <div className="mt-5 space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                        Recommended Inquiries
                      </span>
                      {suggestedPrompts.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(s.prompt)}
                          className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-rose-50/80 dark:hover:bg-slate-750 border border-rose-200/90 dark:border-slate-700 hover:border-primary transition-all text-slate-800 dark:text-slate-100 flex items-center justify-between group shadow-2xs hover:shadow-xs active:scale-[0.99] cursor-pointer"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-slate-700/80 border border-rose-100 dark:border-slate-600 flex items-center justify-center text-primary group-hover:scale-105 transition shrink-0 mt-0.5">
                              <RoboticIcon size="sm" />
                            </div>
                            <div>
                              <p className="text-[12.5px] font-bold text-slate-900 dark:text-white group-hover:text-primary transition leading-snug">
                                {s.label}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {s.desc}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ───── Message Thread ───── */}
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  const isLatestAssistant = !isUser && index === messages.length - 1;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`transition-all ${
                          isUser
                            ? 'max-w-[85%] rounded-2xl rounded-tr-xs px-4 py-3 bg-gradient-to-r from-rose-100/90 to-rose-50/90 dark:from-rose-950/70 dark:to-rose-900/50 border border-rose-200/90 dark:border-rose-800/60 text-slate-900 dark:text-white text-[13.5px] font-medium leading-relaxed shadow-2xs'
                            : msg.isError
                            ? 'max-w-[88%] rounded-2xl rounded-tl-xs px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 text-slate-700 dark:text-slate-200 text-xs leading-relaxed shadow-2xs'
                            : 'max-w-[92%] rounded-2xl rounded-tl-xs px-4 py-3.5 bg-white dark:bg-slate-800/95 border border-rose-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[13.5px] leading-relaxed shadow-[0_4px_18px_rgba(158,42,75,0.06)]'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : msg.isError ? (
                          // Calm error state with Retry action
                          <div>
                            <div className="flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-slate-800 dark:text-slate-200 text-xs font-semibold">
                                  {msg.content}
                                </p>
                                {msg.failedQuery && (
                                  <button
                                    onClick={() => handleRetry(msg.failedQuery)}
                                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-primary text-xs font-bold hover:bg-rose-50 dark:hover:bg-slate-600 transition shadow-2xs cursor-pointer active:scale-95"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Retry Request</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Standard AI Message
                          <div>
                            {/* Robotic Header on AI Bubble */}
                            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-rose-100 dark:border-slate-700/60 text-[11px] font-semibold text-primary">
                              <div className="flex items-center gap-1.5">
                                <RoboticIcon size="sm" />
                                <span className="font-bold text-slate-900 dark:text-white">NariBot Intelligence</span>
                              </div>
                              <span className="text-[10px] font-bold text-primary bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 px-2 py-0.5 rounded-full capitalize">
                                {msg.contextSnapshot?.currentPhase ? `${msg.contextSnapshot.currentPhase} Phase` : 'Cycle Analysis'}
                              </span>
                            </div>

                            <FormattedMessage text={msg.content} />

                            {/* Discreet footer with Copy action */}
                            <div className="mt-3 pt-2 border-t border-rose-100/60 dark:border-slate-700/40 flex items-center justify-between text-[10.5px] text-slate-400">
                              <span className="font-medium">
                                {msg.contextSnapshot?.currentCycleDay ? `Cycle Day ${msg.contextSnapshot.currentCycleDay}` : 'Real-time telemetry'}
                              </span>

                              <button
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="inline-flex items-center gap-1 hover:text-primary transition font-bold cursor-pointer"
                                title="Copy response"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interactive High-Contrast Follow-Up Chips */}
                      {isLatestAssistant && !msg.isError && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="mt-3 space-y-1.5 w-full max-w-[92%]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            Suggested Follow-Ups
                          </span>
                          {msg.suggestedFollowUps.map((chip, chipIdx) => (
                            <button
                              key={chipIdx}
                              onClick={() => handleSendMessage(chip)}
                              disabled={isLoading}
                              className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-rose-50/90 dark:hover:bg-slate-750 border border-rose-200/90 dark:border-slate-700 hover:border-primary text-slate-800 dark:text-slate-100 hover:text-primary text-[12px] font-medium transition-all shadow-2xs hover:shadow-xs flex items-center justify-between gap-2.5 group cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-2">
                                <RoboticIcon size="sm" />
                                <span className="leading-snug font-semibold">{chip}</span>
                              </div>
                              <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary shrink-0 transition" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Robotic Thinking Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800/90 border border-rose-200/90 dark:border-slate-700 max-w-[150px] shadow-2xs">
                    <RoboticIcon size="sm" animated={true} />
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                      Processing...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-6" />
              </div>
            )}

            {/* ───── Bottom Composer ───── */}
            {!isMinimized && (
              <div className="p-3 bg-surface-container-lowest dark:bg-slate-900 border-t border-rose-200/80 dark:border-slate-800 shrink-0">
                <div className="flex items-end gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all shadow-2xs">
                  <textarea
                    ref={textareaRef}
                    value={inputPrompt}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask NariBot about your cycle, symptoms, or energy..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent border-none text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0 resize-none py-1 max-h-24 leading-relaxed font-normal"
                  />

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputPrompt.trim() || isLoading}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      inputPrompt.trim() && !isLoading
                        ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-xs active:scale-95'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed'
                    }`}
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RoboticIcon size="sm" />
                    <span>Personal health companion</span>
                  </span>
                  <span>Enter ↵ to send</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
