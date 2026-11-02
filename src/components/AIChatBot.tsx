import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
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
  AlertCircle
} from 'lucide-react';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

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

// Editorial, clean Markdown renderer matching NariCare's typography
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-slate-800 dark:text-slate-100 font-normal">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Blockquote / Medical note
        if (trimmed.startsWith('>')) {
          const content = trimmed.replace(/^>\s*/, '');
          return (
            <div 
              key={idx} 
              className="pl-3 py-1 my-1.5 border-l-2 border-primary/40 bg-rose-50/50 dark:bg-rose-950/20 rounded-r text-[12px] text-slate-700 dark:text-slate-300 italic"
            >
              <RenderInline text={content} />
            </div>
          );
        }

        // Bullet list item
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-2 shrink-0" />
              <div className="flex-1">
                <RenderInline text={content} />
              </div>
            </div>
          );
        }

        // Section Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-semibold text-slate-900 dark:text-white text-[13px] pt-1.5 text-primary">
              <RenderInline text={trimmed.substring(4)} />
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-semibold text-slate-900 dark:text-white text-sm pt-1.5">
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
          return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i} className="italic text-slate-700 dark:text-slate-300">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-primary font-mono text-[11px]">
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

      // Graceful, calm health assistant error with Retry action
      const errorMsg: ChatMessageItem = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: 'Nari AI is temporarily unavailable. Please try again shortly.',
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
    // Remove the error message from the feed before retrying
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

  // Adjust textarea height dynamically
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

  // Personalized user greeting
  const userFirstName = user?.name ? user.name.split(' ')[0] : 'there';

  // Editorial suggested prompts
  const suggestedPrompts = [
    { label: "Understand my current cycle", prompt: "What phase of my cycle am I in right now, and what should I understand about it?" },
    { label: "Explore my health insights", prompt: "Can you give me an overview of my health insights and recent biometric trends?" },
    { label: "Help me log today's symptoms", prompt: "Help me log today's symptoms, mood, and wellness metrics." },
  ];

  return (
    <>
      {/* ═══════════════ RESTRAINED FLOATING LAUNCHER ═══════════════ */}
      {!isOpen && (
        <div className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-40">
          <motion.button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-primary text-white shadow-[0_8px_24px_rgba(165,53,86,0.22)] hover:shadow-[0_12px_28px_rgba(165,53,86,0.3)] transition-all duration-300 border border-white/20 select-none cursor-pointer"
            aria-label="Open Nari AI health companion"
          >
            {/* Small NariCare Mark */}
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>

            {/* Label */}
            <span className="text-xs font-semibold tracking-wide">
              Nari AI
            </span>

            {/* Subtle Availability Indicator */}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </motion.button>
        </div>
      )}

      {/* ═══════════════ REFINED CHAT WINDOW ═══════════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '52px' : undefined
            }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed z-50 overflow-hidden bg-[#fffefe]/98 dark:bg-slate-900/98 backdrop-blur-xl border border-rose-100/80 dark:border-slate-800 shadow-[0_20px_50px_rgba(165,53,86,0.08)] flex flex-col transition-all duration-200 ${
              isMinimized
                ? 'bottom-24 right-4 sm:bottom-8 sm:right-8 w-[280px] rounded-xl h-[52px]'
                : 'bottom-20 right-2 sm:bottom-24 sm:right-8 w-[calc(100vw-16px)] sm:w-[375px] h-[540px] max-h-[82vh] rounded-2xl'
            }`}
          >
            {/* ───── Header ───── */}
            <div className="px-4 py-3 bg-surface-container-lowest dark:bg-slate-900 border-b border-rose-100/60 dark:border-slate-800 flex items-center justify-between select-none shrink-0">
              <div className="flex items-center gap-2.5">
                {/* Small Nari AI identity mark */}
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-xs leading-none">
                      Nari AI
                    </h3>
                    {/* Subtle Availability indicator */}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Online" />
                  </div>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5">
                    Personal Health Companion
                    {activeCycleSnapshot?.currentPhase && (
                      <span className="capitalize text-primary/80"> • {activeCycleSnapshot.currentPhase}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5 text-slate-400">
                {!isMinimized && messages.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    title="Clear conversation"
                    className="p-1.5 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Minimize / Expand Button */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Expand" : "Minimize"}
                  className="p-1.5 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
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
                  className="bg-rose-50/90 dark:bg-rose-950/40 border-b border-rose-100 px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 shrink-0"
                >
                  <span>Clear conversation history?</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleClearHistory}
                      className="px-2 py-0.5 bg-primary hover:bg-primary/90 text-white rounded text-[10px] font-semibold transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-0.5 text-slate-500 hover:text-slate-700 text-[10px] transition"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ───── Body / Message Stream ───── */}
            {!isMinimized && (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 scroll-smooth custom-scrollbar">
                {/* ───── Thoughtful Welcome State ───── */}
                {messages.length === 0 && (
                  <div className="py-3 px-1 text-left">
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1.5">
                      Hello {userFirstName},
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      I'm Nari AI, your personal health companion. I can help you understand your cycle patterns, explore your wellness logs, and make sense of your health insights.
                    </p>

                    {/* Compact Suggested Prompts */}
                    <div className="mt-5 space-y-1.5">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                        Suggested Inquiries
                      </span>
                      {suggestedPrompts.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(s.prompt)}
                          className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-rose-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 hover:border-primary/30 transition-all text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between group shadow-2xs"
                        >
                          <span>{s.label}</span>
                          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:translate-x-0.5 transition" />
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
                            ? 'max-w-[85%] rounded-2xl rounded-tr-xs px-3.5 py-2.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-100/90 dark:border-rose-900/40 text-slate-800 dark:text-slate-100 text-[13px] leading-relaxed'
                            : msg.isError
                            ? 'max-w-[88%] rounded-2xl rounded-tl-xs px-3.5 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 text-slate-700 dark:text-slate-300 text-xs leading-relaxed shadow-2xs'
                            : 'max-w-[88%] rounded-2xl rounded-tl-xs px-4 py-3 bg-[#fbf9f9] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-[13px] leading-relaxed shadow-2xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : msg.isError ? (
                          // Calm, refined error state with Retry action
                          <div>
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-slate-600 dark:text-slate-300 text-xs">
                                  {msg.content}
                                </p>
                                {msg.failedQuery && (
                                  <button
                                    onClick={() => handleRetry(msg.failedQuery)}
                                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-primary text-[11px] font-semibold hover:bg-rose-50 dark:hover:bg-slate-600 transition shadow-2xs"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    <span>Retry</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Standard AI Message
                          <div>
                            <FormattedMessage text={msg.content} />

                            {/* Discreet footer with Copy action */}
                            <div className="mt-2.5 pt-1.5 border-t border-slate-200/40 dark:border-slate-700/30 flex items-center justify-between text-[10px] text-slate-400">
                              <span>
                                {msg.contextSnapshot?.currentPhase ? (
                                  <span className="capitalize">{msg.contextSnapshot.currentPhase} Phase</span>
                                ) : (
                                  'Nari Care Intelligence'
                                )}
                              </span>

                              <button
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="inline-flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                title="Copy response"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600 font-medium">Copied</span>
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

                      {/* Outlined suggested follow-up chips */}
                      {isLatestAssistant && !msg.isError && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                          {msg.suggestedFollowUps.map((chip, chipIdx) => (
                            <button
                              key={chipIdx}
                              onClick={() => handleSendMessage(chip)}
                              disabled={isLoading}
                              className="text-left px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/40 text-[11px] font-medium transition shadow-2xs flex items-center gap-1"
                            >
                              <span>{chip}</span>
                              <CornerDownLeft className="w-2.5 h-2.5 text-slate-300 group-hover:text-primary transition" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Calm Typing Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-tl-xs bg-[#fbf9f9] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 max-w-[120px] shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse [animation-delay:0.4s]" />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* ───── Bottom Composer ───── */}
            {!isMinimized && (
              <div className="p-3 bg-surface-container-lowest dark:bg-slate-900 border-t border-rose-100/60 dark:border-slate-800 shrink-0">
                <div className="flex items-end gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={inputPrompt}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Nari AI about your cycle or wellness..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent border-none text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0 resize-none py-1 max-h-24 leading-relaxed"
                  />

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputPrompt.trim() || isLoading}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
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
                  <span>Confidential health companion</span>
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
