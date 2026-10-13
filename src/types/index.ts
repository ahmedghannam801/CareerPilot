export type CareerStatus = 'student' | 'fresh_graduate' | 'experienced_professional' | 'career_changer';

export type SkillLevel = 'Beginner' | 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';

export type EvidenceType = 'project' | 'assessment' | 'certification' | 'experience' | 'interview' | 'course' | 'user_verification';

export interface SkillEvidence {
  id: string;
  skillName: string;
  type: EvidenceType;
  title: string;
  score?: number;
  url?: string;
  date: string;
  verified: boolean;
  notes?: string;
}

export interface UserSkill {
  id: string;
  canonicalName: string;
  category: 'Technical' | 'Soft' | 'Domain' | 'Tool';
  level: SkillLevel;
  confidence: number; // 0 - 100
  evidenceCount: number;
  lastAssessed: string;
  evidence: SkillEvidence[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  responsibilities: string[];
  achievements: string[];
}

export interface CareerDNA {
  currentLevel: string;
  primaryDirection: string;
  secondaryDirections: string[];
  strengths: string[];
  weaknesses: string[];
  keyCompetencies: string[];
  workPreferences: {
    workModel: 'Remote' | 'Hybrid' | 'On-site' | 'Flexible';
    teamStyle: 'Collaborative' | 'Independent' | 'Mixed';
    pace: 'High-growth' | 'Balanced' | 'Structured';
  };
  summary: string;
  lastUpdated: string;
}

export interface CareerReadinessBreakdown {
  skillsScore: number;
  cvScore: number;
  experienceScore: number;
  projectsScore: number;
  educationScore: number;
  interviewReadinessScore: number;
  brandingScore: number;
  applicationReadinessScore: number;
}

export interface CareerReadiness {
  overallScore: number; // 0 - 100
  breakdown: CareerReadinessBreakdown;
  summary: string;
  improvementActions: {
    id: string;
    title: string;
    impact: 'High' | 'Medium' | 'Low';
    estimatedHours: number;
    category: string;
    completed: boolean;
  }[];
}

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  reason: string;
  evidenceNeeded: string;
  expectedImpact: string;
  estimatedEffort: string;
  targetUrl?: string;
  actionType: 'build_project' | 'tailor_cv' | 'apply' | 'practice_interview' | 'learn_skill' | 'review_email';
}

export interface CareerProfile {
  id: string;
  fullName: string;
  email: string;
  headline: string;
  location: string;
  careerStatus: CareerStatus;
  targetRole: string;
  targetIndustries: string[];
  targetSalary?: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: UserSkill[];
  dna?: CareerDNA;
  readiness?: CareerReadiness;
  nextBestAction?: NextBestAction;
  onboardingCompleted: boolean;
}

export interface ResumeVersion {
  id: string;
  title: string;
  isMaster: boolean;
  targetRole?: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  certifications: string[];
  atsScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ATSAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missingKeywords: string[];
  formattingScore: number;
  relevanceScore: number;
  impactScore: number;
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  workModel: 'Remote' | 'Hybrid' | 'On-site';
  employmentType: 'Full-time' | 'Contract' | 'Internship' | 'Part-time';
  salary?: string;
  description: string;
  requirements: string[];
  preferredSkills: string[];
  deadline?: string;
  sourceUrl?: string;
  sourcePlatform?: 'LinkedIn' | 'RemoteOK' | 'Wuzzuf' | 'Direct' | 'Indeed';
  matchScore?: number;
  isManual: boolean;
  createdAt: string;
}

export interface JobMatchAnalysis {
  opportunityId: string;
  overallMatch: number; // 0 - 100
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  recommendation: 'APPLY' | 'DON_T_APPLY_YET';
  recommendationReason: string;
  skillGaps: {
    skill: string;
    status: 'MATCHED' | 'PARTIAL' | 'MISSING';
    importance: 'Critical' | 'Preferred' | 'Bonus';
    action: string;
  }[];
  improvementPath: string[];
}

export type ApplicationStatus =
  | 'Saved'
  | 'Preparing'
  | 'Applied'
  | 'Screening'
  | 'Assessment'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface Application {
  id: string;
  opportunityId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedDate?: string;
  tailoredResumeId?: string;
  coverLetter?: string;
  answers: { question: string; answer: string }[];
  qualityScore?: number;
  qualityFeedback?: string[];
  notes?: string;
  events: {
    id: string;
    date: string;
    type: string;
    description: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface MicroProject {
  id: string;
  title: string;
  targetSkill: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  scenario: string;
  objective: string;
  tasks: { id: string; title: string; completed: boolean }[];
  submission?: {
    codeUrl?: string;
    liveDemoUrl?: string;
    summary: string;
    submittedAt: string;
  };
  evaluation?: {
    score: number;
    passed: boolean;
    feedback: string;
    strengths: string[];
    improvements: string[];
    evidenceGenerated: boolean;
  };
  status: 'available' | 'in_progress' | 'submitted' | 'evaluated';
}

export interface EmailEvent {
  id: string;
  subject: string;
  sender: string;
  date: string;
  snippet: string;
  category:
    | 'application_confirmation'
    | 'application_update'
    | 'interview_invitation'
    | 'assessment'
    | 'recruiter_message'
    | 'job_opportunity'
    | 'offer'
    | 'rejection'
    | 'other';
  detectedAction?: string;
  relatedCompany?: string;
  relatedJobTitle?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  processed: boolean;
}

export interface InterviewSession {
  id: string;
  jobRole: string;
  type: 'HR' | 'Behavioral' | 'Technical' | 'Mixed';
  questions: {
    id: string;
    question: string;
    userAnswer?: string;
    feedback?: {
      score: number;
      strengths: string[];
      improvements: string[];
      suggestedRefinement: string;
    };
  }[];
  currentQuestionIndex: number;
  completed: boolean;
  overallScore?: number;
  summaryFeedback?: string;
  createdAt: string;
}

export interface CareerMemoryFact {
  id: string;
  category: 'Career' | 'Skills' | 'Goals' | 'Applications' | 'Interviews' | 'Preferences';
  fact: string;
  confidence: number;
  updatedAt: string;
}

export interface CareerTimelineEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string;
  source: 'User' | 'AI' | 'Email' | 'Application' | 'Project';
}

export interface CourseModule {
  id: string;
  title: string;
  duration?: string;
  completed: boolean;
}

export interface Course {
  id: string;
  title: string;
  provider: string; // e.g. Coursera, DeepLearning.AI, edX, Udemy, AWS, Google Cloud, YouTube
  instructor?: string;
  domain: string; // e.g. "AI & Machine Learning", "Full-Stack Software Engineering", "Cloud & DevOps", "System Design & Architecture", "Data Engineering", "Cybersecurity", "Product & Management"
  targetRole?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration: string;
  rating: number;
  reviewsCount?: number;
  url: string;
  description: string;
  skillsGained: string[];
  relevanceReason: string;
  cost: 'Free' | 'Paid' | 'Free with Paid Cert';
  certificateAvailable: boolean;
  enrollmentStatus: 'not_enrolled' | 'in_progress' | 'completed';
  progressPercentage: number;
  modules: CourseModule[];
  enrolledAt?: string;
  completedAt?: string;
  certificateUrl?: string;
  notes?: string;
  source: 'Curated' | 'AI_Generated' | 'User_Added';
}
