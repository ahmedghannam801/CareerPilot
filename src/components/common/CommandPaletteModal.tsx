import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  LayoutDashboard,
  Compass,
  FileText,
  Briefcase,
  Layers,
  FolderGit2,
  GraduationCap,
  Mail,
  Mic,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { Opportunity } from '../../types/index.js';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  opportunities?: Opportunity[];
  onOpenLinkedInSync?: () => void;
  onStartOnboarding?: () => void;
  lang: 'en' | 'ar';
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  opportunities = [],
  onOpenLinkedInSync,
  onStartOnboarding,
  lang,
}) => {
  const [query, setQuery] = useState('');
  const isAr = lang === 'ar';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const navigationItems = [
    {
      id: 'dashboard',
      title: isAr ? 'لوحة القيادة والمؤشرات' : 'Dashboard & Overview',
      category: isAr ? 'التنقل الرئيسي' : 'Navigation',
      icon: LayoutDashboard,
      shortcut: '1',
    },
    {
      id: 'career',
      title: isAr ? 'هويتي المهنية والـ DNA والمهارات' : 'Career DNA & Readiness Pillars',
      category: isAr ? 'الملف المهني' : 'Profile',
      icon: Compass,
      shortcut: '2',
    },
    {
      id: 'cv',
      title: isAr ? 'استوديو السيرة الذاتية وفحص ATS' : 'CV Studio & ATS Optimizer',
      category: isAr ? 'الملف المهني' : 'Profile',
      icon: FileText,
      shortcut: '3',
    },
    {
      id: 'opportunities',
      title: isAr ? 'الفرص ومطابقة الوظائف الحية' : 'Opportunities & Hiring Sync',
      category: isAr ? 'الوظائف والتقديم' : 'Jobs',
      icon: Briefcase,
      shortcut: '4',
    },
    {
      id: 'applications',
      title: isAr ? 'متابعة مراحل طلبات التوظيف' : 'Applications Pipeline Tracker',
      category: isAr ? 'الوظائف والتقديم' : 'Jobs',
      icon: Layers,
      shortcut: '5',
    },
    {
      id: 'projects',
      title: isAr ? 'المشاريع المصغرة وإثبات المهارة' : 'Skill Gap Micro-Projects',
      category: isAr ? 'التطوير والتعلم' : 'Growth',
      icon: FolderGit2,
      shortcut: '6',
    },
    {
      id: 'courses',
      title: isAr ? 'الكورسات التخصصية ومسارات التعلم' : 'Courses & Skill Development',
      category: isAr ? 'التطوير والتعلم' : 'Growth',
      icon: GraduationCap,
      shortcut: '7',
    },
    {
      id: 'email',
      title: isAr ? 'ذكاء وتحليل البريد الإلكتروني' : 'Career Email Intelligence',
      category: isAr ? 'الوظائف والتقديم' : 'Jobs',
      icon: Mail,
      shortcut: '8',
    },
    {
      id: 'interviews',
      title: isAr ? 'محاكي المقابلات المهنية الذكي' : 'Mock Interview Simulator',
      category: isAr ? 'التطوير والتعلم' : 'Growth',
      icon: Mic,
      shortcut: '9',
    },
    {
      id: 'assistant',
      title: isAr ? 'مساعد كاريير بايلوت الذكي' : 'AI Career Assistant & Chat',
      category: isAr ? 'الدعم والمساعدة' : 'Support',
      icon: MessageSquare,
      shortcut: 'A',
    },
    {
      id: 'settings',
      title: isAr ? 'الخصوصية والذاكرة وإعادة التعيين' : 'Privacy, Memory & Settings',
      category: isAr ? 'الدعم والمساعدة' : 'Support',
      icon: ShieldCheck,
      shortcut: 'S',
    },
  ];

  const filteredNav = useMemo(() => {
    if (!query.trim()) return navigationItems;
    const q = query.toLowerCase();
    return navigationItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [navigationItems, query]);

  const matchedJobs = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return opportunities
      .filter(
        (opp) =>
          opp.title.toLowerCase().includes(q) ||
          opp.company.toLowerCase().includes(q) ||
          opp.requirements.some((r) => r.toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [opportunities, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-3 pt-6 sm:p-4 sm:pt-20 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[calc(100dvh-3rem)] sm:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-200 bg-neutral-50/50 shrink-0">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث عن أي قسم، وظيفة، مهارة، أو أداة... (اكتب ما تبحث عنه)'
                : 'Search any page, job role, skill, or tool...'
            }
            className="flex-1 text-sm bg-transparent outline-none text-neutral-900 placeholder:text-neutral-400 font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-neutral-200 rounded-md text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 bg-white border border-neutral-200 rounded text-neutral-500 shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Quick Actions Shortcuts */}
          {!query && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 block mb-2">
                {isAr ? 'إجراءات سريعة فورية' : 'Quick Actions'}
              </span>
              <div className="grid grid-cols-2 gap-2 px-1">
                <button
                  onClick={() => {
                    onNavigate('cv');
                    onClose();
                  }}
                  className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-100 flex items-center gap-2.5 text-neutral-800 transition-colors text-right"
                >
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate font-medium">
                    {isAr ? 'فحص السيرة الذاتية (ATS)' : 'Audit Resume ATS'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('interviews');
                    onClose();
                  }}
                  className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-100 flex items-center gap-2.5 text-neutral-800 transition-colors text-right"
                >
                  <Mic className="w-4 h-4 text-violet-600 shrink-0" />
                  <span className="truncate font-medium">
                    {isAr ? 'بدء مقابلة تجريبية' : 'Start Mock Interview'}
                  </span>
                </button>
                {onOpenLinkedInSync && (
                  <button
                    onClick={() => {
                      onOpenLinkedInSync();
                      onClose();
                    }}
                    className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-100 flex items-center gap-2.5 text-neutral-800 transition-colors text-right"
                  >
                    <span className="w-4 h-4 rounded bg-[#0077B5] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      in
                    </span>
                    <span className="truncate font-medium">
                      {isAr ? 'مزامنة مع LinkedIn' : 'Sync with LinkedIn'}
                    </span>
                  </button>
                )}
                {onStartOnboarding && (
                  <button
                    onClick={() => {
                      onStartOnboarding();
                      onClose();
                    }}
                    className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-100 flex items-center gap-2.5 text-neutral-800 transition-colors text-right"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate font-medium">
                      {isAr ? 'إعادة التهيئة الذكية' : 'AI Onboarding'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Matched Opportunities (if query provided) */}
          {matchedJobs.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 block mb-1.5">
                {isAr ? 'وظائف متطابقة مع بحثك' : 'Matched Opportunities'}
              </span>
              <div className="space-y-1">
                {matchedJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => {
                      onNavigate('opportunities');
                      onClose();
                    }}
                    className="p-2.5 hover:bg-neutral-100/80 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Briefcase className="w-4 h-4 text-neutral-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-neutral-900 block truncate">
                          {job.title}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {job.company} · {job.workModel} · {job.matchScore != null ? `${job.matchScore}% ${isAr ? 'توافق' : 'fit'}` : (isAr ? 'غير محلل' : 'Not analyzed')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 block mb-1.5">
              {isAr ? 'الأقسام والصفحات' : 'Navigation & Views'}
            </span>
            <div className="space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className="p-2.5 hover:bg-neutral-100 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white flex items-center justify-center transition-colors text-neutral-600 shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-900 group-hover:text-indigo-600 transition-colors block">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-neutral-400">{item.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-900 rtl:rotate-180 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="shrink-0 p-3 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-between text-[11px] text-neutral-500">
          <span>{isAr ? 'استخدم الأسهم أو الفأرة للتنقل' : 'Use arrow keys or click to navigate'}</span>
          <span className="font-mono text-[10px]">CareerPilot AI Command Hub</span>
        </div>
      </div>
    </div>
  );
};
