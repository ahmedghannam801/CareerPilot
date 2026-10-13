import React, { useState } from 'react';
import {
  FolderGit2,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Send,
  Award,
  AlertCircle,
  Plus,
  Code,
  Check,
  Target,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { MicroProject, CareerProfile } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';

interface MicroProjectsViewProps {
  projects: MicroProject[];
  profile: CareerProfile;
  selectedProject: MicroProject | null;
  onSelectProject: (proj: MicroProject | null) => void;
  onGenerateProject: (skillGap: string) => Promise<MicroProject>;
  onSubmitProject: (
    id: string,
    data: { summary: string; codeUrl?: string; liveDemoUrl?: string }
  ) => Promise<any>;
  lang: 'en' | 'ar';
}

export const MicroProjectsView: React.FC<MicroProjectsViewProps> = ({
  projects,
  profile,
  selectedProject,
  onSelectProject,
  onGenerateProject,
  onSubmitProject,
  lang,
}) => {
  const [activeProject, setActiveProject] = useState<MicroProject>(
    selectedProject || projects[0]
  );
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [skillGapInput, setSkillGapInput] = useState('React 19 & Next.js');
  const [isGenerating, setIsGenerating] = useState(false);

  // Submission state
  const [submissionSummary, setSubmissionSummary] = useState('');
  const [codeUrl, setCodeUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const isAr = lang === 'ar';

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newProj = await onGenerateProject(skillGapInput);
      setActiveProject(newProj);
      setShowGenerateModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionSummary.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await onSubmitProject(activeProject.id, {
        summary: submissionSummary,
        codeUrl,
        liveDemoUrl: demoUrl,
      });
      setActiveProject(res.project);
      setSubmissionSummary('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const quickSkills = [
    'React 19 & Server Actions',
    'PostgreSQL & Database Indexing',
    'Docker & Microservices',
    'API Architecture & WebSockets',
    'System Design & Redis',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <div>
          <div className="text-xs font-semibold text-blue-600 mb-1">
            {isAr ? 'معمل المشاريع والأدلة العملية' : 'Practical Skill Evidence Lab'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAr ? 'المشاريع المصغرة وإثبات المهارات' : 'Micro-Projects & Skill Evidence'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'مشاريع عملية سريعة (ساعتان إلى 4 ساعات) لسد فجوات المهارات وإضافتها كأدلة مثبتة في سيرتك الذاتية'
              : 'Targeted practical challenges designed to prove competence and add verified credentials to your profile'}
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAr ? 'توليد مشروع لمهارة جديدة' : 'Generate Project for Skill'}</span>
        </button>
      </div>

      {/* Main Grid: Left Projects List, Right Project Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Project Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              {isAr ? 'المشاريع المتاحة' : 'Available Challenges'} ({projects.length})
            </span>
          </div>

          {projects.map((proj) => {
            const isSelected = activeProject?.id === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => {
                  setActiveProject(proj);
                  onSelectProject(proj);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {proj.targetSkill} · {proj.difficulty}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {proj.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      proj.status === 'evaluated'
                        ? 'bg-emerald-100 text-emerald-800'
                        : proj.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {proj.status === 'evaluated'
                      ? `${proj.evaluation?.score}% ${isAr ? 'مثبت' : 'Verified'}`
                      : proj.status === 'in_progress'
                      ? isAr ? 'قيد التنفيذ' : 'In Progress'
                      : isAr ? 'جاهز للتنفيذ' : 'Ready'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {proj.scenario}
                </p>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{proj.duration}</span>
                  </span>
                  <span className="text-blue-600 font-bold flex items-center gap-1">
                    <span>{isAr ? 'فتح المشروع' : 'Open Workspace'}</span>
                    <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Project Workspace */}
        <div className="lg:col-span-7 space-y-6">
          {activeProject ? (
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-6 shadow-2xs">
              {/* Project Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {activeProject.targetSkill}
                  </span>
                  <span className="text-xs text-slate-400">· {activeProject.duration}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{activeProject.title}</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {activeProject.objective}
                </p>
              </div>

              {/* Scenario Context */}
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-slate-800 block">
                  {isAr ? 'سيناريو العمل الواقعي:' : 'Real-World Workplace Scenario:'}
                </span>
                <p className="text-slate-600 leading-relaxed italic">{activeProject.scenario}</p>
              </div>

              {/* Actionable Checklist Tasks */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {isAr ? 'خطوات ومهام المشروع (Checklist):' : 'Project Tasks Checklist:'}
                </h3>
                <div className="space-y-2">
                  {activeProject.tasks.map((task, idx) => {
                    const isDone = Boolean(completedTasks[task.id || `task-${idx}`]);
                    return (
                      <div
                        key={task.id || idx}
                        onClick={() => toggleTask(task.id || `task-${idx}`)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                          isDone
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-500'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isDone && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.title}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Evaluation Results if already evaluated */}
              {activeProject.evaluation ? (
                <div className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 text-sm">
                      {isAr ? 'تم تقييم المشروع بنجاح' : 'Evaluation Complete'}
                    </span>
                    <span className="font-mono font-bold text-sm bg-emerald-700 text-white px-3 py-0.5 rounded-full">
                      {activeProject.evaluation.score}%
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed italic">
                    "{activeProject.evaluation.feedback}"
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'تم حفظ النتيجة كدليل كفاءة في ملفك الشخصي' : 'Verified and added to Career DNA evidence!'}</span>
                  </div>
                </div>
              ) : (
                /* Submission Form */
                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {isAr ? 'تسليم المشروع للتقييم بالذكاء الاصطناعي:' : 'Submit Project for AI Evaluation:'}
                    </span>
                    <span className="text-[11px] text-slate-400">STAR Evaluator</span>
                  </div>

                  <textarea
                    rows={4}
                    value={submissionSummary}
                    onChange={(e) => setSubmissionSummary(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اشرح باختصار كيف نفذت الخطوات والقرارات الهندسية التي اتخذتها...'
                        : 'Summarize your implementation, key technical tradeoffs, and results...'
                    }
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-100"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="url"
                      value={codeUrl}
                      onChange={(e) => setCodeUrl(e.target.value)}
                      placeholder={isAr ? 'رابط GitHub (اختياري)' : 'GitHub Repo URL (optional)'}
                      className="text-xs p-2.5 border border-slate-300 rounded-xl bg-white outline-none"
                    />
                    <input
                      type="url"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      placeholder={isAr ? 'رابط المعاينة المباشرة (اختياري)' : 'Live Demo URL (optional)'}
                      className="text-xs p-2.5 border border-slate-300 rounded-xl bg-white outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !submissionSummary.trim()}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? (isAr ? 'جاري التقييم...' : 'Evaluating...') : isAr ? 'تسليم وتقييم المشروع' : 'Submit & Evaluate'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
              {isAr ? 'اختر مشروعاً من القائمة لبدء التطبيق' : 'Select a project from the left list.'}
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'توليد مشروع عملي ذكي' : 'Generate Targeted Micro-Project'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? 'اختر أو اكتب المهارة التي تريد إثباتها، وسيقوم الذكاء الاصطناعي ببناء سيناريو وتحدي عملي مخصص'
                  : 'Specify the skill you want to prove, and AI will architect a realistic project scenario.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                {isAr ? 'المهارة المستهدفة:' : 'Target Skill:'}
              </label>
              <input
                type="text"
                value={skillGapInput}
                onChange={(e) => setSkillGapInput(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                {isAr ? 'اقتراحات سريعة بنقرة واحدة:' : 'Quick Suggestions:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickSkills.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSkillGapInput(s)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !skillGapInput.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? (isAr ? 'جاري البناء...' : 'Architecting...') : isAr ? 'إنشاء المشروع' : 'Create Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
