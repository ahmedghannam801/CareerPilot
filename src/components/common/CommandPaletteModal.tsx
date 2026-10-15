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
    <div className="glass-surface fixed inset-0 z-50 flex items-start justify-center p-3 pt-6 sm:p-4 sm:pt-20 animate-in fade-in duration-150" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose}>
      <div
        className="card-surface rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[calc(100dvh-3rem)] sm:max-h-[80vh]"
        style={{ backgroundColor: 'var(--surface)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-hairline shrink-0" style={{ borderBottomColor: 'var(--border)', backgroundColor: 'var(--surface-container)' }}>
          <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--on-surface-variant)' }} />
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
            className="input-field flex-1 text-body-base bg-transparent outline-none font-medium"
            style={{ color: 'var(--on-surface)', border: 'none', padding: 0 }}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="btn-secondary p-1 rounded-md"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-label-caps px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--on-surface-variant)' }}>
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-body-sm">
          {/* Quick Actions Shortcuts */}
          {!query && (
            <div>
              <span className="text-label-caps px-3 block mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                {isAr ? 'إجراءات سريعة فورية' : 'Quick Actions'}
              </span>
              <div className="grid grid-cols-2 gap-2 px-1">
                <button
                  onClick={() => {
                    onNavigate('cv');
                    onClose();
                  }}
                  className="btn-secondary p-2.5 rounded-xl flex items-center gap-2.5 text-right"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
                >
                  <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--primary)' }} />
                  <span className="truncate font-medium text-body-sm">
                    {isAr ? 'فحص السيرة الذاتية (ATS)' : 'Audit Resume ATS'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('interviews');
                    onClose();
                  }}
                  className="btn-secondary p-2.5 rounded-xl flex items-center gap-2.5 text-right"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
                >
                  <Mic className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="truncate font-medium text-body-sm">
                    {isAr ? 'بدء مقابلة تجريبية' : 'Start Mock Interview'}
                  </span>
                </button>
                {onOpenLinkedInSync && (
                  <button
                    onClick={() => {
                      onOpenLinkedInSync();
                      onClose();
                    }}
                    className="btn-secondary p-2.5 rounded-xl flex items-center gap-2.5 text-right"
                    style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
                  >
                    <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: '#0077B5', color: 'white' }}>
                      in
                    </span>
                    <span className="truncate font-medium text-body-sm">
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
                    className="btn-secondary p-2.5 rounded-xl flex items-center gap-2.5 text-right"
                    style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--warning)' }} />
                    <span className="truncate font-medium text-body-sm">
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
              <span className="text-label-caps px-3 block mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
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
                    className="p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-container)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Briefcase className="w-4 h-4 shrink-0" style={{ color: 'var(--on-surface-variant)' }} />
                      <div className="truncate">
                        <span className="font-semibold block truncate text-body-sm" style={{ color: 'var(--on-surface)' }}>
                          {job.title}
                        </span>
                        <span className="text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>
                          {job.company} · {job.workModel} · {job.matchScore != null ? `${job.matchScore}% ${isAr ? 'توافق' : 'fit'}` : (isAr ? 'غير محلل' : 'Not analyzed')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" style={{ color: 'var(--on-surface-variant)' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div>
            <span className="text-label-caps px-3 block mb-1.5" style={{ color: 'var(--on-surface-variant)' }}>
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
                    className="p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-container)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0" style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold transition-colors block text-body-sm" style={{ color: 'var(--on-surface)' }}>
                          {item.title}
                        </span>
                        <span className="text-label-caps" style={{ color: 'var(--on-surface-variant)' }}>{item.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 transition-colors rtl:rotate-180" style={{ color: 'var(--on-surface-variant)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="shrink-0 p-3 border-hairline flex items-center justify-between text-body-xs" style={{ borderTopColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
          <span>{isAr ? 'استخدم الأسهم أو الفأرة للتنقل' : 'Use arrow keys or click to navigate'}</span>
          <span className="font-mono text-label-caps">CareerPilot AI Command Hub</span>
        </div>
      </div>
    </div>
  );
};
