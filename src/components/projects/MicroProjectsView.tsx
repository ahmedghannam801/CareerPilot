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
    if (isGenerating) return; // Prevent duplicate calls
    setIsGenerating(true);
    try {
      const newProj = await onGenerateProject(skillGapInput);
      setActiveProject(newProj);
      setShowGenerateModal(false);
      setSkillGapInput(''); // Reset input after successful generation
    } catch (error) {
      console.error('Failed to generate project:', error);
      // Keep modal open on error so user can retry
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
      <div
        className="card-surface flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div>
          <div
            className="text-label-caps mb-1"
            style={{ color: 'var(--primary)' }}
          >
            {isAr ? 'معمل المشاريع والأدلة العملية' : 'Practical Skill Evidence Lab'}
          </div>
          <h1
            className="text-headline-lg"
            style={{ color: 'var(--on-surface)' }}
          >
            {isAr ? 'المشاريع المصغرة وإثبات المهارات' : 'Micro-Projects & Skill Evidence'}
          </h1>
          <p
            className="text-body-sm mt-1"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {isAr
              ? 'مشاريع عملية سريعة (ساعتان إلى 4 ساعات) لسد فجوات المهارات وإضافتها كأدلة مثبتة في سيرتك الذاتية'
              : 'Targeted practical challenges designed to prove competence and add verified credentials to your profile'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary inline-flex items-center gap-2 cursor-pointer"
          style={{
            background: 'var(--primary)',
            color: 'var(--on-primary)',
          }}
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
            <span
              className="text-label-md"
              style={{ color: 'var(--on-surface)' }}
            >
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
                className="card-surface p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  background: isSelected ? 'var(--primary-container)' : 'var(--surface)',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className="text-label-caps block"
                      style={{ color: 'var(--primary)' }}
                    >
                      {proj.targetSkill} · {proj.difficulty}
                    </span>
                    <h3
                      className="text-body-md-bold mt-0.5 truncate"
                      style={{ color: 'var(--on-surface)' }}
                    >
                      {proj.title}
                    </h3>
                  </div>
                  <span
                    className="badge-pill shrink-0"
                    style={{
                      background:
                        proj.status === 'evaluated'
                          ? 'var(--success-container)'
                          : proj.status === 'in_progress'
                          ? 'var(--warning-container)'
                          : 'var(--surface-variant)',
                      color:
                        proj.status === 'evaluated'
                          ? 'var(--on-success-container)'
                          : proj.status === 'in_progress'
                          ? 'var(--on-warning-container)'
                          : 'var(--on-surface-variant)',
                    }}
                  >
                    {proj.status === 'evaluated'
                      ? `${proj.evaluation?.score}% ${isAr ? 'مثبت' : 'Verified'}`
                      : proj.status === 'in_progress'
                      ? isAr ? 'قيد التنفيذ' : 'In Progress'
                      : isAr ? 'جاهز للتنفيذ' : 'Ready'}
                  </span>
                </div>

                <p
                  className="text-body-sm mt-2 line-clamp-2 leading-relaxed"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  {proj.scenario}
                </p>

                <div
                  className="mt-3 flex items-center justify-between pt-2 text-body-sm border-hairline"
                  style={{
                    borderTopColor: 'var(--border)',
                    color: 'var(--on-surface-variant)',
                  }}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{proj.duration}</span>
                  </span>
                  <span
                    className="text-label-md flex items-center gap-1"
                    style={{ color: 'var(--primary)' }}
                  >
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
            <div
              className="card-surface p-6 rounded-2xl space-y-6"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Project Header */}
              <div
                className="border-hairline pb-4"
                style={{ borderBottomColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="badge-pill"
                    style={{
                      background: 'var(--primary-container)',
                      color: 'var(--on-primary-container)',
                    }}
                  >
                    {activeProject.targetSkill}
                  </span>
                  <span
                    className="text-body-sm"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    · {activeProject.duration}
                  </span>
                </div>
                <h2
                  className="text-headline-md"
                  style={{ color: 'var(--on-surface)' }}
                >
                  {activeProject.title}
                </h2>
                <p
                  className="text-body-base mt-1 leading-relaxed"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  {activeProject.objective}
                </p>
              </div>

              {/* Scenario Context */}
              <div
                className="p-4 rounded-xl space-y-1 text-body-base"
                style={{
                  background: 'var(--surface-variant)',
                  borderColor: 'var(--border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                <span
                  className="text-label-md block"
                  style={{ color: 'var(--on-surface)' }}
                >
                  {isAr ? 'سيناريو العمل الواقعي:' : 'Real-World Workplace Scenario:'}
                </span>
                <p
                  className="leading-relaxed italic"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  {activeProject.scenario}
                </p>
              </div>

              {/* Actionable Checklist Tasks */}
              <div className="space-y-3">
                <h3
                  className="text-label-caps"
                  style={{ color: 'var(--on-surface)' }}
                >
                  {isAr ? 'خطوات ومهام المشروع (Checklist):' : 'Project Tasks Checklist:'}
                </h3>
                <div className="space-y-2">
                  {activeProject.tasks.map((task, idx) => {
                    const isDone = Boolean(completedTasks[task.id || `task-${idx}`]);
                    return (
                      <div
                        key={task.id || idx}
                        onClick={() => toggleTask(task.id || `task-${idx}`)}
                        className="p-3.5 rounded-xl text-body-base cursor-pointer transition-all flex items-start gap-3"
                        style={{
                          background: isDone ? 'var(--success-container)' : 'var(--surface)',
                          borderColor: isDone ? 'var(--success)' : 'var(--border)',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          color: isDone ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                          style={{
                            background: isDone ? 'var(--success)' : 'var(--surface)',
                            borderColor: isDone ? 'var(--success)' : 'var(--border)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: isDone ? 'var(--on-success)' : 'transparent',
                          }}
                        >
                          {isDone && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0">
                          <h4
                            className="text-label-md"
                            style={{
                              color: isDone ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                              textDecoration: isDone ? 'line-through' : 'none',
                            }}
                          >
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
                <div
                  className="p-5 rounded-xl space-y-3 text-body-base"
                  style={{
                    background: 'var(--success-container)',
                    borderColor: 'var(--success)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-headline-sm"
                      style={{ color: 'var(--on-success-container)' }}
                    >
                      {isAr ? 'تم تقييم المشروع بنجاح' : 'Evaluation Complete'}
                    </span>
                    <span
                      className="badge-pill text-headline-sm"
                      style={{
                        background: 'var(--success)',
                        color: 'var(--on-success)',
                      }}
                    >
                      {activeProject.evaluation.score}%
                    </span>
                  </div>
                  <p
                    className="leading-relaxed italic"
                    style={{ color: 'var(--on-success-container)' }}
                  >
                    "{activeProject.evaluation.feedback}"
                  </p>
                  <div
                    className="pt-2 text-label-md flex items-center gap-1.5 border-hairline"
                    style={{
                      borderTopColor: 'var(--success)',
                      color: 'var(--on-success-container)',
                    }}
                  >
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: 'var(--success)' }}
                    />
                    <span>{isAr ? 'تم حفظ النتيجة كدليل كفاءة في ملفك الشخصي' : 'Verified and added to Career DNA evidence!'}</span>
                  </div>
                </div>
              ) : (
                /* Submission Form */
                <div
                  className="p-5 rounded-xl space-y-3.5 text-body-base"
                  style={{
                    background: 'var(--surface-variant)',
                    borderColor: 'var(--border)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-label-md"
                      style={{ color: 'var(--on-surface)' }}
                    >
                      {isAr ? 'تسليم المشروع للتقييم بالذكاء الاصطناعي:' : 'Submit Project for AI Evaluation:'}
                    </span>
                    <span
                      className="text-body-sm"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      STAR Evaluator
                    </span>
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
                    className="w-full text-body-base p-3 rounded-xl outline-none focus:ring-2"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--on-surface)',
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="url"
                      value={codeUrl}
                      onChange={(e) => setCodeUrl(e.target.value)}
                      placeholder={isAr ? 'رابط GitHub (اختياري)' : 'GitHub Repo URL (optional)'}
                      className="text-body-base p-2.5 rounded-xl outline-none"
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: 'var(--on-surface)',
                      }}
                    />
                    <input
                      type="url"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      placeholder={isAr ? 'رابط المعاينة المباشرة (اختياري)' : 'Live Demo URL (optional)'}
                      className="text-body-base p-2.5 rounded-xl outline-none"
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: 'var(--on-surface)',
                      }}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !submissionSummary.trim()}
                      className="btn-primary inline-flex items-center gap-2 cursor-pointer disabled:opacity-40"
                      style={{
                        background: 'var(--primary)',
                        color: 'var(--on-primary)',
                      }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? (isAr ? 'جاري التقييم...' : 'Evaluating...') : isAr ? 'تسليم وتقييم المشروع' : 'Submit & Evaluate'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="card-surface p-12 text-center text-body-base rounded-2xl"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--on-surface-variant)',
              }}
            >
              {isAr ? 'اختر مشروعاً من القائمة لبدء التطبيق' : 'Select a project from the left list.'}
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            className="rounded-2xl max-w-md w-full flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden"
            style={{
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="p-5 shrink-0 border-hairline"
              style={{ borderBottomColor: 'var(--border)' }}
            >
              <h3
                className="text-headline-md"
                style={{ color: 'var(--on-surface)' }}
              >
                {isAr ? 'توليد مشروع عملي ذكي' : 'Generate Targeted Micro-Project'}
              </h3>
              <p
                className="text-body-base mt-1"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                {isAr
                  ? 'اختر أو اكتب المهارة التي تريد إثباتها، وسيقوم الذكاء الاصطناعي ببناء سيناريو وتحدي عملي مخصص'
                  : 'Specify the skill you want to prove, and AI will architect a realistic project scenario.'}
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-2">
                <label
                  className="text-label-md"
                  style={{ color: 'var(--on-surface)' }}
                >
                  {isAr ? 'المهارة المستهدفة:' : 'Target Skill:'}
                </label>
                <input
                  type="text"
                  value={skillGapInput}
                  onChange={(e) => setSkillGapInput(e.target.value)}
                  className="w-full text-body-base p-3 rounded-xl outline-none"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: 'var(--on-surface)',
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <span
                  className="text-label-sm"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  {isAr ? 'اقتراحات سريعة بنقرة واحدة:' : 'Quick Suggestions:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSkills.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSkillGapInput(s)}
                      className="text-body-sm px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      style={{
                        background: 'var(--surface-variant)',
                        color: 'var(--on-surface-variant)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-container)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface-variant)';
                        e.currentTarget.style.color = 'var(--on-surface-variant)';
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="shrink-0 p-4 flex items-center justify-end gap-2 border-hairline"
              style={{
                borderTopColor: 'var(--border)',
                background: 'var(--surface-variant)',
              }}
            >
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="btn-secondary cursor-pointer"
                style={{
                  color: 'var(--on-surface-variant)',
                }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !skillGapInput.trim()}
                className="btn-primary inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--on-primary)',
                }}
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
