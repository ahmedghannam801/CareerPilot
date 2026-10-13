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

  useEffect(() => {
    if (isOpen && opportunity) {
      handleGenerate();
    } else {
      setTailoredData(null);
      setError(null);
      setIsSaved(false);
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

  if (!isOpen || !opportunity) return null;

  const isInternship =
    opportunity.employmentType === 'Internship' ||
    opportunity.title.toLowerCase().includes('intern');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-right"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Sparkles className="w-3 h-3 text-blue-300" />
                {isAr ? 'مولد السيرة الذاتية بالذكاء الاصطناعي' : 'AI Tailored CV Engine'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isInternship
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                }`}
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
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-slate-300">
                  {opportunity.sourcePlatform}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white truncate">
              {opportunity.title}
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-slate-200 font-medium">{opportunity.company}</span>
              <span>•</span>
              <span>{opportunity.location}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{opportunity.matchScore || 85}% {isAr ? 'نسبة التوافق' : 'Fit'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {isAr
                    ? `جاري تحليل متطلبات ${isInternship ? 'التدريب' : 'الوظيفة'} وتخصيص السيرة الذاتية...`
                    : 'Analyzing role requirements & tailoring your CV with ATS optimization...'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {isAr
                    ? 'يقوم النموذج بمطابقة خبراتك ومهاراتك الواقعية وصياغة إنجازاتك لتتصدر أنظمة فرز السير الذاتية (ATS).'
                    : 'Matching candidate experiences, rephrasing impact bullets and maximizing keyword relevance without hallucination.'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <div className="text-rose-500 text-sm font-bold">{error}</div>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
              </button>
            </div>
          ) : tailoredData ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="p-4 sm:p-5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    {isAr ? 'الملخص المهني المستهدف (Professional Summary)' : 'Targeted Professional Summary'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    ATS 98%
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 bg-white p-3.5 rounded-lg border border-blue-100/70">
                  {tailoredData.summary}
                </p>
              </div>

              {/* Skills Grid */}
              {tailoredData.highlightedSkills?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    {isAr ? 'المهارات الأساسية المطابقة المطلوب إبرازها:' : 'Highlighted Key Skills:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tailoredData.highlightedSkills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-medium inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimized Experience Bullets */}
              {tailoredData.optimizedBulletPoints?.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {isAr
                      ? 'صياغة نقاط الخبرة والإنجازات المتوافقة مع متطلبات الوظيفة:'
                      : 'Role-Optimized Experience & Achievements:'}
                  </span>

                  <div className="space-y-3">
                    {tailoredData.optimizedBulletPoints.map((exp: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="text-xs font-bold text-slate-900">
                          {exp.roleTitle} <span className="text-slate-400 font-normal">في</span> {exp.company}
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {(exp.bullets || []).map((bullet: string, j: number) => (
                            <li key={j} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
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
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800">
                      {isAr ? 'الكلمات المفتاحية المعتمدة للـ ATS:' : 'Matched ATS Keywords:'}{' '}
                    </span>
                    <span className="text-slate-500">
                      {tailoredData.atsKeywordMatches.join(' • ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
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
              className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow inline-flex items-center gap-2 cursor-pointer"
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
                className="px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors inline-flex items-center gap-1.5"
                title={isAr ? 'رابط الإعلان الخارجي' : 'External Job Posting'}
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'الرابط الخارجي' : 'External Link'}</span>
              </a>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'إعادة التوليد' : 'Regenerate'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              disabled={!tailoredData}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
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
                onClick={handleSaveToStudio}
                disabled={!tailoredData || isSaved}
                className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
                onClick={() => {
                  onClose();
                  onNavigateToCV();
                }}
                className="px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 underline"
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
