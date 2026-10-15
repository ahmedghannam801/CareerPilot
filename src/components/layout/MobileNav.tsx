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
              className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors relative cursor-pointer"
              style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)' }}
            >
              {isActive && (
                <motion.span
                  layoutId="mobileNavActivePill"
                  className="absolute inset-0 rounded-xl -z-10 border-hairline surface-elevated"
                  style={{ backgroundColor: 'var(--surface-container-highest)', borderColor: 'var(--outline-variant)' }}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <div
                className="p-1 rounded-md transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-micro leading-none">{item.label}</span>
            </motion.button>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <motion.button
          type="button"
          onClick={() => setDrawerOpen(true)}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition-colors cursor-pointer"
          style={{ color: drawerOpen ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}
        >
          <div className="p-1 rounded-md" style={{ color: 'var(--on-surface-variant)' }}>
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-micro leading-none">{isAr ? 'المزيد' : 'More'}</span>
        </motion.button>
      </nav>

      {/* Slide-over Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setDrawerOpen(false)}>
          <div className="w-4/5 max-w-sm h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-200" style={{ backgroundColor: 'var(--surface-container)', boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)' }} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="p-5 border-hairline flex items-center justify-between shrink-0" style={{ borderBlockEndColor: 'var(--outline-variant)', backgroundColor: 'var(--surface-container-low)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--primary)' }} />
                <span className="text-body-strong" style={{ color: 'var(--on-surface)' }}>CareerPilot AI</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg cursor-pointer transition-colors"
                style={{ color: 'var(--on-surface-variant)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--on-surface)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--on-surface-variant)'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 space-y-6 flex-1 overflow-y-auto overscroll-contain">

              {/* Quick Actions in Mobile Drawer */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleLang}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-body-base"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{isAr ? 'English' : 'العربية'}</span>
                </button>
                {onToggleTheme && (
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    className="flex items-center justify-center p-2 rounded-lg text-body-base cursor-pointer border-hairline"
                    style={{ backgroundColor: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4" style={{ color: 'var(--secondary)' }} />
                    ) : (
                      <Moon className="w-4 h-4" style={{ color: 'var(--on-surface-variant)' }} />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onStartOnboarding();
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-body-base"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تهيئة' : 'Onboard'}</span>
                </button>
              </div>

              {/* Grouped Nav Items */}
              <div className="space-y-4">
                {allSections.map((sec, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-label-caps px-2 block" style={{ color: 'var(--on-surface-variant)' }}>
                      {sec.group}
                    </span>
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onNavigate(item.id);
                            setDrawerOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-body-base rounded-xl transition-colors"
                          style={{
                            backgroundColor: isActive ? 'var(--primary-container)' : 'transparent',
                            color: isActive ? 'var(--on-primary-container)' : 'var(--on-surface)',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'var(--surface-container-high)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className="w-4 h-4"
                              style={{ color: isActive ? 'var(--on-primary-container)' : 'var(--on-surface-variant)' }}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="badge-pill text-mono-metric" style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}>
                              {item.badge}
                            </span>
                          )}
                          {item.count !== undefined && item.count > 0 && (
                            <span className="badge-pill text-mono-metric" style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}>
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
            <div className="p-4 border-hairline text-center text-micro shrink-0" style={{ borderBlockStartColor: 'var(--outline-variant)', backgroundColor: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>
              CareerPilot AI Operating System
            </div>
          </div>
        </div>
      )}
    </>
  );
};
