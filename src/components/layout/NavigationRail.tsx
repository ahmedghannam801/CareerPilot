import React, { useState } from 'react';
import {
  Home,
  Compass,
  Search,
  Layers,
  Briefcase,
  FileText,
  FolderGit2,
  GraduationCap,
  Mic,
  Mail,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronUp,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

interface NavigationRailProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
  onToggleLang?: () => void;
  metrics?: {
    applicationsCount?: number;
    projectsCount?: number;
    coursesCount?: number;
    emailEventsCount?: number;
    readinessScore?: number;
  };
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentTab,
  onNavigate,
  lang,
  onToggleLang,
  metrics,
}) => {
  const isAr = lang === 'ar';
  const [toolsExpanded, setToolsExpanded] = useState<boolean>(true);

  // Primary destinations
  const primaryNav = [
    { id: 'dashboard', labelAr: 'الرئيسية', labelEn: 'Home', icon: Home },
    { id: 'career', labelAr: 'مساري المهني', labelEn: 'My Journey', icon: Compass },
    { id: 'opportunities', labelAr: 'اكتشف الوظائف', labelEn: 'Discover', icon: Search },
    {
      id: 'applications',
      labelAr: 'طلبات التقديم',
      labelEn: 'Applications',
      icon: Layers,
      count: metrics?.applicationsCount,
    },
    { id: 'cv', labelAr: 'مساحة العمل', labelEn: 'My Workspace', icon: Briefcase },
  ];

  // Secondary tools (Toolkit)
  const secondaryTools = [
    { id: 'cv', labelAr: 'السيرة والـ ATS', labelEn: 'CV Builder', icon: FileText },
    {
      id: 'projects',
      labelAr: 'المشاريع والأدلة',
      labelEn: 'Projects',
      icon: FolderGit2,
      count: metrics?.projectsCount,
    },
    {
      id: 'courses',
      labelAr: 'المسارات والكورسات',
      labelEn: 'Learning',
      icon: GraduationCap,
      count: metrics?.coursesCount,
    },
    { id: 'interviews', labelAr: 'محاكاة المقابلات', labelEn: 'Interviews', icon: Mic },
    {
      id: 'email',
      labelAr: 'البريد الذكي',
      labelEn: 'Email Intel',
      icon: Mail,
      count: metrics?.emailEventsCount,
    },
    { id: 'assistant', labelAr: 'المدرب الذكي', labelEn: 'AI Assistant', icon: Sparkles, badge: 'AI' },
  ];

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 bg-white border-e border-[#E4EAF2] w-56 lg:w-60 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-30 select-none"
    >
      {/* Brand & Workspace Subheader */}
      <div className="px-4 py-3.5 border-b border-[#EDF2F7]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
            CP
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-[#0B1F3A] tracking-tight">
              CareerPilot <span className="text-[#2563EB]">AI</span>
            </div>
            <div className="text-[10.5px] text-[#64748B] truncate">
              {isAr ? 'مساحة العمل المهنية' : 'Career Workspace'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {/* Primary Destinations */}
        <div>
          <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
            {isAr ? 'الوجهات الأساسية' : 'Core Journey'}
          </div>
          <div className="space-y-0.5">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const label = isAr ? item.labelAr : item.labelEn;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#EEF4FF] text-[#2563EB]'
                      : 'text-[#64748B] hover:text-[#17253B] hover:bg-[#F7F9FC]'
                  }`}
                >
                  {/* Distinctive active left/right accent bar */}
                  {isActive && (
                    <span className="absolute start-0 top-2 bottom-2 w-1 bg-[#2563EB] rounded-e-full" />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                    }`}
                  />
                  <span className="flex-1 truncate text-start">{label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Toolkit */}
        <div>
          <button
            onClick={() => setToolsExpanded(!toolsExpanded)}
            className="w-full flex items-center justify-between px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#64748B] transition-colors cursor-pointer"
          >
            <span>{isAr ? 'أدوات الدعم والتطوير' : 'Career Toolkit'}</span>
            {toolsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {toolsExpanded && (
            <div className="space-y-0.5 pt-0.5">
              {secondaryTools.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const label = isAr ? item.labelAr : item.labelEn;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-[#EEF4FF] text-[#2563EB] font-bold'
                        : 'text-[#64748B] hover:text-[#17253B] hover:bg-[#F7F9FC]'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                      }`}
                    />
                    <span className="flex-1 truncate text-start">{label}</span>
                    {item.badge && (
                      <span className="text-[9.5px] font-black text-[#2563EB] bg-[#EEF4FF] px-1.5 py-0.2 rounded-full border border-[#2563EB]/20">
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-slate-100 text-[#64748B]">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation: Readiness & Settings */}
      <div className="p-3 border-t border-[#EDF2F7] bg-[#F7F9FC] space-y-2">
        {/* Readiness pill */}
        <div className="flex items-center justify-between text-xs px-2">
          <span className="text-[11px] font-semibold text-[#64748B]">
            {isAr ? 'جاهزيتك المهنية' : 'Career Readiness'}
          </span>
          <span className="text-xs font-black text-[#2563EB]">
            {metrics?.readinessScore ?? 84}%
          </span>
        </div>
        <div className="w-full h-1 bg-[#E4EAF2] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#20C997] rounded-full transition-all duration-700"
            style={{ width: `${metrics?.readinessScore ?? 84}%` }}
          />
        </div>

        {/* Settings & Language row */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentTab === 'settings'
                ? 'text-[#2563EB] font-bold bg-[#EEF4FF]'
                : 'text-[#64748B] hover:text-[#17253B]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
          </button>

          {onToggleLang && (
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-[#64748B] hover:text-[#17253B] hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <Globe className="w-3 h-3 text-[#2563EB]" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
