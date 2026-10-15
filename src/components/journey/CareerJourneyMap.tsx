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
  const analyzedResumes = resumes.filter((r) => r.atsScore !== undefined && r.atsScore !== null);
  const bestATS = analyzedResumes.length > 0 ? Math.max(...analyzedResumes.map((r) => r.atsScore!)) : null;
  // Stage 2 complete when: profile ready + master CV created + (ATS analyzed and passing, OR not yet analyzed)
  const prepareDone = discoverDone && hasMasterCV;

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
      progressPct: prepareDone ? 100 : hasMasterCV ? (bestATS != null ? Math.min(bestATS, 90) : 60) : 30,
      evidenceTextAr: hasMasterCV ? (bestATS != null ? `السيرة جاهزة بنسبة توافق ATS ${bestATS}%` : 'السيرة جاهزة بانتظار التحليل') : 'بانتظار إنشاء أو رفع السيرة',
      evidenceTextEn: hasMasterCV ? (bestATS != null ? `Master resume active • ATS ${bestATS}%` : 'Master resume active • Pending audit') : 'Resume creation pending',
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
      <div className="card-surface" style={{ borderRadius: '16px', padding: '16px 20px' }}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'rgba(184, 196, 255, 0.12)',
                color: 'var(--primary)',
              }}
            >
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-body-strong" style={{ color: 'var(--on-surface)' }}>
                {isAr ? 'مساري المهني (Career Journey)' : 'My Career Journey'}
              </h2>
              <p className="text-micro" style={{ color: 'var(--on-surface-variant)' }}>
                {isAr
                  ? `المحطة الحالية: ${stages.find((s) => s.id === currentStageId)?.titleAr.replace(/^\d+\.\s*/, '')}`
                  : `Current checkpoint: ${stages.find((s) => s.id === currentStageId)?.titleEn.replace(/^\d+\.\s*/, '')}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="badge-pill text-label-caps"
              style={{
                color: 'var(--primary)',
                backgroundColor: 'rgba(184, 196, 255, 0.12)',
                border: '1px solid rgba(184, 196, 255, 0.3)',
              }}
            >
              {overallJourneyPct}% {isAr ? 'مكتمل' : 'Progress'}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('career')}
              className="text-micro flex items-center gap-1 transition-colors cursor-pointer"
              style={{
                color: 'var(--primary)',
                fontWeight: 500,
              }}
            >
              <span>{isAr ? 'خريطة الطريق الكاملة' : 'Full Roadmap'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Progression Track */}
        <div
          className="grid grid-cols-5 gap-2 pt-2"
          style={{ borderTop: '1px solid var(--outline-variant)' }}
        >
          {stages.map((stg) => {
            const Icon = stg.icon;
            const isCompleted = stg.status === 'completed';
            const isCurrent = stg.status === 'current';

            return (
              <button
                type="button"
                key={stg.id}
                onClick={() => onNavigate(stg.targetTab)}
                className="group flex flex-col items-center text-center p-2 rounded-xl transition-all cursor-pointer relative"
                style={{
                  backgroundColor: isCurrent
                    ? 'rgba(184, 196, 255, 0.08)'
                    : 'transparent',
                  border: isCurrent
                    ? '1px solid rgba(184, 196, 255, 0.3)'
                    : '1px solid transparent',
                  opacity: isCompleted || isCurrent ? 1 : 0.7,
                }}
              >
                {/* Node circle */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: isCompleted
                      ? 'var(--tertiary)'
                      : isCurrent
                      ? 'var(--primary-container)'
                      : 'var(--surface-container)',
                    color: isCompleted
                      ? 'var(--on-tertiary)'
                      : isCurrent
                      ? 'var(--on-primary-container)'
                      : 'var(--on-surface-variant)',
                    border: isCompleted || isCurrent ? 'none' : '1px solid var(--outline-variant)',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(184, 196, 255, 0.15)' : 'none',
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Stage short title */}
                <span
                  className="text-label-caps leading-tight line-clamp-1"
                  style={{
                    color: isCurrent
                      ? 'var(--primary)'
                      : isCompleted
                      ? 'var(--on-surface)'
                      : 'var(--on-surface-variant)',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {isAr ? stg.titleAr.replace(/^\d+\.\s*/, '') : stg.titleEn.replace(/^\d+\.\s*/, '')}
                </span>

                {/* Status chip */}
                <span
                  className="text-micro mt-1 px-1.5 py-0.5 rounded-full"
                  style={{
                    color: isCompleted
                      ? 'var(--tertiary)'
                      : isCurrent
                      ? 'var(--primary)'
                      : 'var(--on-surface-variant)',
                    backgroundColor: isCompleted
                      ? 'rgba(78, 222, 163, 0.12)'
                      : isCurrent
                      ? 'rgba(184, 196, 255, 0.12)'
                      : 'transparent',
                    fontWeight: isCurrent ? 600 : 500,
                  }}
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
    <div className="card-surface space-y-6" style={{ borderRadius: '16px', padding: '24px 32px' }}>
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6"
        style={{ borderBottom: '1px solid var(--outline-variant)' }}
      >
        <div>
          <div
            className="flex items-center gap-2 text-label-caps mb-1"
            style={{ color: 'var(--primary)' }}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? 'خريطة التقدم المهني الشاملة' : 'Interactive Career Progression Route'}</span>
          </div>
          <h2 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>
            {isAr ? 'مسارك من التأسيس إلى اقتناص الوظيفة' : 'From Career Foundation to Job Placement'}
          </h2>
          <p className="text-body-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            {isAr
              ? 'نهج مبني على الأدلة الحقيقية: 5 محطات متسلسلة تقودك نحو هدفك الوظيفي بثقة.'
              : 'Evidence-based route: 5 connected checkpoints designed to advance your trajectory.'}
          </p>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl shrink-0"
          style={{
            backgroundColor: 'rgba(184, 196, 255, 0.12)',
            border: '1px solid rgba(184, 196, 255, 0.3)',
          }}
        >
          <div className="text-end">
            <div className="text-micro" style={{ color: 'var(--on-surface-variant)' }}>
              {isAr ? 'إجمالي الإنجاز' : 'Total Progress'}
            </div>
            <div className="text-headline-sm" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              {overallJourneyPct}%
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-micro"
            style={{
              border: '3px solid var(--primary-container)',
              borderTopColor: 'transparent',
              color: 'var(--primary)',
              fontWeight: 600,
            }}
          >
            {completedStages}/5
          </div>
        </div>
      </div>

      {/* Connected Vertical Checkpoints */}
      <div
        className="relative space-y-6"
        style={{
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '16px',
            bottom: '16px',
            insetInlineStart: '24px',
            width: '2px',
            backgroundColor: 'var(--outline-variant)',
          }}
        />
        {stages.map((stg) => {
          const Icon = stg.icon;
          const isCompleted = stg.status === 'completed';
          const isCurrent = stg.status === 'current';

          return (
            <div
              key={stg.id}
              className="relative flex items-start gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl transition-all"
              style={{
                backgroundColor: isCurrent
                  ? 'var(--surface-container)'
                  : isCompleted
                  ? 'var(--surface-container-low)'
                  : 'var(--surface-container-lowest)',
                border: isCurrent
                  ? '1px solid var(--primary)'
                  : '1px solid var(--outline-variant)',
                boxShadow: isCurrent
                  ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 0 0 1px var(--primary)'
                  : 'none',
                opacity: isCompleted || isCurrent ? 1 : 0.75,
              }}
            >
              {/* Checkpoint Badge */}
              <div
                className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all"
                style={{
                  backgroundColor: isCompleted
                    ? 'var(--tertiary)'
                    : isCurrent
                    ? 'var(--primary-container)'
                    : 'var(--surface-container)',
                  color: isCompleted
                    ? 'var(--on-tertiary)'
                    : isCurrent
                    ? 'var(--on-primary-container)'
                    : 'var(--on-surface-variant)',
                  border: isCompleted || isCurrent ? 'none' : '1px solid var(--outline-variant)',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(184, 196, 255, 0.2)' : 'none',
                }}
              >
                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
              </div>

              {/* Checkpoint Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-title-base" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>
                      {isAr ? stg.titleAr : stg.titleEn}
                    </h3>
                    <span
                      className="badge-pill text-label-caps"
                      style={{
                        backgroundColor: isCompleted
                          ? 'rgba(78, 222, 163, 0.12)'
                          : isCurrent
                          ? 'rgba(184, 196, 255, 0.12)'
                          : 'var(--surface-container)',
                        color: isCompleted
                          ? 'var(--tertiary)'
                          : isCurrent
                          ? 'var(--primary)'
                          : 'var(--on-surface-variant)',
                        border: isCompleted
                          ? '1px solid rgba(78, 222, 163, 0.25)'
                          : isCurrent
                          ? '1px solid rgba(184, 196, 255, 0.3)'
                          : '1px solid var(--outline-variant)',
                      }}
                    >
                      {isCompleted
                        ? isAr ? 'مكتمل بنجاح' : 'Completed'
                        : isCurrent
                        ? isAr ? 'المحطة النشطة الحالية' : 'Active Stage'
                        : isAr ? 'محطة قادمة' : 'Upcoming'}
                    </span>
                  </div>

                  <span className="text-mono-metric" style={{ color: 'var(--on-surface-variant)' }}>
                    {stg.progressPct}%
                  </span>
                </div>

                <p className="text-body-sm mb-3" style={{ color: 'var(--on-surface-variant)' }}>
                  {isAr ? stg.subtitleAr : stg.subtitleEn}
                </p>

                {/* Progress Bar */}
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden mb-3"
                  style={{ backgroundColor: 'var(--surface-container)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stg.progressPct}%`,
                      backgroundColor: isCompleted ? 'var(--tertiary)' : 'var(--primary-container)',
                    }}
                  />
                </div>

                {/* Evidence & Action Row */}
                <div
                  className="flex flex-wrap items-center justify-between gap-2 pt-2"
                  style={{ borderTop: '1px solid var(--outline-variant)' }}
                >
                  <div className="text-body-sm flex items-center gap-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                    <span>{isAr ? stg.evidenceTextAr : stg.evidenceTextEn}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate(stg.targetTab)}
                    className="px-3.5 py-1.5 rounded-xl text-micro transition-all flex items-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: isCurrent
                        ? 'var(--primary-container)'
                        : 'rgba(184, 196, 255, 0.12)',
                      color: isCurrent
                        ? 'var(--on-primary-container)'
                        : 'var(--primary)',
                      fontWeight: 600,
                      border: isCurrent ? 'none' : '1px solid rgba(184, 196, 255, 0.3)',
                    }}
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
