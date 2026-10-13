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
      className="hidden md:flex flex-col shrink-0 bg-white border-e border-slate-200/70 w-56 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-30"
      style={{ boxShadow: '1px 0 0 rgba(0,0,0,0.04)' }}
    >
      <nav className="flex-1 p-3 space-y-0.5">
        {enrichedItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const label = isAr ? item.labelAr : item.labelEn;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                isActive
                  ? 'text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #4f6ef7 0%, #6c8aff 100%)',
                      boxShadow: '0 2px 8px rgba(79,110,247,0.2)',
                    }
                  : {}
              }
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span className="flex-1 truncate text-start">{label}</span>
              <div className="flex items-center gap-1">
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
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
      <div className="p-3 border-t border-slate-100 m-3 mt-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-semibold text-slate-700">
              {isAr ? 'جاهزيتك' : 'Readiness'}
            </span>
          </div>
          <span className="text-xs font-bold text-blue-700">
            {metrics?.readinessScore !== undefined && metrics?.readinessScore !== null
              ? `${metrics.readinessScore}%`
              : (isAr ? '—' : '—')}
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${metrics?.readinessScore ?? 0}%`,
              background: 'linear-gradient(90deg, #4f6ef7, #22c55e)',
            }}
          />
        </div>
        <button
          onClick={() => onNavigate('career')}
          className="w-full mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-center"
        >
          {isAr ? 'عرض التفاصيل ←' : 'View Details →'}
        </button>
      </div>
    </aside>
  );
};
