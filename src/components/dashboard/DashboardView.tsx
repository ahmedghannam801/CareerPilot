import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  FileCheck2,
  FolderGit2,
  GraduationCap,
  Mic,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Layers,
  Send,
  Zap,
  Upload,
  Plus,
  FileText,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  CareerProfile,
  Opportunity,
  Application,
  EmailEvent,
  MicroProject,
  Course,
  ResumeVersion,
  InterviewSession,
} from '../../types/index.js';
import { CareerJourneyMap } from '../journey/CareerJourneyMap.js';
import { calculateProfileCompletion, calculateDynamicCareerReadiness } from '../../lib/scoring.js';

interface DashboardViewProps {
  profile: CareerProfile;
  opportunities: Opportunity[];
  applications: Application[];
  emailEvents: EmailEvent[];
  projects: MicroProject[];
  courses?: Course[];
  resumes?: ResumeVersion[];
  interviews?: InterviewSession[];
  onNavigate: (tab: string) => void;
  onRefreshNBA: () => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  onSelectProject: (proj: MicroProject) => void;
  lang: 'en' | 'ar';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  opportunities = [],
  applications = [],
  projects = [],
  courses = [],
  resumes = [],
  interviews = [],
  onNavigate,
  onSelectOpportunity,
  onSelectProject,
  lang,
}) => {
  const isAr = lang === 'ar';
  const targetRole = profile.targetRole || 'Software Engineer';
  const firstName = profile.fullName ? profile.fullName.split(' ')[0] : (isAr ? 'صديقي' : 'Friend');

  // Real user state calculations (Strictly Zero Hallucination)
  const hasMasterCV = resumes.length > 0;
  const analyzedResumes = resumes.filter((r) => r.atsScore !== undefined && r.atsScore !== null);
  const bestATS = analyzedResumes.length > 0 ? Math.max(...analyzedResumes.map((r) => r.atsScore!)) : null;
  const pendingProjects = projects.filter((p) => p.status === 'in_progress' || p.status === 'available');
  const topOpportunity = opportunities[0];

  // Deterministic profile completion (0-100%) dynamically calculated
  const profileCompletion = calculateProfileCompletion(profile);

  // Dynamic 8-pillar career readiness score calculated from live projects, interviews & resumes
  const dynamicReadiness = calculateDynamicCareerReadiness(profile, {
    projects,
    interviews,
    resumes,
  });
  const readinessScore = profile.readiness?.overallScore && profile.readiness.overallScore > 0
    ? profile.readiness.overallScore
    : dynamicReadiness.overallScore;

  const matchOpportunity = opportunities.find((o) => o.matchScore !== undefined && o.matchScore !== null);

  let nextMove = {
    titleAr: `تخصيص السيرة الذاتية لوظيفة ${topOpportunity?.title || targetRole}`,
    titleEn: `Tailor your CV for ${topOpportunity?.title || targetRole}`,
    whyAr: topOpportunity
      ? `نسبة تطابقك الحالية ${topOpportunity.matchScore}%. تخصيص الكلمات المفتاحية يرفع فرص استدعاء المقابلة بمقدار 3 أضعاف.`
      : `رفع نسبة توافق السيرة مع أنظمة الـ ATS يضمن وصول ملفك لمدراء التوظيف بسرعة.`,
    whyEn: topOpportunity
      ? `Current match is ${topOpportunity.matchScore}%. Tailoring missing keywords will triple your interview callback rate.`
      : `Optimizing for ATS keywords ensures your profile passes recruiter screen filters immediately.`,
    supportsAr: `الوظيفة المستهدفة: ${topOpportunity?.company || 'الشركات التقنية الرائدة'} • المسار: ${targetRole}`,
    supportsEn: `Target: ${topOpportunity?.company || 'Leading Tech Firms'} • Trajectory: ${targetRole}`,
    effortAr: '~20 دقيقة',
    effortEn: '~20 mins',
    actionTab: 'cv',
    actionLabelAr: 'ابدأ التخصيص الآن',
    actionLabelEn: 'Start Tailoring Now',
  };

  if (!hasMasterCV) {
    nextMove = {
      titleAr: 'إنشاء وضبط السيرة الذاتية الأساسية (Master CV)',
      titleEn: 'Create & Audit Your Master Resume',
      whyAr: 'السيرة الذاتية هي حجر الأساس؛ سنقوم بفحصها عبر خوارزميات الـ ATS وتحديد نقاط القوة والفجوات.',
      whyEn: 'Your master resume is the foundation. We will audit ATS compatibility and highlight gaps.',
      supportsAr: `بناء مسارك نحو: ${targetRole}`,
      supportsEn: `Building trajectory for: ${targetRole}`,
      effortAr: '~15 دقيقة',
      effortEn: '~15 mins',
      actionTab: 'cv',
      actionLabelAr: 'إعداد السيرة الذاتية',
      actionLabelEn: 'Set Up Master CV',
    };
  } else if (pendingProjects.length > 0 && bestATS !== null && bestATS >= 85) {
    const proj = pendingProjects[0];
    nextMove = {
      titleAr: `إنجاز مشروع عملي: ${proj.title}`,
      titleEn: `Complete Micro-Project: ${proj.title}`,
      whyAr: `إثبات المهارات العملية عبر المشاريع يمنحك أفضلية حاسمة تتفوق بها على المرشحين الآخرين.`,
      whyEn: `Tangible skill evidence sets your application apart and validates your practical competency.`,
      supportsAr: `إثبات مهارة: ${proj.targetSkill}`,
      supportsEn: `Verifies: ${proj.targetSkill}`,
      effortAr: proj.duration || '~45 دقيقة',
      effortEn: proj.duration || '~45 mins',
      actionTab: 'projects',
      actionLabelAr: 'متابعة المشروع',
      actionLabelEn: 'Continue Project',
    };
  }

  // Active work items (Applications in flight, ongoing projects, active courses)
  const activeApplications = applications.filter((a) => a.status === 'Preparing' || a.status === 'Applied' || a.status === 'Interview');
  const activeProjects = projects.filter((p) => p.status === 'in_progress');
  const activeCourses = courses.filter((c) => c.enrollmentStatus === 'in_progress' && (c.progressPercentage ?? 0) < 100);

  // Top matching opportunities (first 3)
  const topMatches = opportunities.slice(0, 3);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* New User — Onboarding Incomplete Banner */}
      {!profile.onboardingCompleted && (
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg, var(--primary-container) 0%, var(--primary) 100%)', color: 'var(--on-primary-container)' }}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-label-caps" style={{ opacity: 0.8 }}>
                {isAr ? 'الإعداد الشخصي مطلوب' : 'Personal Setup Required'}
              </span>
            </div>
            <h2 className="text-headline-sm">
              {isAr
                ? `مرحباً${firstName !== 'صديقي' ? ` ${firstName}` : ''}! أكمل إعدادك لتحصل على تجربة مخصصة.`
                : `Welcome${firstName !== 'Friend' ? ` ${firstName}` : ''}! Complete your setup for a personalized workspace.`}
            </h2>
            <p className="text-body-sm" style={{ opacity: 0.7 }}>
              {isAr
                ? 'يستغرق ذلك دقيقتين فقط. ستحصل على مسار مهني ومقترحات وظائف مخصصة لك.'
                : 'Takes just 2 minutes. You\'ll get a personalized career path and job recommendations.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('career')}
            className="btn-secondary shrink-0"
          >
            {isAr ? 'ابدأ الإعداد' : 'Complete Setup'}
          </button>
        </div>
      )}
      {/* A. Personal Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
        <div>
          <h1 className="text-display-hero-mobile sm:text-display-hero" style={{ color: 'var(--on-surface)' }}>
            {isAr
              ? `لنمضِ بمسارك المهني خطوة للأمام، يا ${firstName}.`
              : `Let's move your career forward, ${firstName}.`}
          </h1>
          <p className="text-body-base sm:text-title-base" style={{ color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
            {isAr
              ? `أنت في مسار تحقيق هدفك: ${targetRole}. كل خطوة تخطوها اليوم تقربك من العرض الوظيفي.`
              : `Tracking your goal for ${targetRole}. Every focused action moves you closer to placement.`}
          </p>
        </div>

        <div className="flex items-center gap-2 text-body-strong shrink-0" style={{ color: 'var(--on-surface-variant)' }}>
          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
          <span>{isAr ? 'اليوم: خطوة ذات أولوية' : 'Today: One High-Impact Move'}</span>
        </div>
      </div>

      {/* Three Authentic Scores & Profile Completion Indicator (Strictly Zero Hallucination) */}
      <div className="card-surface space-y-5">
        {/* Profile Completion Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-hairline" style={{ borderColor: 'var(--outline-variant)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-label-strong" style={{ color: 'var(--on-surface)' }}>
                {isAr ? 'اكتمال الملف المهني' : 'Profile Completion'}
              </span>
              <span className="badge-pill" style={{
                backgroundColor: profileCompletion === 100 ? 'var(--success-container)' : 'var(--primary-container)',
                color: profileCompletion === 100 ? 'var(--on-success-container)' : 'var(--on-primary-container)'
              }}>
                {profileCompletion}%
              </span>
            </div>
            <p className="text-body-xs" style={{ color: 'var(--on-surface-variant)', marginTop: '0.125rem' }}>
              {profileCompletion === 100
                ? (isAr ? 'ملفك مكتمل ومستعد لمطابقة الوظائف بدقة.' : 'Your profile is complete for high-accuracy job matching.')
                : (isAr ? 'أكمل معلوماتك المهنية لحساب نقاط الجاهزية بدقة متناهية.' : 'Complete your verified details to compute precision career readiness.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-32 sm:w-44 rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--surface-container-highest)' }}>
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%`, backgroundColor: 'var(--primary)' }}
              />
            </div>
            {profileCompletion < 100 && (
              <button
                type="button"
                onClick={() => onNavigate('career')}
                className="text-label-strong shrink-0 hover:underline cursor-pointer"
                style={{ color: 'var(--primary)' }}
              >
                {isAr ? 'إكمال الملف' : 'Update Profile'}
              </button>
            )}
          </div>
        </div>

        {/* 3 Distinct Assessment Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: CV Quality Score */}
          <div className="surface-elevated p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-label-strong mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                  {isAr ? 'جودة السيرة الذاتية (CV)' : 'CV Quality Score'}
                </span>
                <span className="text-label-xs" style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>ATS Audit</span>
              </div>

              {bestATS !== null ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-display-lg" style={{ color: 'var(--on-surface)' }}>{bestATS}%</span>
                    <span className="badge-pill" style={{
                      backgroundColor: bestATS >= 80 ? 'var(--success-container)' : 'var(--warning-container)',
                      color: bestATS >= 80 ? 'var(--on-success-container)' : 'var(--on-warning-container)'
                    }}>
                      {bestATS >= 80 ? (isAr ? 'ممتاز' : 'Optimized') : (isAr ? 'بحاجة لتحسين' : 'Needs Review')}
                    </span>
                  </div>
                  <p className="text-body-xs" style={{ color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
                    {isAr
                      ? 'مبني على تدقيق 5 محاور: البنية، التأثير، الكلمات المفتاحية، المهارات، والصياغة.'
                      : 'Audited across 5 pillars: Structure, Impact, Keywords, Skills, and Readability.'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-title-sm" style={{ color: 'var(--on-surface-variant)' }}>
                    {resumes.length > 0 ? (isAr ? 'في انتظار التحليل' : 'Pending Analysis') : (isAr ? 'لم تُرفع سيرة بعد' : 'No CV Uploaded')}
                  </div>
                  <p className="text-body-xs" style={{ color: 'var(--on-surface-variant)', opacity: 0.7, marginTop: '0.25rem' }}>
                    {isAr
                      ? 'ارفع أو أنشئ سيرتك الذاتية لتحليلها وحساب تقييم الـ ATS الحقيقي.'
                      : 'Upload and analyze your CV to get your score.'}
                  </p>
                </div>
              )}
            </div>

            <div className="border-hairline" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderColor: 'var(--outline-variant)' }}>
              {bestATS !== null ? (
                <button
                  type="button"
                  onClick={() => onNavigate('cv')}
                  className="w-full py-1.5 text-label-strong rounded-lg transition-colors cursor-pointer text-center"
                  style={{ color: 'var(--primary)', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-container)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {isAr ? 'مراجعة الملاحظات والتحسينات' : 'Review Suggestions & Studio'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('cv')}
                    className="btn-primary flex-1 flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isAr ? 'رفع سيرة' : 'Upload CV'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('cv')}
                    className="btn-secondary flex-1 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAr ? 'إنشاء سيرة' : 'Create CV'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pillar 2: Career Readiness Score */}
          <div className="surface-elevated p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-label-strong mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--tertiary)' }} />
                  {isAr ? 'جاهزية المسار المهني' : 'Career Readiness'}
                </span>
                <span className="text-label-xs" style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>Overall</span>
              </div>

              {readinessScore > 0 ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-display-lg" style={{ color: 'var(--on-surface)' }}>{readinessScore}%</span>
                    <span className="badge-pill" style={{
                      backgroundColor: 'var(--tertiary-container)',
                      color: 'var(--on-tertiary-container)'
                    }}>
                      {targetRole}
                    </span>
                  </div>
                  <p className="text-body-xs" style={{ color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
                    {isAr
                      ? 'تقييم شامل يجمع المهارات الموثقة، المشاريع المنجزة، والخبرات المؤكدة.'
                      : 'Comprehensive rating combining verified skills, projects, and interview readiness.'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-title-sm" style={{ color: 'var(--on-surface-variant)' }}>0%</div>
                  <p className="text-body-xs" style={{ color: 'var(--on-surface-variant)', opacity: 0.7, marginTop: '0.25rem' }}>
                    {isAr
                      ? 'أكمل إعداد ملفك وأنجز مشروعاً عملياً لتفعيل مؤشر الجاهزية المهنية.'
                      : 'Complete your profile and evidence to calculate readiness.'}
                  </p>
                </div>
              )}
            </div>

            <div className="border-hairline" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderColor: 'var(--outline-variant)' }}>
              <button
                type="button"
                onClick={() => onNavigate('career')}
                className="w-full py-1.5 text-label-strong rounded-lg transition-colors cursor-pointer text-center"
                style={{ color: 'var(--primary)', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-container)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isAr ? 'عرض تفاصيل الجاهزية' : 'View Readiness Breakdown'}
              </button>
            </div>
          </div>

          {/* Pillar 3: Target Job Match Score */}
          <div className="surface-elevated p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-label-strong mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                  {isAr ? 'تطابق الوظيفة المستهدفة' : 'Job Match Score'}
                </span>
                <span className="text-label-xs" style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>Role-Specific</span>
              </div>

              {matchOpportunity && matchOpportunity.matchScore != null ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-display-lg" style={{ color: 'var(--success)' }}>{matchOpportunity.matchScore}%</span>
                    <span className="badge-pill truncate max-w-[120px]" style={{
                      backgroundColor: 'var(--success-container)',
                      color: 'var(--on-success-container)'
                    }}>
                      {matchOpportunity.company}
                    </span>
                  </div>
                  <p className="text-body-xs truncate" style={{ color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
                    {matchOpportunity.title}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-title-sm" style={{ color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'لم يُقارن بعد' : 'Not Compared Yet'}
                  </div>
                  <p className="text-body-xs" style={{ color: 'var(--on-surface-variant)', opacity: 0.7, marginTop: '0.25rem' }}>
                    {isAr
                      ? 'اختر فرصة وظيفية لمطابقتها مع سيرتك واستخراج الكلمات الناقصة.'
                      : 'Select a target job to calculate precise semantic match.'}
                  </p>
                </div>
              )}
            </div>

            <div className="border-hairline" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderColor: 'var(--outline-variant)' }}>
              {matchOpportunity ? (
                <button
                  type="button"
                  onClick={() => onSelectOpportunity(matchOpportunity)}
                  className="w-full py-1.5 text-label-strong rounded-lg transition-colors cursor-pointer text-center"
                  style={{ color: 'var(--success)', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--success-container)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {isAr ? 'تخصيص السيرة لهذه الوظيفة' : 'Tailor CV for this Job'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('opportunities')}
                  className="w-full py-1.5 text-label-strong rounded-lg transition-colors cursor-pointer text-center"
                  style={{ color: 'var(--primary)', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-container)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {isAr ? 'استكشف الوظائف المتاحة' : 'Discover Opportunities'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* B. The Next Move (Single most prominent section) */}
      <div
        className="relative card-surface overflow-hidden"
        style={{
          borderWidth: '2px',
          borderColor: 'var(--primary)',
          boxShadow: '0 4px 20px -2px var(--primary-shadow)',
        }}
      >
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 start-0 end-0 h-1.5" style={{ background: 'linear-gradient(90deg, var(--primary) 0%, var(--tertiary) 50%, var(--secondary) 100%)' }} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Tag */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-label-caps rounded-full px-2.5 py-0.5 border-hairline" style={{
                color: 'var(--primary)',
                backgroundColor: 'var(--primary-container)',
                borderColor: 'var(--primary)'
              }}>
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? 'خطوتك القادمة الأكثر قيمة (My Next Move)' : 'My Next Move'}
              </span>
              <span className="text-label-strong flex items-center gap-1" style={{ color: 'var(--on-surface-variant)' }}>
                <Clock className="w-3 h-3" style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }} />
                {isAr ? nextMove.effortAr : nextMove.effortEn}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-headline-lg leading-tight" style={{ color: 'var(--on-surface)' }}>
              {isAr ? nextMove.titleAr : nextMove.titleEn}
            </h2>

            {/* Why explanation */}
            <p className="text-body-base leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
              {isAr ? nextMove.whyAr : nextMove.whyEn}
            </p>

            {/* Supports metadata */}
            <div className="flex items-center gap-2 text-body-sm pt-1" style={{ color: 'var(--on-surface-variant)' }}>
              <span className="text-body-strong" style={{ color: 'var(--on-surface)' }}>
                {isAr ? nextMove.supportsAr : nextMove.supportsEn}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(nextMove.actionTab)}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>{isAr ? nextMove.actionLabelAr : nextMove.actionLabelEn}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('career')}
              className="px-4 py-2 rounded-xl text-label-base transition-colors cursor-pointer text-center"
              style={{ color: 'var(--on-surface-variant)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--on-surface)';
                e.currentTarget.style.backgroundColor = 'var(--surface-container-high)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--on-surface-variant)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {isAr ? 'عرض خريطة المسار' : 'View Full Roadmap'}
            </button>
          </div>
        </div>
      </div>

      {/* C. My Journey Compact Roadmap */}
      <CareerJourneyMap
        profile={profile}
        resumes={resumes}
        opportunities={opportunities}
        applications={applications}
        projects={projects}
        courses={courses}
        interviews={interviews}
        mode="compact"
        onNavigate={onNavigate}
        lang={lang}
      />

      {/* D. Opportunities Worth Your Attention */}
      <div className="card-surface space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary-container)', color: 'var(--primary)' }}>
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-title-sm" style={{ color: 'var(--on-surface)' }}>
                {isAr ? 'فرص عمل تستحق اهتمامك' : 'Opportunities Worth Your Attention'}
              </h3>
              <p className="text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>
                {isAr
                  ? 'وظائف منتقاة بعناية بناءً على مهاراتك ومعدل التطابق مع متطلباتك'
                  : 'Curated roles based on verified skill alignment and trajectory'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('opportunities')}
            className="text-label-base flex items-center gap-1 cursor-pointer"
            style={{ color: 'var(--primary)' }}
          >
            <span>{isAr ? `عرض الكل (${opportunities.length})` : `View all (${opportunities.length})`}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {/* Vertical List of Opportunities */}
        <div style={{ borderTop: '1px solid var(--outline-variant)' }}>
          {topMatches.map((opp) => (
            <div
              key={opp.id}
              className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group -mx-2 px-2 rounded-xl transition-colors"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-container-highest)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-title-sm truncate transition-colors" style={{ color: 'var(--on-surface)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--on-surface)'}
                  >
                    {opp.title}
                  </h4>
                  <span className="badge-pill" style={{
                    backgroundColor: 'var(--surface-container-high)',
                    color: 'var(--on-surface-variant)'
                  }}>
                    {opp.workModel || 'Remote'}
                  </span>
                </div>
                <div className="text-body-xs flex items-center gap-2" style={{ color: 'var(--on-surface-variant)' }}>
                  <span className="text-body-strong" style={{ color: 'var(--on-surface)' }}>{opp.company}</span>
                  <span>•</span>
                  <span>{opp.location || 'Flexible'}</span>
                  <span>•</span>
                  <span className="text-body-strong" style={{ color: 'var(--success)' }}>{opp.salary || 'Competitive'}</span>
                </div>
                {opp.requirements && opp.requirements.length > 0 && (
                  <div className="flex items-center gap-1.5 text-body-xs pt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                    <span style={{ opacity: 0.7 }}>{isAr ? 'المهارات المطلوبة:' : 'Key skills:'}</span>
                    <span className="truncate">{opp.requirements.slice(0, 3).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Match Score */}
                <div className="text-end">
                  {opp.matchScore != null ? (
                    <>
                      <div className="text-title-sm" style={{ color: 'var(--success)' }}>{opp.matchScore}%</div>
                      <div className="text-label-xs" style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>{isAr ? 'تطابق' : 'Match'}</div>
                    </>
                  ) : (
                    <div className="text-body-xs text-end leading-tight" style={{ color: 'var(--on-surface-variant)', opacity: 0.7 }}>
                      {isAr ? 'لم يُحلل' : 'Not analyzed'}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectOpportunity(opp)}
                  className="px-3.5 py-1.5 rounded-xl text-label-strong transition-all cursor-pointer flex items-center gap-1"
                  style={{
                    backgroundColor: 'var(--primary-container)',
                    color: 'var(--primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                    e.currentTarget.style.color = 'var(--on-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-container)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                >
                  <span>{isAr ? 'تخصيص وتقديم' : 'Tailor & Apply'}</span>
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* E. My Active Work (Compact ongoing tasks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Applications */}
        <div className="card-surface space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <h3 className="text-title-sm" style={{ color: 'var(--on-surface)' }}>
                {isAr ? 'طلبات التقديم النشطة' : 'Active Applications'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('applications')}
              className="text-label-base cursor-pointer"
              style={{ color: 'var(--primary)' }}
            >
              {isAr ? 'لوحة المتابعة' : 'Pipeline'}
            </button>
          </div>

          {activeApplications.length > 0 ? (
            <div className="space-y-2">
              {activeApplications.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-xl border-hairline flex items-center justify-between text-body-sm"
                  style={{
                    backgroundColor: 'var(--surface-container-highest)',
                    borderColor: 'var(--outline-variant)'
                  }}
                >
                  <div>
                    <div className="text-body-strong" style={{ color: 'var(--on-surface)' }}>{app.jobTitle}</div>
                    <div className="text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>{app.company}</div>
                  </div>
                  <span
                    className="badge-pill"
                    style={{
                      backgroundColor: app.status === 'Interview'
                        ? 'var(--tertiary-container)'
                        : app.status === 'Applied'
                        ? 'var(--primary-container)'
                        : 'var(--warning-container)',
                      color: app.status === 'Interview'
                        ? 'var(--on-tertiary-container)'
                        : app.status === 'Applied'
                        ? 'var(--on-primary-container)'
                        : 'var(--on-warning-container)'
                    }}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-body-sm rounded-xl border border-dashed" style={{
              color: 'var(--on-surface-variant)',
              backgroundColor: 'var(--surface-container-highest)',
              borderColor: 'var(--outline-variant)'
            }}>
              <p>{isAr ? 'لا توجد طلبات تقديم معلقة حالياً' : 'No active applications in pipeline'}</p>
              <button
                type="button"
                onClick={() => onNavigate('opportunities')}
                className="text-label-strong hover:underline cursor-pointer"
                style={{ marginTop: '0.5rem', color: 'var(--primary)' }}
              >
                {isAr ? 'اختر وظيفة وابدأ التقديم' : 'Find a role and apply'}
              </button>
            </div>
          )}
        </div>

        {/* Evidence & Learning Work */}
        <div className="card-surface space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4" style={{ color: 'var(--secondary)' }} />
              <h3 className="text-title-sm" style={{ color: 'var(--on-surface)' }}>
                {isAr ? 'المشاريع وبناء الأدلة' : 'Practical Evidence & Projects'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-label-base cursor-pointer"
              style={{ color: 'var(--primary)' }}
            >
              {isAr ? 'كل المشاريع' : 'All Projects'}
            </button>
          </div>

          {projects.length > 0 ? (
            <div className="space-y-2">
              {projects.slice(0, 3).map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className="p-3 rounded-xl border-hairline flex items-center justify-between text-body-sm transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-container-highest)',
                    borderColor: 'var(--outline-variant)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--outline-variant)'}
                >
                  <div className="min-w-0">
                    <div className="text-body-strong truncate" style={{ color: 'var(--on-surface)' }}>{proj.title}</div>
                    <div className="flex items-center gap-1.5 text-body-xs" style={{ color: 'var(--on-surface-variant)', marginTop: '0.125rem' }}>
                      <span className="text-body-strong" style={{ color: 'var(--secondary)' }}>{proj.targetSkill}</span>
                      <span>•</span>
                      <span>{proj.duration || '30m'}</span>
                    </div>
                  </div>
                  <span
                    className="badge-pill shrink-0"
                    style={{
                      backgroundColor: proj.status === 'evaluated'
                        ? 'var(--success-container)'
                        : proj.status === 'submitted'
                        ? 'var(--primary-container)'
                        : 'var(--surface-container-high)',
                      color: proj.status === 'evaluated'
                        ? 'var(--on-success-container)'
                        : proj.status === 'submitted'
                        ? 'var(--on-primary-container)'
                        : 'var(--on-surface-variant)'
                    }}
                  >
                    {proj.status === 'evaluated'
                      ? isAr ? 'معتمد' : 'Verified'
                      : proj.status === 'submitted'
                      ? isAr ? 'قيد المراجعة' : 'Submitted'
                      : isAr ? 'متاح' : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-body-sm rounded-xl border border-dashed" style={{
              color: 'var(--on-surface-variant)',
              backgroundColor: 'var(--surface-container-highest)',
              borderColor: 'var(--outline-variant)'
            }}>
              <p>{isAr ? 'ابدأ مشروعاً عملياً لتوثيق مهاراتك' : 'Start a project to prove your competency'}</p>
              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className="text-label-strong hover:underline cursor-pointer"
                style={{ marginTop: '0.5rem', color: 'var(--primary)' }}
              >
                {isAr ? 'استعراض المشاريع' : 'Explore Projects'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
