import React from 'react';
import {
  FileText,
  Briefcase,
  Mic,
  GraduationCap,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { CareerProfile } from '../../types/index.js';

interface QuickActionHubProps {
  profile: CareerProfile;
  opportunitiesCount: number;
  readinessScore: number;
  atsScore: number;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
}

export const QuickActionHub: React.FC<QuickActionHubProps> = ({
  profile,
  opportunitiesCount,
  readinessScore,
  atsScore,
  onNavigate,
  lang,
}) => {
  const isAr = lang === 'ar';

  const quickActions = [
    {
      id: 'cv',
      title: isAr ? 'السيرة الذاتية (CV)' : 'Resume & ATS',
      subtitle: isAr
        ? `نسبة توافق الـ CV حالياً ${atsScore}% — حسّنها لتضمن وصولك للمقابلات`
        : `Current fit ${atsScore}% — tailor for target positions`,
      badge: `${atsScore}% ATS`,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: FileText,
      iconBg: 'bg-blue-600 text-white',
      cardBorder: 'hover:border-blue-400',
      actionText: isAr ? 'تعديل السيرة الذاتية' : 'Open CV Studio',
      tab: 'cv',
    },
    {
      id: 'opportunities',
      title: isAr ? 'الوظائف المناسبة لك' : 'Matched Jobs',
      subtitle: isAr
        ? `يوجد ${opportunitiesCount} وظيفة متاحة تناسب مهاراتك وخبرتك الحالية`
        : `${opportunitiesCount} active roles matching your profile`,
      badge: `${opportunitiesCount} ${isAr ? 'وظيفة' : 'Jobs'}`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Briefcase,
      iconBg: 'bg-emerald-600 text-white',
      cardBorder: 'hover:border-emerald-400',
      actionText: isAr ? 'عرض الوظائف والتقديم' : 'Explore Jobs',
      tab: 'opportunities',
    },
    {
      id: 'interviews',
      title: isAr ? 'تدريب المقابلات' : 'Mock Interviews',
      subtitle: isAr
        ? 'تدرّب على أسئلة HR والأسئلة التقنية واعرف تقييم إجاباتك فوراً'
        : 'Practice role-specific interview questions with instant feedback',
      badge: isAr ? 'تدريب فوري' : 'Practice',
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: Mic,
      iconBg: 'bg-violet-600 text-white',
      cardBorder: 'hover:border-violet-400',
      actionText: isAr ? 'بدء تدريب مقابلة' : 'Start Simulation',
      tab: 'interviews',
    },
    {
      id: 'assistant',
      title: isAr ? 'المساعد الذكي' : 'AI Assistant',
      subtitle: isAr
        ? 'اسأله أي سؤال مهني يجاوبك بوضوح ومباشرة بدون لف أو تعقيد'
        : 'Direct answers to any career or technical questions',
      badge: isAr ? 'مباشر' : 'Instant AI',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: MessageSquare,
      iconBg: 'bg-amber-500 text-white',
      cardBorder: 'hover:border-amber-400',
      actionText: isAr ? 'اسأل المساعد الآن' : 'Ask AI',
      tab: 'assistant',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-900">
          {isAr ? 'أهم الأدوات المساعدة لك:' : 'Core Tools for You:'}
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          {isAr ? 'اختر ما تريد العمل عليه الآن' : 'Choose what you need now'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              onClick={() => onNavigate(action.tab)}
              className={`group p-5 bg-white border border-slate-200/90 rounded-2xl cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${action.cardBorder}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${action.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${action.badgeColor}`}
                  >
                    {action.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {action.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {action.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                <span>{action.actionText}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 text-indigo-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
