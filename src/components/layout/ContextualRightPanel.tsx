import React from 'react';
import {
  Target,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Briefcase,
  Layers,
  GraduationCap,
  Mic,
  Lightbulb,
} from 'lucide-react';
import {
  CareerProfile,
  Opportunity,
  Application,
  ResumeVersion,
  MicroProject,
  Course,
} from '../../types/index.js';

interface ContextualRightPanelProps {
  currentTab: string;
  profile: CareerProfile;
  resumes?: ResumeVersion[];
  opportunities?: Opportunity[];
  applications?: Application[];
  projects?: MicroProject[];
  courses?: Course[];
  onNavigate: (tab: string) => void;
  lang: 'en' | 'ar';
}

export const ContextualRightPanel: React.FC<ContextualRightPanelProps> = ({
  currentTab,
  profile,
  resumes = [],
  opportunities = [],
  applications = [],
  projects = [],
  courses = [],
  onNavigate,
  lang,
}) => {
  const isAr = lang === 'ar';
  const targetRole = profile.targetRole || 'Software Engineer';
  const readiness = profile.readiness?.overallScore ?? null;
  const analyzedResumes = resumes.filter((r) => r.atsScore !== undefined && r.atsScore !== null);
  const bestATS = analyzedResumes.length > 0 ? Math.max(...analyzedResumes.map((r) => r.atsScore!)) : null;

  return (
    <aside
      className="hidden xl:flex flex-col shrink-0 w-72 2xl:w-80 border-s border-hairline p-4 2xl:p-5 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-20 space-y-4"
      style={{ backgroundColor: 'var(--surface-container-lowest)' }}
    >
      {/* 1. Current Target Trajectory Card */}
      <div className="card-surface rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-label-caps" style={{ color: 'var(--primary)' }}>
            <Target className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
            {isAr ? 'الهدف المهني النشط' : 'Active Career Goal'}
          </span>
          {readiness !== null ? (
            <span className="text-micro font-semibold" style={{ color: 'var(--on-surface)' }}>{readiness}%</span>
          ) : (
            <span className="text-micro" style={{ color: 'var(--on-surface-variant)' }}>{isAr ? 'لم يُحسب' : 'Not set'}</span>
          )}
        </div>
        <div className="text-body-strong line-clamp-1" style={{ color: 'var(--on-surface)' }}>
          {targetRole}
        </div>
        <p className="text-micro mt-1 line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>
          {isAr
            ? `مسار معتمد لتحقيق الجاهزية التامة والمنافسة في السوق.`
            : `Verified trajectory to maximize your market positioning and interview rate.`}
        </p>

        {/* Readiness track */}
        <div className="w-full h-1.5 rounded-full overflow-hidden mt-3" style={{ backgroundColor: 'var(--surface-container-high)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${readiness ?? 0}%`, backgroundColor: 'var(--primary)' }}
          />
        </div>
      </div>

      {/* 2. Screen-Specific Contextual Intelligence */}
      {currentTab === 'dashboard' && (
        <>
          {/* AI Guidance Box */}
          <div className="rounded-2xl p-4 border-hairline" style={{ backgroundColor: 'rgba(184, 196, 255, 0.08)', borderColor: 'var(--primary)' }}>
            <div className="flex items-center gap-1.5 text-body-strong mb-1.5" style={{ color: 'var(--primary)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'توجيه الذكاء الاصطناعي' : 'AI Career Guidance'}</span>
            </div>
            <p className="text-body-sm leading-relaxed" style={{ color: 'var(--on-surface)' }}>
              {isAr
                ? `لديك ${opportunities.length} وظيفة متطابقة في السوق. تحسين السيرة لنسبة 90%+ سيرفع معدل استدعاء المقابلات فوراً.`
                : `You have ${opportunities.length} matched roles. Tailoring your CV to 90%+ compatibility will immediately increase your interview callbacks.`}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('cv')}
              className="mt-3 text-body-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              style={{ color: 'var(--primary)' }}
            >
              <span>{isAr ? 'تخصيص السيرة الآن' : 'Tailor CV for Top Match'}</span>
              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </button>
          </div>

          {/* Key Skill Focus Gaps */}
          <div className="space-y-2">
            <div className="text-body-sm font-semibold flex items-center justify-between" style={{ color: 'var(--on-surface)' }}>
              <span>{isAr ? 'المهارات المطلوبة للمسار' : 'Required Role Skills'}</span>
              <span className="text-label-caps" style={{ color: 'var(--primary)' }}>{isAr ? 'مهم' : 'In-demand'}</span>
            </div>
            <div className="space-y-1.5">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.slice(0, 3).map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl border-hairline text-body-sm"
                    style={{ backgroundColor: 'var(--surface-container-low)' }}
                  >
                    <span className="font-medium" style={{ color: 'var(--on-surface)' }}>
                      {typeof skill === 'string'
                        ? skill
                        : ((skill as any).canonicalName || (skill as any).name || 'Skill')}
                    </span>
                    <span className="badge-pill" style={{ backgroundColor: 'rgba(184, 196, 255, 0.12)', color: 'var(--primary)', border: '1px solid rgba(184, 196, 255, 0.25)' }}>
                      {typeof skill === 'object' && skill && 'level' in skill
                        ? (skill as any).level
                        : isAr
                        ? 'موثق'
                        : 'Listed'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-body-sm text-center py-2" style={{ color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'أضف مهاراتك في ملفك الشخصي' : 'Add your skills in Career Profile'}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {currentTab === 'career' && (
        <div className="card-surface rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-body-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span>{isAr ? 'النمط المهني (Career DNA)' : 'Career Archetype'}</span>
          </div>
          <div className="text-body-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {profile.dna?.primaryDirection || profile.dna?.currentLevel || (isAr ? 'مهندس برمجيات ذكي وتطبيقات متكاملة' : 'Full-Stack Systems Engineer')}
          </div>
          <div className="pt-2 border-t border-hairline text-micro" style={{ color: 'var(--on-surface-variant)' }}>
            {isAr
              ? 'يتم تحديث التحليل تلقائياً مع كل مشروع جديد تقدمه وتوثقه.'
              : 'DNA trajectory updates continuously as you build and submit evidence.'}
          </div>
        </div>
      )}

      {currentTab === 'cv' && (
        <div className="rounded-2xl p-4 space-y-3 border-hairline" style={{ backgroundColor: 'rgba(184, 196, 255, 0.08)', borderColor: 'var(--primary)' }}>
          <div className="flex items-center gap-2 text-body-sm font-semibold" style={{ color: 'var(--primary)' }}>
            <FileCheck2 className="w-4 h-4" />
            <span>{isAr ? 'معايير فحص الـ ATS' : 'ATS Audit Checklist'}</span>
          </div>
          <ul className="text-body-sm space-y-2" style={{ color: 'var(--on-surface)' }}>
            <li className="flex items-center gap-1.5">
              <span style={{ color: 'var(--tertiary)' }}>✓</span> {isAr ? 'تنسيق قياسي خالٍ من الجداول المعقدة' : 'Clean single-column ATS layout'}
            </li>
            <li className="flex items-center gap-1.5">
              <span style={{ color: 'var(--tertiary)' }}>✓</span> {isAr ? 'كلمات مفتاحية مطابقة لمتطلبات السوق' : 'Keyword alignment with role'}
            </li>
            <li className="flex items-center gap-1.5">
              <span style={{ color: 'var(--primary)' }}>ℹ</span>
              {bestATS !== null
                ? (isAr ? `أفضل نتيجة ATS مسجلة: ${bestATS}%` : `Best ATS Score: ${bestATS}%`)
                : (isAr ? 'لم يتم تحليل السيرة بعد' : 'Run ATS Audit to get score')}
            </li>
          </ul>
        </div>
      )}

      {currentTab === 'opportunities' && (
        <div className="card-surface rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-body-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
            <Briefcase className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span>{isAr ? 'تلميح التقديم الذكي' : 'Strategic Application Tip'}</span>
          </div>
          <p className="text-body-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {isAr
              ? 'التقديم على الوظائف التي يتجاوز تطابقها 85% مع إرفاق سيرة مخصصة يضاعف فرص استدعائك 3 مرات.'
              : 'Applying to jobs with >85% match using tailored CVs triples your callback probability.'}
          </p>
        </div>
      )}

      {currentTab === 'applications' && (
        <div className="card-surface rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-body-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
            <Layers className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span>{isAr ? 'ملخص مسار التقديم' : 'Pipeline Summary'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-body-sm">
            <div className="p-2 rounded-xl border-hairline" style={{ backgroundColor: 'var(--surface-container)' }}>
              <div className="font-semibold" style={{ color: 'var(--on-surface)' }}>{applications.length}</div>
              <div className="text-micro" style={{ color: 'var(--on-surface-variant)' }}>{isAr ? 'إجمالي الطلبات' : 'Total'}</div>
            </div>
            <div className="p-2 rounded-xl border-hairline" style={{ backgroundColor: 'var(--surface-container)' }}>
              <div className="font-semibold" style={{ color: 'var(--tertiary)' }}>
                {applications.filter((a) => a.status === 'Interview' || a.status === 'Offer').length}
              </div>
              <div className="text-micro" style={{ color: 'var(--on-surface-variant)' }}>{isAr ? 'مقابلات وعروض' : 'Interviews'}</div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'interviews' && (
        <div className="card-surface rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-body-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
            <Mic className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span>{isAr ? 'منهجية الإجابة (STAR)' : 'STAR Method Framework'}</span>
          </div>
          <p className="text-body-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {isAr
              ? 'ركز في كل إجابة على: الموقف (Situation)، المهمة (Task)، الإجراء المتخذ (Action)، والنتيجة بالأرقام (Result).'
              : 'Structure answers: Situation, Task, Action taken, and quantifiable Result.'}
          </p>
        </div>
      )}

      {/* 3. Quick Action Shortcut */}
      <div className="pt-2 border-t border-hairline">
        <button
          type="button"
          onClick={() => onNavigate('assistant')}
          className="btn-primary w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer text-body-sm font-semibold"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" style={{ color: 'var(--secondary)' }} />
            <span>{isAr ? 'استشر المساعد الذكي' : 'Ask Career Coach'}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>
    </aside>
  );
};
