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
      badgeStyle: {
        backgroundColor: 'var(--primary-container)',
        color: 'var(--on-primary-container)',
      },
      icon: FileText,
      iconStyle: {
        backgroundColor: 'var(--primary)',
        color: 'var(--on-primary)',
      },
      hoverBorderColor: 'var(--primary)',
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
      badgeStyle: {
        backgroundColor: 'var(--tertiary-container)',
        color: 'var(--on-tertiary-container)',
      },
      icon: Briefcase,
      iconStyle: {
        backgroundColor: 'var(--tertiary)',
        color: 'var(--on-tertiary)',
      },
      hoverBorderColor: 'var(--tertiary)',
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
      badgeStyle: {
        backgroundColor: 'var(--secondary-container)',
        color: 'var(--on-secondary-container)',
      },
      icon: Mic,
      iconStyle: {
        backgroundColor: 'var(--secondary)',
        color: 'var(--on-secondary)',
      },
      hoverBorderColor: 'var(--secondary)',
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
      badgeStyle: {
        backgroundColor: 'var(--primary-fixed)',
        color: 'var(--on-primary-fixed)',
      },
      icon: MessageSquare,
      iconStyle: {
        backgroundColor: 'var(--primary-fixed-dim)',
        color: 'var(--on-primary-fixed)',
      },
      hoverBorderColor: 'var(--primary-fixed-dim)',
      actionText: isAr ? 'اسأل المساعد الآن' : 'Ask AI',
      tab: 'assistant',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-title-base" style={{ color: 'var(--on-surface)' }}>
          {isAr ? 'أهم الأدوات المساعدة لك:' : 'Core Tools for You:'}
        </h3>
        <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
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
              className="group p-5 card-surface border-hairline rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--surface-container)',
                borderColor: 'var(--outline-variant)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.hoverBorderColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--outline-variant)';
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: action.iconStyle.backgroundColor,
                      color: action.iconStyle.color,
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className="text-label-caps px-2 py-0.5 rounded-full border-hairline"
                    style={{
                      backgroundColor: action.badgeStyle.backgroundColor,
                      color: action.badgeStyle.color,
                      fontSize: '10px',
                    }}
                  >
                    {action.badge}
                  </span>
                </div>

                <h4
                  className="text-title-base transition-colors"
                  style={{ color: 'var(--on-surface)' }}
                >
                  {action.title}
                </h4>
                <p
                  className="text-body-sm mt-1 line-clamp-2"
                  style={{ color: 'var(--on-surface-variant)', lineHeight: '1.5' }}
                >
                  {action.subtitle}
                </p>
              </div>

              <div
                className="mt-4 pt-3 flex items-center justify-between text-body-strong transition-colors"
                style={{
                  borderTop: '1px solid var(--outline-variant)',
                  color: 'var(--on-surface-variant)',
                }}
              >
                <span>{action.actionText}</span>
                <ArrowRight
                  className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  style={{ color: 'var(--primary)' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
