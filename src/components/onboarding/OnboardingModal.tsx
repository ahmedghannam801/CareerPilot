import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Repeat2,
  BookOpen,
  Clock,
  Target,
  Compass,
  Code,
  Database,
  Brain,
  Globe,
  Shield,
  Upload,
  FileText,
  X,
  Layers,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { CareerProfile, CareerStatus, UserSkill, OnboardingAnswers } from '../../types/index.js';
import { INITIAL_ROADMAPS } from '../../data/roadmapsData.js';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: Partial<CareerProfile>, selectedRoadmapId?: string, weeklyHours?: number) => Promise<void>;
  lang: 'en' | 'ar';
  userId?: string;
  userEmail?: string;
  userFullName?: string;
}

// ─── Predefined Curated Options ──────────────────────────────────────────────

const CAREER_STAGES: {
  value: CareerStatus;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'student',
    labelEn: 'Student',
    labelAr: 'طالب جامعي',
    descEn: 'Enrolled in university or institute, building foundations',
    descAr: 'ملتحق بالجامعة أو معهد، تبني أساسياتك الأكاديمية والعملية',
    icon: GraduationCap,
  },
  {
    value: 'fresh_graduate',
    labelEn: 'Fresh Graduate',
    labelAr: 'خريج حديث',
    descEn: 'Recently graduated, seeking your first professional placement',
    descAr: 'تخرجت حديثاً وتبحث عن أول وظيفة أو تدريب عملي مناسب',
    icon: Sparkles,
  },
  {
    value: 'experienced_professional',
    labelEn: 'Experienced Professional',
    labelAr: 'محترف متمرس',
    descEn: 'Working professional looking to advance, specialize, or get promoted',
    descAr: 'تعمل حالياً وترغب في التطور، التخصص الدقيق، أو الترقية',
    icon: Briefcase,
  },
  {
    value: 'career_changer',
    labelEn: 'Career Changer',
    labelAr: 'مغيّر مسار مهني',
    descEn: 'Pivoting from another field into software, AI, or digital careers',
    descAr: 'تتحول من مجال آخر إلى البرمجة، الذكاء الاصطناعي، أو التقنية',
    icon: Repeat2,
  },
];

const PRIMARY_GOALS = [
  { id: 'job', labelEn: 'Find a suitable job', labelAr: 'إيجاد وظيفة مناسبة' },
  { id: 'internship', labelEn: 'Find an internship or training', labelAr: 'فرصة تدريب أو عمل صيفي' },
  { id: 'learn_scratch', labelEn: 'Learn a new career from scratch', labelAr: 'تعلم مهنة جديدة من الصفر' },
  { id: 'improve_skills', labelEn: 'Improve current technical skills', labelAr: 'تطوير مهاراتي الحالية' },
  { id: 'portfolio', labelEn: 'Build practical projects & portfolio', labelAr: 'بناء مشاريع عملية وبورتفوليو' },
  { id: 'improve_cv', labelEn: 'Optimize CV & ATS application quality', labelAr: 'تحسين السيرة الذاتية وجودة التقديم' },
  { id: 'interviews', labelEn: 'Prepare for job interviews', labelAr: 'الاستعداد لمقابلات العمل التقنية' },
  { id: 'change_career', labelEn: 'Transition to a new career track', labelAr: 'تغيير مساري المهني بالكامل' },
  { id: 'promotion', labelEn: 'Get promoted in current role', labelAr: 'الترقية والتقدم في وظيفتي الحالية' },
  { id: 'freelance', labelEn: 'Start freelance & client work', labelAr: 'بدء العمل الحر (Freelancing)' },
  { id: 'discovery', labelEn: 'Explore options & discover my strengths', labelAr: 'استكشاف الخيارات واكتشاف نقاط قوتي' },
];

const CAREER_INTEREST_DOMAINS = [
  { id: 'ai_ml', nameEn: 'AI & Machine Learning', nameAr: 'الذكاء الاصطناعي وتعلم الآلة', icon: Brain },
  { id: 'fullstack', nameEn: 'Full-Stack Software Development', nameAr: 'تطوير البرمجيات الشامل (Full-Stack)', icon: Code },
  { id: 'data_analytics', nameEn: 'Data Analysis & Business Intelligence', nameAr: 'تحليل البيانات وذكاء الأعمال (BI)', icon: Database },
  { id: 'frontend', nameEn: 'Frontend Web Development', nameAr: 'تطوير واجهات الويب (Frontend)', icon: Globe },
  { id: 'backend', nameEn: 'Backend & Cloud APIs', nameAr: 'برمجة الخوادم والـ APIs (Backend)', icon: Layers },
  { id: 'data_science', nameEn: 'Data Science & Predictive Modeling', nameAr: 'علوم البيانات والنماذج التنبؤية', icon: Database },
  { id: 'cloud_devops', nameEn: 'Cloud & DevOps Engineering', nameAr: 'الحوسبة السحابية و DevOps', icon: Shield },
  { id: 'cybersecurity', nameEn: 'Cybersecurity & InfoSec', nameAr: 'الأمن السيبراني وحماية النظم', icon: Shield },
  { id: 'ui_ux', nameEn: 'UI/UX & Product Design', nameAr: 'تصميم تجربة وواجهات المستخدم (UI/UX)', icon: Compass },
  { id: 'product_mgmt', nameEn: 'Product Management', nameAr: 'إدارة المنتجات الرقمية', icon: Target },
  { id: 'business_analysis', nameEn: 'Business Analysis & Strategy', nameAr: 'تحليل الأعمال وتطوير النظم', icon: Briefcase },
  { id: 'discover_more', nameEn: 'Help me discover a suitable field', nameAr: 'ساعدني في استكشاف المسار الأنسب', icon: Sparkles },
];

const SUGGESTED_ROLES = [
  'Full-Stack Software Engineer',
  'AI & Machine Learning Engineer',
  'Data Analyst & BI Specialist',
  'Frontend Developer (React)',
  'Backend Developer (Node.js)',
  'Cloud & DevOps Engineer',
  'UI/UX Product Designer',
  'Data Scientist',
  'Product Manager',
];

const EXPERIENCE_LEVELS: {
  id: OnboardingAnswers['experienceLevel'];
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
}[] = [
  {
    id: 'scratch',
    labelEn: 'Starting from scratch',
    labelAr: 'أبدأ من الصفر تماماً',
    descEn: 'No prior background in this field, starting foundations',
    descAr: 'ليس لدي خلفية سابقة في المجال وأبدأ من الأساسيات',
  },
  {
    id: 'basics',
    labelEn: 'Studied the basics',
    labelAr: 'درست الأساسيات النظرية',
    descEn: 'Understand core syntax and principles, limited practical code',
    descAr: 'أفهم المفاهيم الأساسية مع تطبيق عملي بسيط',
  },
  {
    id: 'courses',
    labelEn: 'Completed relevant courses',
    labelAr: 'أكملت دورات تدريبية متخصصة',
    descEn: 'Completed structured online or classroom courses',
    descAr: 'أتممت كورسات أو برامج تدريبية متخصصة',
  },
  {
    id: 'projects',
    labelEn: 'Built personal or academic projects',
    labelAr: 'بنيت مشاريع شخصية أو عملية',
    descEn: 'Created standalone repositories or capstone deliverables',
    descAr: 'قمت بإنهاء مشاريع متكاملة وبورتفوليو أولي',
  },
  {
    id: 'internship',
    labelEn: 'Internship or training experience',
    labelAr: 'لدي خبرة تدريب عملي (Internship)',
    descEn: 'Hands-on experience in a real company or startup team',
    descAr: 'تدربت في بيئة عمل حقيقية أو فريق تطوعي',
  },
  {
    id: 'working',
    labelEn: 'Currently working in the field',
    labelAr: 'أعمل فعلياً في وظيفة في المجال',
    descEn: 'Employed in a professional role, looking to grow',
    descAr: 'أشغل وظيفة في هذا المجال وأتطلع للتطور والتوسع',
  },
  {
    id: 'substantial',
    labelEn: 'Substantial experience, seeking specialization',
    labelAr: 'خبرة عميقة وأبحث عن تخصص قيادي',
    descEn: 'Several years of verified experience, aiming for senior/lead level',
    descAr: 'سنوات خبرة مثبتة وأسعى نحو المستوى المتقدم أو القيادة',
  },
  {
    id: 'unsure',
    labelEn: 'Unsure about my exact level',
    labelAr: 'غير متأكد من مستواي بدقة',
    descEn: 'Need an objective skill assessment to evaluate readiness',
    descAr: 'أريد تقييم موضوعي لقياس جاهزيتي ونقاط قوتي',
  },
];

const POPULAR_SKILLS = [
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'SQL',
  'PostgreSQL',
  'Power BI',
  'Excel',
  'Git & GitHub',
  'Docker',
  'HTML5 / CSS3',
  'Tailwind CSS',
  'FastAPI',
  'REST APIs',
  'Figma',
  'Machine Learning',
  'Next.js',
];

const WEEKLY_HOURS_OPTIONS: {
  id: OnboardingAnswers['weeklyHours'];
  hoursNumber: number;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
}[] = [
  {
    id: '1-2',
    hoursNumber: 2,
    labelEn: '1–2 hours / week',
    labelAr: '1–2 ساعة أسبوعياً',
    descEn: 'Gentle, casual pace alongside heavy commitments',
    descAr: 'وتيرة هادئة تناسب الانشغال الشديد',
  },
  {
    id: '3-5',
    hoursNumber: 5,
    labelEn: '3–5 hours / week (Recommended)',
    labelAr: '3–5 ساعات أسبوعياً (موصى به)',
    descEn: 'Consistent progress with high retention and sustainable momentum',
    descAr: 'وتيرة متوازنة وثابتة تضمن الاستمرارية والإتقان',
  },
  {
    id: '6-10',
    hoursNumber: 8,
    labelEn: '6–10 hours / week',
    labelAr: '6–10 ساعات أسبوعياً',
    descEn: 'Accelerated pace with dedicated daily study slots',
    descAr: 'وتيرة مكثفة مع جلسات تعلم وتطبيق شبه يومية',
  },
  {
    id: '10+',
    hoursNumber: 15,
    labelEn: 'More than 10 hours / week',
    labelAr: 'أكثر من 10 ساعات أسبوعياً',
    descEn: 'Full-time immersion or bootcamp-level dedication',
    descAr: 'تفرغ شبه كامل أو وتيرة معسكر تدريبي سريع',
  },
  {
    id: 'variable',
    hoursNumber: 4,
    labelEn: 'Availability changes weekly',
    labelAr: 'وقتي يتغير من أسبوع لآخر',
    descEn: 'Flexible roadmap adjusting to dynamic schedules',
    descAr: 'خطة مرنة تتكيف مع التزاماتك المتغيرة',
  },
];

// Helper to select matching roadmap from curated roadmaps
function pickMatchingRoadmap(targetRole: string, interests: string[]) {
  const query = `${targetRole} ${interests.join(' ')}`.toLowerCase();

  if (query.includes('ai') || query.includes('machine learning') || query.includes('deep learning') || query.includes('ذكاء')) {
    return INITIAL_ROADMAPS.find((r) => r.id === 'rdm-ai-engineer') || INITIAL_ROADMAPS[0];
  }
  if (query.includes('data') || query.includes('analyst') || query.includes('bi') || query.includes('بيانات') || query.includes('power bi')) {
    return INITIAL_ROADMAPS.find((r) => r.id === 'rdm-data-analyst') || INITIAL_ROADMAPS[2] || INITIAL_ROADMAPS[0];
  }
  return INITIAL_ROADMAPS.find((r) => r.id === 'rdm-fullstack-developer') || INITIAL_ROADMAPS[1] || INITIAL_ROADMAPS[0];
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  lang,
  userId,
  userEmail = '',
  userFullName = '',
}) => {
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User-scoped draft storage key
  const storageKey = useMemo(() => {
    return `careerpilot_onboarding_draft_${userId || 'guest'}`;
  }, [userId]);

  // Step state: 1 to 10
  const [step, setStep] = useState(1);
  const [draftRestored, setDraftRestored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter text for interests search
  const [interestSearch, setInterestSearch] = useState('');
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Primary state form
  const [formData, setFormData] = useState({
    // Step 1: Career Stage
    careerStatus: '' as CareerStatus | '',

    // Step 2: Primary Goal
    primaryGoal: 'Find a suitable job',
    secondaryGoals: [] as string[],
    customGoal: '',

    // Step 3: Interests
    interests: [] as string[],
    customInterests: [] as string[],
    needsDiscovery: false,

    // Step 4: Target Role & Direction
    roleDirectionType: 'specific_role' as 'specific_role' | 'compare_roles' | 'general_field' | 'discover' | 'job_description',
    targetRole: '',
    rolesToCompare: [] as string[],
    roleCompareInput: '',
    targetJobDescription: '',

    // Step 5: Current Experience
    experienceLevel: 'basics' as OnboardingAnswers['experienceLevel'],
    experienceDetails: '',

    // Step 6: Existing Skills & Evidence
    existingSkills: [] as string[],
    toolsUsed: [] as string[],
    cvFileName: '',
    cvParsedPreview: null as { suggestedRole?: string; extractedSkills?: string[] } | null,

    // Step 7: Conditional questions by stage
    fieldOfStudy: '',
    academicYear: '3rd',
    expectedGraduation: '',
    preferredExperienceTypes: [] as string[],

    degree: '',
    graduationYear: new Date().getFullYear().toString(),
    targetEntryRoles: '',
    mainObstacle: 'experience',

    currentRole: '',
    yearsOfExperience: '1-2',
    careerDirection: 'grow',
    keyAchievements: '',

    previousField: '',
    desiredField: '',
    transferableSkills: [] as string[],
    transitionTimeframe: '3-6_months',
    gradualTransition: true,

    // Step 8: Time Availability
    weeklyHours: '3-5' as OnboardingAnswers['weeklyHours'],
    weeklyHoursNumber: 5,

    // Step 9: Learning Preferences
    learningFormats: ['hands_on', 'practical_projects'] as ('video' | 'hands_on' | 'projects' | 'reading' | 'exercises')[],
    resourceCostPreference: 'mostly_free' as 'free_only' | 'mostly_free' | 'mix' | 'paid_ok',
    learningLanguage: 'Both' as 'Arabic' | 'English' | 'Both',
    budgetPreference: 'free',
  });

  // Restore draft from localStorage on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.step === 'number') {
          setStep(parsed.step);
          if (parsed.formData) {
            setFormData((prev) => ({ ...prev, ...parsed.formData }));
          }
          setDraftRestored(true);
        }
      }
    } catch (e) {
      console.warn('[Onboarding] Failed to restore draft:', e);
    }
  }, [storageKey]);

  // Auto-save draft on changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          step,
          formData,
          lastSaved: new Date().toISOString(),
        })
      );
    } catch {}
  }, [step, formData, storageKey]);

  // Clean draft upon reset or restart
  const handleResetDraft = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
    setStep(1);
    setDraftRestored(false);
  };

  const totalSteps = 10;

  // Validation rules for each step
  const canProceed = (): boolean => {
    if (step === 1) return formData.careerStatus !== '';
    if (step === 2) return formData.primaryGoal.trim().length > 0;
    if (step === 3) return formData.interests.length > 0 || formData.needsDiscovery;
    if (step === 4) {
      if (formData.roleDirectionType === 'specific_role') return formData.targetRole.trim().length >= 2;
      return true;
    }
    if (step === 5) return !!formData.experienceLevel;
    if (step === 6) return true; // optional
    if (step === 7) return true; // stage questions have sensible defaults
    if (step === 8) return !!formData.weeklyHours;
    if (step === 9) return formData.learningFormats.length > 0;
    return true;
  };

  // Matched roadmap preview
  const matchedRoadmap = useMemo(() => {
    return pickMatchingRoadmap(formData.targetRole, formData.interests);
  }, [formData.targetRole, formData.interests]);

  // Navigation handlers
  const handleNext = () => {
    if (!canProceed()) return;
    setErrorMessage(null);
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Final confirmation
  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const skillsArray: UserSkill[] = formData.existingSkills.map((name, i) => ({
        id: `sk-onb-${Date.now()}-${i}`,
        canonicalName: name,
        category: 'Technical',
        level: 'Intermediate',
        confidence: 70,
        evidenceCount: 0,
        lastAssessed: new Date().toISOString().split('T')[0],
        evidence: [],
      }));

      // Generate smart career headline
      let headline = '';
      if (formData.careerStatus === 'student') {
        headline = `${formData.fieldOfStudy ? formData.fieldOfStudy + ' Student' : 'Student'} · Aspiring ${formData.targetRole || 'Professional'}`;
      } else if (formData.careerStatus === 'fresh_graduate') {
        headline = `${formData.degree ? formData.degree + ' Graduate' : 'Fresh Graduate'} · Target: ${formData.targetRole || 'Software Engineer'}`;
      } else if (formData.careerStatus === 'experienced_professional') {
        headline = `${formData.currentRole || formData.targetRole || 'Specialist'}${formData.yearsOfExperience ? ` (${formData.yearsOfExperience}y exp)` : ''}`;
      } else if (formData.careerStatus === 'career_changer') {
        headline = `${formData.previousField ? formData.previousField + ' → ' : ''}${formData.targetRole || 'Tech Specialist'}`;
      }

      const structuredAnswers: OnboardingAnswers = {
        careerStatus: formData.careerStatus as CareerStatus,
        primaryGoal: formData.primaryGoal,
        secondaryGoals: formData.secondaryGoals,
        customGoal: formData.customGoal,
        interests: formData.interests,
        customInterests: formData.customInterests,
        needsDiscovery: formData.needsDiscovery,
        roleDirectionType: formData.roleDirectionType,
        targetRole: formData.targetRole,
        rolesToCompare: formData.rolesToCompare,
        targetJobDescription: formData.targetJobDescription,
        experienceLevel: formData.experienceLevel,
        experienceDetails: formData.experienceDetails,
        existingSkills: formData.existingSkills,
        toolsUsed: formData.toolsUsed,
        stageSpecific: {
          fieldOfStudy: formData.fieldOfStudy,
          academicYear: formData.academicYear,
          expectedGraduation: formData.expectedGraduation,
          preferredExperienceTypes: formData.preferredExperienceTypes,
          degree: formData.degree,
          graduationYear: formData.graduationYear,
          targetEntryRoles: formData.targetEntryRoles,
          mainObstacle: formData.mainObstacle,
          currentRole: formData.currentRole,
          yearsOfExperience: formData.yearsOfExperience,
          careerDirection: formData.careerDirection,
          keyAchievements: formData.keyAchievements,
          currentField: formData.previousField,
          previousField: formData.previousField,
          desiredField: formData.desiredField,
          transferableSkills: formData.transferableSkills,
          transitionTimeframe: formData.transitionTimeframe,
          gradualTransition: formData.gradualTransition,
        },
        weeklyHours: formData.weeklyHours,
        weeklyHoursNumber: formData.weeklyHoursNumber,
        learningFormats: formData.learningFormats,
        resourceCostPreference: formData.resourceCostPreference,
        learningLanguage: formData.learningLanguage,
        budgetPreference: formData.budgetPreference,
        completedAt: new Date().toISOString(),
        matchedRoadmapId: matchedRoadmap.id,
      };

      const profilePayload: Partial<CareerProfile> = {
        fullName: userFullName || 'Career Explorer',
        email: userEmail,
        headline,
        careerStatus: formData.careerStatus as CareerStatus,
        targetRole: formData.targetRole || matchedRoadmap.targetRole,
        targetIndustries: formData.interests.length > 0 ? formData.interests : [matchedRoadmap.category],
        skills: skillsArray,
        onboardingCompleted: true,
        onboardingAnswers: structuredAnswers,
      };

      // Call parent onComplete handler
      await onComplete(profilePayload, matchedRoadmap.id, formData.weeklyHoursNumber);

      // Successfully saved - remove draft
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(storageKey);
      }
      onClose();
    } catch (err: unknown) {
      console.error('[Onboarding] Error during submission:', err);
      const msg = err instanceof Error ? err.message : 'Failed to finalize profile. Please retry.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock CV upload parser that safely extracts relevant skills
  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, cvFileName: file.name }));

    // Read simple text to detect keywords or extract candidate skills
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const detectedSkills: string[] = [];
      const testKeywords = ['python', 'javascript', 'typescript', 'react', 'sql', 'html', 'css', 'git', 'docker', 'excel', 'power bi'];
      testKeywords.forEach((kw) => {
        if (text.toLowerCase().includes(kw)) {
          const cap = kw.charAt(0).toUpperCase() + kw.slice(1);
          if (!detectedSkills.includes(cap)) detectedSkills.push(cap);
        }
      });

      const extracted = detectedSkills.length > 0 ? detectedSkills : ['Problem Solving', 'Git & GitHub', 'Analytical Skills'];
      setFormData((prev) => ({
        ...prev,
        cvParsedPreview: {
          suggestedRole: prev.targetRole || 'Software Specialist',
          extractedSkills: extracted,
        },
        existingSkills: Array.from(new Set([...prev.existingSkills, ...extracted])),
      }));
    };
    reader.readAsText(file.slice(0, 50000)); // preview first 50KB
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0B1F3A] px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-wide">CareerPilot AI</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/20">
                  {isAr ? 'الإعداد الشخصي الذكي' : 'One-Time Onboarding'}
                </span>
              </div>
              <p className="text-xs text-slate-300/80 font-medium mt-0.5">
                {isAr
                  ? 'بناء ملفك المهني الذكي وتوليد خارطة الطريق المخصصة'
                  : 'Architecting your Career Profile & Personalized Learning Roadmap'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Stage Indicator */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span className="font-bold flex items-center gap-2">
              <span>{isAr ? `الخطوة ${step} من ${totalSteps}` : `Step ${step} of ${totalSteps}`}</span>
              {draftRestored && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  {isAr ? 'مسترجع تلقائياً' : 'Draft Restored'}
                </span>
              )}
            </span>
            <span className="font-extrabold text-blue-600">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{isAr ? 'حدث خطأ أثناء الحفظ:' : 'Action failed:'}</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 1: CAREER STAGE (CORE QUESTION 1)
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 1 من 10 • الهوية المهنية' : 'Step 1 of 10 • Career Identity'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {isAr ? 'ما الذي يصف وضعك الحالي بأفضل شكل؟' : 'What best describes your current situation?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'نستخدم إجابتك لتحديد الأسئلة التابعة وخارطة الطريق ونوع الفرص الأنسب لك.'
                    : 'We tailor the roadmap structure, prerequisite depth, and opportunities to your exact stage.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {CAREER_STAGES.map((stage) => {
                  const Icon = stage.icon;
                  const isSelected = formData.careerStatus === stage.value;
                  return (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, careerStatus: stage.value })}
                      className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-[#0B1F3A]">{isAr ? stage.labelAr : stage.labelEn}</h5>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{isAr ? stage.descAr : stage.descEn}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 2: PRIMARY GOAL (CORE QUESTION 2)
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 2 من 10 • الهدف المهني' : 'Step 2 of 10 • Primary Goal'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {isAr
                    ? 'ما أهم نتيجة تريد تحقيقها خلال الـ 3 إلى 6 أشهر القادمة؟'
                    : 'What is the most important result you want to achieve in the next 3–6 months?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'يحدد هدفك الأولويات والمشاريع العملية والموارد التي سنرشحها لك أولاً.'
                    : 'Your primary goal defines roadmap priorities, milestone deliverables, and dashboard actions.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {PRIMARY_GOALS.map((goal) => {
                  const isPrimary = formData.primaryGoal === goal.labelEn;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, primaryGoal: goal.labelEn })}
                      className={`p-3 rounded-xl border text-start text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        isPrimary
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{isAr ? goal.labelAr : goal.labelEn}</span>
                      {isPrimary && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Goal */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'أو اكتب هدفاً مخصصاً:' : 'Or describe a specific custom goal:'}
                </label>
                <input
                  type="text"
                  value={formData.customGoal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customGoal: e.target.value,
                      primaryGoal: e.target.value.trim() ? e.target.value : formData.primaryGoal,
                    })
                  }
                  placeholder={isAr ? 'مثال: الحصول على منحة تدريبية في هندسة النظم السحابية...' : 'e.g. Land a scholarship in Cloud Architecture...'}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 3: CAREER INTERESTS (CORE QUESTION 3)
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 3 من 10 • المجالات والاهتمامات' : 'Step 3 of 10 • Career Interests'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {isAr ? 'ما المجالات التي تهتم باستكشافها أو التخصص فيها؟' : 'Which fields are you interested in exploring or developing?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'اختر مجالك الأساسي ومجالات الاهتمام الداعمة، أو اختر مساعدتك في الاستكشاف.'
                    : 'Select your core interests to prioritize resources and match curated roadmaps.'}
                </p>
              </div>

              {/* Search filter */}
              <div>
                <input
                  type="text"
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  placeholder={isAr ? 'ابحث في المجالات...' : 'Search fields & domains...'}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {CAREER_INTEREST_DOMAINS.filter((d) =>
                  interestSearch ? (isAr ? d.nameAr : d.nameEn).toLowerCase().includes(interestSearch.toLowerCase()) : true
                ).map((dom) => {
                  const Icon = dom.icon;
                  const isSelected = formData.interests.includes(dom.nameEn);
                  return (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => {
                        if (dom.id === 'discover_more') {
                          setFormData({ ...formData, needsDiscovery: !formData.needsDiscovery });
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            interests: isSelected
                              ? prev.interests.filter((i) => i !== dom.nameEn)
                              : [...prev.interests, dom.nameEn],
                          }));
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-start text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected || (dom.id === 'discover_more' && formData.needsDiscovery)
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span>{isAr ? dom.nameAr : dom.nameEn}</span>
                      </div>
                      {(isSelected || (dom.id === 'discover_more' && formData.needsDiscovery)) && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom interest */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customInterestInput}
                  onChange={(e) => setCustomInterestInput(e.target.value)}
                  placeholder={isAr ? 'أضف مجالاً آخر...' : 'Add custom interest...'}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customInterestInput.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        interests: [...prev.interests, customInterestInput.trim()],
                        customInterests: [...prev.customInterests, customInterestInput.trim()],
                      }));
                      setCustomInterestInput('');
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isAr ? 'إضافة' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 4: TARGET ROLE OR DIRECTION (CORE QUESTION 4)
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 4 من 10 • المسمى الوظيفي المستهدف' : 'Step 4 of 10 • Target Role & Trajectory'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {isAr ? 'هل حددت المسمى الوظيفي أو المسار الذي تريده؟' : 'Do you already know which job or career path you want to pursue?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'اختر وضعك الحالي وسنقوم بتوجيه خارطة الطريق ومقترحات المهارات نحوه.'
                    : 'We customize your roadmap to your exact target role rather than giving you a generic curriculum.'}
                </p>
              </div>

              {/* Role direction types */}
              <div className="space-y-2">
                {[
                  { id: 'specific_role', labelEn: 'Yes, I have a specific target role', labelAr: 'نعم، لدي مسمى وظيفي مستهدف ومحدد' },
                  { id: 'compare_roles', labelEn: 'I have 2 or more roles and need help comparing', labelAr: 'أفاضل بين مسميين أو أكثر وأحتاج مقارنة' },
                  { id: 'general_field', labelEn: 'I know the general field, not exact role yet', labelAr: 'أعرف المجال العام ولكن لم أحدد المسمى بدقة' },
                  { id: 'discover', labelEn: 'I want CareerPilot AI to discover the best fit', labelAr: 'أريد مساعدة الذكاء الاصطناعي لاكتشاف الأنسب' },
                ].map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.roleDirectionType === type.id
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleDirectionType"
                      checked={formData.roleDirectionType === type.id}
                      onChange={() => setFormData({ ...formData, roleDirectionType: type.id as any })}
                      className="text-blue-600"
                    />
                    <span className="text-xs">{isAr ? type.labelAr : type.labelEn}</span>
                  </label>
                ))}
              </div>

              {/* Target role input */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'المسمى الوظيفي المستهدف:' : 'Target Job Title:'}
                </label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  placeholder={isAr ? 'مثال: Full-Stack Software Engineer, Data Analyst...' : 'e.g. Full-Stack Software Engineer, AI Engineer...'}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                />

                <div className="pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">{isAr ? 'اقتراحات شائعة:' : 'Quick suggestions:'}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {SUGGESTED_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, targetRole: role })}
                        className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer ${
                          formData.targetRole === role
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 5: CURRENT EXPERIENCE (CORE QUESTION 5)
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 5 من 10 • مستوى الخبرة' : 'Step 5 of 10 • Current Experience'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {isAr ? 'ما مستوى خبرتك الحالي في هذا المجال؟' : 'What experience do you currently have in this field?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'يساعدنا تقديرك الذاتي على عدم تكرار ما تعرفه وتحديد نقطة بداية الخارطة المناسبة.'
                    : 'Helps place you at the right roadmap stage without repeating what you already know.'}
                </p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {EXPERIENCE_LEVELS.map((lvl) => {
                  const isSelected = formData.experienceLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, experienceLevel: lvl.id })}
                      className={`w-full p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#0B1F3A]">{isAr ? lvl.labelAr : lvl.labelEn}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{isAr ? lvl.descAr : lvl.descEn}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 6: EXISTING SKILLS & EVIDENCE (CORE QUESTION 6)
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 6 من 10 • المهارات الحالية' : 'Step 6 of 10 • Existing Skills & Evidence'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {isAr ? 'ما المهارات أو الأدوات التي تتقنها بالفعل؟' : 'Which skills or tools do you already have?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'اختر مهاراتك لتجاوز الدروس التأسيسية التي أتقنتها مسبقاً.'
                    : 'Select your proven skills so your roadmap focuses only on the high-value missing competencies.'}
                </p>
              </div>

              {/* Popular skills chips */}
              <div>
                <span className="text-xs font-bold text-slate-700">{isAr ? 'مهارات وأدوات شائعة (انقر للاختيار):' : 'Popular skills (click to select):'}</span>
                <div className="flex flex-wrap gap-1.5 mt-2 max-h-36 overflow-y-auto">
                  {POPULAR_SKILLS.map((sk) => {
                    const isSelected = formData.existingSkills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            existingSkills: isSelected
                              ? prev.existingSkills.filter((s) => s !== sk)
                              : [...prev.existingSkills, sk],
                          }));
                        }}
                        className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{sk}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add custom skill */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder={isAr ? 'أضف مهارة مخصصة (مثال: C++, AWS Lambda)...' : 'Add custom skill (e.g. C++, PyTorch, Docker)...'}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customSkillInput.trim() && !formData.existingSkills.includes(customSkillInput.trim())) {
                      setFormData((prev) => ({
                        ...prev,
                        existingSkills: [...prev.existingSkills, customSkillInput.trim()],
                      }));
                      setCustomSkillInput('');
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isAr ? 'إضافة' : 'Add'}
                </button>
              </div>

              {/* Optional CV Quick Upload */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      {isAr ? 'اختياري: رفع سيرة ذاتية لاستخراج المهارات' : 'Optional: Upload CV to extract skills'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 text-xs font-bold bg-white border border-slate-300 hover:border-slate-400 rounded-lg cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{formData.cvFileName ? formData.cvFileName : isAr ? 'اختر ملفاً' : 'Choose File'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleCVUpload}
                    className="hidden"
                  />
                </div>
                {formData.cvParsedPreview && (
                  <div className="p-2.5 bg-white rounded-xl border border-blue-200 text-xs text-blue-900">
                    <p className="font-bold">
                      {isAr ? 'تم استخراج مهارات مبدئية:' : 'Extracted candidate skills:'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.cvParsedPreview.extractedSkills?.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 7: STAGE-SPECIFIC CONDITIONAL QUESTIONS
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 7 من 10 • تفاصيل مسارك' : 'Step 7 of 10 • Stage-Specific Details'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {formData.careerStatus === 'student' && (isAr ? 'التفاصيل الأكاديمية والتدريبية' : 'Academic & Study Details')}
                  {formData.careerStatus === 'fresh_graduate' && (isAr ? 'خطة الانتقال لسوق العمل' : 'Workforce Transition Plan')}
                  {formData.careerStatus === 'experienced_professional' && (isAr ? 'تفاصيل الخبرة والترقية' : 'Experience & Advancement Plan')}
                  {formData.careerStatus === 'career_changer' && (isAr ? 'خطة التحول المهني' : 'Career Pivot & Transferable Skills')}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'أسئلة موجهة خصيصاً لمرحلتك الحالية دون أسئلة غير ملائمة.' : 'Tailored follow-ups based on your current professional stage.'}
                </p>
              </div>

              {/* Student */}
              {formData.careerStatus === 'student' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'مجال الدراسة / الكلية:' : 'Field of Study / Major:'}</label>
                    <input
                      type="text"
                      value={formData.fieldOfStudy}
                      onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                      placeholder={isAr ? 'مثال: هندسة الحاسوب، نظم معلومات، تجارة...' : 'e.g. Computer Science, Business Analytics...'}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'السنة الدراسية:' : 'Academic Stage:'}</label>
                      <select
                        value={formData.academicYear}
                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-blue-500"
                      >
                        <option value="1st">{isAr ? 'السنة الأولى' : '1st Year'}</option>
                        <option value="2nd">{isAr ? 'السنة الثانية' : '2nd Year'}</option>
                        <option value="3rd">{isAr ? 'السنة الثالثة' : '3rd Year'}</option>
                        <option value="4th">{isAr ? 'السنة الرابعة / تخرج' : 'Senior Year'}</option>
                        <option value="masters">{isAr ? 'دراسات عليا' : 'Postgraduate'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'سنة التخرج المتوقعة:' : 'Expected Graduation:'}</label>
                      <input
                        type="text"
                        value={formData.expectedGraduation}
                        onChange={(e) => setFormData({ ...formData, expectedGraduation: e.target.value })}
                        placeholder="2027"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fresh Graduate */}
              {formData.careerStatus === 'fresh_graduate' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'المؤهل / التخصص الجامعي:' : 'Degree / Major:'}</label>
                    <input
                      type="text"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      placeholder={isAr ? 'مثال: بكالوريوس هندسة البرمجيات...' : 'e.g. BS in Software Engineering...'}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'ما العائق الأكبر الذي تواجهه حالياً؟' : 'What is your main current obstacle?'}</label>
                    <select
                      value={formData.mainObstacle}
                      onChange={(e) => setFormData({ ...formData, mainObstacle: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-blue-500"
                    >
                      <option value="experience">{isAr ? 'نقص الخبرة العملية والمشاريع القوية' : 'Lack of verified project experience'}</option>
                      <option value="cv">{isAr ? 'عدم توافق السيرة الذاتية مع أنظمة الـ ATS' : 'Resume ATS score & recruiter callbacks'}</option>
                      <option value="interviews">{isAr ? 'الاستعداد لمقابلات العمل التقنية' : 'Technical & behavioral interview readiness'}</option>
                      <option value="skills">{isAr ? 'فجوات في المهارات التقنية المطلوبة' : 'Missing technical skill gaps'}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Experienced */}
              {formData.careerStatus === 'experienced_professional' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'وظيفتك الحالية:' : 'Current Role:'}</label>
                      <input
                        type="text"
                        value={formData.currentRole}
                        onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                        placeholder={isAr ? 'مثال: Frontend Developer...' : 'e.g. Frontend Developer...'}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'سنوات الخبرة:' : 'Years of Experience:'}</label>
                      <select
                        value={formData.yearsOfExperience}
                        onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-blue-500"
                      >
                        <option value="1-2">{isAr ? '1–2 سنوات' : '1–2 years'}</option>
                        <option value="3-5">{isAr ? '3–5 سنوات' : '3–5 years'}</option>
                        <option value="6-9">{isAr ? '6–9 سنوات' : '6–9 years'}</option>
                        <option value="10+">{isAr ? '10+ سنوات' : '10+ years'}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'اتجاهك المطلوب:' : 'Career Trajectory Goal:'}</label>
                    <select
                      value={formData.careerDirection}
                      onChange={(e) => setFormData({ ...formData, careerDirection: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-blue-500"
                    >
                      <option value="grow">{isAr ? 'التعمق والتخصص الدقيق في نفس المجال' : 'Deepen technical specialization'}</option>
                      <option value="promote">{isAr ? 'الترقية لمستوى Senior / Lead' : 'Promotion to Senior or Tech Lead'}</option>
                      <option value="switch">{isAr ? 'الانتقال إلى مجال تقني أحدث (AI / Cloud)' : 'Pivot to modern technologies (AI / Cloud)'}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Career Changer */}
              {formData.careerStatus === 'career_changer' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'مجالك الحالي أو السابق:' : 'Current / Previous Field:'}</label>
                    <input
                      type="text"
                      value={formData.previousField}
                      onChange={(e) => setFormData({ ...formData, previousField: e.target.value })}
                      placeholder={isAr ? 'مثال: الهندسة المدنية، المحاسبة، التدريس...' : 'e.g. Civil Engineering, Accounting, Teaching...'}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'المدى الزمني للانتقال:' : 'Transition Horizon:'}</label>
                      <select
                        value={formData.transitionTimeframe}
                        onChange={(e) => setFormData({ ...formData, transitionTimeframe: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-blue-500"
                      >
                        <option value="3-6_months">{isAr ? '3–6 أشهر' : '3–6 months'}</option>
                        <option value="6-12_months">{isAr ? '6–12 شهراً' : '6–12 months'}</option>
                        <option value="1+_year">{isAr ? 'أكثر من سنة' : '1+ year'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'نمط التحول:' : 'Transition Model:'}</label>
                      <select
                        value={formData.gradualTransition ? 'gradual' : 'full'}
                        onChange={(e) => setFormData({ ...formData, gradualTransition: e.target.value === 'gradual' })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-blue-500"
                      >
                        <option value="gradual">{isAr ? 'تدريجي بجانب عملي الحالي' : 'Gradual while working'}</option>
                        <option value="full">{isAr ? 'تفرغ كامل للتحول' : 'Full-time pivot'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 8: TIME AVAILABILITY (CORE QUESTION 7)
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 8 من 10 • الوقت الأسبوعي' : 'Step 8 of 10 • Weekly Commitment'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {isAr
                    ? 'كم ساعة أسبوعياً يمكنك تخصيصها للتعلم والتطبيق العملي؟'
                    : 'How much time can you realistically spend on learning each week?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'نحسب مدة إنهاء خارطة الطريق بناءً على وقتك الفعلي حتى تكون التقديرات واقعية وموثوقة.'
                    : 'We schedule roadmap stages and estimated completion dates based on your real weekly hours.'}
                </p>
              </div>

              <div className="space-y-2.5">
                {WEEKLY_HOURS_OPTIONS.map((opt) => {
                  const isSelected = formData.weeklyHours === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, weeklyHours: opt.id, weeklyHoursNumber: opt.hoursNumber })}
                      className={`w-full p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                          <div className="text-xs font-bold text-[#0B1F3A]">{isAr ? opt.labelAr : opt.labelEn}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{isAr ? opt.descAr : opt.descEn}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 9: LEARNING PREFERENCES
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 9 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 9 من 10 • تفضيلات التعلم' : 'Step 9 of 10 • Learning Preferences'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {isAr ? 'كيف تفضل أن تتعلم وتستوعب المهارات الجديدة؟' : 'How do you prefer to learn new skills?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'سنرتب لك المصادر التعليمية المعتمدة (YouTube، Coursera، التوثيق الرسمي) وفق تفضيلك.'
                    : 'We rank verified courses, videos, and official docs based on your learning style.'}
                </p>
              </div>

              {/* Formats */}
              <div>
                <span className="text-xs font-bold text-slate-700">{isAr ? 'الصيغ المفضلة (اختر ما يناسبك):' : 'Preferred Formats:'}</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { id: 'video', labelEn: 'Video Tutorials & Courses', labelAr: 'فيديوهات وكورسات مرئية' },
                    { id: 'hands_on', labelEn: 'Hands-on Coding Practice', labelAr: 'تطبيق عملي وكتابة كود' },
                    { id: 'projects', labelEn: 'End-to-End Real Projects', labelAr: 'بناء مشاريع واقعية متكاملة' },
                    { id: 'reading', labelEn: 'Official Docs & Textbooks', labelAr: 'التوثيق الرسمي والمقالات' },
                  ].map((fmt) => {
                    const isChecked = formData.learningFormats.includes(fmt.id as any);
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            learningFormats: isChecked
                              ? prev.learningFormats.filter((f) => f !== fmt.id)
                              : [...prev.learningFormats, fmt.id as any],
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-start text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          isChecked ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span>{isAr ? fmt.labelAr : fmt.labelEn}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cost & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'تكلفة الموارد المفضلة:' : 'Resource Cost Preference:'}</label>
                  <select
                    value={formData.resourceCostPreference}
                    onChange={(e) => setFormData({ ...formData, resourceCostPreference: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-blue-500"
                  >
                    <option value="free_only">{isAr ? 'مصادر مجانية بالكامل فقط' : 'Free resources only (YouTube / Docs)'}</option>
                    <option value="mostly_free">{isAr ? 'غالباً مجانية مع بدائل مدفوعة' : 'Mostly free with paid alternatives'}</option>
                    <option value="mix">{isAr ? 'مزيج متوازن من المجاني والمدفوع' : 'Balanced mix of free and paid'}</option>
                    <option value="paid_ok">{isAr ? 'الموارد المدفوعة عالية الجودة مقبولة' : 'High-quality paid courses acceptable'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'لغة التعلم المفضلة:' : 'Preferred Learning Language:'}</label>
                  <select
                    value={formData.learningLanguage}
                    onChange={(e) => setFormData({ ...formData, learningLanguage: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:border-blue-500"
                  >
                    <option value="Both">{isAr ? 'العربية والإنجليزية معاً' : 'Both Arabic & English'}</option>
                    <option value="Arabic">{isAr ? 'العربية بشكل أساسي' : 'Arabic'}</option>
                    <option value="English">{isAr ? 'الإنجليزية فقط' : 'English'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 10: REVIEW PROPOSED PLAN & ROADMAP (CORE STEP 10)
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 10 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {isAr ? 'المرحلة 10 من 10 • مراجعة واعتماد الخطة' : 'Step 10 of 10 • Plan Review & Confirmation'}
                </span>
                <h4 className="text-lg font-black text-[#0B1F3A] mt-1">
                  {isAr ? 'مراجعة خطتك المهنية وخارطة الطريق المقترحة' : 'Review Your Personalized Career Plan'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'تحقق من صحة البيانات أدناه. عند التأكيد، سيتم تفعيل حسابك وحفظ الخارطة في قاعدة البيانات.'
                    : 'Verify your plan summary. Confirming will initialize your career workspace and enroll you into your roadmap.'}
                </p>
              </div>

              {/* Career DNA Preview Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      {isAr ? 'ملخص الهوية المهنية (Career DNA)' : 'Career DNA Overview'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {isAr ? 'تعديل الإجابات' : 'Edit Answers'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">{isAr ? 'المرحلة المهنية:' : 'Career Stage:'}</span>
                    <p className="font-bold text-slate-800 capitalize">
                      {formData.careerStatus.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">{isAr ? 'الهدف الأساسي:' : 'Primary Goal:'}</span>
                    <p className="font-bold text-slate-800">{formData.primaryGoal}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">{isAr ? 'المسمى المستهدف:' : 'Target Role:'}</span>
                    <p className="font-bold text-slate-800">{formData.targetRole || matchedRoadmap.targetRole}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">{isAr ? 'الالتزام الأسبوعي:' : 'Weekly Commitment:'}</span>
                    <p className="font-bold text-slate-800">{formData.weeklyHoursNumber} {isAr ? 'ساعات/أسبوع' : 'hrs/week'}</p>
                  </div>
                </div>
              </div>

              {/* Recommended Roadmap Card */}
              <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wide">
                    {isAr ? 'خارطة الطريق المطابقة والمرشحة لك' : 'Recommended Learning Roadmap'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    {matchedRoadmap.difficulty}
                  </span>
                </div>

                <div>
                  <h5 className="text-sm font-black text-[#0B1F3A]">
                    {isAr ? matchedRoadmap.titleAr : matchedRoadmap.title}
                  </h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {isAr ? matchedRoadmap.descriptionAr : matchedRoadmap.description}
                  </p>
                </div>

                {/* Stages preview */}
                <div className="pt-2 border-t border-blue-200/60 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    {isAr
                      ? `مراحل الخارطة (${matchedRoadmap.stages.length} مراحل • تقديري ${Math.round(matchedRoadmap.estimatedTotalHours / formData.weeklyHoursNumber)} أسبوع):`
                      : `Roadmap Stages (${matchedRoadmap.stages.length} Stages • ~${Math.round(matchedRoadmap.estimatedTotalHours / formData.weeklyHoursNumber)} weeks total):`}
                  </span>
                  <div className="space-y-1.5">
                    {matchedRoadmap.stages.map((stg, i) => (
                      <div key={stg.id} className="flex items-center justify-between text-xs bg-white/80 px-3 py-1.5 rounded-xl border border-blue-100">
                        <span className="font-semibold text-slate-800">
                          {i + 1}. {isAr ? stg.titleAr : stg.title}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {stg.nodes.length} {isAr ? 'مهارات' : 'skills'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'السابق' : 'Back'}</span>
              </button>
            ) : draftRestored ? (
              <button
                type="button"
                onClick={handleResetDraft}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'بدء من جديد' : 'Reset Form'}</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isAr ? 'متابعة' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{isAr ? 'جاري الحفظ والتسجيل...' : 'Saving & Enrolling...'}</span>
                ) : (
                  <>
                    <span>{isAr ? 'تأكيد وبدء خارطة الطريق' : 'Confirm & Start My Roadmap'}</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
