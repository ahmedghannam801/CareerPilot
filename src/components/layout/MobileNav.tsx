import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Mic,
  Menu,
  X,
  Compass,
  Layers,
  FolderGit2,
  GraduationCap,
  Mail,
  MessageSquare,
  ShieldCheck,
  Globe,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onStartOnboarding: () => void;
  onOpenLinkedInSync?: () => void;
  metrics?: {
    applicationsCount: number;
    projectsCount: number;
    emailEventsCount: number;
    readinessScore?: number | null;
    coursesCount?: number;
  };
}

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  count?: number;
}

interface MobileNavSection {
  group: string;
  items: MobileNavItem[];
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onNavigate,
  lang,
  onToggleLang,
  theme = 'light',
  onToggleTheme,
  onStartOnboarding,
  onOpenLinkedInSync,
  metrics,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAr = lang === 'ar';

  const bottomItems = [
    { id: 'dashboard', label: isAr ? 'الرئيسية' : 'Home', icon: LayoutDashboard },
    { id: 'cv', label: isAr ? 'السيرة' : 'CV Studio', icon: FileText },
    { id: 'opportunities', label: isAr ? 'الوظائف' : 'Jobs', icon: Briefcase },
    { id: 'interviews', label: isAr ? 'المقابلات' : 'Interviews', icon: Mic },
  ];

  const allSections: MobileNavSection[] = [
    {
      group: isAr ? 'الملف المهني' : 'Career Profile',
      items: [
        { id: 'dashboard', label: isAr ? 'لوحة القيادة' : 'Dashboard', icon: LayoutDashboard },
        {
          id: 'career',
          label: isAr ? 'الـ DNA والجاهزية' : 'Career DNA & Readiness',
          icon: Compass,
          badge: metrics?.readinessScore != null ? `${metrics.readinessScore}%` : undefined,
        },
        { id: 'cv', label: isAr ? 'استوديو السيرة الذاتية (ATS)' : 'CV Studio & ATS', icon: FileText },
      ],
    },
    {
      group: isAr ? 'التوظيف والتقديم' : 'Jobs & Applications',
      items: [
        { id: 'opportunities', label: isAr ? 'الفرص ومطابقة الوظائف' : 'Opportunities & Match', icon: Briefcase },
        {
          id: 'applications',
          label: isAr ? 'متابعة الطلبات' : 'Applications Pipeline',
          icon: Layers,
          count: metrics?.applicationsCount,
        },
        {
          id: 'email',
          label: isAr ? 'بريد التوظيف الذكي' : 'Email Intelligence',
          icon: Mail,
          count: metrics?.emailEventsCount,
        },
      ],
    },
    {
      group: isAr ? 'المهارات والتدريب' : 'Growth & Practice',
      items: [
        {
          id: 'projects',
          label: isAr ? 'المشاريع العملية' : 'Micro-Projects',
          icon: FolderGit2,
          count: metrics?.projectsCount,
        },
        {
          id: 'courses',
          label: isAr ? 'مسارات التعلم المهني' : 'Learning Roadmaps',
          icon: GraduationCap,
          count: metrics?.coursesCount,
        },
        { id: 'interviews', label: isAr ? 'محاكي المقابلات' : 'Interview Simulator', icon: Mic },
      ],
    },
    {
      group: isAr ? 'المساعد والإعدادات' : 'Support & System',
      items: [
        { id: 'assistant', label: isAr ? 'المساعد الذكي' : 'AI Assistant', icon: MessageSquare },
        { id: 'settings', label: isAr ? 'الخصوصية والذاكرة' : 'Privacy & Memory', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <>
      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-surface border-hairline px-3 py-1.5 flex items-center justify-around" style={{ borderBlockStartColor: 'var(--outline-variant)', boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.15)' }}>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-[#2563EB] dark:text-blue-400 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="mobileNavActivePill"
                  className="absolute inset-0 bg-[#EEF4FF] dark:bg-blue-950/40 rounded-xl -z-10 border border-[#2563EB]/15 dark:border-blue-500/20"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <div
                className={`p-1 rounded-md transition-colors ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-neutral-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] leading-none">{item.label}</span>
            </motion.button>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <motion.button
          type="button"
          onClick={() => setDrawerOpen(true)}
          whileTap={{ scale: 0.9 }}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-slate-200 transition-colors cursor-pointer ${
            drawerOpen ? 'text-neutral-900 dark:text-white font-bold' : ''
          }`}
        >
          <div className="p-1 rounded-md text-neutral-500">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] leading-none">{isAr ? 'المزيد' : 'More'}</span>
        </motion.button>
      </nav>

      {/* Slide-over Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end md:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="bg-white w-4/5 max-w-sm h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-neutral-900 rounded-sm" />
                <span className="font-bold text-sm text-neutral-900">CareerPilot AI</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 space-y-6 flex-1 overflow-y-auto overscroll-contain">

              {/* Quick Actions in Mobile Drawer */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleLang}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{isAr ? 'English' : 'العربية'}</span>
                </button>
                {onToggleTheme && (
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    className="flex items-center justify-center p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-neutral-600" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onStartOnboarding();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isAr ? 'تهيئة' : 'Onboard'}</span>
                </button>
              </div>

              {/* Grouped Nav Items */}
              <div className="space-y-4">
                {allSections.map((sec, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 block">
                      {sec.group}
                    </span>
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id);
                            setDrawerOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors ${
                            isActive
                              ? 'bg-neutral-900 text-white font-semibold'
                              : 'text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive ? 'text-white' : 'text-neutral-500'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-800">
                              {item.badge}
                            </span>
                          )}
                          {item.count !== undefined && item.count > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-800">
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-neutral-100 text-center text-[11px] text-neutral-400 shrink-0 bg-neutral-50/50">
              CareerPilot AI Operating System
            </div>
          </div>
        </div>
      )}
    </>
  );
};
