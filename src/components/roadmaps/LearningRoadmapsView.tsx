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
      <div className="p-6 surface-elevated border-hairline rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: 'var(--color-primary)' }}>
            <Compass className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <span>{isAr ? 'مسارات التعلم التفاعلية ومصادر الدورات' : 'Interactive Learning Roadmaps & Resource Discovery'}</span>
          </div>
          <h1 className="heading-2xl" style={{ color: 'var(--color-text-primary)' }}>
            {isAr ? 'مسارات التعلم المهني (Learning Roadmaps)' : 'Career Learning Roadmaps'}
          </h1>
          <p className="text-xs mt-1 max-w-2xl leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
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
            className="button-primary inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'توليد مسار مخصص بالذكاء الاصطناعي' : 'Generate Custom AI Roadmap'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b text-xs font-bold" style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-secondary)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'workspace'
              ? 'shadow-xs'
              : ''
          }`}
          style={activeTab === 'workspace' ? {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)'
          } : {
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'workspace') {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'workspace') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isAr ? 'مساحة المسار التفاعلي' : 'Roadmap Workspace'}</span>
          {currentEnrollment && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px]" style={activeTab === 'workspace' ? {
              backgroundColor: 'rgba(var(--color-primary-rgb), 0.3)',
              color: 'var(--color-text-inverse)'
            } : {
              backgroundColor: 'var(--color-surface-secondary)',
              color: 'var(--color-text-primary)'
            }}>
              {progressPercent}%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('discovery')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'discovery' ? 'shadow-xs' : ''
          }`}
          style={activeTab === 'discovery' ? {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)'
          } : {
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'discovery') {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'discovery') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{isAr ? 'اكتشاف المسارات' : 'Roadmap Discovery'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px]" style={activeTab === 'discovery' ? {
            backgroundColor: 'rgba(var(--color-primary-rgb), 0.3)',
            color: 'var(--color-text-inverse)'
          } : {
            backgroundColor: 'var(--color-surface-secondary)',
            color: 'var(--color-text-primary)'
          }}>
            {roadmaps.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_roadmaps')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'my_roadmaps' ? 'shadow-xs' : ''
          }`}
          style={activeTab === 'my_roadmaps' ? {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)'
          } : {
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'my_roadmaps') {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'my_roadmaps') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isAr ? 'مساراتي المسجلة' : 'My Roadmaps'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px]" style={activeTab === 'my_roadmaps' ? {
            backgroundColor: 'rgba(var(--color-primary-rgb), 0.3)',
            color: 'var(--color-text-inverse)'
          } : {
            backgroundColor: 'var(--color-surface-secondary)',
            color: 'var(--color-text-primary)'
          }}>
            {enrollments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('weekly_plan')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'weekly_plan' ? 'shadow-xs' : ''
          }`}
          style={activeTab === 'weekly_plan' ? {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)'
          } : {
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'weekly_plan') {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'weekly_plan') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isAr ? 'الخطة الأسبوعية' : 'Weekly Plan'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'progress' ? 'shadow-xs' : ''
          }`}
          style={activeTab === 'progress' ? {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)'
          } : {
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'progress') {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'progress') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isAr ? 'مؤشرات التقدم والجاهزية' : 'Progress & Readiness'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings' ? 'shadow-xs' : ''
          }`}
          style={activeTab === 'settings' ? {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)'
          } : {
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'settings') {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'settings') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
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
          <div className="p-4 surface-elevated border-hairline rounded-2xl shadow-2xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                placeholder={isAr ? 'ابحث عن مسار مهني أو مهارة (مثال: AI, Python, React, Data)...' : 'Search roadmaps or skills (e.g. AI, Python, React, Data)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-text w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-select"
              >
                <option value="all">{isAr ? 'جميع المجالات' : 'All Categories'}</option>
                <option value="Data & AI">{isAr ? 'البيانات والذكاء الاصطناعي' : 'Data & AI'}</option>
                <option value="Software Engineering">{isAr ? 'هندسة البرمجيات' : 'Software Engineering'}</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="input-select"
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
                  className="card-interactive p-5 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="badge-primary">
                        {roadmap.category}
                      </span>
                      <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        <Clock className="w-3 h-3" />
                        <span>~{roadmap.estimatedTotalHours} {isAr ? 'ساعة' : 'hrs'}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="heading-base group-hover:text-primary transition-colors">
                        {isAr ? roadmap.titleAr : roadmap.title}
                      </h3>
                      <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                        {isAr ? roadmap.descriptionAr : roadmap.description}
                      </p>
                    </div>

                    {/* Stages breakdown */}
                    <div className="p-3 rounded-xl space-y-1 text-xs" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                      <div className="text-[11px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {isAr ? `يتضمن ${roadmap.stages.length} مراحل تعليمية:` : `Includes ${roadmap.stages.length} Structured Stages:`}
                      </div>
                      <div className="space-y-0.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {roadmap.stages.slice(0, 3).map((stg, i) => (
                          <div key={stg.id} className="truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
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
                          className="badge-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border-tertiary)' }}>
                    {isEnrolled ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isAr ? `مسجل (${enr?.progressPercentage}%)` : `Enrolled (${enr?.progressPercentage}%)`}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoadmapId(roadmap.id);
                            setActiveTab('workspace');
                          }}
                          className="button-primary-sm"
                        >
                          {isAr ? 'فتح المسار' : 'Open Workspace'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                          {isAr ? 'متاح للتسجيل الفوري' : 'Open enrollment'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEnroll(roadmap.id, 5)}
                          className="button-secondary-sm"
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
            <div className="p-12 surface-elevated border-hairline rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--color-surface-primary-subtle)', color: 'var(--color-primary)' }}>
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="heading-base">
                {isAr ? 'لم تسجل في أي مسار بعد' : 'No Enrolled Roadmaps Yet'}
              </h3>
              <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                {isAr
                  ? 'اختر مساراً مهنياً يناسب هدفك وانطلق في رحلة التعلم بخطة أسبوعية منظمة.'
                  : 'Select a career path that aligns with your goal and start your guided learning plan.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('discovery')}
                className="button-primary"
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
                    className="p-6 surface-elevated border-hairline rounded-2xl shadow-2xs space-y-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="badge-primary">
                          {rdm.category}
                        </span>
                        <h3 className="heading-lg mt-1.5">
                          {isAr ? rdm.titleAr : rdm.title}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                          {isAr ? `تستهدف دور: ${rdm.targetRole}` : `Targeting: ${rdm.targetRole}`}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text-primary)' }}>
                        {enr.weeklyHoursCommitted || 5} {isAr ? 'س/أسبوع' : 'hrs/wk'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {isAr ? `تم إنجاز ${completedCount} من ${totalNodes} مهارة` : `${completedCount} of ${totalNodes} skills completed`}
                        </span>
                        <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{enr.progressPercentage}%</span>
                      </div>
                      <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${enr.progressPercentage}%`, backgroundColor: 'var(--color-primary)' }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border-tertiary)' }}>
                      <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {isAr ? `تاريخ البدء: ${enr.startDate}` : `Started: ${enr.startDate}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoadmapId(rdm.id);
                          setActiveTab('workspace');
                        }}
                        className="button-primary-sm inline-flex items-center gap-1.5"
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
          <div className="p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: 'linear-gradient(to right, var(--color-surface-inverse), var(--color-primary-dark), var(--color-surface-inverse))', color: 'var(--color-text-inverse)' }}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.3)', color: 'var(--color-text-inverse)', borderWidth: '1px', borderColor: 'rgba(var(--color-primary-rgb), 0.5)' }}>
                  {currentRoadmap.category}
                </span>
                <span className="text-xs" style={{ color: 'rgba(var(--color-text-inverse-rgb), 0.7)' }}>
                  ~{currentRoadmap.estimatedTotalHours} {isAr ? 'ساعة تدريبية' : 'total hours'}
                </span>
              </div>
              <h2 className="heading-xl">
                {isAr ? currentRoadmap.titleAr : currentRoadmap.title}
              </h2>
              <p className="text-xs max-w-xl leading-relaxed" style={{ color: 'rgba(var(--color-text-inverse-rgb), 0.7)' }}>
                {isAr ? currentRoadmap.descriptionAr : currentRoadmap.description}
              </p>
            </div>

            {/* Quick Switcher dropdown & Progress Widget */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <select
                value={selectedRoadmapId}
                onChange={(e) => setSelectedRoadmapId(e.target.value)}
                className="text-xs p-2.5 rounded-xl font-medium outline-none cursor-pointer" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.2)', color: 'var(--color-text-inverse)' }}
              >
                {roadmaps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isAr ? r.titleAr : r.title}
                  </option>
                ))}
              </select>

              <div className="text-xs flex items-center gap-2 font-medium" style={{ color: 'rgba(var(--color-text-inverse-rgb), 0.7)' }}>
                <span>{isAr ? 'نسبة الإنجاز:' : 'Completion:'}</span>
                <span className="font-bold" style={{ color: 'var(--color-success-light)' }}>{progressPercent}%</span>
                <span style={{ color: 'rgba(var(--color-text-inverse-rgb), 0.5)' }}>
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
                  <div className="w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}>
                    {stageIndex + 1}
                  </div>
                  <div>
                    <h3 className="heading-sm">
                      {isAr ? stage.titleAr || stage.title : stage.title}
                    </h3>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      {isAr ? stage.descriptionAr || stage.description : stage.description} •{' '}
                      <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{stage.estimatedEffort}</span>
                    </p>
                  </div>
                </div>

                {/* Nodes Grid in Stage */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 rtl:pr-4 rtl:pl-0 border-l-2 rtl:border-r-2 rtl:border-l-0 ml-4 rtl:mr-4 rtl:ml-0" style={{ borderColor: 'rgba(var(--color-primary-rgb), 0.3)' }}>
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
                            ? 'shadow-2xs'
                            : effectiveStatus === 'in_progress'
                            ? 'shadow-xs'
                            : effectiveStatus === 'locked'
                            ? 'opacity-60 hover:opacity-80'
                            : 'shadow-2xs hover:shadow-xs'
                        }`}
                        style={
                          effectiveStatus === 'completed' ? {
                            backgroundColor: 'var(--color-success-bg)',
                            borderColor: 'var(--color-success-border)'
                          } : effectiveStatus === 'in_progress' ? {
                            backgroundColor: 'var(--color-primary-bg)',
                            borderColor: 'var(--color-primary)',
                            boxShadow: '0 0 0 2px rgba(var(--color-primary-rgb), 0.1)'
                          } : effectiveStatus === 'locked' ? {
                            backgroundColor: 'var(--color-surface-secondary)',
                            borderColor: 'var(--color-border-primary)'
                          } : {
                            backgroundColor: 'var(--color-surface-primary)',
                            borderColor: 'var(--color-border-primary)'
                          }
                        }
                      >
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text-secondary)' }}>
                            {node.category}
                          </span>

                          <span className="flex items-center gap-1 text-[11px] font-bold">
                            {effectiveStatus === 'completed' && (
                              <span className="flex items-center gap-1" style={{ color: 'var(--color-success-text)' }}>
                                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                                {isAr ? 'مكتمل' : 'Completed'}
                              </span>
                            )}
                            {effectiveStatus === 'in_progress' && (
                              <span className="flex items-center gap-1 animate-pulse" style={{ color: 'var(--color-primary-text)' }}>
                                <PlayCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
                                {isAr ? 'قيد التعلم' : 'In Progress'}
                              </span>
                            )}
                            {effectiveStatus === 'available' && (
                              <span className="flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                                {isAr ? 'متاح للبدء' : 'Available'}
                              </span>
                            )}
                            {effectiveStatus === 'locked' && (
                              <span className="flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                <Lock className="w-3 h-3" />
                                {isAr ? 'مغلق بمتطلبات' : 'Locked'}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Node Content */}
                        <div>
                          <h4 className="text-xs font-bold group-hover:text-primary transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                            {isAr ? node.titleAr || node.title : node.title}
                          </h4>
                          <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                            {isAr ? node.descriptionAr || node.description : node.description}
                          </p>
                        </div>

                        {/* Footer Details */}
                        <div className="pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--color-border-tertiary)', color: 'var(--color-text-tertiary)' }}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{node.estimatedEffort}</span>
                          </span>

                          <span className="font-semibold group-hover:underline flex items-center gap-0.5" style={{ color: 'var(--color-primary)' }}>
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
          <div className="p-6 surface-elevated border-hairline rounded-2xl shadow-2xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="heading-lg">
                  {isAr ? 'الخطة والجدول الأسبوعي المخصص' : 'Personalized Weekly Learning Schedule'}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {isAr
                    ? 'جدول مذاكرة مقسم على أيام الأسبوع بناءً على ساعات فراغك الملتزم بها للوصول إلى هدفك المهني.'
                    : 'Structured activities balanced across your available days to ensure consistent career momentum.'}
                </p>
              </div>

              {/* Hours commitment selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
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
                  className="input-select font-bold"
                  style={{ color: 'var(--color-primary)' }}
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
                        ? 'opacity-60'
                        : ''
                    }`}
                    style={act.completed ? {
                      backgroundColor: 'var(--color-surface-secondary)',
                      borderColor: 'var(--color-border-primary)'
                    } : {
                      backgroundColor: 'var(--color-surface-primary)',
                      borderColor: 'var(--color-border-primary)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          act.completed = !act.completed;
                          setEnrollments([...clientDb.getUserEnrollments()]);
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer mt-0.5`}
                        style={act.completed ? {
                          backgroundColor: 'var(--color-success)',
                          borderColor: 'var(--color-success)',
                          color: 'var(--color-text-inverse)'
                        } : {
                          borderColor: 'var(--color-border-secondary)',
                          backgroundColor: 'var(--color-surface-primary)'
                        }}
                      >
                        {act.completed && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="badge-primary">
                            {act.dayOfWeek || 'Scheduled'}
                          </span>
                          <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{act.activityTitle}</span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          {isAr ? 'المهارة المرتبطة:' : 'Skill Node:'} {act.nodeTitle}
                        </p>
                        {act.resourceUrl && (
                          <a
                            href={act.resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] hover:underline mt-1 font-medium"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <span>{act.resourceTitle || act.resourceUrl}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-mono shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
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
            <div className="p-6 surface-elevated border-hairline rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>{isAr ? 'إجمالي المهارات المنجزة' : 'Skills Mastered'}</span>
              <div className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{completedNodesCount}</div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--color-success)' }}>
                {isAr ? 'تم توثيقها كأدلة رسمية في ملفك المهني' : 'Recorded as verified skill evidence in Career DNA'}
              </p>
            </div>

            <div className="p-6 surface-elevated border-hairline rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>{isAr ? 'ساعات الاستثمار التدريبي' : 'Training Hours Invested'}</span>
              <div className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>
                {completedNodesCount * 8} {isAr ? 'ساعة' : 'hrs'}
              </div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                {isAr ? 'مبنية على التقدير المعياري للمسار' : 'Based on roadmap standard effort metrics'}
              </p>
            </div>

            <div className="p-6 surface-elevated border-hairline rounded-2xl shadow-2xs space-y-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>{isAr ? 'تأثير جاهزية التوظيف' : 'Career Readiness Boost'}</span>
              <div className="text-3xl font-black" style={{ color: 'var(--color-success)' }}>+{Math.min(30, completedNodesCount * 6)}%</div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                {isAr ? 'يرفع مطابقة سيرتك الذاتية في أنظمة الـ ATS' : 'Elevates ATS resume matching & opportunity fit'}
              </p>
            </div>
          </div>

          {/* Saved Resources List */}
          <div className="p-6 surface-elevated border-hairline rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="heading-base">
                {isAr ? 'المصادر والدورات المحفوظة' : 'Saved Learning Resources'}
              </h3>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                {savedResources.length} {isAr ? 'مصادر' : 'items'}
              </span>
            </div>

            {savedResources.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                {isAr
                  ? 'لم تحفظ أي مصادر بعد. انقر على أيقونة الإشارة المرجعية داخل تفاصيل أي مهارة لحفظها هنا.'
                  : 'No saved resources yet. Click the bookmark icon inside any skill drawer to save courses here.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-3.5 border rounded-xl flex items-start justify-between gap-3"
                    style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-primary)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="badge-primary">
                          {res.provider}
                        </span>
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>{res.priceCategory}</span>
                      </div>
                      <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{res.title}</h4>
                      {res.instructor && <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>{res.instructor}</p>}
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-colors cursor-pointer shrink-0"
                      style={{ color: 'var(--color-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
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
        <div className="p-6 surface-elevated border-hairline rounded-2xl shadow-2xs space-y-6 max-w-2xl">
          <div>
            <h3 className="heading-base">
              {isAr ? 'تفضيلات وأهداف التعلم' : 'Learning Preferences & Goals'}
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {isAr
                ? 'تخصيص نمط التعلم المفضل واللغة والميزانية لتوجيه توصيات الذكاء الاصطناعي بدقة.'
                : 'Configure your preferred study format, language, and budget to refine AI roadmap recommendations.'}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold block" style={{ color: 'var(--color-text-primary)' }}>
                {isAr ? 'المسمى المهني المستهدف بالمسارات:' : 'Target Career Trajectory:'}
              </label>
              <input
                type="text"
                value={profile?.targetRole || 'Software Engineer'}
                disabled
                className="input-text font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold block" style={{ color: 'var(--color-text-primary)' }}>
                {isAr ? 'لغة المحتوى المفضلة:' : 'Preferred Content Language:'}
              </label>
              <select
                value={learningSettings.preferredLanguage}
                onChange={(e) => setLearningSettings({ ...learningSettings, preferredLanguage: e.target.value })}
                className="input-select"
              >
                <option value="Both">{isAr ? 'العربية والإنجليزية (Both)' : 'Both Arabic & English'}</option>
                <option value="English">{isAr ? 'الإنجليزية فقط' : 'English Only'}</option>
                <option value="Arabic">{isAr ? 'العربية فقط' : 'Arabic Only'}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold block" style={{ color: 'var(--color-text-primary)' }}>
                {isAr ? 'تفضيل التكلفة والميزانية:' : 'Budget Preference:'}
              </label>
              <select
                value={learningSettings.budgetPreference}
                onChange={(e) => setLearningSettings({ ...learningSettings, budgetPreference: e.target.value })}
                className="input-select"
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
        <div className="fixed inset-0 z-50 flex items-center justify-end animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedNode(null)}>
          <div
            className="w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b shrink-0 z-10" style={{ backgroundColor: 'rgba(var(--color-surface-primary-rgb), 0.95)', backdropFilter: 'blur(4px)', borderColor: 'var(--color-border-tertiary)' }}>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="badge-primary">
                    {selectedNode.category}
                  </span>
                  <h3 className="heading-base">
                    {isAr ? selectedNode.titleAr || selectedNode.title : selectedNode.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-tertiary)';
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body Content */}
            <div className="p-5 space-y-6 flex-1 overflow-y-auto overscroll-contain">
              {/* Overview & Why it Matters */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                  {isAr ? 'أهمية المهارة في مسارك المهني:' : 'Why This Skill Matters:'}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {isAr ? selectedNode.descriptionAr || selectedNode.description : selectedNode.description}
                </p>
              </div>

              {/* Learning Objectives */}
              <div className="space-y-2 p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-secondary)' }}>
                <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {isAr ? 'الأهداف التعليمية للمهارة:' : 'Learning Objectives:'}
                </h4>
                <ul className="space-y-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {(isAr && selectedNode.learningObjectivesAr ? selectedNode.learningObjectivesAr : selectedNode.learningObjectives).map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Completion Criteria & Practical Exercise */}
              <div className="p-3.5 border rounded-xl space-y-2 text-xs" style={{ backgroundColor: 'var(--color-primary-bg)', borderColor: 'var(--color-primary-border)' }}>
                <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--color-primary-text)' }}>
                  <Award className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  <span>{isAr ? 'معيار إتقان المهارة (Completion Criteria):' : 'Completion Criteria:'}</span>
                </div>
                <p className="leading-relaxed" style={{ color: 'var(--color-primary-text)' }}>{selectedNode.completionCriteria}</p>
                {selectedNode.practicalExercise && (
                  <div className="pt-2 border-t text-[11px]" style={{ borderColor: 'var(--color-primary-border)', color: 'var(--color-primary-text)' }}>
                    <strong>{isAr ? 'تمرين عملي مقترح:' : 'Practical Exercise:'}</strong> {selectedNode.practicalExercise}
                  </div>
                )}
              </div>

              {/* Resources Header & Filters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                    <Video className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    <span>{isAr ? 'المصادر والدورات المعتمدة:' : 'Curated Verified Resources:'}</span>
                  </h4>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                    {selectedNode.resources.length} {isAr ? 'مصادر موثقة' : 'sources'}
                  </span>
                </div>

                {/* Resource Category filter pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  {['all', 'free', 'youtube', 'coursera'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setResourceFilter(filter as any)}
                      className="px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                      style={resourceFilter === filter ? {
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-text-inverse)'
                      } : {
                        backgroundColor: 'var(--color-surface-secondary)',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      {filter === 'all' ? (isAr ? 'الكل' : 'All') :
                       filter === 'free' ? (isAr ? 'مجاني (Free)' : 'Free') :
                       filter === 'youtube' ? 'YouTube' : 'Coursera'}
                    </button>
                  ))}
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
                          className="p-3.5 border rounded-xl shadow-2xs space-y-2 transition-all"
                          style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-primary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="badge-primary">
                                  {resource.provider}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ color: 'var(--color-success-text)', backgroundColor: 'var(--color-success-bg)' }}>
                                  {resource.priceCategory}
                                </span>
                                {resource.verificationStatus === 'Verified' && (
                                  <span className="text-[10px] font-bold" style={{ color: 'var(--color-success)' }}>✓ {isAr ? 'موثق' : 'Verified'}</span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{resource.title}</h5>
                              {resource.instructor && (
                                <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>{resource.instructor}</p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleSaveResource(resource)}
                              className="p-1.5 transition-colors cursor-pointer"
                              title={isSaved ? 'Unsave' : 'Save resource'}
                              style={{ color: isSaved ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-primary)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSaved) {
                                  e.currentTarget.style.color = 'var(--color-text-tertiary)';
                                }
                              }}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="w-4 h-4" />
                              ) : (
                                <Bookmark className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {resource.description && (
                            <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                              {resource.description}
                            </p>
                          )}

                          <div className="pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--color-border-tertiary)' }}>
                            {resource.estimatedDuration && (
                              <span className="flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                <Clock className="w-3 h-3" />
                                <span>{resource.estimatedDuration}</span>
                              </span>
                            )}

                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button-primary-sm inline-flex items-center gap-1"
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
            <div className="p-4 border-t flex items-center justify-between gap-3 shrink-0" style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-primary)' }}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateNodeStatus(selectedNode.id, 'in_progress');
                    setSelectedNode(null);
                  }}
                  className="button-secondary-sm"
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
                className="px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                style={{ color: 'var(--color-text-inverse)', backgroundColor: 'var(--color-success)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-success-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-success)';
                }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} onClick={() => setShowGenerateModal(false)}>
          <div
            className="rounded-2xl shadow-2xl border max-w-lg w-full flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-5 shrink-0" style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-tertiary)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="heading-sm">
                    {isAr ? 'توليد مسار تعلم مخصص بالذكاء الاصطناعي' : 'Generate Custom Learning Roadmap'}
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                    {isAr ? 'يتم البناء اعتماداً على مهاراتك الحالية وثغرات ملفك المهني' : 'Tailored to your current skills and target role trajectory'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="p-1.5 rounded-lg cursor-pointer"
                style={{ color: 'var(--color-text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-tertiary)';
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain text-xs">
              {generationError && (
                <div className="p-3 border rounded-xl text-xs flex items-start gap-2" style={{ backgroundColor: 'var(--color-error-bg)', borderColor: 'var(--color-error-border)', color: 'var(--color-error-text)' }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
                  <span>{generationError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold block" style={{ color: 'var(--color-text-primary)' }}>
                  {isAr ? 'المسمى الوظيفي المستهدف:' : 'Target Job Role / Career Goal:'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: AI Systems Engineer, Cloud Architect...' : 'e.g. AI Systems Engineer, Cloud Architect...'}
                  value={customTargetRole}
                  onChange={(e) => setCustomTargetRole(e.target.value)}
                  className="input-text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold block" style={{ color: 'var(--color-text-primary)' }}>
                  {isAr ? 'ساعات المذاكرة الأسبوعية المتوقعة:' : 'Available Weekly Hours:'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 8, 10].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setCustomWeeklyHours(hrs)}
                      className={`py-2 rounded-xl border text-center font-bold transition-all cursor-pointer`}
                      style={customWeeklyHours === hrs ? {
                        backgroundColor: 'var(--color-primary-bg)',
                        borderColor: 'var(--color-primary)',
                        color: 'var(--color-primary-text)'
                      } : {
                        borderColor: 'var(--color-border-primary)',
                        backgroundColor: 'var(--color-surface-primary)',
                        color: 'var(--color-text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        if (customWeeklyHours !== hrs) {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (customWeeklyHours !== hrs) {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface-primary)';
                        }
                      }}
                    >
                      {hrs} {isAr ? 'ساعات' : 'hrs'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 p-4 border-t flex items-center justify-end gap-2" style={{ backgroundColor: 'rgba(var(--color-surface-secondary-rgb), 0.7)', borderColor: 'var(--color-border-tertiary)' }}>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteAIGeneration}
                disabled={isGeneratingRoadmap || !customTargetRole.trim()}
                className="button-primary inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isGeneratingRoadmap ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
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
