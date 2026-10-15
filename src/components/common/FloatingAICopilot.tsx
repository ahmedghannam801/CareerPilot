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
    <path d="M18 52 C18 30 36 14 58 14 C72 14 84 21 91 32" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M10 62 C12 82 30 96 52 96 C70 96 85 86 92 70" stroke="var(--primary-container)" strokeWidth="5" strokeLinecap="round" fill="none" />
    {/* Network nodes */}
    <circle cx="22" cy="28" r="7" fill="var(--on-primary)" />
    <circle cx="22" cy="72" r="7" fill="var(--on-primary)" />
    <circle cx="60" cy="86" r="7" stroke="var(--primary-container)" strokeWidth="3" fill="var(--surface-bright)" />
    {/* Connector lines */}
    <line x1="22" y1="35" x2="42" y2="50" stroke="var(--on-primary)" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="22" y1="65" x2="42" y2="50" stroke="var(--on-primary)" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="48" y1="52" x2="58" y2="80" stroke="var(--primary-container)" strokeWidth="3" strokeLinecap="round" />
    {/* Paper-plane arrow */}
    <polygon points="44,22 90,44 58,56 44,22" fill="var(--secondary)" />
    <polygon points="44,22 58,56 50,34 44,22" fill="var(--secondary-container)" />
    <polygon points="58,56 90,44 72,72 58,56" fill="var(--primary)" />
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
          type="button"
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-20 md:bottom-8 ${
            isAr ? 'left-5' : 'right-5'
          } z-40 p-2.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group hover:scale-105 border-hairline glass-surface`}
          style={{
            backgroundColor: 'var(--surface-container)',
            borderColor: 'var(--primary-container)',
          }}
          title={isAr ? 'المساعد المهني الذكي' : 'CareerPilot AI Copilot'}
        >
          <div className="relative">
            <AIAgentLogo size={34} />
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{
                backgroundColor: 'var(--tertiary)',
                borderColor: 'var(--surface-container)',
              }}
            />
          </div>
          <span className="text-micro font-semibold max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:pr-1 transition-all duration-300" style={{ color: 'var(--on-surface)' }}>
            {isAr ? 'مساعد AI' : 'AI Agent'}
          </span>
        </button>
      )}

      {/* Floating Chat Drawer/Window */}
      {isOpen && (
        <div
          className={`fixed bottom-20 md:bottom-8 ${
            isAr ? 'left-3 sm:left-5' : 'right-3 sm:right-5'
          } z-50 w-[calc(100vw-1.5rem)] sm:w-[410px] max-w-[410px] border-hairline rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 glass-surface ${
            isMinimized ? 'h-14' : 'h-[520px] max-h-[calc(100dvh-6rem)] sm:max-h-[85vh]'
          }`}
          style={{
            backgroundColor: 'var(--surface-container)',
            borderColor: 'var(--outline-variant)',
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-hairline flex items-center justify-between shrink-0" style={{ backgroundColor: 'var(--surface-container-high)', borderBottomColor: 'var(--outline-variant)' }}>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <AIAgentLogo size={30} />
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border"
                  style={{
                    backgroundColor: 'var(--tertiary)',
                    borderColor: 'var(--surface-container-high)',
                  }}
                />
              </div>
              <div>
                <h3 className="text-micro font-bold leading-tight flex items-center gap-1.5" style={{ color: 'var(--on-surface)' }}>
                  <span>{isAr ? 'المساعد المهني الفوري' : 'CareerPilot AI Agent'}</span>
                </h3>
                <p className="text-micro" style={{ color: 'var(--on-surface-variant)', fontSize: '10px' }}>
                  {profile.targetRole || 'Career Operating System'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1" style={{ color: 'var(--on-surface-variant)' }}>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  color: 'var(--on-surface-variant)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--on-surface)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-container)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--on-surface-variant)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  color: 'var(--on-surface-variant)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--on-surface)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-container)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--on-surface-variant)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-body-sm" style={{ backgroundColor: 'var(--surface-container-low)' }}>
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
                          ? 'rounded-br-xs'
                          : 'border-hairline rounded-bl-xs'
                      }`}
                      style={
                        msg.role === 'user'
                          ? {
                              backgroundColor: 'var(--primary-container)',
                              color: 'var(--on-primary-container)',
                            }
                          : {
                              backgroundColor: 'var(--surface-container-highest)',
                              borderColor: 'var(--outline-variant)',
                              color: 'var(--on-surface)',
                            }
                      }
                    >
                      <p className="whitespace-pre-wrap text-body-sm">{msg.text.replace(/\*\*/g, '').replace(/\*/g, '')}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)' }}>
                        <User className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-center gap-2 text-micro italic" style={{ color: 'var(--on-surface-variant)' }}>
                    <div className="animate-pulse"><AIAgentLogo size={18} /></div>
                    <span>{isAr ? 'المساعد يفكر...' : 'CareerPilot is thinking...'}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div className="shrink-0 p-2 border-t border-hairline flex items-center gap-1.5 overflow-x-auto no-scrollbar" style={{ backgroundColor: 'var(--surface-container-high)', borderTopColor: 'var(--outline-variant)' }}>
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip)}
                    disabled={isSending}
                    className="text-micro font-medium px-2.5 py-1 rounded-full transition-colors whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: 'var(--surface-container)',
                      color: 'var(--on-surface-variant)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-container-highest)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-container)';
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="shrink-0 p-3 border-t border-hairline" style={{ backgroundColor: 'var(--surface-container-high)', borderTopColor: 'var(--outline-variant)' }}>
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
                    className="flex-1 text-body-sm p-2.5 border-hairline rounded-xl outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--surface-container)',
                      color: 'var(--on-surface)',
                      borderColor: 'var(--outline-variant)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 1px var(--primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--outline-variant)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputMessage.trim()}
                    className="btn-ai p-2.5 rounded-xl transition-all disabled:opacity-40"
                    style={{
                      backgroundColor: 'var(--primary-container)',
                      color: 'var(--on-primary-container)',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = 'var(--primary)';
                        e.currentTarget.style.color = 'var(--on-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-container)';
                      e.currentTarget.style.color = 'var(--on-primary-container)';
                    }}
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
