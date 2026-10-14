import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  User,
  Minimize2,
  Maximize2,
} from 'lucide-react';

// AI Agent logo — matches the provided brand logo
const AIAgentLogo: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Circular arc background */}
    <path d="M18 52 C18 30 36 14 58 14 C72 14 84 21 91 32" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M10 62 C12 82 30 96 52 96 C70 96 85 86 92 70" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" fill="none" />
    {/* Network nodes */}
    <circle cx="22" cy="28" r="7" fill="#1e3a5f" />
    <circle cx="22" cy="72" r="7" fill="#1e3a5f" />
    <circle cx="60" cy="86" r="7" stroke="#3b82f6" strokeWidth="3" fill="white" />
    {/* Connector lines */}
    <line x1="22" y1="35" x2="42" y2="50" stroke="#1e3a5f" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="22" y1="65" x2="42" y2="50" stroke="#1e3a5f" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="48" y1="52" x2="58" y2="80" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
    {/* Paper-plane arrow */}
    <polygon points="44,22 90,44 58,56 44,22" fill="#0ea5e9" />
    <polygon points="44,22 58,56 50,34 44,22" fill="#06b6d4" />
    <polygon points="58,56 90,44 72,72 58,56" fill="#2563eb" />
  </svg>
);
import { CareerProfile } from '../../types/index.js';

interface FloatingAICopilotProps {
  profile: CareerProfile;
  onSendMessage: (
    message: string,
    history: { role: 'user' | 'assistant'; text: string }[]
  ) => Promise<string>;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
}

export const FloatingAICopilot: React.FC<FloatingAICopilotProps> = ({
  profile,
  onSendMessage,
  onNavigate,
  lang,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const isAr = lang === 'ar';

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: isAr
        ? `مرحباً ${profile.fullName}! أنا مساعدك المهني الذكي المباشر. كيف يمكنني مساعدتك الآن؟ يمكنك سؤالي عن السيرة الذاتية، الوظائف، أو الاستعداد للمقابلات.`
        : `Hi ${profile.fullName}! I'm your on-demand CareerPilot AI Copilot. How can I assist you right now?`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const newHistory = [...messages, { role: 'user' as const, text }];
    setMessages(newHistory);
    setInputMessage('');
    setIsSending(true);

    try {
      const reply = await onSendMessage(text, messages);
      setMessages([...newHistory, { role: 'assistant' as const, text: reply }]);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      setMessages([
        ...newHistory,
        {
          role: 'assistant' as const,
          text: isAr
            ? 'واجهت صعوبة في الاتصال بالمساعد الذكي حالياً. يرجى المحاولة لاحقاً.'
            : 'Could not connect to AI Assistant. Please try again later.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const quickChips = isAr
    ? [
        'كيف أرفع نسبة ATS لسيرتي؟',
        'ما هي أفضل وظيفة تناسبني؟',
        'نصيحة سريعة لمقابلة عمل',
        'ما الإجراء الأفضل التالي؟',
      ]
    : [
        'How to boost my CV ATS score?',
        'What job best fits my skills?',
        'Quick tip for interview prep',
        'What is my Next Best Action?',
      ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-20 md:bottom-8 ${
            isAr ? 'left-5' : 'right-5'
          } z-40 p-2.5 bg-white hover:bg-blue-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group ring-2 ring-blue-100 hover:ring-blue-300 hover:scale-105 border border-blue-100`}
          title={isAr ? 'المساعد المهني الذكي' : 'CareerPilot AI Copilot'}
        >
          <div className="relative">
            <AIAgentLogo size={34} />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <span className="text-xs font-semibold text-slate-700 max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:pr-1 transition-all duration-300">
            {isAr ? 'مساعد AI' : 'AI Agent'}
          </span>
        </button>
      )}

      {/* Floating Chat Drawer/Window */}
      {isOpen && (
        <div
          className={`fixed bottom-20 md:bottom-8 ${
            isAr ? 'left-3 sm:left-5' : 'right-3 sm:right-5'
          } z-50 w-[calc(100vw-1.5rem)] sm:w-[410px] max-w-[410px] bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[520px] max-h-[calc(100dvh-6rem)] sm:max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="p-3 bg-white border-b border-neutral-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <AIAgentLogo size={30} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5 text-slate-900">
                  <span>{isAr ? 'المساعد المهني الفوري' : 'CareerPilot AI Agent'}</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {profile.targetRole || 'Career Operating System'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-neutral-400">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-slate-700 hover:bg-neutral-100 rounded-lg transition-colors"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-slate-700 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-[#fafafa]">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="shrink-0 mt-0.5">
                        <AIAgentLogo size={22} />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-neutral-900 text-white rounded-br-xs'
                          : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '').replace(/\*/g, '')}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-center gap-2 text-neutral-500 text-xs italic">
                    <div className="animate-pulse"><AIAgentLogo size={18} /></div>
                    <span>{isAr ? 'المساعد يفكر...' : 'CareerPilot is thinking...'}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div className="shrink-0 p-2 border-t border-neutral-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    disabled={isSending}
                    className="text-[11px] font-medium px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="shrink-0 p-3 border-t border-neutral-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isAr ? 'اسأل المساعد أي سؤال مهني...' : 'Ask your AI copilot anything...'
                    }
                    className="flex-1 text-xs p-2.5 border border-neutral-200 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputMessage.trim()}
                    className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-colors disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
