import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  LogOut,
} from 'lucide-react';

import { CareerProfile } from '../../types/index.js';

interface NavigationRailProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
  onToggleLang?: () => void;
  onLogout?: () => void;
  profile?: CareerProfile | null;
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
  onLogout,
  profile,
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
      labelAr: 'مسارات التعلم',
      labelEn: 'Learning Roadmaps',
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

  const userInitials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : (profile?.email ? profile.email[0].toUpperCase() : 'U');

  const displayName = profile?.fullName?.trim() || (profile?.email ? profile.email.split('@')[0] : (isAr ? 'حسابي' : 'My Account'));
  const displayRole = profile?.targetRole || (profile?.careerStatus ? profile.careerStatus.replace('_', ' ') : (isAr ? 'الملف المهني' : 'Career Profile'));

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 w-56 lg:w-60 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-30 select-none border-hairline"
      style={{
        backgroundColor: 'var(--surface-container-low)',
        borderInlineEndColor: 'var(--outline-variant)',
      }}
    >
      {/* Sidebar Header: Brand on top, User identity below */}
      <div className="border-hairline" style={{ borderBlockEndColor: 'var(--outline-variant)', backgroundColor: 'var(--surface-container)' }}>
        {/* Row 1: CareerPilot AI Brand */}
        <div className="px-4 py-3 flex items-center justify-between border-hairline" style={{ borderBlockEndColor: 'var(--outline-variant)' }}>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 shadow-xs group-hover:scale-105 transition-transform" style={{ backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)' }}>
              CP
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black tracking-tight group-hover:opacity-80 transition-opacity" style={{ color: 'var(--on-surface)' }}>
                CareerPilot <span style={{ color: 'var(--primary)' }}>AI</span>
              </div>
            </div>
          </button>
          <span className="badge-pill text-label-caps" style={{ backgroundColor: 'rgba(184, 196, 255, 0.12)', color: 'var(--primary)', border: '1px solid rgba(184, 196, 255, 0.3)' }}>PRO</span>
        </div>

        {/* Row 2: Authenticated User Identity */}
        <button
          type="button"
          onClick={() => onNavigate('career')}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-all text-start cursor-pointer group"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-container-high)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={isAr ? 'عرض الملف الشخصي والإعدادات' : 'View Profile & Settings'}
        >
          <div className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, var(--primary-container) 0%, var(--primary) 100%)', color: 'var(--on-primary-container)' }}>
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold truncate group-hover:opacity-80 transition-opacity" style={{ color: 'var(--on-surface)' }}>
              {displayName}
            </div>
            <div className="text-micro truncate capitalize" style={{ color: 'var(--on-surface-variant)' }}>
              {displayRole}
            </div>
          </div>
        </button>
      </div>


      {/* Main Navigation Scroll Area */}
      <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {/* Primary Destinations */}
        <div>
          <div className="px-2.5 pb-1.5 text-label-caps" style={{ color: 'var(--on-surface-variant)' }}>
            {isAr ? 'الوجهات الأساسية' : 'Core Journey'}
          </div>
          <div className="space-y-0.5">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const label = isAr ? item.labelAr : item.labelEn;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  whileHover={{ x: isAr ? -3 : 3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-strong transition-colors cursor-pointer relative z-0"
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--surface-container-high)';
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
                  {/* Floating gliding active pill */}
                  {isActive && (
                    <motion.span
                      layoutId="activeRailPill"
                      className="absolute inset-0 rounded-xl -z-10 border-hairline surface-elevated"
                      style={{
                        backgroundColor: 'var(--surface-container-highest)',
                        borderColor: 'var(--outline-variant)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {/* Distinctive active accent bar */}
                  {isActive && (
                    <motion.span
                      layoutId="activeRailAccent"
                      className="absolute start-0 top-2 bottom-2 w-1 rounded-e-full z-10"
                      style={{ backgroundColor: 'var(--primary)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)' }}
                  />
                  <span className="flex-1 truncate text-start">{label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className="badge-pill text-mono-metric"
                      style={{
                        backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-container)',
                        color: isActive ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                        border: `1px solid ${isActive ? 'var(--primary)' : 'var(--outline-variant)'}`,
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Secondary Toolkit */}
        <div>
          <button
            type="button"
            onClick={() => setToolsExpanded(!toolsExpanded)}
            className="w-full flex items-center justify-between px-2.5 pb-1.5 text-label-caps transition-colors cursor-pointer"
            style={{ color: 'var(--on-surface-variant)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--on-surface)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--on-surface-variant)'}
          >
            <span>{isAr ? 'أدوات الدعم والتطوير' : 'Career Toolkit'}</span>
            <motion.div
              animate={{ rotate: toolsExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {toolsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-0.5 pt-0.5 overflow-hidden"
              >
                {secondaryTools.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  const label = isAr ? item.labelAr : item.labelEn;

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      whileHover={{ x: isAr ? -3 : 3 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-body-base transition-colors cursor-pointer relative z-0"
                      style={{
                        color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--surface-container-high)';
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
                      {isActive && (
                        <motion.span
                          layoutId="activeRailToolkitPill"
                          className="absolute inset-0 rounded-xl -z-10 border-hairline surface-elevated"
                          style={{
                            backgroundColor: 'var(--surface-container-highest)',
                            borderColor: 'var(--outline-variant)',
                          }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon
                        className="w-3.5 h-3.5 shrink-0 transition-colors"
                        style={{ color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)' }}
                      />
                      <span className="flex-1 truncate text-start">{label}</span>
                      {item.badge && (
                        <span className="badge-pill text-label-caps" style={{ backgroundColor: 'rgba(184, 196, 255, 0.12)', color: 'var(--primary)', border: '1px solid rgba(184, 196, 255, 0.3)' }}>
                          {item.badge}
                        </span>
                      )}
                      {item.count !== undefined && item.count > 0 && (
                        <span className="badge-pill text-mono-metric" style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}>
                          {item.count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation: Readiness & Settings */}
      <div className="p-3 border-hairline space-y-2" style={{ borderBlockStartColor: 'var(--outline-variant)', backgroundColor: 'var(--surface-container)' }}>
        {/* Readiness pill */}
        <div className="flex items-center justify-between text-xs px-2">
          <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {isAr ? 'جاهزيتك المهنية' : 'Career Readiness'}
          </span>
          <span className="text-body-strong" style={{ color: 'var(--primary)' }}>
            {metrics?.readinessScore !== undefined && metrics?.readinessScore !== null
              ? `${metrics.readinessScore}%`
              : (isAr ? '—' : '—')}
          </span>
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-container-low)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${metrics?.readinessScore ?? 0}%`,
              background: 'linear-gradient(to right, var(--primary), var(--tertiary))',
            }}
          />
        </div>

        {/* Settings, Logout & Language row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-body-base transition-colors cursor-pointer"
              style={{
                color: currentTab === 'settings' ? 'var(--primary)' : 'var(--on-surface-variant)',
                backgroundColor: currentTab === 'settings' ? 'rgba(184, 196, 255, 0.12)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (currentTab !== 'settings') {
                  e.currentTarget.style.color = 'var(--on-surface)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentTab !== 'settings') {
                  e.currentTarget.style.color = 'var(--on-surface-variant)';
                }
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title={isAr ? 'تسجيل الخروج' : 'Log Out'}
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--error)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 180, 171, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onToggleLang && (
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-label-caps transition-colors cursor-pointer"
              style={{ color: 'var(--on-surface-variant)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-container-high)';
                e.currentTarget.style.color = 'var(--on-surface)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--on-surface-variant)';
              }}
            >
              <Globe className="w-3 h-3" style={{ color: 'var(--primary)' }} />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
