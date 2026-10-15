import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  Award,
  ChevronRight,
  Plus,
  Play,
  RotateCcw,
  Check,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  Star,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Course, CareerProfile, CourseModule } from '../../types/index.js';

interface CoursesViewProps {
  courses: Course[];
  profile: CareerProfile;
  onEnrollCourse: (id: string) => Promise<any>;
  onUpdateProgress: (id: string, progress: number, completedModuleId?: string) => Promise<any>;
  onCompleteCourse: (id: string, notes?: string, certUrl?: string) => Promise<any>;
  onAddCourse: (course: Partial<Course>) => Promise<any>;
  onDeleteCourse: (id: string) => Promise<any>;
  onRecommendCourses: (focusArea?: string) => Promise<any>;
  onNavigateTab: (tab: string) => void;
  lang: 'en' | 'ar';
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  profile,
  onEnrollCourse,
  onUpdateProgress,
  onCompleteCourse,
  onAddCourse,
  onDeleteCourse,
  onRecommendCourses,
  onNavigateTab,
  lang,
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCost, setSelectedCost] = useState<string>('all');

  // Modals & Drawers
  const [activeCourseDrawer, setActiveCourseDrawer] = useState<Course | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState<Course | null>(null);

  // AI Generation state
  const [aiFocusArea, setAiFocusArea] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResultNotice, setAiResultNotice] = useState<string | null>(null);

  // Complete course form state
  const [completionNotes, setCompletionNotes] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // New course form state
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    provider: 'Coursera',
    instructor: '',
    domain: profile.targetIndustries[0] || 'AI & Machine Learning',
    level: 'Intermediate',
    duration: '10 hours',
    rating: 4.8,
    url: '',
    description: '',
    skillsGained: [],
    cost: 'Free with Paid Cert',
    certificateAvailable: true,
  });
  const [newSkillsInput, setNewSkillsInput] = useState('');

  // Extract unique domains
  const availableDomains = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.domain) set.add(c.domain);
    });
    return Array.from(set);
  }, [courses]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesProvider = c.provider.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesSkills = c.skillsGained.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesProvider && !matchesDesc && !matchesSkills) {
          return false;
        }
      }

      // Domain
      if (selectedDomain !== 'all') {
        if (selectedDomain === 'my_target') {
          const target = (profile.targetRole || '').toLowerCase();
          const matchesTarget =
            c.domain.toLowerCase().includes('ai') ||
            c.domain.toLowerCase().includes('software') ||
            (c.targetRole && c.targetRole.toLowerCase().includes(target));
          if (!matchesTarget) return false;
        } else if (c.domain !== selectedDomain) {
          return false;
        }
      }

      // Level
      if (selectedLevel !== 'all' && c.level !== selectedLevel) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && c.enrollmentStatus !== selectedStatus) {
        return false;
      }

      // Cost
      if (selectedCost !== 'all') {
        if (selectedCost === 'free' && c.cost === 'Paid') return false;
        if (selectedCost === 'paid' && c.cost !== 'Paid') return false;
      }

      return true;
    });
  }, [courses, searchQuery, selectedDomain, selectedLevel, selectedStatus, selectedCost, profile]);

  // Metrics
  const enrolledCount = courses.filter((c) => c.enrollmentStatus === 'in_progress').length;
  const completedCount = courses.filter((c) => c.enrollmentStatus === 'completed').length;
  const verifiedEvidenceCount = profile.skills.reduce(
    (acc, s) => acc + s.evidence.filter((e) => e.type === 'course').length,
    0
  );

  // Handle AI generation
  const handleRunAIGenerate = async () => {
    try {
      setIsGeneratingAI(true);
      setAiResultNotice(null);
      const res = await onRecommendCourses(aiFocusArea || undefined);
      setShowAIModal(false);
      setAiFocusArea('');
      setAiResultNotice(
        lang === 'ar'
          ? `تم بنجاح توليد ${res.newCourses?.length || 3} كورسات متوافقة مع مجالك وثغرات مهاراتك!`
          : `Generated ${res.newCourses?.length || 3} tailored courses aligned with your domain!`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to generate course recommendations');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle Complete submission
  const handleConfirmCompletion = async () => {
    if (!showCompleteModal) return;
    try {
      setIsSubmittingCompletion(true);
      await onCompleteCourse(showCompleteModal.id, completionNotes, certificateUrl);
      setShowCompleteModal(null);
      setCompletionNotes('');
      setCertificateUrl('');
      setActiveCourseDrawer(null);
    } catch (err: any) {
      alert(err.message || 'Failed to complete course');
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  // Handle add manual course
  const handleCreateCustomCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.provider) return;

    const skills = newSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await onAddCourse({
      ...newCourse,
      skillsGained: skills.length > 0 ? skills : ['General Competency'],
      modules: [
        { id: `m-${Date.now()}-1`, title: 'Core Foundations & Setup', duration: '2h', completed: false },
        { id: `m-${Date.now()}-2`, title: 'Advanced Practical Implementation', duration: '4h', completed: false },
        { id: `m-${Date.now()}-3`, title: 'Final Project & Assessment', duration: '4h', completed: false },
      ],
      enrollmentStatus: 'not_enrolled',
      progressPercentage: 0,
      source: 'User_Added',
      rating: 4.8,
      relevanceReason: lang === 'ar' ? 'أضيف يدوياً بواسطة المستخدم لتتبع مسار التعلم' : 'Added manually by user for career growth tracking',
    });

    setShowAddModal(false);
    setNewCourse({
      title: '',
      provider: 'Coursera',
      instructor: '',
      domain: profile.targetIndustries[0] || 'AI & Machine Learning',
      level: 'Intermediate',
      duration: '10 hours',
      rating: 4.8,
      url: '',
      description: '',
      skillsGained: [],
      cost: 'Free with Paid Cert',
      certificateAvailable: true,
    });
    setNewSkillsInput('');
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="surface-elevated border-hairline rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg inline-block" style={{ backgroundColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)' }}>
                <GraduationCap className="w-5 h-5" />
              </span>
              <h1 className="heading-lg">
                {lang === 'ar' ? 'مركز التطوير المهني والكورسات' : 'Professional Skill Development & Courses'}
              </h1>
            </div>
            <p className="body-sm" style={{ color: 'var(--color-neutral-600)' }}>
              {lang === 'ar'
                ? 'كورسات تدريبية ومسارات تخصصية متزامنة مع مجالك المستهدف وثغرات مهاراتك المكتشفة بالذكاء الاصطناعي. إكمال الكورسات يضيف أدلة موثقة فورياً لملفك المهني ويرفع نقاط جاهزيتك للوظائف.'
                : 'Curated and AI-recommended skill development tracks aligned with your target domain and identified skill gaps. Completing courses immediately awards verified evidence to your Career DNA and boosts your Career Readiness.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 caption" style={{ color: 'var(--color-neutral-500)' }}>
              <span className="font-medium" style={{ color: 'var(--color-neutral-700)' }}>
                {lang === 'ar' ? 'المجال المستهدف:' : 'Target Field:'}
              </span>
              <span className="px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-800)', fontSize: '11px' }}>
                {profile.targetRole || 'Full-Stack Software Engineer'}
              </span>
              <span style={{ color: 'var(--color-neutral-300)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                {profile.targetIndustries.join(' / ') || 'AI & Machine Learning'}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAIModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {lang === 'ar' ? 'اقتراح كورسات ذكية بالـ AI' : 'AI Course Recommendations'}
              </span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-secondary flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إضافة كورس يدوي' : 'Add Custom Course'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t caption" style={{ borderColor: 'var(--color-neutral-100)' }}>
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-neutral-50)', borderColor: 'var(--color-neutral-200)' }}>
            <span className="block" style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
              {lang === 'ar' ? 'إجمالي الكورسات المتاحة' : 'Total Available'}
            </span>
            <span className="font-bold font-mono tabular-nums" style={{ fontSize: '18px', color: 'var(--color-neutral-900)' }}>
              {courses.length}
            </span>
          </div>
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-neutral-50)', borderColor: 'var(--color-neutral-200)' }}>
            <span className="block" style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
              {lang === 'ar' ? 'قيد التعلم والمتابعة' : 'In Progress'}
            </span>
            <span className="font-bold font-mono tabular-nums" style={{ fontSize: '18px', color: 'var(--color-amber-700)' }}>
              {enrolledCount}
            </span>
          </div>
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-neutral-50)', borderColor: 'var(--color-neutral-200)' }}>
            <span className="block" style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
              {lang === 'ar' ? 'كورسات مكتملة' : 'Completed'}
            </span>
            <span className="font-bold font-mono tabular-nums" style={{ fontSize: '18px', color: 'var(--color-emerald-700)' }}>
              {completedCount}
            </span>
          </div>
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-neutral-50)', borderColor: 'var(--color-neutral-200)' }}>
            <span className="block" style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
              {lang === 'ar' ? 'أدلة كفاءة موثقة' : 'Verified Evidence'}
            </span>
            <span className="font-bold font-mono tabular-nums" style={{ fontSize: '18px', color: 'var(--color-blue-700)' }}>
              {verifiedEvidenceCount}
            </span>
          </div>
        </div>
      </div>

      {/* AI Recommendation Alert / Domain Focus Insight */}
      <div className="rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: 'linear-gradient(to right, var(--color-neutral-900), var(--color-neutral-800), var(--color-neutral-900))', color: 'var(--color-neutral-50)' }}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-emerald-400)' }} />
          </div>
          <div className="space-y-1">
            <h3 className="caption font-bold tracking-tight flex items-center gap-1.5" style={{ color: 'var(--color-neutral-50)' }}>
              <span>{lang === 'ar' ? 'توصية المسار الذكي لمجالك المستهدف' : 'Smart Domain Learning Track Recommendation'}</span>
              <span className="px-1.5 py-0.2 rounded font-normal" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-emerald-300)', fontSize: '10px' }}>
                {lang === 'ar' ? 'مطابقة عالية' : 'High Impact'}
              </span>
            </h3>
            <p className="max-w-2xl leading-relaxed" style={{ fontSize: '11px', color: 'var(--color-neutral-300)' }}>
              {lang === 'ar'
                ? `بناءً على هدفك (${profile.targetRole}) وثغراتك الحالية، نوصي بإكمال مسار الأنظمة الموزعة وهندسة النماذج التوليدية لرفع نسبة التنافسية في المقابلات التقنية إلى أكثر من 90%.`
                : `Based on your trajectory as "${profile.targetRole}" and current skill gaps, prioritizing Distributed Systems & Generative AI Agent workflows will bridge remaining weaknesses and push your readiness over 90%.`}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedDomain('my_target');
            setSelectedStatus('all');
          }}
          className="self-start md:self-center shrink-0 px-3 py-1.5 rounded-md caption font-semibold transition-colors" style={{ backgroundColor: 'var(--color-neutral-50)', color: 'var(--color-neutral-900)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-neutral-50)'}
        >
          {lang === 'ar' ? 'عرض الكورسات الموصى بها لمجالي' : 'Filter by My Target Field'}
        </button>
      </div>

      {/* Notification Toast if AI generated */}
      {aiResultNotice && (
        <div className="p-3.5 rounded-lg caption flex items-center justify-between gap-3 animate-in fade-in duration-200" style={{ backgroundColor: 'var(--color-emerald-50)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-emerald-200)', color: 'var(--color-emerald-900)' }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--color-emerald-600)' }} />
            <span>{aiResultNotice}</span>
          </div>
          <button
            onClick={() => setAiResultNotice(null)}
            style={{ color: 'var(--color-emerald-700)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-emerald-900)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-emerald-700)'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="surface-elevated border-hairline rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" style={{ color: 'var(--color-neutral-400)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'ابحث باسم الكورس، المهارة (مثل PostgreSQL، Kubernetes)، أو المنصة...'
                  : 'Search courses by title, skill (e.g. PostgreSQL, Docker, RAG), or provider...'
              }
              className="input-base caption w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2"
            />
          </div>

          {/* Secondary filter dropdowns */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Level */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="input-base caption px-2.5 py-2"
            >
              <option value="all">{lang === 'ar' ? 'جميع المستويات' : 'All Levels'}</option>
              <option value="Beginner">{lang === 'ar' ? 'مبتدئ' : 'Beginner'}</option>
              <option value="Intermediate">{lang === 'ar' ? 'متوسط' : 'Intermediate'}</option>
              <option value="Advanced">{lang === 'ar' ? 'متقدم' : 'Advanced'}</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-base caption px-2.5 py-2"
            >
              <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="in_progress">{lang === 'ar' ? 'قيد التعلم' : 'In Progress'}</option>
              <option value="completed">{lang === 'ar' ? 'مكتمل' : 'Completed'}</option>
              <option value="not_enrolled">{lang === 'ar' ? 'متاح للبدء' : 'Not Enrolled'}</option>
            </select>

            {/* Cost */}
            <select
              value={selectedCost}
              onChange={(e) => setSelectedCost(e.target.value)}
              className="input-base caption px-2.5 py-2"
            >
              <option value="all">{lang === 'ar' ? 'التكلفة: الكل' : 'Cost: All'}</option>
              <option value="free">{lang === 'ar' ? 'مجاني / مع شهادة' : 'Free / Audit'}</option>
              <option value="paid">{lang === 'ar' ? 'مدفوع' : 'Paid'}</option>
            </select>

            {(searchQuery || selectedDomain !== 'all' || selectedLevel !== 'all' || selectedStatus !== 'all' || selectedCost !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDomain('all');
                  setSelectedLevel('all');
                  setSelectedStatus('all');
                  setSelectedCost('all');
                }}
                className="caption underline whitespace-nowrap px-1" style={{ color: 'var(--color-neutral-500)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-neutral-900)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-neutral-500)'}
              >
                {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        {/* Domain Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t no-scrollbar" style={{ borderColor: 'var(--color-neutral-100)' }}>
          <span className="font-semibold uppercase tracking-wider shrink-0 mr-1 rtl:mr-0 rtl:ml-1" style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>
            {lang === 'ar' ? 'المجال:' : 'Field:'}
          </span>
          <button
            onClick={() => setSelectedDomain('all')}
            className="px-2.5 py-1 caption rounded-md whitespace-nowrap transition-colors"
            style={selectedDomain === 'all' ? { backgroundColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)', fontWeight: 500 } : { backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' }}
            onMouseEnter={(e) => {
              if (selectedDomain !== 'all') e.currentTarget.style.backgroundColor = 'var(--color-neutral-200)';
            }}
            onMouseLeave={(e) => {
              if (selectedDomain !== 'all') e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
            }}
          >
            {lang === 'ar' ? 'جميع التخصصات' : 'All Domains'}
          </button>
          <button
            onClick={() => setSelectedDomain('my_target')}
            className="px-2.5 py-1 caption rounded-md whitespace-nowrap transition-colors flex items-center gap-1"
            style={selectedDomain === 'my_target' ? { backgroundColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)', fontWeight: 500 } : { backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' }}
            onMouseEnter={(e) => {
              if (selectedDomain !== 'my_target') e.currentTarget.style.backgroundColor = 'var(--color-neutral-200)';
            }}
            onMouseLeave={(e) => {
              if (selectedDomain !== 'my_target') e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
            }}
          >
            <Sparkles className="w-3 h-3" style={{ color: 'var(--color-amber-400)' }} />
            <span>{lang === 'ar' ? 'مجالي المستهدف (AI & Tech)' : 'My Target Field'}</span>
          </button>
          {availableDomains.map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className="px-2.5 py-1 caption rounded-md whitespace-nowrap transition-colors"
              style={selectedDomain === domain ? { backgroundColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)', fontWeight: 500 } : { backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' }}
              onMouseEnter={(e) => {
                if (selectedDomain !== domain) e.currentTarget.style.backgroundColor = 'var(--color-neutral-200)';
              }}
              onMouseLeave={(e) => {
                if (selectedDomain !== domain) e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
              }}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="surface-elevated border-hairline rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 mx-auto" style={{ color: 'var(--color-neutral-400)' }} />
          <h3 className="body-sm font-bold" style={{ color: 'var(--color-neutral-900)' }}>
            {lang === 'ar' ? 'لم يتم العثور على كورسات مطابقة' : 'No matching courses found'}
          </h3>
          <p className="caption max-w-sm mx-auto" style={{ color: 'var(--color-neutral-500)' }}>
            {lang === 'ar'
              ? 'جرّب تعديل الفلاتر أو استخدام زر توليد الكورسات بالذكاء الاصطناعي لاقتراح كورسات مخصصة فوراً.'
              : 'Try clearing your search filters or use AI Course Recommendations to generate tailored courses.'}
          </p>
          <button
            onClick={() => setShowAIModal(true)}
            className="px-4 py-2 caption font-semibold rounded-lg inline-flex items-center gap-1.5" style={{ backgroundColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'توليد كورسات بالذكاء الاصطناعي' : 'Generate with AI'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const isCompleted = course.enrollmentStatus === 'completed';
            const isInProgress = course.enrollmentStatus === 'in_progress';

            return (
              <div
                key={course.id}
                className="surface-elevated rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs relative"
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: isCompleted
                    ? 'rgba(16, 185, 129, 0.3)'
                    : isInProgress
                    ? 'var(--color-neutral-300)'
                    : 'var(--color-neutral-200)',
                  backgroundColor: isCompleted ? 'rgba(236, 253, 245, 0.2)' : 'var(--color-surface)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(115, 115, 115, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isCompleted
                    ? 'rgba(16, 185, 129, 0.3)'
                    : isInProgress
                    ? 'var(--color-neutral-300)'
                    : 'var(--color-neutral-200)';
                }}
              >
                {/* Card Top: Provider & Status Badge */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)', fontSize: '10px' }}>
                        {course.provider}
                      </span>
                      <span className="px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)', fontSize: '10px' }}>
                        {course.domain}
                      </span>
                      {course.cost === 'Free' && (
                        <span className="px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-800)', fontSize: '10px' }}>
                          {lang === 'ar' ? 'مجاني' : 'Free'}
                        </span>
                      )}
                    </div>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ fontSize: '11px', color: 'var(--color-emerald-700)', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'مكتمل وموثق' : 'Verified'}</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ fontSize: '11px', color: 'var(--color-amber-700)', backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'قيد التعلم' : 'In Progress'}</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Title & Instructor */}
                  <div>
                    <h3 className="body-sm font-bold line-clamp-2 leading-snug" style={{ color: 'var(--color-neutral-900)' }}>
                      {course.title}
                    </h3>
                    {course.instructor && (
                      <p className="mt-0.5" style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                        {lang === 'ar' ? 'المحاضر:' : 'By:'} {course.instructor}
                      </p>
                    )}
                  </div>

                  {/* Ratings, Duration, Level */}
                  <div className="flex items-center gap-3 font-mono" style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                    <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--color-neutral-800)' }}>
                      <Star className="w-3 h-3" style={{ fill: 'var(--color-amber-400)', color: 'var(--color-amber-400)' }} />
                      <span>{course.rating.toFixed(1)}</span>
                      {course.reviewsCount && (
                        <span className="font-normal" style={{ color: 'var(--color-neutral-400)', fontSize: '10px' }}>
                          ({course.reviewsCount.toLocaleString()})
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span>{course.duration}</span>
                    <span>•</span>
                    <span
                      style={{
                        color: course.level === 'Advanced'
                          ? 'var(--color-purple-700)'
                          : course.level === 'Intermediate'
                          ? 'var(--color-blue-700)'
                          : 'var(--color-neutral-700)',
                        fontWeight: course.level === 'Advanced' ? 600 : 400,
                      }}
                    >
                      {course.level}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="caption line-clamp-2 leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
                    {course.description}
                  </p>

                  {/* Skills Gained Tags */}
                  <div className="space-y-1.5 pt-1">
                    <span className="font-semibold uppercase tracking-wider block" style={{ fontSize: '10px', color: 'var(--color-neutral-400)' }}>
                      {lang === 'ar' ? 'المهارات المكتسبة:' : 'Skills Gained:'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {course.skillsGained.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded font-mono"
                          style={{ backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-700)', fontSize: '10px' }}
                        >
                          {skill}
                        </span>
                      ))}
                      {course.skillsGained.length > 4 && (
                        <span className="self-center" style={{ fontSize: '10px', color: 'var(--color-neutral-400)' }}>
                          +{course.skillsGained.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Match Rationale */}
                  {course.relevanceReason && (
                    <div className="p-2.5 rounded-lg border space-y-1" style={{ backgroundColor: 'var(--color-neutral-50)', borderColor: 'var(--color-neutral-150)', fontSize: '11px', color: 'var(--color-neutral-700)' }}>
                      <div className="flex items-center gap-1 font-semibold uppercase tracking-wider" style={{ color: 'var(--color-neutral-900)', fontSize: '10px' }}>
                        <Sparkles className="w-3 h-3" style={{ color: 'var(--color-amber-500)' }} />
                        <span>{lang === 'ar' ? 'لماذا يناسب مسارك المهني؟' : 'Why this fits your path:'}</span>
                      </div>
                      <p className="leading-snug line-clamp-2" style={{ color: 'var(--color-neutral-600)' }}>
                        {course.relevanceReason}
                      </p>
                    </div>
                  )}

                  {/* Progress Bar (if enrolled) */}
                  {(isInProgress || isCompleted) && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between font-mono" style={{ fontSize: '11px' }}>
                        <span style={{ color: 'var(--color-neutral-500)' }}>
                          {lang === 'ar' ? 'نسبة الإنجاز:' : 'Progress:'}
                        </span>
                        <span className="font-bold" style={{ color: 'var(--color-neutral-900)' }}>
                          {course.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: 'var(--color-neutral-100)' }}>
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${course.progressPercentage}%`,
                            backgroundColor: isCompleted ? 'var(--color-emerald-600)' : 'var(--color-neutral-900)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Bottom */}
                <div className="pt-4 mt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--color-neutral-100)' }}>
                  <div className="flex items-center gap-2">
                    {course.url && (
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded transition-colors"
                        style={{ color: 'var(--color-neutral-500)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-neutral-900)';
                          e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-neutral-500)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title={lang === 'ar' ? 'فتح رابط الكورس' : 'Open Course Link'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setActiveCourseDrawer(course)}
                      className="caption font-medium flex items-center gap-1"
                      style={{ color: 'var(--color-neutral-700)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-neutral-900)';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-neutral-700)';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      <span>{lang === 'ar' ? 'المحتوى والمحاضرات' : 'Syllabus & Modules'}</span>
                      <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  </div>

                  {/* Main Status CTA */}
                  {isCompleted ? (
                    <button
                      onClick={() => setActiveCourseDrawer(course)}
                      className="px-2.5 py-1.5 rounded-md caption font-semibold flex items-center gap-1 transition-colors"
                      style={{ backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-800)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-emerald-200)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-emerald-100)'}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'عرض التوثيق' : 'Credential'}</span>
                    </button>
                  ) : isInProgress ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowCompleteModal(course)}
                        className="px-2.5 py-1.5 rounded-md caption font-semibold flex items-center gap-1 transition-colors"
                        style={{ backgroundColor: 'var(--color-emerald-600)', color: 'var(--color-neutral-50)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-emerald-700)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-emerald-600)'}
                        title={lang === 'ar' ? 'توثيق الإنجاز كدليل في الملف المهني' : 'Complete and generate verified evidence'}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'إكمال' : 'Complete'}</span>
                      </button>
                      <button
                        onClick={() => setActiveCourseDrawer(course)}
                        className="btn-primary px-2.5 py-1.5 caption font-semibold flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" style={{ fill: 'var(--color-neutral-50)' }} />
                        <span>{lang === 'ar' ? 'متابعة' : 'Resume'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onEnrollCourse(course.id)}
                      className="btn-primary px-3 py-1.5 caption font-semibold flex items-center gap-1"
                    >
                      <span>{lang === 'ar' ? 'بدء التعلم' : 'Enroll & Start'}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Detail Drawer / Modal */}
      {activeCourseDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setActiveCourseDrawer(null)}>
          <div className="surface-elevated border-hairline rounded-2xl max-w-2xl w-full flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b shrink-0" style={{ borderColor: 'var(--color-neutral-100)', backgroundColor: 'var(--color-surface)' }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)', fontSize: '10px' }}>
                    {activeCourseDrawer.provider}
                  </span>
                  <span className="caption font-mono" style={{ color: 'var(--color-neutral-500)' }}>
                    {activeCourseDrawer.domain}
                  </span>
                </div>
                <h2 className="heading-lg">
                  {activeCourseDrawer.title}
                </h2>
                {activeCourseDrawer.instructor && (
                  <p className="caption" style={{ color: 'var(--color-neutral-600)' }}>
                    {lang === 'ar' ? 'المحاضر:' : 'Instructor:'} {activeCourseDrawer.instructor}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveCourseDrawer(null)}
                className="p-1.5 rounded-lg cursor-pointer"
                style={{ color: 'var(--color-neutral-400)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-neutral-900)';
                  e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-neutral-400)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
              {/* Progress overview */}
              <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ backgroundColor: 'var(--color-neutral-50)', borderColor: 'var(--color-neutral-200)' }}>
                <div>
                <span className="caption block" style={{ color: 'var(--color-neutral-500)' }}>
                  {lang === 'ar' ? 'الحالة الحالية:' : 'Current Status:'}
                </span>
                <span className="body-sm font-bold" style={{ color: 'var(--color-neutral-900)' }}>
                  {activeCourseDrawer.enrollmentStatus === 'completed'
                    ? lang === 'ar'
                      ? 'مكتمل وموثق في ملفك المهني'
                      : 'Completed & Verified in Profile'
                    : activeCourseDrawer.enrollmentStatus === 'in_progress'
                    ? lang === 'ar'
                      ? `قيد التعلم (${activeCourseDrawer.progressPercentage}% مكتمل)`
                      : `In Progress (${activeCourseDrawer.progressPercentage}%)`
                    : lang === 'ar'
                    ? 'غير مسجل بعد'
                    : 'Not Enrolled'}
                </span>
              </div>

              {activeCourseDrawer.enrollmentStatus === 'not_enrolled' ? (
                <button
                  onClick={() => {
                    onEnrollCourse(activeCourseDrawer.id);
                    setActiveCourseDrawer({
                      ...activeCourseDrawer,
                      enrollmentStatus: 'in_progress',
                      progressPercentage: 10,
                    });
                  }}
                  className="btn-primary px-3.5 py-2 caption font-semibold"
                >
                  {lang === 'ar' ? 'بدء التعلم الآن' : 'Start Course Now'}
                </button>
              ) : activeCourseDrawer.enrollmentStatus === 'in_progress' ? (
                <button
                  onClick={() => setShowCompleteModal(activeCourseDrawer)}
                  className="px-3.5 py-2 rounded-lg caption font-semibold flex items-center gap-1.5 transition-colors"
                  style={{ backgroundColor: 'var(--color-emerald-600)', color: 'var(--color-neutral-50)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-emerald-700)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-emerald-600)'}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إكمال وتوثيق كدليل' : 'Mark Completed & Verify'}</span>
                </button>
              ) : (
                <span className="caption font-medium flex items-center gap-1" style={{ color: 'var(--color-emerald-700)' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'شهادة مسجلة في ملف المهارات' : 'Evidence Verified'}</span>
                </span>
              )}
            </div>

            {/* Skills & Domain Impact */}
            <div className="space-y-2">
              <h4 className="caption font-bold uppercase tracking-wider" style={{ color: 'var(--color-neutral-900)' }}>
                {lang === 'ar' ? 'المهارات المكتسبة وتأثيرها على الجاهزية:' : 'Skills Gained & Impact:'}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeCourseDrawer.skillsGained.map((skill, idx) => (
                  <span
                    key={idx}
                    className="border px-2.5 py-1 rounded caption font-mono"
                    style={{ backgroundColor: 'var(--color-neutral-100)', borderColor: 'var(--color-neutral-200)', color: 'var(--color-neutral-800)' }}
                  >
                    + {skill}
                  </span>
                ))}
              </div>
              <p className="pt-1" style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                {lang === 'ar'
                  ? 'عند إكمال هذا الكورس، سيتم تحديث رصيد أدلتك المهنية وإعادة احتساب نسبة الجاهزية تلقائياً.'
                  : 'Completing this course immediately issues verified Skill Evidence and recalculates your 8-pillar readiness.'}
              </p>
            </div>

            {/* Interactive Modules Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="caption font-bold uppercase tracking-wider" style={{ color: 'var(--color-neutral-900)' }}>
                  {lang === 'ar' ? 'محاضرات وفصول الكورس:' : 'Course Modules & Chapters:'}
                </h4>
                <span className="caption font-mono" style={{ color: 'var(--color-neutral-500)' }}>
                  {activeCourseDrawer.modules.filter((m) => m.completed).length} /{' '}
                  {activeCourseDrawer.modules.length} {lang === 'ar' ? 'مكتمل' : 'completed'}
                </span>
              </div>

              <div className="space-y-2 divide-y border rounded-lg p-2" style={{ backgroundColor: 'rgba(245, 245, 245, 0.5)', borderColor: 'var(--color-neutral-200)', divideColor: 'var(--color-neutral-100)' }}>
                {activeCourseDrawer.modules.map((mod, idx) => (
                  <div
                    key={mod.id || idx}
                    className="pt-2 first:pt-0 flex items-start gap-3 p-1.5 rounded transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <button
                      onClick={() => {
                        const newCompleted = !mod.completed;
                        const total = activeCourseDrawer.modules.length;
                        const completedCount = activeCourseDrawer.modules.filter((m) =>
                          m.id === mod.id ? newCompleted : m.completed
                        ).length;
                        const newProgress = Math.round((completedCount / total) * 100);

                        onUpdateProgress(
                          activeCourseDrawer.id,
                          newProgress,
                          newCompleted ? mod.id : undefined
                        );

                        setActiveCourseDrawer({
                          ...activeCourseDrawer,
                          progressPercentage: newProgress,
                          enrollmentStatus: newProgress >= 100 ? 'completed' : 'in_progress',
                          modules: activeCourseDrawer.modules.map((m) =>
                            m.id === mod.id ? { ...m, completed: newCompleted } : m
                          ),
                        });
                      }}
                      className="mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                      style={mod.completed ? { backgroundColor: 'var(--color-neutral-900)', borderColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)' } : { borderColor: 'var(--color-neutral-300)', backgroundColor: 'var(--color-surface)' }}
                      onMouseEnter={(e) => {
                        if (!mod.completed) e.currentTarget.style.borderColor = 'var(--color-neutral-500)';
                      }}
                      onMouseLeave={(e) => {
                        if (!mod.completed) e.currentTarget.style.borderColor = 'var(--color-neutral-300)';
                      }}
                    >
                      {mod.completed && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1">
                      <p
                        className="caption"
                        style={mod.completed ? { color: 'var(--color-neutral-500)', textDecoration: 'line-through' } : { color: 'var(--color-neutral-900)', fontWeight: 500 }}
                      >
                        {mod.title}
                      </p>
                      {mod.duration && (
                        <span className="font-mono" style={{ fontSize: '10px', color: 'var(--color-neutral-400)' }}>
                          {mod.duration}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            </div>

            {/* External link & Close Footer */}
            <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-t" style={{ borderColor: 'var(--color-neutral-100)', backgroundColor: 'rgba(241, 245, 249, 0.7)' }}>
              {activeCourseDrawer.url ? (
                <a
                  href={activeCourseDrawer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="caption font-semibold flex items-center gap-1.5"
                  style={{ color: 'var(--color-neutral-900)', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  <span>{lang === 'ar' ? 'الانتقال لصفحة الكورس الرسمية' : 'Open Official Course Page'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : <div />}
              <button
                type="button"
                onClick={() => setActiveCourseDrawer(null)}
                className="btn-primary px-4 py-2 caption font-medium cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Course Modal (Verify to Evidence) */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowCompleteModal(null)}>
          <div className="surface-elevated border-hairline rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--color-neutral-100)', backgroundColor: 'var(--color-surface)' }}>
              <div className="space-y-1">
                <span className="p-1.5 rounded-lg inline-block" style={{ backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-800)' }}>
                  <Award className="w-4 h-4" />
                </span>
                <h3 className="body-sm font-bold" style={{ color: 'var(--color-neutral-900)' }}>
                  {lang === 'ar' ? 'توثيق إكمال الكورس كدليل مهني' : 'Verify Course Completion as Evidence'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteModal(null)}
                className="p-1.5 rounded-lg cursor-pointer"
                style={{ color: 'var(--color-neutral-400)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-neutral-900)';
                  e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-neutral-400)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain">

            <p className="caption leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
              {lang === 'ar'
                ? `تهانينا على إكمال "${showCompleteModal.title}"! سيتم توثيق شهادتك واحتساب أدلة المهارات (${showCompleteModal.skillsGained.join(', ')}) لرفع نقاط جاهزيتك المهنية.`
                : `Congratulations on completing "${showCompleteModal.title}"! This will automatically register verified Skill Evidence for (${showCompleteModal.skillsGained.join(', ')}) in your profile.`}
            </p>

            <div className="space-y-3">
              <div>
                <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                  {lang === 'ar' ? 'رابط الشهادة أو الملف (اختياري):' : 'Certificate URL (optional):'}
                </label>
                <input
                  type="url"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  placeholder="https://coursera.org/verify/..."
                  className="input-base caption w-full px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                  {lang === 'ar' ? 'ملاحظات أو ملخص التعلم (اختياري):' : 'Key Takeaways & Notes (optional):'}
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'ما أهم ما أنجزته أو طبقته عملياً في هذا الكورس؟'
                      : 'Key practical projects, lab benchmarks, or skills mastered...'
                  }
                  className="input-base caption w-full p-3 resize-none"
                />
              </div>
            </div>

            </div>

            <div className="shrink-0 flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: 'var(--color-neutral-100)', backgroundColor: 'rgba(241, 245, 249, 0.7)' }}>
              <button
                type="button"
                onClick={() => setShowCompleteModal(null)}
                className="px-3 py-1.5 caption cursor-pointer"
                style={{ color: 'var(--color-neutral-600)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-neutral-900)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-neutral-600)'}
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                disabled={isSubmittingCompletion}
                className="px-4 py-2 rounded-lg caption font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--color-emerald-600)', color: 'var(--color-neutral-50)' }}
                onMouseEnter={(e) => {
                  if (!isSubmittingCompletion) e.currentTarget.style.backgroundColor = 'var(--color-emerald-700)';
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingCompletion) e.currentTarget.style.backgroundColor = 'var(--color-emerald-600)';
                }}
              >
                {isSubmittingCompletion && (
                  <div className="w-3 h-3 rounded-full animate-spin" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--color-neutral-50)', borderTopColor: 'transparent' }} />
                )}
                <span>
                  {lang === 'ar' ? 'تأكيد التوثيق ورفع الجاهزية' : 'Confirm & Update Readiness'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Course Recommendations Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAIModal(false)}>
          <div className="surface-elevated border-hairline rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--color-neutral-100)', backgroundColor: 'var(--color-surface)' }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-neutral-900)', color: 'var(--color-neutral-50)' }}>
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--color-amber-400)' }} />
                  </span>
                  <h3 className="body-sm font-bold" style={{ color: 'var(--color-neutral-900)' }}>
                    {lang === 'ar'
                      ? 'اقتراح مسارات وكورسات مخصصة بالذكاء الاصطناعي'
                      : 'AI Personalized Course & Skill Recommendations'}
                  </h3>
                </div>
                <p className="caption" style={{ color: 'var(--color-neutral-500)' }}>
                  {lang === 'ar'
                    ? 'يقوم النموذج بتحليل هويتك المهنية (Career DNA)، وثغرات مهاراتك، وهدفك الوظيفي لاقتراح أفضل الكورسات الواقعية.'
                    : 'Gemini analyzes your Career DNA, target role, and identified skill gaps to suggest high-impact courses.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="p-1.5 rounded-lg cursor-pointer"
                style={{ color: 'var(--color-neutral-400)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-neutral-900)';
                  e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-neutral-400)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain">
              <div className="p-3 rounded-lg border space-y-1 caption" style={{ backgroundColor: 'var(--color-neutral-50)', borderColor: 'var(--color-neutral-200)' }}>
                <span className="font-semibold block" style={{ color: 'var(--color-neutral-700)' }}>
                  {lang === 'ar' ? 'الملف الجاري تحليله:' : 'Current Trajectory:'}
                </span>
                <p className="font-mono" style={{ color: 'var(--color-neutral-600)', fontSize: '11px' }}>
                  {profile.targetRole || 'Software Engineer'} • {profile.dna?.currentLevel || 'Mid-Level'}
                </p>
                <p style={{ color: 'var(--color-neutral-500)', fontSize: '11px' }}>
                  {lang === 'ar' ? 'الثغرات المستهدفة للردم:' : 'Identified gaps to bridge:'}{' '}
                  {profile.dna?.weaknesses?.join(', ') || 'Systems Architecture, Database Pooling'}
                </p>
              </div>

              <div>
                <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                  {lang === 'ar'
                    ? 'مجال أو مهارة محددة ترغب في التركيز عليها (اختياري):'
                    : 'Specific focus area or skill to target (optional):'}
                </label>
                <input
                  type="text"
                  value={aiFocusArea}
                  onChange={(e) => setAiFocusArea(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'مثال: Large Language Models, System Design, Kubernetes DevOps'
                      : 'e.g. Distributed Consensus, LLM Agents, Next.js 15 Server Actions'
                  }
                  className="input-base caption w-full px-3 py-2"
                />
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: 'var(--color-neutral-100)', backgroundColor: 'rgba(241, 245, 249, 0.7)' }}>
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="px-3 py-1.5 caption cursor-pointer"
                style={{ color: 'var(--color-neutral-600)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-neutral-900)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-neutral-600)'}
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleRunAIGenerate}
                disabled={isGeneratingAI}
                className="btn-primary px-4 py-2 caption font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingAI && (
                  <div className="w-3.5 h-3.5 rounded-full animate-spin" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--color-neutral-50)', borderTopColor: 'transparent' }} />
                )}
                <span>
                  {isGeneratingAI
                    ? lang === 'ar'
                      ? 'جاري تحليل الثغرات والتوليد...'
                      : 'Analyzing gaps & generating...'
                    : lang === 'ar'
                    ? 'توليد الكورسات الآن'
                    : 'Generate Tailored Courses'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddModal(false)}>
          <form
            onSubmit={handleCreateCustomCourse}
            className="surface-elevated border-hairline rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--color-neutral-100)', backgroundColor: 'var(--color-surface)' }}>
              <div>
                <h3 className="body-sm font-bold" style={{ color: 'var(--color-neutral-900)' }}>
                  {lang === 'ar' ? 'إضافة كورس تدريبي جديد' : 'Add Custom Course'}
                </h3>
                <p className="caption" style={{ color: 'var(--color-neutral-500)' }}>
                  {lang === 'ar'
                    ? 'أضف كورس قمت بالتسجيل فيه على أي منصة لتتبع مسارك واحتساب نقاطه.'
                    : 'Track any course you are taking externally on Coursera, Udemy, YouTube, etc.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg cursor-pointer"
                style={{ color: 'var(--color-neutral-400)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-neutral-900)';
                  e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-neutral-400)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 overscroll-contain">
              <div>
                <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                  {lang === 'ar' ? 'عنوان الكورس *' : 'Course Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g. Complete System Design Interview Bootcamp"
                  className="input-base caption w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                    {lang === 'ar' ? 'المنصة / المزود *' : 'Platform / Provider *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourse.provider}
                    onChange={(e) => setNewCourse({ ...newCourse, provider: e.target.value })}
                    placeholder="Coursera, Udemy, YouTube, MIT..."
                    className="input-base caption w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                    {lang === 'ar' ? 'المجال / التخصص' : 'Domain / Field'}
                  </label>
                  <select
                    value={newCourse.domain}
                    onChange={(e) => setNewCourse({ ...newCourse, domain: e.target.value })}
                    className="input-base caption w-full px-3 py-2"
                  >
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Full-Stack Software Engineering">Full-Stack Software Engineering</option>
                    <option value="System Design & Architecture">System Design & Architecture</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Data Engineering">Data Engineering</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                    {lang === 'ar' ? 'المستوى' : 'Level'}
                  </label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as any })}
                    className="input-base caption w-full px-3 py-2"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                    {lang === 'ar' ? 'المدة التقديرية' : 'Duration'}
                  </label>
                  <input
                    type="text"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    placeholder="12 hours / 3 weeks"
                    className="input-base caption w-full px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                  {lang === 'ar' ? 'المهارات المكتسبة (مفصولة بفواصل)' : 'Skills Gained (comma-separated)'}
                </label>
                <input
                  type="text"
                  value={newSkillsInput}
                  onChange={(e) => setNewSkillsInput(e.target.value)}
                  placeholder="e.g. Distributed Systems, Kafka, Go, Concurrency"
                  className="input-base caption w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="caption font-semibold block mb-1" style={{ color: 'var(--color-neutral-700)' }}>
                  {lang === 'ar' ? 'رابط الكورس' : 'Course URL'}
                </label>
                <input
                  type="url"
                  value={newCourse.url}
                  onChange={(e) => setNewCourse({ ...newCourse, url: e.target.value })}
                  placeholder="https://..."
                  className="input-base caption w-full px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: 'var(--color-neutral-100)', backgroundColor: 'rgba(241, 245, 249, 0.7)' }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 caption cursor-pointer"
                style={{ color: 'var(--color-neutral-600)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-neutral-900)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-neutral-600)'}
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="btn-primary px-4 py-2 caption font-semibold shadow-xs cursor-pointer"
              >
                {lang === 'ar' ? 'حفظ الكورس' : 'Save Course'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
