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
      <div className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-indigo-600 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'المساعد المهني الذكي' : 'Unified AI Career Advisor'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {isAr ? 'محادثة المساعد الذكي' : 'CareerPilot AI Chat'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'استشارات وإجابات مباشرة لتطوير سيرتك وخطواتك المهنية'
                : 'Direct, context-aware guidance tailored to your profile and goals'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isAr ? 'متصل' : 'Online'}
            </div>
            <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80 truncate max-w-[180px]">
              {profile.fullName}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div
        className="border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-sm"
        style={{ height: '620px' }}
      >
        {/* Messages Scroll Area */}
        <div
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
          style={{
            background: 'var(--chat-bg, linear-gradient(to bottom, #f8faff 0%, #f1f5f9 100%))',
          }}
        >
          <style>{`
            .dark .chat-area { background: linear-gradient(to bottom, #0B0F17 0%, #0D1117 100%) !important; }
            :root { --chat-bg: linear-gradient(to bottom, #f8faff 0%, #f1f5f9 100%); }
            .dark { --chat-bg: linear-gradient(to bottom, #0B0F17 0%, #0D1117 100%); }
          `}</style>

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-violet-600 dark:bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-violet-200/40 dark:shadow-violet-900/40">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm shadow-md'
                    : 'rounded-bl-sm shadow-sm'
                }`}
                style={
                  msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }
                    : {
                        background: 'var(--assistant-bubble, #ffffff)',
                        border: '1px solid var(--assistant-border, rgba(226,232,240,0.9))',
                        color: 'var(--assistant-text, #1e293b)',
                      }
                }
              >
                <style>{`
                  :root {
                    --assistant-bubble: #ffffff;
                    --assistant-border: rgba(226,232,240,0.9);
                    --assistant-text: #1e293b;
                  }
                  .dark {
                    --assistant-bubble: #1E293B;
                    --assistant-border: rgba(55,65,81,0.8);
                    --assistant-text: #e2e8f0;
                  }
                `}</style>
                <div className="whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '').replace(/\*/g, '')}</div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600 dark:bg-violet-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div
                className="rounded-2xl rounded-bl-sm p-4 text-xs shadow-sm"
                style={{
                  background: 'var(--assistant-bubble, #ffffff)',
                  border: '1px solid var(--assistant-border, rgba(226,232,240,0.9))',
                  color: 'var(--assistant-text, #1e293b)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-slate-500">
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
          className="px-4 py-2.5 border-t flex items-center gap-2 overflow-x-auto shrink-0"
          style={{
            background: 'var(--bar-bg, #f8fafc)',
            borderColor: 'var(--bar-border, rgba(226,232,240,0.7))',
          }}
        >
          <style>{`
            :root { --bar-bg: #f8fafc; --bar-border: rgba(226,232,240,0.7); }
            .dark { --bar-bg: #0D1117; --bar-border: rgba(31,41,55,0.8); }
          `}</style>
          <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap shrink-0">
            {isAr ? 'سريع:' : 'Quick:'}
          </span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt.text)}
              disabled={isSending}
              className="text-[11px] font-medium px-3 py-1 rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer border"
              style={{
                background: 'var(--prompt-bg, #f1f5f9)',
                color: 'var(--prompt-text, #475569)',
                borderColor: 'var(--prompt-border, rgba(226,232,240,0.8))',
              }}
            >
              <style>{`
                :root { --prompt-bg: #f1f5f9; --prompt-text: #475569; --prompt-border: rgba(226,232,240,0.8); }
                .dark { --prompt-bg: #1E293B; --prompt-text: #94A3B8; --prompt-border: rgba(55,65,81,0.6); }
              `}</style>
              {prompt.icon} {prompt.text}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          className="p-4 border-t shrink-0"
          style={{
            background: 'var(--input-bg, #ffffff)',
            borderColor: 'var(--input-border, rgba(226,232,240,0.8))',
          }}
        >
          <style>{`
            :root { --input-bg: #ffffff; --input-border: rgba(226,232,240,0.8); }
            .dark { --input-bg: #0D1117; --input-border: rgba(31,41,55,0.8); }
          `}</style>
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
              className="flex-1 text-xs p-3 rounded-xl outline-none transition-all"
              style={{
                background: 'var(--field-bg, #f8fafc)',
                color: 'var(--field-text, #1e293b)',
                border: '1px solid var(--field-border, rgba(226,232,240,0.8))',
              }}
            />
            <style>{`
              :root { --field-bg: #f8fafc; --field-text: #1e293b; --field-border: rgba(226,232,240,0.8); }
              .dark { --field-bg: #1E293B; --field-text: #e2e8f0; --field-border: rgba(55,65,81,0.6); }
            `}</style>
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="px-4 py-3 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
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
            className="p-3.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-all text-start flex items-center gap-2 group cursor-pointer shadow-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              <item.icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
