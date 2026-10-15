import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Mic,
  MessageSquare,
  GraduationCap,
  FolderGit2,
  Compass,
  Layers,
  Settings,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
  metrics?: {
    applicationsCount: number;
    projectsCount: number;
    emailEventsCount: number;
    readinessScore: number;
    coursesCount?: number;
  };
}

interface NavItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
  count?: number;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', labelAr: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard },
  { id: 'cv', labelAr: 'السيرة الذاتية', labelEn: 'CV Studio', icon: FileText },
  { id: 'opportunities', labelAr: 'الوظائف', labelEn: 'Jobs', icon: Briefcase },
  { id: 'interviews', labelAr: 'المقابلات', labelEn: 'Interviews', icon: Mic },
  { id: 'assistant', labelAr: 'المساعد الذكي', labelEn: 'AI Assistant', icon: MessageSquare, badge: 'AI' },
  { id: 'courses', labelAr: 'مسارات التعلم', labelEn: 'Learning Roadmaps', icon: Compass },
  { id: 'projects', labelAr: 'المشاريع', labelEn: 'Projects', icon: FolderGit2 },
  { id: 'applications', labelAr: 'تتبع التقديمات', labelEn: 'Applications', icon: Layers },
  { id: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  lang,
  metrics,
}) => {
  const isAr = lang === 'ar';

  // Enrich items with counts
  const enrichedItems = NAV_ITEMS.map((item) => {
    let count: number | undefined;
    if (item.id === 'applications') count = metrics?.applicationsCount;
    if (item.id === 'projects') count = metrics?.projectsCount;
    if (item.id === 'courses') count = metrics?.coursesCount;
    return { ...item, count };
  });

  return (
    <aside
      dir={isAr ? 'rtl' : 'ltr'}
      className="hidden md:flex flex-col shrink-0 w-56 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-30 border-hairline"
      style={{
        backgroundColor: 'var(--surface-container-low)',
        borderInlineEndColor: 'var(--outline-variant)',
        borderInlineEndWidth: '1px',
        borderInlineEndStyle: 'solid',
      }}
    >
      <nav className="flex-1 p-3 space-y-0.5">
        {enrichedItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const label = isAr ? item.labelAr : item.labelEn;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-micro font-medium transition-all cursor-pointer group ${
                isActive ? '' : ''
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--primary-container)',
                      color: 'var(--on-primary-container)',
                      boxShadow: '0 2px 8px -2px rgba(184, 196, 255, 0.3)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--on-surface-variant)',
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-container)';
                  e.currentTarget.style.color = 'var(--on-surface)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--on-surface-variant)';
                }
              }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{
                  color: isActive ? 'var(--on-primary-container)' : 'currentColor',
                  opacity: isActive ? 1 : 0.7,
                }}
              />
              <span className="flex-1 truncate text-start">{label}</span>
              <div className="flex items-center gap-1">
                {item.badge && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={
                      isActive
                        ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'var(--on-primary-container)',
                          }
                        : {
                            backgroundColor: 'rgba(184, 196, 255, 0.12)',
                            color: 'var(--primary)',
                          }
                    }
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={
                      isActive
                        ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'var(--on-primary-container)',
                          }
                        : {
                            backgroundColor: 'var(--surface-container)',
                            color: 'var(--on-surface-variant)',
                          }
                    }
                  >
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Readiness Score Footer */}
      <div
        className="p-3 m-3 mt-0 rounded-lg"
        style={{
          backgroundColor: 'var(--surface-container)',
          borderTop: '1px solid var(--outline-variant)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp
              className="w-3.5 h-3.5"
              style={{ color: 'var(--primary)' }}
            />
            <span
              className="text-label-caps"
              style={{
                color: 'var(--on-surface)',
                fontSize: '11px',
                textTransform: 'none',
              }}
            >
              {isAr ? 'جاهزيتك' : 'Readiness'}
            </span>
          </div>
          <span
            className="text-mono-metric"
            style={{
              color: 'var(--primary)',
              fontSize: '12px',
            }}
          >
            {metrics?.readinessScore !== undefined && metrics?.readinessScore !== null
              ? `${metrics.readinessScore}%`
              : '—'}
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-container-high)',
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${metrics?.readinessScore ?? 0}%`,
              background: 'linear-gradient(90deg, var(--primary-container), var(--tertiary))',
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => onNavigate('career')}
          className="w-full mt-2 text-micro font-medium transition-colors cursor-pointer text-center"
          style={{
            color: 'var(--primary)',
            fontSize: '11px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary-fixed-dim)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--primary)';
          }}
        >
          {isAr ? 'عرض التفاصيل ←' : 'View Details →'}
        </button>
      </div>
    </aside>
  );
};
