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

  // Compute "The Next Move" dynamically from real state
  const hasMasterCV = resumes.length > 0;
  const bestATS = Math.max(...(resumes.map((r) => r.atsScore ?? 80)), 80);
  const pendingProjects = projects.filter((p) => p.status === 'in_progress' || p.status === 'available');
  const topOpportunity = opportunities[0];

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
  } else if (pendingProjects.length > 0 && bestATS >= 85) {
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
                  <div className="text-sm font-black text-[#15803D]">{opp.matchScore}%</div>
                  <div className="text-[10px] text-[#94A3B8]">{isAr ? 'تطابق' : 'Match'}</div>
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
