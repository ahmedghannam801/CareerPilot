import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  Lock,
  PlayCircle,
  Bookmark,
  BookmarkCheck,
  Award,
  TrendingUp,
  Calendar,
  Settings,
  AlertCircle,
  FileText,
  Video,
  GraduationCap,
  ArrowRight,
  RotateCcw,
  Plus,
  X,
  Target,
  Check,
} from 'lucide-react';
import {
  LearningRoadmap,
  RoadmapNode,
  RoadmapStage,
  RoadmapResource,
  UserRoadmapEnrollment,
  WeeklyLearningPlan,
  NodeProgressStatus,
  CareerProfile,
  MicroProject,
} from '../../types/index.js';
import { clientDb } from '../../lib/clientDb.js';

interface LearningRoadmapsViewProps {
  profile: CareerProfile | null;
  projects?: MicroProject[];
  onNavigateTab: (tab: string) => void;
  lang: 'en' | 'ar';
}

type RoadmapActiveTab =
  | 'discovery'
  | 'my_roadmaps'
  | 'workspace'
  | 'progress'
  | 'weekly_plan'
  | 'settings';

export const LearningRoadmapsView: React.FC<LearningRoadmapsViewProps> = ({
  profile,
  projects = [],
  onNavigateTab,
  lang,
}) => {
  const isAr = lang === 'ar';

  // Sub-navigation tab
  const [activeTab, setActiveTab] = useState<RoadmapActiveTab>('workspace');

  // Roadmaps & Enrollments state (from clientDb)
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>(() => clientDb.getRoadmaps());
  const [enrollments, setEnrollments] = useState<UserRoadmapEnrollment[]>(() =>
    clientDb.getUserEnrollments()
  );
  const [savedResources, setSavedResources] = useState<RoadmapResource[]>(() =>
    clientDb.getSavedResources()
  );

  // Selected Active Roadmap
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>(() => {
    const existing = clientDb.getUserEnrollments()[0];
    if (existing) return existing.roadmapId;
    return roadmaps[0]?.id || 'rdm-ai-engineer';
  });

  // Selected Node Drawer
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);

  // Filters for Discovery
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Resource Filter inside Drawer
  const [resourceFilter, setResourceFilter] = useState<'all' | 'free' | 'youtube' | 'coursera' | 'docs'>('all');
  const [resourceLangFilter, setResourceLangFilter] = useState<'all' | 'Arabic' | 'English'>('all');

  // AI Roadmap Generator Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [customTargetRole, setCustomTargetRole] = useState(profile?.targetRole || '');
  const [customWeeklyHours, setCustomWeeklyHours] = useState(5);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Settings State
  const [learningSettings, setLearningSettings] = useState({
    preferredFormat: 'Video & Practice',
    preferredLanguage: isAr ? 'Both' : 'English',
    weeklyHours: 5,
    budgetPreference: 'Free',
  });

  // Active Roadmap Object
  const currentRoadmap = useMemo(() => {
    return roadmaps.find((r) => r.id === selectedRoadmapId || r.slug === selectedRoadmapId) || roadmaps[0];
  }, [roadmaps, selectedRoadmapId]);

  // Active Enrollment for current Roadmap
  const currentEnrollment = useMemo(() => {
    return enrollments.find((e) => e.roadmapId === currentRoadmap?.id);
  }, [enrollments, currentRoadmap]);

  // Active Weekly Plan
  const activeWeeklyPlan = useMemo(() => {
    if (!currentEnrollment) return undefined;
    let plan = clientDb.getWeeklyPlan(currentEnrollment.id);
    if (!plan) {
      plan = clientDb.generateWeeklyPlan(currentEnrollment.id, currentEnrollment.weeklyHoursCommitted || 5);
    }
    return plan;
  }, [currentEnrollment]);

  // Handle Enrollment
  const handleEnroll = (roadmapId: string, hours = 5) => {
    const enr = clientDb.enrollInRoadmap(roadmapId, hours);
    setEnrollments([...clientDb.getUserEnrollments()]);
    setSelectedRoadmapId(roadmapId);
    setActiveTab('workspace');
  };

  // Handle Node Status Change
  const handleUpdateNodeStatus = (nodeId: string, status: NodeProgressStatus, notes?: string) => {
    if (!currentEnrollment) {
      // Auto-enroll if not yet enrolled
      const newEnr = clientDb.enrollInRoadmap(currentRoadmap.id, 5);
      clientDb.updateNodeProgress(newEnr.id, nodeId, status, notes);
      setEnrollments([...clientDb.getUserEnrollments()]);
      return;
    }
    clientDb.updateNodeProgress(currentEnrollment.id, nodeId, status, notes);
    setEnrollments([...clientDb.getUserEnrollments()]);
  };

  // Toggle Save Resource
  const handleToggleSaveResource = (res: RoadmapResource) => {
    const isSaved = savedResources.some((r) => r.id === res.id);
    if (isSaved) {
      clientDb.unsaveResource(res.id);
    } else {
      clientDb.saveResource(res);
    }
    setSavedResources([...clientDb.getSavedResources()]);
  };

  // Execute AI Custom Roadmap Generation
  const handleExecuteAIGeneration = async () => {
    if (!customTargetRole.trim()) return;
    setIsGeneratingRoadmap(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/roadmaps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: customTargetRole,
          weeklyHours: customWeeklyHours,
        }),
      });

      const data = await response.json();
      if (!data.success || !data.roadmap) {
        throw new Error(data.error || 'Failed to generate roadmap');
      }

      const generated = clientDb.addCustomRoadmap(data.roadmap);
      setRoadmaps([...clientDb.getRoadmaps()]);
      handleEnroll(generated.id, customWeeklyHours);
      setShowGenerateModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGenerationError(msg);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Filtered Roadmaps for Discovery
  const filteredRoadmaps = useMemo(() => {
    return roadmaps.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.titleAr.includes(searchQuery) ||
        r.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'all' || r.difficulty === selectedDifficulty;
      return matchSearch && matchCat && matchDiff;
    });
  }, [roadmaps, searchQuery, selectedCategory, selectedDifficulty]);

  // Overall metrics
  const completedNodesCount = useMemo(() => {
    if (!currentEnrollment) return 0;
    return Object.values(currentEnrollment.nodeProgress).filter((p) => p.status === 'completed').length;
  }, [currentEnrollment]);

  const totalNodesInCurrentRoadmap = useMemo(() => {
    if (!currentRoadmap) return 0;
    return currentRoadmap.stages.reduce((acc, s) => acc + s.nodes.length, 0);
  }, [currentRoadmap]);

  const progressPercent = useMemo(() => {
    if (totalNodesInCurrentRoadmap === 0) return 0;
    return Math.round((completedNodesCount / totalNodesInCurrentRoadmap) * 100);
  }, [completedNodesCount, totalNodesInCurrentRoadmap]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'مسارات التعلم التفاعلية ومصادر الدورات' : 'Interactive Learning Roadmaps & Resource Discovery'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAr ? 'مسارات التعلم المهني (Learning Roadmaps)' : 'Career Learning Roadmaps'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? 'خرائط تعلم تفاعلية منظمة على مراحل متعاقبة، مع مصادر تعليمية حقيقية ومجانية من YouTube ودورات معتمدة من Coursera وتطبيقات عملية متصلة بملفك المهني.'
              : 'Interactive step-by-step career roadmaps connected with verified free YouTube tutorials, Coursera specializations, and portfolio micro-projects.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'توليد مسار مخصص بالذكاء الاصطناعي' : 'Generate Custom AI Roadmap'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200/80 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'workspace'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isAr ? 'مساحة المسار التفاعلي' : 'Roadmap Workspace'}</span>
          {currentEnrollment && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'workspace' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
              {progressPercent}%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('discovery')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'discovery'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{isAr ? 'اكتشاف المسارات' : 'Roadmap Discovery'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'discovery' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
            {roadmaps.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_roadmaps')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'my_roadmaps'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isAr ? 'مساراتي المسجلة' : 'My Roadmaps'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'my_roadmaps' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
            {enrollments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('weekly_plan')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'weekly_plan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isAr ? 'الخطة الأسبوعية' : 'Weekly Plan'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'progress'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isAr ? 'مؤشرات التقدم والجاهزية' : 'Progress & Readiness'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{isAr ? 'الإعدادات والتفضيلات' : 'Learning Settings'}</span>
        </button>
      </div>

      {/* ====================================================================
          VIEW 1: ROADMAP DISCOVERY
          ==================================================================== */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* Search & Category Filter Bar */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isAr ? 'ابحث عن مسار مهني أو مهارة (مثال: AI, Python, React, Data)...' : 'Search roadmaps or skills (e.g. AI, Python, React, Data)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none"
              >
                <option value="all">{isAr ? 'جميع المجالات' : 'All Categories'}</option>
                <option value="Data & AI">{isAr ? 'البيانات والذكاء الاصطناعي' : 'Data & AI'}</option>
                <option value="Software Engineering">{isAr ? 'هندسة البرمجيات' : 'Software Engineering'}</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none"
              >
                <option value="all">{isAr ? 'جميع المستويات' : 'All Levels'}</option>
                <option value="Beginner">{isAr ? 'مبتدئ' : 'Beginner'}</option>
                <option value="Intermediate">{isAr ? 'متوسط' : 'Intermediate'}</option>
                <option value="Advanced">{isAr ? 'متقدم' : 'Advanced'}</option>
              </select>
            </div>
          </div>

          {/* Roadmaps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRoadmaps.map((roadmap) => {
              const isEnrolled = enrollments.some((e) => e.roadmapId === roadmap.id);
              const enr = enrollments.find((e) => e.roadmapId === roadmap.id);

              return (
                <div
                  key={roadmap.id}
                  className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                        {roadmap.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>~{roadmap.estimatedTotalHours} {isAr ? 'ساعة' : 'hrs'}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {isAr ? roadmap.titleAr : roadmap.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {isAr ? roadmap.descriptionAr : roadmap.description}
                      </p>
                    </div>

                    {/* Stages breakdown */}
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                      <div className="text-[11px] font-bold text-slate-700">
                        {isAr ? `يتضمن ${roadmap.stages.length} مراحل تعليمية:` : `Includes ${roadmap.stages.length} Structured Stages:`}
                      </div>
                      <div className="space-y-0.5 text-[11px] text-slate-600">
                        {roadmap.stages.slice(0, 3).map((stg, i) => (
                          <div key={stg.id} className="truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>{isAr ? stg.titleAr || stg.title : stg.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {roadmap.tags.slice(0, 4).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {isEnrolled ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isAr ? `مسجل (${enr?.progressPercentage}%)` : `Enrolled (${enr?.progressPercentage}%)`}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoadmapId(roadmap.id);
                            setActiveTab('workspace');
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer"
                        >
                          {isAr ? 'فتح المسار' : 'Open Workspace'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-500">
                          {isAr ? 'متاح للتسجيل الفوري' : 'Open enrollment'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEnroll(roadmap.id, 5)}
                          className="px-4 py-1.5 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-xl transition-all cursor-pointer border border-blue-200/60"
                        >
                          {isAr ? 'ابدأ المسار الآن' : 'Start Roadmap'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 2: MY ROADMAPS
          ==================================================================== */}
      {activeTab === 'my_roadmaps' && (
        <div className="space-y-6">
          {enrollments.length === 0 ? (
            <div className="p-12 bg-white border border-slate-200/80 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'لم تسجل في أي مسار بعد' : 'No Enrolled Roadmaps Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAr
                  ? 'اختر مساراً مهنياً يناسب هدفك وانطلق في رحلة التعلم بخطة أسبوعية منظمة.'
                  : 'Select a career path that aligns with your goal and start your guided learning plan.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('discovery')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isAr ? 'استكشف المسارات المتاحة' : 'Browse Roadmaps Catalog'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {enrollments.map((enr) => {
                const rdm = roadmaps.find((r) => r.id === enr.roadmapId);
                if (!rdm) return null;

                const completedCount = Object.values(enr.nodeProgress).filter((p) => p.status === 'completed').length;
                const totalNodes = rdm.stages.reduce((acc, s) => acc + s.nodes.length, 0);

                return (
                  <div
                    key={enr.id}
                    className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                          {rdm.category}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                          {isAr ? rdm.titleAr : rdm.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isAr ? `تستهدف دور: ${rdm.targetRole}` : `Targeting: ${rdm.targetRole}`}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                        {enr.weeklyHoursCommitted || 5} {isAr ? 'س/أسبوع' : 'hrs/wk'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600">
                          {isAr ? `تم إنجاز ${completedCount} من ${totalNodes} مهارة` : `${completedCount} of ${totalNodes} skills completed`}
                        </span>
                        <span className="text-blue-600 font-bold">{enr.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${enr.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {isAr ? `تاريخ البدء: ${enr.startDate}` : `Started: ${enr.startDate}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoadmapId(rdm.id);
                          setActiveTab('workspace');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>{isAr ? 'متابعة التعلم' : 'Resume Learning'}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          VIEW 3: INTERACTIVE ROADMAP WORKSPACE
          ==================================================================== */}
      {activeTab === 'workspace' && currentRoadmap && (
        <div className="space-y-6">
          {/* Active Roadmap Banner & Switcher */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {currentRoadmap.category}
                </span>
                <span className="text-xs text-slate-300">
                  ~{currentRoadmap.estimatedTotalHours} {isAr ? 'ساعة تدريبية' : 'total hours'}
                </span>
              </div>
              <h2 className="text-xl font-bold">
                {isAr ? currentRoadmap.titleAr : currentRoadmap.title}
              </h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {isAr ? currentRoadmap.descriptionAr : currentRoadmap.description}
              </p>
            </div>

            {/* Quick Switcher dropdown & Progress Widget */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <select
                value={selectedRoadmapId}
                onChange={(e) => setSelectedRoadmapId(e.target.value)}
                className="text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium outline-none cursor-pointer"
              >
                {roadmaps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isAr ? r.titleAr : r.title}
                  </option>
                ))}
              </select>

              <div className="text-xs text-slate-300 flex items-center gap-2 font-medium">
                <span>{isAr ? 'نسبة الإنجاز:' : 'Completion:'}</span>
                <span className="text-emerald-400 font-bold">{progressPercent}%</span>
                <span className="text-slate-400">
                  ({completedNodesCount}/{totalNodesInCurrentRoadmap})
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Roadmap Stages */}
          <div className="space-y-8 relative">
            {currentRoadmap.stages.map((stage, stageIndex) => (
              <div key={stage.id} className="space-y-4">
                {/* Stage Header */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {stageIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isAr ? stage.titleAr || stage.title : stage.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? stage.descriptionAr || stage.description : stage.description} •{' '}
                      <span className="font-medium text-blue-600">{stage.estimatedEffort}</span>
                    </p>
                  </div>
                </div>

                {/* Nodes Grid in Stage */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 rtl:pr-4 rtl:pl-0 border-l-2 rtl:border-r-2 rtl:border-l-0 border-blue-200/60 ml-4 rtl:mr-4 rtl:ml-0">
                  {stage.nodes.map((node) => {
                    const nodeProgress = currentEnrollment?.nodeProgress[node.id];
                    const status: NodeProgressStatus = nodeProgress?.status || 'available';

                    // Check if prerequisites are locked
                    const isLocked =
                      node.prerequisites?.length > 0 &&
                      node.prerequisites.some((preId) => currentEnrollment?.nodeProgress[preId]?.status !== 'completed');

                    const effectiveStatus: NodeProgressStatus = isLocked ? 'locked' : status;

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative group ${
                          effectiveStatus === 'completed'
                            ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500 shadow-2xs'
                            : effectiveStatus === 'in_progress'
                            ? 'bg-blue-50/50 border-blue-400 hover:border-blue-600 shadow-xs ring-2 ring-blue-500/10'
                            : effectiveStatus === 'locked'
                            ? 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-80'
                            : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600">
                            {node.category}
                          </span>

                          <span className="flex items-center gap-1 text-[11px] font-bold">
                            {effectiveStatus === 'completed' && (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {isAr ? 'مكتمل' : 'Completed'}
                              </span>
                            )}
                            {effectiveStatus === 'in_progress' && (
                              <span className="text-blue-700 flex items-center gap-1 animate-pulse">
                                <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
                                {isAr ? 'قيد التعلم' : 'In Progress'}
                              </span>
                            )}
                            {effectiveStatus === 'available' && (
                              <span className="text-slate-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                {isAr ? 'متاح للبدء' : 'Available'}
                              </span>
                            )}
                            {effectiveStatus === 'locked' && (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-slate-400" />
                                {isAr ? 'مغلق بمتطلبات' : 'Locked'}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Node Content */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {isAr ? node.titleAr || node.title : node.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {isAr ? node.descriptionAr || node.description : node.description}
                          </p>
                        </div>

                        {/* Footer Details */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{node.estimatedEffort}</span>
                          </span>

                          <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                            <span>{isAr ? 'عرض المصادر' : 'View Resources'}</span>
                            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 4: WEEKLY LEARNING PLAN
          ==================================================================== */}
      {activeTab === 'weekly_plan' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isAr ? 'الخطة والجدول الأسبوعي المخصص' : 'Personalized Weekly Learning Schedule'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'جدول مذاكرة مقسم على أيام الأسبوع بناءً على ساعات فراغك الملتزم بها للوصول إلى هدفك المهني.'
                    : 'Structured activities balanced across your available days to ensure consistent career momentum.'}
                </p>
              </div>

              {/* Hours commitment selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">
                  {isAr ? 'الالتزام الأسبوعي:' : 'Weekly Commitment:'}
                </span>
                <select
                  value={currentEnrollment?.weeklyHoursCommitted || 5}
                  onChange={(e) => {
                    const hrs = parseInt(e.target.value, 10);
                    if (currentEnrollment) {
                      currentEnrollment.weeklyHoursCommitted = hrs;
                      clientDb.generateWeeklyPlan(currentEnrollment.id, hrs);
                      setEnrollments([...clientDb.getUserEnrollments()]);
                    }
                  }}
                  className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 outline-none"
                >
                  <option value={3}>3 {isAr ? 'ساعات / أسبوع' : 'hours / week'}</option>
                  <option value={5}>5 {isAr ? 'ساعات / أسبوع' : 'hours / week'}</option>
                  <option value={8}>8 {isAr ? 'ساعات / أسبوع' : 'hours / week'}</option>
                  <option value={10}>10 {isAr ? 'ساعات / أسبوع' : 'hours / week'}</option>
                </select>
              </div>
            </div>

            {/* Weekly Tasks List */}
            {activeWeeklyPlan && (
              <div className="space-y-3 pt-2">
                {activeWeeklyPlan.activities.map((act) => (
                  <div
                    key={act.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      act.completed
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          act.completed = !act.completed;
                          setEnrollments([...clientDb.getUserEnrollments()]);
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer mt-0.5 ${
                          act.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {act.completed && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                            {act.dayOfWeek || 'Scheduled'}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{act.activityTitle}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {isAr ? 'المهارة المرتبطة:' : 'Skill Node:'} {act.nodeTitle}
                        </p>
                        {act.resourceUrl && (
                          <a
                            href={act.resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-1 font-medium"
                          >
                            <span>{act.resourceTitle || act.resourceUrl}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      ~{act.estimatedMinutes} {isAr ? 'دقيقة' : 'mins'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 5: LEARNING PROGRESS & READINESS
          ==================================================================== */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold">{isAr ? 'إجمالي المهارات المنجزة' : 'Skills Mastered'}</span>
              <div className="text-3xl font-black text-slate-900">{completedNodesCount}</div>
              <p className="text-[11px] text-emerald-600 font-medium">
                {isAr ? 'تم توثيقها كأدلة رسمية في ملفك المهني' : 'Recorded as verified skill evidence in Career DNA'}
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold">{isAr ? 'ساعات الاستثمار التدريبي' : 'Training Hours Invested'}</span>
              <div className="text-3xl font-black text-blue-600">
                {completedNodesCount * 8} {isAr ? 'ساعة' : 'hrs'}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isAr ? 'مبنية على التقدير المعياري للمسار' : 'Based on roadmap standard effort metrics'}
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold">{isAr ? 'تأثير جاهزية التوظيف' : 'Career Readiness Boost'}</span>
              <div className="text-3xl font-black text-emerald-600">+{Math.min(30, completedNodesCount * 6)}%</div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isAr ? 'يرفع مطابقة سيرتك الذاتية في أنظمة الـ ATS' : 'Elevates ATS resume matching & opportunity fit'}
              </p>
            </div>
          </div>

          {/* Saved Resources List */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'المصادر والدورات المحفوظة' : 'Saved Learning Resources'}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {savedResources.length} {isAr ? 'مصادر' : 'items'}
              </span>
            </div>

            {savedResources.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                {isAr
                  ? 'لم تحفظ أي مصادر بعد. انقر على أيقونة الإشارة المرجعية داخل تفاصيل أي مهارة لحفظها هنا.'
                  : 'No saved resources yet. Click the bookmark icon inside any skill drawer to save courses here.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          {res.provider}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">{res.priceCategory}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{res.title}</h4>
                      {res.instructor && <p className="text-[11px] text-slate-500">{res.instructor}</p>}
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 6: LEARNING SETTINGS
          ==================================================================== */}
      {activeTab === 'settings' && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isAr ? 'تفضيلات وأهداف التعلم' : 'Learning Preferences & Goals'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'تخصيص نمط التعلم المفضل واللغة والميزانية لتوجيه توصيات الذكاء الاصطناعي بدقة.'
                : 'Configure your preferred study format, language, and budget to refine AI roadmap recommendations.'}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'المسمى المهني المستهدف بالمسارات:' : 'Target Career Trajectory:'}
              </label>
              <input
                type="text"
                value={profile?.targetRole || 'Software Engineer'}
                disabled
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'لغة المحتوى المفضلة:' : 'Preferred Content Language:'}
              </label>
              <select
                value={learningSettings.preferredLanguage}
                onChange={(e) => setLearningSettings({ ...learningSettings, preferredLanguage: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none"
              >
                <option value="Both">{isAr ? 'العربية والإنجليزية (Both)' : 'Both Arabic & English'}</option>
                <option value="English">{isAr ? 'الإنجليزية فقط' : 'English Only'}</option>
                <option value="Arabic">{isAr ? 'العربية فقط' : 'Arabic Only'}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'تفضيل التكلفة والميزانية:' : 'Budget Preference:'}
              </label>
              <select
                value={learningSettings.budgetPreference}
                onChange={(e) => setLearningSettings({ ...learningSettings, budgetPreference: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none"
              >
                <option value="Free">{isAr ? 'المصادر المجانية و YouTube فقط (Free)' : 'Free YouTube & Open Resources Only'}</option>
                <option value="Audit Free">{isAr ? 'مجانية مع إمكانية تدقيق كورسيرا (Audit Free)' : 'Free Audit Coursera Courses'}</option>
                <option value="Paid">{isAr ? 'مستعد لدفع رسوم الشهادات المعتمدة' : 'Willing to pay for verified certificates'}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SKILL DETAILS & CURATED RESOURCES DRAWER
          ==================================================================== */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-50 text-blue-700">
                  {selectedNode.category}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? selectedNode.titleAr || selectedNode.title : selectedNode.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-5 space-y-6 flex-1">
              {/* Overview & Why it Matters */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {isAr ? 'أهمية المهارة في مسارك المهني:' : 'Why This Skill Matters:'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr ? selectedNode.descriptionAr || selectedNode.description : selectedNode.description}
                </p>
              </div>

              {/* Learning Objectives */}
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <h4 className="text-xs font-bold text-slate-900">
                  {isAr ? 'الأهداف التعليمية للمهارة:' : 'Learning Objectives:'}
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {(isAr && selectedNode.learningObjectivesAr ? selectedNode.learningObjectivesAr : selectedNode.learningObjectives).map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Completion Criteria & Practical Exercise */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'معيار إتقان المهارة (Completion Criteria):' : 'Completion Criteria:'}</span>
                </div>
                <p className="text-blue-800 leading-relaxed">{selectedNode.completionCriteria}</p>
                {selectedNode.practicalExercise && (
                  <div className="pt-2 border-t border-blue-200/60 text-[11px] text-blue-700">
                    <strong>{isAr ? 'تمرين عملي مقترح:' : 'Practical Exercise:'}</strong> {selectedNode.practicalExercise}
                  </div>
                )}
              </div>

              {/* Resources Header & Filters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-blue-600" />
                    <span>{isAr ? 'المصادر والدورات المعتمدة:' : 'Curated Verified Resources:'}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {selectedNode.resources.length} {isAr ? 'مصادر موثقة' : 'sources'}
                  </span>
                </div>

                {/* Resource Category filter pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setResourceFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      resourceFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResourceFilter('free')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      resourceFilter === 'free' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isAr ? 'مجاني (Free)' : 'Free'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResourceFilter('youtube')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      resourceFilter === 'youtube' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setResourceFilter('coursera')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      resourceFilter === 'coursera' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Coursera
                  </button>
                </div>

                {/* Resources List */}
                <div className="space-y-3 pt-1">
                  {selectedNode.resources
                    .filter((r) => {
                      if (resourceFilter === 'free') return r.priceCategory === 'Free' || r.priceCategory === 'Audit Free';
                      if (resourceFilter === 'youtube') return r.provider === 'YouTube';
                      if (resourceFilter === 'coursera') return r.provider === 'Coursera';
                      if (resourceFilter === 'docs') return r.resourceType === 'documentation';
                      return true;
                    })
                    .map((resource) => {
                      const isSaved = savedResources.some((sr) => sr.id === resource.id);

                      return (
                        <div
                          key={resource.id}
                          className="p-3.5 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-2xs space-y-2 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                                  {resource.provider}
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  {resource.priceCategory}
                                </span>
                                {resource.verificationStatus === 'Verified' && (
                                  <span className="text-[10px] font-bold text-emerald-600">✓ {isAr ? 'موثق' : 'Verified'}</span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 mt-1">{resource.title}</h5>
                              {resource.instructor && (
                                <p className="text-[11px] text-slate-500">{resource.instructor}</p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleSaveResource(resource)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title={isSaved ? 'Unsave' : 'Save resource'}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Bookmark className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {resource.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {resource.description}
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            {resource.estimatedDuration && (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{resource.estimatedDuration}</span>
                              </span>
                            )}

                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                            >
                              <span>{isAr ? 'فتح الدورة' : 'Open Course'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 sticky bottom-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateNodeStatus(selectedNode.id, 'in_progress');
                    setSelectedNode(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  {isAr ? 'تحديد كـ قيد التعلم' : 'Mark In Progress'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleUpdateNodeStatus(selectedNode.id, 'completed');
                  setSelectedNode(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'إتمام المهارة واعتمادها' : 'Mark as Completed'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: AI CUSTOM ROADMAP GENERATOR
          ==================================================================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden space-y-5 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAr ? 'توليد مسار تعلم مخصص بالذكاء الاصطناعي' : 'Generate Custom Learning Roadmap'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'يتم البناء اعتماداً على مهاراتك الحالية وثغرات ملفك المهني' : 'Tailored to your current skills and target role trajectory'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {generationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{generationError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  {isAr ? 'المسمى الوظيفي المستهدف:' : 'Target Job Role / Career Goal:'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: AI Systems Engineer, Cloud Architect...' : 'e.g. AI Systems Engineer, Cloud Architect...'}
                  value={customTargetRole}
                  onChange={(e) => setCustomTargetRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  {isAr ? 'ساعات المذاكرة الأسبوعية المتوقعة:' : 'Available Weekly Hours:'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 8, 10].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setCustomWeeklyHours(hrs)}
                      className={`py-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        customWeeklyHours === hrs
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {hrs} {isAr ? 'ساعات' : 'hrs'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteAIGeneration}
                disabled={isGeneratingRoadmap || !customTargetRole.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
              >
                {isGeneratingRoadmap ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isAr ? 'جاري بناء المسار...' : 'Generating Roadmap...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'بناء المسار الآن' : 'Generate Roadmap'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
