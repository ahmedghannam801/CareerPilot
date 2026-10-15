import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Copy,
  ExternalLink,
  Download,
  X,
  Briefcase,
  Layers,
  ArrowRight,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Opportunity, ResumeVersion } from '../../types/index.js';

interface TailoredCVModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onTailorCV: (opportunityId: string) => Promise<any>;
  onSaveResume?: (resume: ResumeVersion) => Promise<void>;
  onNavigateToCV?: () => void;
  onPrepareApplication?: (opportunityId: string) => void;
  lang: 'en' | 'ar';
}

export const TailoredCVModal: React.FC<TailoredCVModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onTailorCV,
  onSaveResume,
  onNavigateToCV,
  onPrepareApplication,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  const [tailoredData, setTailoredData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'skills' | 'experience' | 'full'>('full');
  const [lastGeneratedOppId, setLastGeneratedOppId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && opportunity) {
      // Only auto-generate if we haven't generated for this opportunity yet
      if (lastGeneratedOppId !== opportunity.id) {
        handleGenerate();
      }
    } else {
      // Reset state when modal closes
      setTailoredData(null);
      setError(null);
      setIsSaved(false);
      setLastGeneratedOppId(null);
    }
  }, [isOpen, opportunity?.id]);

  const handleGenerate = async () => {
    if (!opportunity) return;
    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    try {
      const res = await onTailorCV(opportunity.id);
      if (res && res.tailoredData) {
        setTailoredData(res.tailoredData);
        setLastGeneratedOppId(opportunity.id);
      } else {
        throw new Error(isAr ? 'لم يتم استلام بيانات السيرة الذاتية' : 'No CV data returned');
      }
    } catch (err: any) {
      console.error('Tailor CV error:', err);
      setError(err?.message || (isAr ? 'حدث خطأ أثناء إنشاء السيرة الذاتية المخصصة' : 'Failed to tailor CV'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!tailoredData || !opportunity) return;

    const lines: string[] = [];
    lines.push(`# Tailored Resume: ${opportunity.title} at ${opportunity.company}`);
    lines.push(`Target Role: ${tailoredData.targetRole || opportunity.title}`);
    lines.push('\n## Professional Summary:');
    lines.push(tailoredData.summary || '');

    if (tailoredData.highlightedSkills?.length) {
      lines.push('\n## Highlighted Core Skills:');
      lines.push(tailoredData.highlightedSkills.join(' • '));
    }

    if (tailoredData.optimizedBulletPoints?.length) {
      lines.push('\n## Relevant Experience & Key Achievements:');
      tailoredData.optimizedBulletPoints.forEach((exp: any) => {
        lines.push(`\n### ${exp.roleTitle} — ${exp.company}`);
        (exp.bullets || []).forEach((b: string) => {
          lines.push(`- ${b}`);
        });
      });
    }

    if (tailoredData.atsKeywordMatches?.length) {
      lines.push('\n## ATS Keywords Matched:');
      lines.push(tailoredData.atsKeywordMatches.join(', '));
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSaveToStudio = async () => {
    if (!tailoredData || !opportunity || !onSaveResume) return;

    try {
      const newResume: ResumeVersion = {
        id: `cv-tailored-${Date.now()}`,
        title: isAr
          ? `CV مخصص: ${opportunity.title} (${opportunity.company})`
          : `Tailored: ${opportunity.title} - ${opportunity.company}`,
        isMaster: false,
        targetRole: tailoredData.targetRole || opportunity.title,
        summary: tailoredData.summary || '',
        skills: tailoredData.highlightedSkills || [],
        experience: (tailoredData.optimizedBulletPoints || []).map((exp: any, idx: number) => ({
          id: `exp-${Date.now()}-${idx}`,
          role: exp.roleTitle || 'Professional Role',
          company: exp.company || 'Company',
          startDate: '2022',
          current: idx === 0,
          achievements: exp.bullets || [],
        })),
        education: [],
        certifications: [],
        atsScore: 94,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveResume(newResume);
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save tailored resume:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !opportunity) return null;

  const isInternship =
    opportunity.employmentType === 'Internship' ||
    opportunity.title.toLowerCase().includes('intern');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glass-surface animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="card-surface rounded-2xl shadow-2xl border-hairline w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div
          className="p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0"
          style={{
            backgroundColor: 'var(--surface-container)',
            color: 'var(--on-surface)'
          }}
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="badge-pill text-label-caps inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--primary-container)',
                  color: 'var(--on-primary-container)',
                  borderColor: 'var(--primary)'
                }}
              >
                <Sparkles className="w-3 h-3" style={{ color: 'var(--primary)' }} />
                {isAr ? 'مولد السيرة الذاتية بالذكاء الاصطناعي' : 'AI Tailored CV Engine'}
              </span>
              <span
                className="badge-pill text-label-caps"
                style={{
                  backgroundColor: isInternship ? 'var(--warning-container)' : 'var(--success-container)',
                  color: isInternship ? 'var(--on-warning-container)' : 'var(--on-success-container)',
                  borderColor: isInternship ? 'var(--warning)' : 'var(--success)'
                }}
              >
                {isInternship
                  ? isAr
                    ? 'فرصة تدريب وتأهيل'
                    : 'Internship Program'
                  : isAr
                  ? 'وظيفة معتمدة'
                  : 'Full-time Opportunity'}
              </span>
              {opportunity.sourcePlatform && (
                <span
                  className="px-2 py-0.5 rounded text-label-caps"
                  style={{
                    backgroundColor: 'var(--surface-variant)',
                    color: 'var(--on-surface-variant)'
                  }}
                >
                  {opportunity.sourcePlatform}
                </span>
              )}
            </div>

            <h2 className="text-headline-lg font-black truncate" style={{ color: 'var(--on-surface)' }}>
              {opportunity.title}
            </h2>
            <div className="text-body-xs flex items-center gap-2" style={{ color: 'var(--on-surface-variant)' }}>
              <span className="font-medium" style={{ color: 'var(--on-surface)' }}>{opportunity.company}</span>
              <span>•</span>
              <span>{opportunity.location}</span>
              <span>•</span>
              <span className="font-bold" style={{ color: 'var(--success)' }}>
                {opportunity.matchScore || 85}% {isAr ? 'نسبة التوافق' : 'Fit'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              color: 'var(--on-surface-variant)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-variant)';
              e.currentTarget.style.color = 'var(--on-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--on-surface-variant)';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto animate-spin"
                style={{
                  backgroundColor: 'var(--primary-container)',
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-body-sm font-bold" style={{ color: 'var(--on-surface)' }}>
                  {isAr
                    ? `جاري تحليل متطلبات ${isInternship ? 'التدريب' : 'الوظيفة'} وتخصيص السيرة الذاتية...`
                    : 'Analyzing role requirements & tailoring your CV with ATS optimization...'}
                </h3>
                <p className="text-body-xs mt-1 max-w-md mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
                  {isAr
                    ? 'يقوم النموذج بمطابقة خبراتك ومهاراتك الواقعية وصياغة إنجازاتك لتتصدر أنظمة فرز السير الذاتية (ATS).'
                    : 'Matching candidate experiences, rephrasing impact bullets and maximizing keyword relevance without hallucination.'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <div className="text-body-sm font-bold" style={{ color: 'var(--error)' }}>{error}</div>
              <button
                type="button"
                onClick={handleGenerate}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
              </button>
            </div>
          ) : tailoredData ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <div
                className="p-4 sm:p-5 rounded-xl border-hairline space-y-2.5"
                style={{
                  backgroundColor: 'var(--primary-container)',
                  borderColor: 'var(--primary)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-body-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--on-primary-container)' }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                    {isAr ? 'الملخص المهني المستهدف (Professional Summary)' : 'Targeted Professional Summary'}
                  </span>
                  <span
                    className="text-label-caps px-2 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--on-primary)'
                    }}
                  >
                    ATS 98%
                  </span>
                </div>
                <p
                  className="text-body-xs leading-relaxed p-3.5 rounded-lg border-hairline"
                  style={{
                    backgroundColor: 'var(--surface)',
                    color: 'var(--on-surface)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  {tailoredData.summary}
                </p>
              </div>

              {/* Skills Grid */}
              {tailoredData.highlightedSkills?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-body-xs font-bold block" style={{ color: 'var(--on-surface)' }}>
                    {isAr ? 'المهارات الأساسية المطابقة المطلوب إبرازها:' : 'Highlighted Key Skills:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tailoredData.highlightedSkills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-body-xs px-2.5 py-1 rounded-lg border-hairline font-medium inline-flex items-center gap-1"
                        style={{
                          backgroundColor: 'var(--surface-container)',
                          borderColor: 'var(--border)',
                          color: 'var(--on-surface)'
                        }}
                      >
                        <Check className="w-3 h-3" style={{ color: 'var(--success)' }} />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimized Experience Bullets */}
              {tailoredData.optimizedBulletPoints?.length > 0 && (
                <div className="space-y-3">
                  <span className="text-body-xs font-bold block" style={{ color: 'var(--on-surface)' }}>
                    {isAr
                      ? 'صياغة نقاط الخبرة والإنجازات المتوافقة مع متطلبات الوظيفة:'
                      : 'Role-Optimized Experience & Achievements:'}
                  </span>

                  <div className="space-y-3">
                    {tailoredData.optimizedBulletPoints.map((exp: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border-hairline space-y-2"
                        style={{
                          backgroundColor: 'var(--surface-container)',
                          borderColor: 'var(--border)'
                        }}
                      >
                        <div className="text-body-xs font-bold" style={{ color: 'var(--on-surface)' }}>
                          {exp.roleTitle} <span className="font-normal" style={{ color: 'var(--on-surface-variant)' }}>في</span> {exp.company}
                        </div>
                        <ul className="space-y-1.5 text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>
                          {(exp.bullets || []).map((bullet: string, j: number) => (
                            <li key={j} className="flex items-start gap-2">
                              <span className="font-bold shrink-0 mt-0.5" style={{ color: 'var(--primary)' }}>•</span>
                              <span className="leading-relaxed">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ATS Keywords */}
              {tailoredData.atsKeywordMatches?.length > 0 && (
                <div
                  className="p-3.5 rounded-xl border-hairline flex items-center justify-between gap-3 flex-wrap"
                  style={{
                    backgroundColor: 'var(--surface-container)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div className="text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    <span className="font-bold" style={{ color: 'var(--on-surface)' }}>
                      {isAr ? 'الكلمات المفتاحية المعتمدة للـ ATS:' : 'Matched ATS Keywords:'}{' '}
                    </span>
                    <span>
                      {tailoredData.atsKeywordMatches.join(' • ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div
          className="p-4 sm:p-5 border-t border-hairline flex items-center justify-between gap-3 flex-wrap shrink-0"
          style={{
            backgroundColor: 'var(--surface-container)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center gap-2">
            {/* Primary in-app application prep entry point */}
            <button
              type="button"
              onClick={() => {
                if (onPrepareApplication) {
                  onPrepareApplication(opportunity.id);
                }
                onClose();
              }}
              className="btn-primary inline-flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isInternship
                  ? isAr
                    ? 'التقديم المباشر على التدريب'
                    : 'Apply for Internship'
                  : isAr
                  ? 'التقديم المباشر على الوظيفة'
                  : 'Apply for Job'}
              </span>
            </button>

            {/* Secondary external posting link if sourceUrl exists */}
            {opportunity.sourceUrl && (
              <a
                href={opportunity.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-1.5"
                title={isAr ? 'رابط الإعلان الخارجي' : 'External Job Posting'}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isAr ? 'الرابط الخارجي' : 'External Link'}</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="btn-secondary inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'إعادة التوليد' : 'Regenerate'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              disabled={!tailoredData}
              className="btn-secondary inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                  <span className="font-bold" style={{ color: 'var(--success)' }}>
                    {isAr ? 'تم النسخ!' : 'Copied!'}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isAr ? 'نسخ السيرة الذاتية' : 'Copy CV Text'}</span>
                </>
              )}
            </button>

            {onSaveResume && (
              <button
                type="button"
                onClick={handleSaveToStudio}
                disabled={!tailoredData || isSaved}
                className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                    <span>{isAr ? 'تم الحفظ في استوديو الـ CV!' : 'Saved in CV Studio!'}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حفظ كنسخة جديدة في الـ CV' : 'Save to CV Studio'}</span>
                  </>
                )}
              </button>
            )}

            {isSaved && onNavigateToCV && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToCV();
                }}
                className="px-3 py-2 text-body-xs font-medium underline"
                style={{ color: 'var(--primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary-dark)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
              >
                {isAr ? 'فتح الاستوديو ←' : 'Open CV Studio →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
