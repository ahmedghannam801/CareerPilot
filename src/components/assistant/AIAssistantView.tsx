import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, Bot, Zap, Target, FileText, Mic } from 'lucide-react';
import { CareerProfile } from '../../types/index.js';

interface AIAssistantViewProps {
  profile: CareerProfile;
  onSendMessage: (
    message: string,
    history: { role: 'user' | 'assistant'; text: string }[]
  ) => Promise<string>;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  profile,
  onSendMessage,
  onNavigate,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: isAr
        ? `أهلاً بك يا ${profile.fullName} 👋\n\nأنا مساعدك المهني الذكي في CareerPilot. لدي تفاصيل مسارك المستهدف (${profile.targetRole})، ومهاراتك الحالية، وسجل تقديماتك.\n\nكيف يمكنني مساعدتك اليوم؟`
        : `Hello ${profile.fullName} 👋\n\nI'm your CareerPilot AI Advisor. I have full context on your target trajectory (${profile.targetRole}), verified skills, and application history.\n\nHow can I advance your career today?`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            ? `واجهت مشكلة في الاتصال: ${errText}`
            : `I encountered an issue connecting: ${errText}`,
        },
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const quickPrompts = isAr
    ? [
        { icon: '🎯', text: 'ما هي أفضل خطوتي التالية الآن؟' },
        { icon: '📄', text: 'هل سيرتي الذاتية قوية بما يكفي؟' },
        { icon: '💡', text: 'اقترح مشروعاً عملياً يرفع فرصي' },
        { icon: '🎤', text: 'نصيحة سريعة لمقابلة تقنية قادمة' },
      ]
    : [
        { icon: '🎯', text: 'What is my single most impactful next action?' },
        { icon: '📄', text: 'How should I improve my CV achievements?' },
        { icon: '💡', text: 'Suggest a practical micro-project for my track' },
        { icon: '🎤', text: 'Help me prep for a technical interview' },
      ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="card-surface p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-label-caps mb-1 flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'المساعد المهني الذكي' : 'Unified AI Career Advisor'}</span>
            </div>
            <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>
              {isAr ? 'محادثة المساعد الذكي' : 'CareerPilot AI Chat'}
            </h1>
            <p className="text-body-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
              {isAr
                ? 'استشارات وإجابات مباشرة لتطوير سيرتك وخطواتك المهنية'
                : 'Direct, context-aware guidance tailored to your profile and goals'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="badge-pill flex items-center gap-1.5" style={{
              background: 'var(--success-container)',
              color: 'var(--on-success-container)',
              border: '1px solid var(--success)'
            }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
              {isAr ? 'متصل' : 'Online'}
            </div>
            <span className="badge-pill truncate max-w-[180px]" style={{
              background: 'var(--surface-variant)',
              color: 'var(--on-surface-variant)'
            }}>
              {profile.fullName}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div
        className="surface-elevated border-hairline overflow-hidden flex flex-col"
        style={{
          height: '620px',
          borderRadius: '16px'
        }}
      >
        {/* Messages Scroll Area */}
        <div
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
          style={{
            background: 'var(--surface-dim)',
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--tertiary) 100%)',
                    color: 'var(--on-primary)',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                  }}
                >
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-body-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm'
                    : 'rounded-bl-sm'
                }`}
                style={
                  msg.role === 'user'
                    ? {
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--tertiary) 100%)',
                        color: 'var(--on-primary)',
                        boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
                      }
                    : {
                        background: 'var(--surface)',
                        border: '1px solid var(--outline-variant)',
                        color: 'var(--on-surface)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                      }
                }
              >
                <div className="whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '').replace(/\*/g, '')}</div>
              </div>

              {msg.role === 'user' && (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: 'var(--primary-container)',
                    color: 'var(--on-primary-container)'
                  }}
                >
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--tertiary) 100%)',
                  color: 'var(--on-primary)'
                }}
              >
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div
                className="rounded-2xl rounded-bl-sm p-4 text-body-sm"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--outline-variant)',
                  color: 'var(--on-surface)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'var(--primary)', animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'var(--primary)', animationDelay: '150ms', opacity: 0.7 }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'var(--primary)', animationDelay: '300ms', opacity: 0.5 }}
                    />
                  </div>
                  <span style={{ color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'يفكر ويجهز إجابة...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div
          className="px-4 py-2.5 border-hairline flex items-center gap-2 overflow-x-auto shrink-0"
          style={{
            background: 'var(--surface-container)',
            borderTop: '1px solid var(--outline-variant)'
          }}
        >
          <span className="text-label-caps whitespace-nowrap shrink-0" style={{ color: 'var(--on-surface-variant)' }}>
            {isAr ? 'سريع:' : 'Quick:'}
          </span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt.text)}
              disabled={isSending}
              className="badge-pill whitespace-nowrap shrink-0 cursor-pointer transition-all hover:opacity-80 disabled:opacity-40"
              style={{
                background: 'var(--surface-variant)',
                color: 'var(--on-surface-variant)',
                border: '1px solid var(--outline-variant)'
              }}
            >
              {prompt.icon} {prompt.text}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          className="p-4 border-hairline shrink-0"
          style={{
            background: 'var(--surface)',
            borderTop: '1px solid var(--outline-variant)'
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب استفسارك هنا (مثلاً: كيف أطور سيرتي؟)...'
                  : 'Ask anything about your roadmap, CV, or next action...'
              }
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="btn-ai shrink-0"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Target, label: isAr ? 'خريطة المسار' : 'Career Map', tab: 'career', color: 'indigo' },
          { icon: FileText, label: isAr ? 'السيرة الذاتية' : 'CV Studio', tab: 'cv', color: 'blue' },
          { icon: Zap, label: isAr ? 'فرص العمل' : 'Opportunities', tab: 'opportunities', color: 'emerald' },
          { icon: Sparkles, label: isAr ? 'مقابلات' : 'Interviews', tab: 'interviews', color: 'purple' },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => onNavigate(item.tab)}
            className="card-surface p-3.5 text-body-sm font-semibold text-start flex items-center gap-2 group cursor-pointer transition-all hover:border-primary"
            style={{
              color: 'var(--on-surface)'
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: 'var(--surface-variant)'
              }}
            >
              <item.icon
                className="w-3.5 h-3.5 transition-colors"
                style={{ color: 'var(--on-surface-variant)' }}
              />
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
