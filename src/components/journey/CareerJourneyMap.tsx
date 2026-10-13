import React from 'react';
import {
  Compass,
  FileCheck2,
  FolderGit2,
  Send,
  Trophy,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  CareerProfile,
  ResumeVersion,
  Opportunity,
  Application,
  MicroProject,
  Course,
  InterviewSession,
} from '../../types/index.js';

export type StageId = 'discover' | 'prepare' | 'evidence' | 'apply' | 'grow';

export interface StageInfo {
  id: StageId;
  number: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  targetTab: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'upcoming' | 'blocked';
  progressPct: number;
  evidenceTextAr: string;
  evidenceTextEn: string;
  nextActionLabelAr: string;
  nextActionLabelEn: string;
}

interface CareerJourneyMapProps {
  profile: CareerProfile;
  resumes?: ResumeVersion[];
  opportunities?: Opportunity[];
  applications?: Application[];
  projects?: MicroProject[];
  courses?: Course[];
  interviews?: InterviewSession[];
  mode?: 'compact' | 'detailed';
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
}

export const CareerJourneyMap: React.FC<CareerJourneyMapProps> = ({
  profile,
  resumes = [],
  opportunities = [],
  applications = [],
  projects = [],
  courses = [],
  interviews = [],
  mode = 'compact',
  onNavigate,
  lang,
}) => {
  const isAr = lang === 'ar';

  // Evaluate real user progress across the 5 stages
  const hasTargetRole = Boolean(profile.targetRole && profile.targetRole.trim().length > 0);
  const hasSkills = Boolean(profile.skills && profile.skills.length >= 3);
  const discoverDone = hasTargetRole && hasSkills;

  const hasMasterCV = Boolean(resumes.some((r) => r.isMaster) || resumes.length > 0);
  const bestATS = Math.max(...(resumes.map((r) => r.atsScore ?? 80)), 80);
  const prepareDone = discoverDone && hasMasterCV && bestATS >= 75;

  const completedProjectsCount = projects.filter((p) => p.status === 'submitted' || p.status === 'evaluated').length;
  const completedCoursesCount = courses.filter((c) => c.enrollmentStatus === 'completed' || (c.progressPercentage ?? 0) >= 100).length;
  const evidenceCount = completedProjectsCount + completedCoursesCount;
  const evidenceDone = prepareDone && evidenceCount >= 1;

  const activeApplicationsCount = applications.length;
  const appliedOrInterviewing = applications.filter((a) => a.status === 'Applied' || a.status === 'Interview' || a.status === 'Offer').length;
  const applyDone = evidenceDone && appliedOrInterviewing >= 1;

  const completedInterviews = interviews.filter((i) => i.completed).length;
  const growDone = applyDone && completedInterviews >= 1;

  // Determine current active stage
  let currentStageId: StageId = 'discover';
  if (discoverDone && !prepareDone) currentStageId = 'prepare';
  else if (prepareDone && !evidenceDone) currentStageId = 'evidence';
  else if (evidenceDone && !applyDone) currentStageId = 'apply';
  else if (applyDone) currentStageId = 'grow';

  const stages: StageInfo[] = [
    {
      id: 'discover',
      number: 1,
      titleAr: '1. استكشاف وتحديد المسار',
      titleEn: '1. Discover & Target Trajectory',
      subtitleAr: 'تحديد الدور المستهدف، تحليل الـ DNA المهني ونقاط القوة الأساسية',
      subtitleEn: 'Target role, career DNA assessment, and core skill trajectory',
      targetTab: 'career',
      icon: Compass,
      status: discoverDone ? 'completed' : currentStageId === 'discover' ? 'current' : 'upcoming',
      progressPct: discoverDone ? 100 : hasTargetRole ? 65 : 25,
      evidenceTextAr: `${profile.targetRole || 'مسار قيد التحديد'} • ${profile.skills?.length || 0} مهارات موثقة`,
      evidenceTextEn: `${profile.targetRole || 'Role pending'} • ${profile.skills?.length || 0} verified skills`,
      nextActionLabelAr: discoverDone ? 'عرض الـ DNA المهني' : 'حدد دورك المستهدف',
      nextActionLabelEn: discoverDone ? 'View Career DNA' : 'Define Target Role',
    },
    {
      id: 'prepare',
      number: 2,
      titleAr: '2. إعداد السيرة والملف المهني',
      titleEn: '2. Prepare & ATS Optimization',
      subtitleAr: 'سيرة ذاتية متوافقة مع أنظمة الـ ATS وتحديد الفجوات المهارية',
      subtitleEn: 'High-score master resume and ATS compatibility audit',
      targetTab: 'cv',
      icon: FileCheck2,
      status: prepareDone
        ? 'completed'
        : currentStageId === 'prepare'
        ? hasMasterCV
          ? 'current'
          : 'current'
        : 'upcoming',
      progressPct: prepareDone ? 100 : hasMasterCV ? Math.min(bestATS, 90) : 30,
      evidenceTextAr: hasMasterCV ? `السيرة جاهزة بنسبة توافق ATS ${bestATS}%` : 'بانتظار إنشاء أو رفع السيرة',
      evidenceTextEn: hasMasterCV ? `Master resume active • ATS ${bestATS}%` : 'Resume creation pending',
      nextActionLabelAr: prepareDone ? 'تخصيص سيرة لوظيفة' : 'تحسين السيرة الذاتية',
      nextActionLabelEn: prepareDone ? 'Tailor for Job' : 'Optimize Resume',
    },
    {
      id: 'evidence',
      number: 3,
      titleAr: '3. بناء الأدلة والمشاريع',
      titleEn: '3. Build Evidence & Proof of Skill',
      subtitleAr: 'مشاريع عملية وشهادات معتمدة لإثبات جاهزيتك العملية أمام الشركات',
      subtitleEn: 'Hands-on micro-projects and certifications verifying your capability',
      targetTab: 'projects',
      icon: FolderGit2,
      status: evidenceDone ? 'completed' : currentStageId === 'evidence' ? 'current' : 'upcoming',
      progressPct: evidenceDone ? 100 : Math.min(evidenceCount * 50, 75),
      evidenceTextAr: `${completedProjectsCount} مشاريع عملية • ${completedCoursesCount} دورات مكتملة`,
      evidenceTextEn: `${completedProjectsCount} completed projects • ${completedCoursesCount} courses done`,
      nextActionLabelAr: evidenceDone ? 'استعراض سجل الأدلة' : 'ابدأ مشروعاً عملياً',
      nextActionLabelEn: evidenceDone ? 'Review Evidence Portfolio' : 'Start Micro-Project',
    },
    {
      id: 'apply',
      number: 4,
      titleAr: '4. التقديم والفرص المستهدفة',
      titleEn: '4. Target & Apply Strategically',
      subtitleAr: 'اقتناص أفضل الفرص المتوافقة وتتبع مسار التقديم خطوة بخطوة',
      subtitleEn: 'Matched opportunities, tailored applications, and submission tracking',
      targetTab: 'opportunities',
      icon: Send,
      status: applyDone ? 'completed' : currentStageId === 'apply' ? 'current' : 'upcoming',
      progressPct: applyDone ? 100 : activeApplicationsCount > 0 ? 60 : 20,
      evidenceTextAr: `${activeApplicationsCount} طلبات متابعة • ${opportunities.length} وظيفة متطابقة`,
      evidenceTextEn: `${activeApplicationsCount} tracked applications • ${opportunities.length} live matches`,
      nextActionLabelAr: activeApplicationsCount > 0 ? 'متابعة الطلبات' : 'استكشف الوظائف المتوافقة',
      nextActionLabelEn: activeApplicationsCount > 0 ? 'Track Pipeline' : 'Discover Opportunities',
    },
    {
      id: 'grow',
      number: 5,
      titleAr: '5. المقابلات والتطور المهني',
      titleEn: '5. Interview Prep & Career Growth',
      subtitleAr: 'تدريب صوتي وتقني مع الذكاء الاصطناعي لاجتياز المقابلات وقبول العروض',
      subtitleEn: 'Voice AI simulator, behavioral feedback, and offer readiness',
      targetTab: 'interviews',
      icon: Trophy,
      status: growDone ? 'completed' : currentStageId === 'grow' ? 'current' : 'upcoming',
      progressPct: growDone ? 100 : completedInterviews > 0 ? 50 : 15,
      evidenceTextAr: `${completedInterviews} جلسات مقابلة مكتملة بنجاح`,
      evidenceTextEn: `${completedInterviews} simulated interview sessions`,
      nextActionLabelAr: 'ابدأ محاكاة المقابلة الصوتية',
      nextActionLabelEn: 'Practice Voice Interview',
    },
  ];

  // Overall journey percentage
  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const overallJourneyPct = Math.round((completedStages / 5) * 100);

  if (mode === 'compact') {
    return (
      <div className="bg-white border border-[#E4EAF2] rounded-2xl p-4 sm:p-5 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#17253B]">
                {isAr ? 'مساري المهني (Career Journey)' : 'My Career Journey'}
              </h2>
              <p className="text-[12px] text-[#64748B]">
                {isAr
                  ? `المحطة الحالية: ${stages.find((s) => s.id === currentStageId)?.titleAr.replace(/^\d+\.\s*/, '')}`
                  : `Current checkpoint: ${stages.find((s) => s.id === currentStageId)?.titleEn.replace(/^\d+\.\s*/, '')}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-[#2563EB] bg-[#EEF4FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              {overallJourneyPct}% {isAr ? 'مكتمل' : 'Progress'}
            </span>
            <button
              onClick={() => onNavigate('career')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isAr ? 'خريطة الطريق الكاملة' : 'Full Roadmap'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Progression Track */}
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-[#EDF2F7]">
          {stages.map((stg) => {
            const Icon = stg.icon;
            const isCompleted = stg.status === 'completed';
            const isCurrent = stg.status === 'current';

            return (
              <button
                key={stg.id}
                onClick={() => onNavigate(stg.targetTab)}
                className={`group flex flex-col items-center text-center p-2 rounded-xl transition-all cursor-pointer relative ${
                  isCurrent
                    ? 'bg-[#EEF4FF] border border-[#2563EB]/30'
                    : isCompleted
                    ? 'hover:bg-slate-50'
                    : 'opacity-70 hover:opacity-100 hover:bg-slate-50'
                }`}
              >
                {/* Node circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
                    isCompleted
                      ? 'bg-[#15803D] text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[#2563EB] text-white ring-4 ring-[#2563EB]/15'
                      : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E4EAF2]'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Stage short title */}
                <span
                  className={`text-[11px] font-semibold leading-tight line-clamp-1 ${
                    isCurrent
                      ? 'text-[#2563EB]'
                      : isCompleted
                      ? 'text-[#17253B]'
                      : 'text-[#64748B]'
                  }`}
                >
                  {isAr ? stg.titleAr.replace(/^\d+\.\s*/, '') : stg.titleEn.replace(/^\d+\.\s*/, '')}
                </span>

                {/* Status chip */}
                <span
                  className={`text-[9.5px] font-medium mt-1 px-1.5 py-0.5 rounded-full ${
                    isCompleted
                      ? 'text-[#15803D] bg-emerald-50'
                      : isCurrent
                      ? 'text-[#2563EB] bg-blue-100/60 font-bold'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {isCompleted
                    ? isAr ? 'مكتمل' : 'Done'
                    : isCurrent
                    ? isAr ? 'الحالية' : 'Current'
                    : isAr ? 'قادم' : 'Next'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Detailed Full Roadmap View
  return (
    <div className="bg-white border border-[#E4EAF2] rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EDF2F7]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? 'خريطة التقدم المهني الشاملة' : 'Interactive Career Progression Route'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#17253B]">
            {isAr ? 'مسارك من التأسيس إلى اقتناص الوظيفة' : 'From Career Foundation to Job Placement'}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            {isAr
              ? 'نهج مبني على الأدلة الحقيقية: 5 محطات متسلسلة تقودك نحو هدفك الوظيفي بثقة.'
              : 'Evidence-based route: 5 connected checkpoints designed to advance your trajectory.'}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#EEF4FF] border border-[#2563EB]/20 px-4 py-3 rounded-xl shrink-0">
          <div className="text-end">
            <div className="text-xs text-[#64748B]">{isAr ? 'إجمالي الإنجاز' : 'Total Progress'}</div>
            <div className="text-xl font-black text-[#2563EB]">{overallJourneyPct}%</div>
          </div>
          <div className="w-10 h-10 rounded-full border-3 border-[#2563EB] border-t-transparent flex items-center justify-center font-bold text-xs text-[#2563EB]">
            {completedStages}/5
          </div>
        </div>
      </div>

      {/* Connected Vertical Checkpoints */}
      <div className="relative space-y-6 before:absolute before:top-4 before:bottom-4 before:start-6 before:w-0.5 before:bg-[#E4EAF2]">
        {stages.map((stg) => {
          const Icon = stg.icon;
          const isCompleted = stg.status === 'completed';
          const isCurrent = stg.status === 'current';

          return (
            <div
              key={stg.id}
              className={`relative flex items-start gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-[#F7F9FC] border-[#2563EB] shadow-xs ring-1 ring-[#2563EB]/20'
                  : isCompleted
                  ? 'bg-white border-[#E4EAF2] hover:border-slate-300'
                  : 'bg-white/50 border-[#E4EAF2] opacity-75'
              }`}
            >
              {/* Checkpoint Badge */}
              <div
                className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all ${
                  isCompleted
                    ? 'bg-[#15803D] text-white shadow-xs'
                    : isCurrent
                    ? 'bg-[#2563EB] text-white ring-4 ring-[#2563EB]/20'
                    : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E4EAF2]'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
              </div>

              {/* Checkpoint Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#17253B]">
                      {isAr ? stg.titleAr : stg.titleEn}
                    </h3>
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-50 text-[#15803D] border border-emerald-200'
                          : isCurrent
                          ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                          : 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {isCompleted
                        ? isAr ? 'مكتمل بنجاح' : 'Completed'
                        : isCurrent
                        ? isAr ? 'المحطة النشطة الحالية' : 'Active Stage'
                        : isAr ? 'محطة قادمة' : 'Upcoming'}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-[#64748B]">
                    {stg.progressPct}%
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#64748B] mb-3">
                  {isAr ? stg.subtitleAr : stg.subtitleEn}
                </p>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stg.progressPct}%`,
                      backgroundColor: isCompleted ? '#15803D' : '#2563EB',
                    }}
                  />
                </div>

                {/* Evidence & Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EDF2F7]">
                  <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{isAr ? stg.evidenceTextAr : stg.evidenceTextEn}</span>
                  </div>

                  <button
                    onClick={() => onNavigate(stg.targetTab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-xs'
                        : 'bg-[#EEF4FF] text-[#2563EB] hover:bg-[#DBEAFE]'
                    }`}
                  >
                    <span>{isAr ? stg.nextActionLabelAr : stg.nextActionLabelEn}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
