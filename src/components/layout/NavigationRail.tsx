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
      className="hidden md:flex flex-col shrink-0 bg-white dark:bg-[#0B0F17] border-e border-[#E4EAF2] dark:border-slate-800 w-56 lg:w-60 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-30 select-none"
    >
      {/* Sidebar Header: Brand on top, User identity below */}
      <div className="border-b border-[#EDF2F7] dark:border-slate-800 bg-[#FAFBFC] dark:bg-slate-900/30">
        {/* Row 1: CareerPilot AI Brand */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#EDF2F7]/70 dark:border-slate-800/70">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0B1F3A] text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-xs group-hover:bg-[#1E3A5F] transition-colors">
              CP
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-[#0B1F3A] dark:text-slate-100 tracking-tight group-hover:text-[#2563EB] transition-colors">
                CareerPilot <span className="text-[#2563EB]">AI</span>
              </div>
            </div>
          </button>
          <span className="bg-[#EEF4FF] text-[#2563EB] px-1.5 py-0.5 rounded-full font-bold text-[9px] uppercase">PRO</span>
        </div>

        {/* Row 2: Authenticated User Identity */}
        <button
          type="button"
          onClick={() => onNavigate('career')}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white dark:hover:bg-slate-800/50 transition-all text-start cursor-pointer group"
          title={isAr ? 'عرض الملف الشخصي والإعدادات' : 'View Profile & Settings'}
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-[#0B1F3A] truncate group-hover:text-[#2563EB] transition-colors">
              {displayName}
            </div>
            <div className="text-[10px] text-[#64748B] truncate capitalize">
              {displayRole}
            </div>
          </div>
        </button>
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
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  whileHover={{ x: isAr ? -3 : 3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer relative z-0 ${
                    isActive
                      ? 'text-[#2563EB] dark:text-blue-400 font-bold'
                      : 'text-[#64748B] hover:text-[#17253B] dark:hover:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Floating gliding active pill */}
                  {isActive && (
                    <motion.span
                      layoutId="activeRailPill"
                      className="absolute inset-0 bg-[#EEF4FF] dark:bg-blue-950/50 rounded-xl -z-10 border border-[#2563EB]/15 dark:border-blue-500/25 shadow-2xs"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {/* Distinctive active accent bar */}
                  {isActive && (
                    <motion.span
                      layoutId="activeRailAccent"
                      className="absolute start-0 top-2 bottom-2 w-1 bg-[#2563EB] rounded-e-full z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#94A3B8]'
                    }`}
                  />
                  <span className="flex-1 truncate text-start">{label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-transform ${
                        isActive ? 'bg-[#2563EB] text-white scale-105' : 'bg-slate-100 dark:bg-slate-800 text-[#64748B]'
                      }`}
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
            className="w-full flex items-center justify-between px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#64748B] transition-colors cursor-pointer"
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
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors cursor-pointer relative z-0 ${
                        isActive
                          ? 'text-[#2563EB] dark:text-blue-400 font-bold'
                          : 'text-[#64748B] hover:text-[#17253B] dark:hover:text-slate-200 hover:bg-[#F7F9FC] dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeRailToolkitPill"
                          className="absolute inset-0 bg-[#EEF4FF] dark:bg-blue-950/40 rounded-xl -z-10 border border-[#2563EB]/15 dark:border-blue-500/20"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#94A3B8]'
                        }`}
                      />
                      <span className="flex-1 truncate text-start">{label}</span>
                      {item.badge && (
                        <span className="text-[9.5px] font-black text-[#2563EB] bg-[#EEF4FF] dark:bg-blue-950 px-1.5 py-0.2 rounded-full border border-[#2563EB]/20">
                          {item.badge}
                        </span>
                      )}
                      {item.count !== undefined && item.count > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[#64748B]">
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
      <div className="p-3 border-t border-[#EDF2F7] bg-[#F7F9FC] space-y-2">
        {/* Readiness pill */}
        <div className="flex items-center justify-between text-xs px-2">
          <span className="text-[11px] font-semibold text-[#64748B]">
            {isAr ? 'جاهزيتك المهنية' : 'Career Readiness'}
          </span>
          <span className="text-xs font-black text-[#2563EB]">
            {metrics?.readinessScore !== undefined && metrics?.readinessScore !== null
              ? `${metrics.readinessScore}%`
              : (isAr ? '—' : '—')}
          </span>
        </div>
        <div className="w-full h-1 bg-[#E4EAF2] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#20C997] rounded-full transition-all duration-700"
            style={{ width: `${metrics?.readinessScore ?? 0}%` }}
          />
        </div>

        {/* Settings, Logout & Language row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('settings')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTab === 'settings'
                  ? 'text-[#2563EB] font-bold bg-[#EEF4FF]'
                  : 'text-[#64748B] hover:text-[#17253B]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title={isAr ? 'تسجيل الخروج' : 'Log Out'}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

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
