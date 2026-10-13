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
      className="hidden xl:flex flex-col shrink-0 w-72 2xl:w-80 bg-white border-s border-[#E4EAF2] p-4 2xl:p-5 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-20 space-y-4"
    >
      {/* 1. Current Target Trajectory Card */}
      <div className="bg-[#F7F9FC] border border-[#E4EAF2] rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs text-[#64748B] mb-1.5">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#2563EB]">
            <Target className="w-3.5 h-3.5 text-[#2563EB]" />
            {isAr ? 'الهدف المهني النشط' : 'Active Career Goal'}
          </span>
          {readiness !== null ? (
            <span className="text-[11px] font-black text-[#17253B]">{readiness}%</span>
          ) : (
            <span className="text-[11px] text-[#94A3B8]">{isAr ? 'لم يُحسب' : 'Not set'}</span>
          )}
        </div>
        <div className="text-sm font-black text-[#17253B] line-clamp-1">
          {targetRole}
        </div>
        <p className="text-[11.5px] text-[#64748B] mt-1 line-clamp-2">
          {isAr
            ? `مسار معتمد لتحقيق الجاهزية التامة والمنافسة في السوق.`
            : `Verified trajectory to maximize your market positioning and interview rate.`}
        </p>

        {/* Readiness track */}
        <div className="w-full h-1.5 bg-[#E4EAF2] rounded-full overflow-hidden mt-3">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
            style={{ width: `${readiness ?? 0}%` }}
          />
        </div>
      </div>

      {/* 2. Screen-Specific Contextual Intelligence */}
      {currentTab === 'dashboard' && (
        <>
          {/* AI Guidance Box */}
          <div className="bg-[#EEF4FF] border border-[#2563EB]/20 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB] mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'توجيه الذكاء الاصطناعي' : 'AI Career Guidance'}</span>
            </div>
            <p className="text-xs text-[#17253B] leading-relaxed">
              {isAr
                ? `لديك ${opportunities.length} وظيفة متطابقة في السوق. تحسين السيرة لنسبة 90%+ سيرفع معدل استدعاء المقابلات فوراً.`
                : `You have ${opportunities.length} matched roles. Tailoring your CV to 90%+ compatibility will immediately increase your interview callbacks.`}
            </p>
            <button
              onClick={() => onNavigate('cv')}
              className="mt-3 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isAr ? 'تخصيص السيرة الآن' : 'Tailor CV for Top Match'}</span>
              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </button>
          </div>

          {/* Key Skill Focus Gaps */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#17253B] flex items-center justify-between">
              <span>{isAr ? 'المهارات المطلوبة للمسار' : 'Required Role Skills'}</span>
              <span className="text-[11px] text-[#2563EB] font-semibold">{isAr ? 'مهم' : 'In-demand'}</span>
            </div>
            <div className="space-y-1.5">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.slice(0, 3).map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9FC] border border-[#E4EAF2] text-xs"
                  >
                    <span className="font-medium text-[#17253B]">
                      {typeof skill === 'string'
                        ? skill
                        : ((skill as any).canonicalName || (skill as any).name || 'Skill')}
                    </span>
                    <span className="text-[10px] font-bold text-[#2563EB] bg-[#EEF4FF] px-1.5 py-0.5 rounded-full">
                      {typeof skill === 'object' && skill && 'level' in skill
                        ? (skill as any).level
                        : isAr
                        ? 'موثق'
                        : 'Listed'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#94A3B8] text-center py-2">
                  {isAr ? 'أضف مهاراتك في ملفك الشخصي' : 'Add your skills in Career Profile'}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {currentTab === 'career' && (
        <div className="bg-[#F7F9FC] border border-[#E4EAF2] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17253B]">
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            <span>{isAr ? 'النمط المهني (Career DNA)' : 'Career Archetype'}</span>
          </div>
          <div className="text-xs text-[#64748B] leading-relaxed">
            {profile.dna?.primaryDirection || profile.dna?.currentLevel || (isAr ? 'مهندس برمجيات ذكي وتطبيقات متكاملة' : 'Full-Stack Systems Engineer')}
          </div>
          <div className="pt-2 border-t border-[#E4EAF2] text-[11px] text-[#64748B]">
            {isAr
              ? 'يتم تحديث التحليل تلقائياً مع كل مشروع جديد تقدمه وتوثقه.'
              : 'DNA trajectory updates continuously as you build and submit evidence.'}
          </div>
        </div>
      )}

      {currentTab === 'cv' && (
        <div className="bg-[#EEF4FF] border border-[#2563EB]/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB]">
            <FileCheck2 className="w-4 h-4" />
            <span>{isAr ? 'معايير فحص الـ ATS' : 'ATS Audit Checklist'}</span>
          </div>
          <ul className="text-xs text-[#17253B] space-y-2">
            <li className="flex items-center gap-1.5">
              <span className="text-[#15803D]">✓</span> {isAr ? 'تنسيق قياسي خالٍ من الجداول المعقدة' : 'Clean single-column ATS layout'}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#15803D]">✓</span> {isAr ? 'كلمات مفتاحية مطابقة لمتطلبات السوق' : 'Keyword alignment with role'}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#2563EB]">ℹ</span>
              {bestATS !== null
                ? (isAr ? `أفضل نتيجة ATS مسجلة: ${bestATS}%` : `Best ATS Score: ${bestATS}%`)
                : (isAr ? 'لم يتم تحليل السيرة بعد' : 'Run ATS Audit to get score')}
            </li>
          </ul>
        </div>
      )}

      {currentTab === 'opportunities' && (
        <div className="bg-[#F7F9FC] border border-[#E4EAF2] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17253B]">
            <Briefcase className="w-4 h-4 text-[#2563EB]" />
            <span>{isAr ? 'تلميح التقديم الذكي' : 'Strategic Application Tip'}</span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {isAr
              ? 'التقديم على الوظائف التي يتجاوز تطابقها 85% مع إرفاق سيرة مخصصة يضاعف فرص استدعائك 3 مرات.'
              : 'Applying to jobs with >85% match using tailored CVs triples your callback probability.'}
          </p>
        </div>
      )}

      {currentTab === 'applications' && (
        <div className="bg-[#F7F9FC] border border-[#E4EAF2] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17253B]">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>{isAr ? 'ملخص مسار التقديم' : 'Pipeline Summary'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 bg-white rounded-xl border border-[#E4EAF2]">
              <div className="font-black text-[#17253B]">{applications.length}</div>
              <div className="text-[10px] text-[#64748B]">{isAr ? 'إجمالي الطلبات' : 'Total'}</div>
            </div>
            <div className="p-2 bg-white rounded-xl border border-[#E4EAF2]">
              <div className="font-black text-[#15803D]">
                {applications.filter((a) => a.status === 'Interview' || a.status === 'Offer').length}
              </div>
              <div className="text-[10px] text-[#64748B]">{isAr ? 'مقابلات وعروض' : 'Interviews'}</div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'interviews' && (
        <div className="bg-[#F7F9FC] border border-[#E4EAF2] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17253B]">
            <Mic className="w-4 h-4 text-[#2563EB]" />
            <span>{isAr ? 'منهجية الإجابة (STAR)' : 'STAR Method Framework'}</span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {isAr
              ? 'ركز في كل إجابة على: الموقف (Situation)، المهمة (Task)، الإجراء المتخذ (Action)، والنتيجة بالأرقام (Result).'
              : 'Structure answers: Situation, Task, Action taken, and quantifiable Result.'}
          </p>
        </div>
      )}

      {/* 3. Quick Action Shortcut */}
      <div className="pt-2 border-t border-[#E4EAF2]">
        <button
          onClick={() => onNavigate('assistant')}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0B1F3A] text-white hover:bg-[#17253B] transition-colors cursor-pointer text-xs font-bold shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#22C7E8]" />
            <span>{isAr ? 'استشر المساعد الذكي' : 'Ask Career Coach'}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>
    </aside>
  );
};
