import React, { useState } from 'react';
import {
  Sparkles,
  Bell,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  LogOut,
  User,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { CareerProfile } from '../../types/index.js';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  notifications: {
    id: string;
    title: string;
    message: string;
    type: 'HIGH' | 'MEDIUM' | 'LOW';
    read: boolean;
    createdAt: string;
  }[];
  onMarkNotificationRead: (id: string) => void;
  onStartOnboarding: () => void;
  onOpenLinkedInSync?: () => void;
  onOpenSearch?: () => void;
  onLogout?: () => void;
  profile?: CareerProfile | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  lang,
  onToggleLang,
  theme = 'light',
  onToggleTheme,
  notifications,
  onMarkNotificationRead,
  onStartOnboarding,
  onOpenLinkedInSync,
  onOpenSearch,
  onLogout,
  profile,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isAr = lang === 'ar';

  const userInitials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : (profile?.email ? profile.email[0].toUpperCase() : 'U');

  const displayName = profile?.fullName?.trim() || (profile?.email ? profile.email.split('@')[0] : (isAr ? 'حسابي' : 'My Account'));
  const displayRole = profile?.targetRole || (profile?.careerStatus ? profile.careerStatus.replace('_', ' ') : (isAr ? 'الملف الشخصي' : 'Profile'));

  return (
    <header
      dir={isAr ? 'rtl' : 'ltr'}
      className="sticky top-0 z-40 flex items-center justify-between gap-3 px-3 sm:px-6 h-14 border-hairline"
      style={{
        backgroundColor: 'var(--surface-container-low)',
        borderBlockEndColor: 'var(--outline-variant)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Upper-Left: CareerPilot Brand Logo only */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Brand Logo & Name */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 shrink-0 cursor-pointer"
          title="CareerPilot AI Dashboard"
        >
          <img
            src="/logo.png"
            alt="CareerPilot AI"
            className="w-8 h-8 rounded-full object-contain bg-white shadow-xs"
          />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-xs font-black text-slate-900 tracking-tight">CareerPilot</span>
            <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase">AI</span>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="input-field flex-1 max-w-sm hidden sm:flex items-center gap-2.5 text-body-base cursor-pointer"
        style={{
          color: 'var(--on-surface-variant)',
          backgroundColor: 'var(--surface-container)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-container-high)';
          e.currentTarget.style.color = 'var(--on-surface)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-container)';
          e.currentTarget.style.color = 'var(--on-surface-variant)';
        }}
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-start">
          {isAr ? 'ابحث...' : 'Search...'}
        </span>
        <kbd className="text-micro font-mono px-1.5 py-0.5 rounded border-hairline hidden md:block" style={{ backgroundColor: 'var(--surface-container-highest)', borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }}>
          Ctrl K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Ask AI Button */}
        <button
          type="button"
          onClick={() => onNavigate('assistant')}
          className="btn-ai hidden sm:flex items-center gap-1.5 text-body-strong cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span>{isAr ? 'المساعد' : 'AI Chat'}</span>
        </button>

        {/* Language Toggle */}
        <button
          type="button"
          onClick={onToggleLang}
          className="btn-secondary flex items-center gap-1 text-body-strong cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
          <span>{lang === 'en' ? 'ع' : 'EN'}</span>
        </button>

        {/* Theme Toggle (Dark / Light) */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? (isAr ? 'الوضع النهاري' : 'Light Mode') : (isAr ? 'الوضع الليلي' : 'Dark Mode')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border-hairline transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--surface-container)',
              borderColor: 'var(--outline-variant)',
              color: 'var(--on-surface-variant)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-container-high)';
              e.currentTarget.style.color = 'var(--on-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-container)';
              e.currentTarget.style.color = 'var(--on-surface-variant)';
            }}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" style={{ color: 'var(--secondary)' }} />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--surface-container)',
              color: 'var(--on-surface-variant)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-container-high)';
              e.currentTarget.style.color = 'var(--on-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-container)';
              e.currentTarget.style.color = 'var(--on-surface-variant)';
            }}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="status-dot-active absolute top-1.5 right-1.5"
                style={{ boxShadow: '0 0 0 2px var(--surface-container-low)' }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute top-full mt-2 w-80 rounded-2xl z-50 p-4 space-y-2 animate-fade-in-up border-hairline"
              style={{
                backgroundColor: 'var(--surface-container)',
                borderColor: 'var(--outline-variant)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                right: isAr ? 'auto' : 0,
                left: isAr ? 0 : 'auto',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-title-base" style={{ color: 'var(--on-surface)' }}>
                  {isAr ? 'الإشعارات' : 'Notifications'}
                  {unreadCount > 0 && (
                    <span className="ms-2 badge-pill" style={{ backgroundColor: 'rgba(184, 196, 255, 0.12)', color: 'var(--primary)', border: '1px solid rgba(184, 196, 255, 0.3)' }}>
                      {unreadCount}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="cursor-pointer transition-colors"
                  style={{ color: 'var(--on-surface-variant)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--on-surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--on-surface-variant)'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {notifications.length === 0 ? (
                  <p className="text-body-base text-center py-6" style={{ color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'لا توجد إشعارات' : 'No notifications yet'}
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className="p-2.5 rounded-xl text-body-base cursor-pointer transition-colors"
                      style={{
                        backgroundColor: n.read ? 'transparent' : 'rgba(184, 196, 255, 0.08)',
                        color: n.read ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = n.read ? 'var(--surface-container-high)' : 'rgba(184, 196, 255, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = n.read ? 'transparent' : 'rgba(184, 196, 255, 0.08)';
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'HIGH' ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--tertiary)' }} />
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-body-strong" style={{ color: 'var(--on-surface)' }}>{n.title}</div>
                          <div className="text-body-sm mt-0.5 leading-relaxed line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{n.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Pill (Authenticated user identity — top-right) */}
        <button
          type="button"
          onClick={() => onNavigate('career')}
          className="flex items-center gap-2 p-1 pe-2.5 border-hairline rounded-2xl transition-all cursor-pointer group text-start"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-container)';
            e.currentTarget.style.borderColor = 'var(--outline-variant)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
          title={isAr ? 'عرض الملف الشخصي والإعدادات' : 'View Profile & Settings'}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform shrink-0" style={{ background: 'linear-gradient(135deg, var(--primary-container) 0%, var(--primary) 100%)', color: 'var(--on-primary-container)' }}>
            {userInitials}
          </div>
          <div className="hidden sm:flex flex-col leading-tight max-w-[130px] md:max-w-[160px]">
            <span className="text-body-strong truncate group-hover:opacity-80 transition-opacity" style={{ color: 'var(--on-surface)' }}>
              {displayName}
            </span>
            <span className="text-micro truncate capitalize" style={{ color: 'var(--on-surface-variant)' }}>
              {displayRole}
            </span>
          </div>
        </button>

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-body-strong border-hairline rounded-lg transition-all cursor-pointer ms-1"
            style={{
              color: 'var(--error)',
              backgroundColor: 'rgba(255, 180, 171, 0.08)',
              borderColor: 'rgba(255, 180, 171, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 180, 171, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 180, 171, 0.08)';
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
