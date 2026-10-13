import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, ChevronRight } from 'lucide-react';
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
        ? `أهلاً بك يا ${profile.fullName}. أنا مساعدك المهني الذكي في CareerPilot. لدي تفاصيل مسارك المستهدف (${profile.targetRole})، ومهاراتك الحالية، وسجل تقديماتك. كيف يمكنني مساعدتك اليوم؟`
        : `Hello ${profile.fullName}. I am your CareerPilot AI Assistant. I have full context on your target trajectory (${profile.targetRole}) and your verified skills. How can I advance your career today?`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    }
  };

  const quickPrompts = isAr
    ? [
        'ما هي خطوتي الأولى لتطوير سيرتي الذاتية؟',
        'هل مهاراتي تؤهلني لوظائف الـ AI Engineer؟',
        'اقترح مشروعاً عملياً يرفع فرص قبولي',
        'نصيحة سريعة لمقابلة تقنية قادمة',
      ]
    : [
        'What is my single most impactful Next Best Action right now?',
        'Am I ready for a Senior AI Engineer role?',
        'How should I improve my CV achievements?',
        'Suggest a practical micro-project to prove my skills.',
      ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
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
                ? 'استشارات وإجابات مباشرة ودقيقة لتطوير سيرتك، التحضير للمقابلات، واختيار الخطوة الأفضل'
                : 'Direct and clear guidance tailored to your profile, CV, and career roadmap'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
              {isAr ? `متصل بملف: ${profile.fullName}` : `Active Profile: ${profile.fullName}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-xs">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-indigo-100">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '').replace(/\*/g, '')}</div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 text-xs text-slate-500 shadow-2xs">
                {isAr ? 'المساعد يفكر ويجهز إجابة مباشرة لك...' : 'Thinking and preparing your answer...'}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">
            {isAr ? 'مقترحات:' : 'Suggested:'}
          </span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={isSending}
              className="text-[11px] text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 px-3 py-1 rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200/90 bg-white">
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
                isAr
                  ? 'اكتب استفسارك هنا (مثلاً: كيف أطور سيرتي؟ أو ما هو أفضل مشروع لي؟)...'
                  : 'Ask anything about your roadmap, CV, job match, or next action...'
              }
              className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
