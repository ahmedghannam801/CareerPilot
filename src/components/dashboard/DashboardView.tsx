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

  // Deterministic profile completion (0-100%)
  const profileCompletion = Math.min(
    100,
    (profile.fullName?.trim() ? 15 : 0) +
    (profile.email?.trim() ? 15 : 0) +
    (profile.targetRole?.trim() ? 15 : 0) +
    (profile.headline?.trim() ? 15 : 0) +
    ((profile.skills && profile.skills.length >= 3) ? 15 : (profile.skills && profile.skills.length > 0) ? 5 : 0) +
    (((profile.experience && profile.experience.length > 0) || (profile.education && profile.education.length > 0)) ? 25 : 0)
  );

  const readinessScore = profile.readiness?.overallScore ?? 0;
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider opacity-80">
                {isAr ? 'الإعداد الشخصي مطلوب' : 'Personal Setup Required'}
              </span>
            </div>
            <h2 className="text-base font-bold">
              {isAr
                ? `مرحباً${firstName !== 'صديقي' ? ` ${firstName}` : ''}! أكمل إعدادك لتحصل على تجربة مخصصة.`
                : `Welcome${firstName !== 'Friend' ? ` ${firstName}` : ''}! Complete your setup for a personalized workspace.`}
            </h2>
            <p className="text-xs opacity-70">
              {isAr
                ? 'يستغرق ذلك دقيقتين فقط. ستحصل على مسار مهني ومقترحات وظائف مخصصة لك.'
                : 'Takes just 2 minutes. You\'ll get a personalized career path and job recommendations.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('career')}
            className="shrink-0 px-5 py-2.5 bg-white text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors"
          >
            {isAr ? 'ابدأ الإعداد' : 'Complete Setup'}
          </button>
        </div>
      )}
      {/* A. Personal Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1F3A] tracking-tight">
            {isAr
              ? `لنمضِ بمسارك المهني خطوة للأمام، يا ${firstName}.`
              : `Let's move your career forward, ${firstName}.`}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            {isAr
              ? `أنت في مسار تحقيق هدفك: ${targetRole}. كل خطوة تخطوها اليوم تقربك من العرض الوظيفي.`
              : `Tracking your goal for ${targetRole}. Every focused action moves you closer to placement.`}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] shrink-0">
          <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>{isAr ? 'اليوم: خطوة ذات أولوية' : 'Today: One High-Impact Move'}</span>
        </div>
      </div>

      {/* Three Authentic Scores & Profile Completion Indicator (Strictly Zero Hallucination) */}
      <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        {/* Profile Completion Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDF2F7]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0B1F3A]">
                {isAr ? 'اكتمال الملف المهني' : 'Profile Completion'}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                profileCompletion === 100
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-blue-50 text-blue-700'
              }`}>
                {profileCompletion}%
              </span>
            </div>
            <p className="text-[11.5px] text-[#64748B] mt-0.5">
              {profileCompletion === 100
                ? (isAr ? 'ملفك مكتمل ومستعد لمطابقة الوظائف بدقة.' : 'Your profile is complete for high-accuracy job matching.')
                : (isAr ? 'أكمل معلوماتك المهنية لحساب نقاط الجاهزية بدقة متناهية.' : 'Complete your verified details to compute precision career readiness.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-32 sm:w-44 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#2563EB] h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            {profileCompletion < 100 && (
              <button
                type="button"
                onClick={() => onNavigate('career')}
                className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer shrink-0"
              >
                {isAr ? 'إكمال الملف' : 'Update Profile'}
              </button>
            )}
          </div>
        </div>

        {/* 3 Distinct Assessment Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: CV Quality Score */}
          <div className="p-4 rounded-xl border border-[#E4EAF2] bg-[#FAFBFC] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#64748B] mb-2">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  {isAr ? 'جودة السيرة الذاتية (CV)' : 'CV Quality Score'}
                </span>
                <span className="text-[10px] text-[#94A3B8]">ATS Audit</span>
              </div>

              {bestATS !== null ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#0B1F3A]">{bestATS}%</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      bestATS >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {bestATS >= 80 ? (isAr ? 'ممتاز' : 'Optimized') : (isAr ? 'بحاجة لتحسين' : 'Needs Review')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    {isAr
                      ? 'مبني على تدقيق 5 محاور: البنية، التأثير، الكلمات المفتاحية، المهارات، والصياغة.'
                      : 'Audited across 5 pillars: Structure, Impact, Keywords, Skills, and Readability.'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-[#64748B]">
                    {resumes.length > 0 ? (isAr ? 'في انتظار التحليل' : 'Pending Analysis') : (isAr ? 'لم تُرفع سيرة بعد' : 'No CV Uploaded')}
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    {isAr
                      ? 'ارفع أو أنشئ سيرتك الذاتية لتحليلها وحساب تقييم الـ ATS الحقيقي.'
                      : 'Upload and analyze your CV to get your score.'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#EDF2F7]">
              {bestATS !== null ? (
                <button
                  type="button"
                  onClick={() => onNavigate('cv')}
                  className="w-full py-1.5 text-xs font-bold text-[#2563EB] hover:bg-[#EEF4FF] rounded-lg transition-colors cursor-pointer text-center"
                >
                  {isAr ? 'مراجعة الملاحظات والتحسينات' : 'Review Suggestions & Studio'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('cv')}
                    className="flex-1 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isAr ? 'رفع سيرة' : 'Upload CV'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('cv')}
                    className="flex-1 py-1.5 bg-white border border-[#E4EAF2] text-[#0B1F3A] text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAr ? 'إنشاء سيرة' : 'Create CV'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pillar 2: Career Readiness Score */}
          <div className="p-4 rounded-xl border border-[#E4EAF2] bg-[#FAFBFC] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#64748B] mb-2">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#1683F8]" />
                  {isAr ? 'جاهزية المسار المهني' : 'Career Readiness'}
                </span>
                <span className="text-[10px] text-[#94A3B8]">Overall</span>
              </div>

              {readinessScore > 0 ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#0B1F3A]">{readinessScore}%</span>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {targetRole}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    {isAr
                      ? 'تقييم شامل يجمع المهارات الموثقة، المشاريع المنجزة، والخبرات المؤكدة.'
                      : 'Comprehensive rating combining verified skills, projects, and interview readiness.'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-[#64748B]">0%</div>
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    {isAr
                      ? 'أكمل إعداد ملفك وأنجز مشروعاً عملياً لتفعيل مؤشر الجاهزية المهنية.'
                      : 'Complete your profile and evidence to calculate readiness.'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#EDF2F7]">
              <button
                type="button"
                onClick={() => onNavigate('career')}
                className="w-full py-1.5 text-xs font-bold text-[#2563EB] hover:bg-[#EEF4FF] rounded-lg transition-colors cursor-pointer text-center"
              >
                {isAr ? 'عرض تفاصيل الجاهزية' : 'View Readiness Breakdown'}
              </button>
            </div>
          </div>

          {/* Pillar 3: Target Job Match Score */}
          <div className="p-4 rounded-xl border border-[#E4EAF2] bg-[#FAFBFC] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#64748B] mb-2">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#15803D]" />
                  {isAr ? 'تطابق الوظيفة المستهدفة' : 'Job Match Score'}
                </span>
                <span className="text-[10px] text-[#94A3B8]">Role-Specific</span>
              </div>

              {matchOpportunity && matchOpportunity.matchScore != null ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#15803D]">{matchOpportunity.matchScore}%</span>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                      {matchOpportunity.company}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 truncate">
                    {matchOpportunity.title}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-[#64748B]">
                    {isAr ? 'لم يُقارن بعد' : 'Not Compared Yet'}
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    {isAr
                      ? 'اختر فرصة وظيفية لمطابقتها مع سيرتك واستخراج الكلمات الناقصة.'
                      : 'Select a target job to calculate precise semantic match.'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#EDF2F7]">
              {matchOpportunity ? (
                <button
                  type="button"
                  onClick={() => onSelectOpportunity(matchOpportunity)}
                  className="w-full py-1.5 text-xs font-bold text-[#15803D] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer text-center"
                >
                  {isAr ? 'تخصيص السيرة لهذه الوظيفة' : 'Tailor CV for this Job'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('opportunities')}
                  className="w-full py-1.5 text-xs font-bold text-[#2563EB] hover:bg-[#EEF4FF] rounded-lg transition-colors cursor-pointer text-center"
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
        className="relative bg-white border-2 border-[#2563EB] rounded-2xl p-5 sm:p-7 shadow-xs overflow-hidden"
        style={{
          boxShadow: '0 4px 20px -2px rgba(37,99,235,0.08)',
        }}
      >
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 start-0 end-0 h-1.5 bg-gradient-to-r from-[#2563EB] via-[#1683F8] to-[#22C7E8]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Tag */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#2563EB] bg-[#EEF4FF] px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                {isAr ? 'خطوتك القادمة الأكثر قيمة (My Next Move)' : 'My Next Move'}
              </span>
              <span className="text-[11px] font-bold text-[#64748B] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#94A3B8]" />
                {isAr ? nextMove.effortAr : nextMove.effortEn}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F3A] leading-tight">
              {isAr ? nextMove.titleAr : nextMove.titleEn}
            </h2>

            {/* Why explanation */}
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              {isAr ? nextMove.whyAr : nextMove.whyEn}
            </p>

            {/* Supports metadata */}
            <div className="flex items-center gap-2 text-xs text-[#64748B] pt-1">
              <span className="font-semibold text-[#17253B]">
                {isAr ? nextMove.supportsAr : nextMove.supportsEn}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={() => onNavigate(nextMove.actionTab)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-all text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>{isAr ? nextMove.actionLabelAr : nextMove.actionLabelEn}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={() => onNavigate('career')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#17253B] hover:bg-[#F7F9FC] transition-colors cursor-pointer text-center"
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
      <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1F3A]">
                {isAr ? 'فرص عمل تستحق اهتمامك' : 'Opportunities Worth Your Attention'}
              </h3>
              <p className="text-[12px] text-[#64748B]">
                {isAr
                  ? 'وظائف منتقاة بعناية بناءً على مهاراتك ومعدل التطابق مع متطلباتك'
                  : 'Curated roles based on verified skill alignment and trajectory'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('opportunities')}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
          >
            <span>{isAr ? `عرض الكل (${opportunities.length})` : `View all (${opportunities.length})`}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {/* Vertical List of Opportunities */}
        <div className="divide-y divide-[#EDF2F7]">
          {topMatches.map((opp) => (
            <div
              key={opp.id}
              className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-[#F7F9FC] -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#17253B] truncate group-hover:text-[#2563EB] transition-colors">
                    {opp.title}
                  </h4>
                  <span className="text-[10px] font-bold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full">
                    {opp.workModel || 'Remote'}
                  </span>
                </div>
                <div className="text-xs text-[#64748B] flex items-center gap-2">
                  <span className="font-medium text-[#17253B]">{opp.company}</span>
                  <span>•</span>
                  <span>{opp.location || 'Flexible'}</span>
                  <span>•</span>
                  <span className="text-[#15803D] font-semibold">{opp.salary || 'Competitive'}</span>
                </div>
                {opp.requirements && opp.requirements.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] pt-0.5">
                    <span className="text-[#94A3B8]">{isAr ? 'المهارات المطلوبة:' : 'Key skills:'}</span>
                    <span className="truncate">{opp.requirements.slice(0, 3).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Match Score */}
                <div className="text-end">
                  {opp.matchScore != null ? (
                    <>
                      <div className="text-sm font-black text-[#15803D]">{opp.matchScore}%</div>
                      <div className="text-[10px] text-[#94A3B8]">{isAr ? 'تطابق' : 'Match'}</div>
                    </>
                  ) : (
                    <div className="text-[11px] text-[#94A3B8] text-end leading-tight">
                      {isAr ? 'لم يُحلل' : 'Not analyzed'}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectOpportunity(opp)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#EEF4FF] text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-all cursor-pointer flex items-center gap-1"
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
        <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#0B1F3A]">
                {isAr ? 'طلبات التقديم النشطة' : 'Active Applications'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('applications')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
            >
              {isAr ? 'لوحة المتابعة' : 'Pipeline'}
            </button>
          </div>

          {activeApplications.length > 0 ? (
            <div className="space-y-2">
              {activeApplications.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-xl bg-[#F7F9FC] border border-[#E4EAF2] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#17253B]">{app.jobTitle}</div>
                    <div className="text-[11px] text-[#64748B]">{app.company}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      app.status === 'Interview'
                        ? 'bg-purple-50 text-purple-700'
                        : app.status === 'Applied'
                        ? 'bg-blue-50 text-[#2563EB]'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[#64748B] bg-[#F7F9FC] rounded-xl border border-dashed border-[#E4EAF2]">
              <p>{isAr ? 'لا توجد طلبات تقديم معلقة حالياً' : 'No active applications in pipeline'}</p>
              <button
                onClick={() => onNavigate('opportunities')}
                className="mt-2 text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                {isAr ? 'اختر وظيفة وابدأ التقديم' : 'Find a role and apply'}
              </button>
            </div>
          )}
        </div>

        {/* Evidence & Learning Work */}
        <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-[#20C997]" />
              <h3 className="text-sm font-bold text-[#0B1F3A]">
                {isAr ? 'المشاريع وبناء الأدلة' : 'Practical Evidence & Projects'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
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
                  className="p-3 rounded-xl bg-[#F7F9FC] border border-[#E4EAF2] flex items-center justify-between text-xs hover:border-[#2563EB]/40 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[#17253B] truncate">{proj.title}</div>
                    <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                      <span className="text-[#20C997] font-semibold">{proj.targetSkill}</span>
                      <span>•</span>
                      <span>{proj.duration || '30m'}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      proj.status === 'evaluated'
                        ? 'bg-emerald-50 text-[#15803D]'
                        : proj.status === 'submitted'
                        ? 'bg-blue-50 text-[#2563EB]'
                        : 'bg-slate-100 text-[#64748B]'
                    }`}
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
            <div className="text-center py-6 text-xs text-[#64748B] bg-[#F7F9FC] rounded-xl border border-dashed border-[#E4EAF2]">
              <p>{isAr ? 'ابدأ مشروعاً عملياً لتوثيق مهاراتك' : 'Start a project to prove your competency'}</p>
              <button
                onClick={() => onNavigate('projects')}
                className="mt-2 text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
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
