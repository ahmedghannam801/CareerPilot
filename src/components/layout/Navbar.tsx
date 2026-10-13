import React, { useState } from 'react';
import {
  Sparkles,
  Bell,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  lang,
  onToggleLang,
  notifications,
  onMarkNotificationRead,
  onStartOnboarding,
  onOpenLinkedInSync,
  onOpenSearch,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isAr = lang === 'ar';

  return (
    <header
      dir={isAr ? 'rtl' : 'ltr'}
      className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-6 h-14 bg-white border-b border-slate-200/70"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      {/* Brand */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2.5 shrink-0 cursor-pointer"
      >
        <img
          src="/logo.png"
          alt="CareerPilot AI"
          className="w-9 h-9 rounded-lg object-contain border border-slate-100 shadow-2xs"
        />
        <div className="hidden sm:flex flex-col leading-none">
          <span className="text-sm font-bold text-slate-900 tracking-tight">CareerPilot</span>
          <span className="text-[10px] font-semibold text-blue-600 tracking-widest uppercase">AI</span>
        </div>
      </button>

      {/* Search Bar */}
      <button
        onClick={onOpenSearch}
        className="flex-1 max-w-sm hidden sm:flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-start">
          {isAr ? 'ابحث...' : 'Search...'}
        </span>
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-400 hidden md:block">
          Ctrl K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Ask AI Button */}
        <button
          onClick={() => onNavigate('assistant')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg cursor-pointer transition-all"
          style={{
            background: 'linear-gradient(135deg, #4f6ef7 0%, #6c8aff 100%)',
            boxShadow: '0 2px 8px rgba(79,110,247,0.25)',
          }}
        >
          <Sparkles className="w-3 h-3" />
          <span>{isAr ? 'المساعد' : 'AI Chat'}</span>
        </button>

        {/* Language Toggle */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{lang === 'en' ? 'ع' : 'EN'}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white"
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl z-50 p-4 space-y-2 animate-fade-in-up"
              style={{
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                right: isAr ? 'auto' : 0,
                left: isAr ? 0 : 'auto',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">
                  {isAr ? 'الإشعارات' : 'Notifications'}
                  {unreadCount > 0 && (
                    <span className="ms-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {isAr ? 'لا توجد إشعارات' : 'No notifications yet'}
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                        n.read
                          ? 'text-slate-500 hover:bg-slate-50'
                          : 'bg-blue-50 text-slate-800 font-medium hover:bg-blue-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'HIGH' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-800">{n.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
