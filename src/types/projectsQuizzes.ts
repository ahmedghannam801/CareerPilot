// ============================================================================
// Projects & Quizzes Types
// Phase 6: Project Library + Quiz Engine + Skill Assessment
// ============================================================================

export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type ProjectStatus = 'not-started' | 'in-progress' | 'completed' | 'submitted' | 'reviewed';
export type ProjectType = 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'devops' | 'data' | 'ml' | 'design';
export type QuizType = 'technical' | 'behavioral' | 'system-design' | 'coding' | 'assessment';
export type QuestionType = 'single-choice' | 'multiple-choice' | 'true-false' | 'code' | 'essay';

// ============================================================================
// Project System
// ============================================================================

export interface ProjectRequirement {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  weight: number; // 0-100 for scoring
}

export interface ProjectTask {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  estimatedHours: number;
  dependencies: string[]; // task IDs
  skills: string[];
  completed: boolean;
}

export interface ProjectDeliverable {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  type: 'code' | 'documentation' | 'demo' | 'video' | 'deployment';
  required: boolean;
}

export interface ProjectEvaluationCriterion {
  id: string;
  criterion: string;
  criterionAr?: string;
  description: string;
  descriptionAr?: string;
  weight: number; // 0-100
  rubric: {
    excellent: string; // 90-100
    good: string; // 70-89
    fair: string; // 50-69
    poor: string; // 0-49
  };
}

export interface Project {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  description: string;
  descriptionAr?: string;
  type: ProjectType;
  difficulty: ProjectDifficulty;
  estimatedHours: number;

  // Learning objectives
  objectives: string[];
  objectivesAr?: string[];
  skills: string[];
  prerequisites: string[];
  prerequisitesAr?: string[];

  // Project structure
  requirements: ProjectRequirement[];
  tasks: ProjectTask[];
  deliverables: ProjectDeliverable[];
  evaluationCriteria: ProjectEvaluationCriterion[];

  // Resources
  starterCode?: {
    repoUrl: string;
    branch: string;
    instructions: string;
    instructionsAr?: string;
  };
  resources: {
    title: string;
    url: string;
    type: 'documentation' | 'tutorial' | 'video' | 'article';
  }[];
  exampleProjects?: {
    title: string;
    url: string;
    description: string;
  }[];

  // Portfolio value
  portfolioScore: number; // 0-100
  portfolioImpact: {
    showcasePotential: number; // 0-100
    complexity: number; // 0-100
    realWorldRelevance: number; // 0-100
    technicalDepth: number; // 0-100
    uniqueness: number; // 0-100
  };

  // Engagement
  completionCount: number;
  averageRating?: number; // 0-5
  averageCompletionTime?: number; // hours

  // Metadata
  tags: string[];
  category: string;
  categoryAr?: string;
  isPremium: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectProgress {
  userId: string;
  projectId: string;
  status: ProjectStatus;
  progressPercentage: number; // 0-100

  // Time tracking
  timeSpent: number; // hours
  startedAt: string | null;
  completedAt: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  lastAccessedAt: string;

  // Task tracking
  tasksCompleted: string[]; // task IDs
  totalTasks: number;
  requirementsCompleted: string[]; // requirement IDs

  // Submission
  submissionUrl?: string; // GitHub repo, live demo, etc.
  submissionNotes?: string;
  deliverables: {
    deliverableId: string;
    url?: string;
    notes?: string;
    submitted: boolean;
  }[];

  // Evaluation
  selfEvaluation?: {
    criterionId: string;
    score: number; // 0-100
    notes?: string;
  }[];
  peerEvaluation?: {
    reviewerId: string;
    criterionId: string;
    score: number; // 0-100
    feedback: string;
    reviewedAt: string;
  }[];
  mentorEvaluation?: {
    mentorId: string;
    criterionId: string;
    score: number; // 0-100
    feedback: string;
    reviewedAt: string;
  }[];
  finalScore?: number; // 0-100
  finalFeedback?: string;

  // Metadata
  updatedAt: string;
}

// ============================================================================
// Quiz System
// ============================================================================

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  questionAr?: string;
  difficulty: ProjectDifficulty;
  skills: string[];
  tags: string[];

  // Options (for choice questions)
  options?: string[];
  optionsAr?: string[];
  correctAnswer?: number | number[]; // index or indices for choice questions

  // Code questions
  codeTemplate?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }[];

  // Explanation
  explanation: string;
  explanationAr?: string;
  detailedSolution?: string;
  detailedSolutionAr?: string;

  // Resources
  resources?: {
    title: string;
    url: string;
  }[];

  // Metadata
  category: string;
  categoryAr?: string;
  estimatedTime: number; // minutes
  usageCount: number;
  averageScore?: number; // 0-100
}

export interface Quiz {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  type: QuizType;
  description: string;
  descriptionAr?: string;
  difficulty: ProjectDifficulty;

  // Structure
  questions: QuizQuestion[];
  totalQuestions: number;
  estimatedTime: number; // minutes
  passingScore: number; // 0-100

  // Configuration
  isRandomized: boolean;
  showFeedback: 'immediate' | 'after-submit' | 'never';
  allowRetry: boolean;
  maxAttempts?: number;
  timeLimit?: number; // minutes

  // Skills & Categories
  skills: string[];
  category: string;
  categoryAr?: string;
  tags: string[];

  // Engagement
  attemptCount: number;
  averageScore?: number; // 0-100
  completionRate?: number; // 0-100
  averageRating?: number; // 0-5

  // Metadata
  isPremium: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  attemptNumber: number;

  // Answers
  answers: {
    questionId: string;
    answer: number | number[] | string; // depends on question type
    isCorrect?: boolean;
    pointsEarned?: number;
    timeSpent?: number; // seconds
  }[];

  // Results
  score: number; // 0-100
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  timeSpent: number; // minutes

  // Feedback
  feedback?: {
    questionId: string;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }[];

  // Metadata
  startedAt: string;
  completedAt: string | null;
  submittedAt: string | null;
}

// ============================================================================
// Interview Questions
// ============================================================================

export interface InterviewQuestion {
  id: string;
  question: string;
  questionAr?: string;
  type: 'technical' | 'behavioral' | 'system-design' | 'coding' | 'scenario';
  difficulty: ProjectDifficulty;
  category: string;
  categoryAr?: string;

  // For technical/coding questions
  skills: string[];
  topics: string[];
  expectedAnswer?: string;
  expectedAnswerAr?: string;
  keyPoints: string[];
  keyPointsAr?: string[];

  // For behavioral questions
  starFramework?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };

  // Resources
  resources?: {
    title: string;
    url: string;
  }[];

  // Frequency & Metadata
  askedBy: string[]; // companies
  frequency: 'very-common' | 'common' | 'occasional' | 'rare';
  lastAskedAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Skill Assessment
// ============================================================================

export interface SkillAssessment {
  id: string;
  skill: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  difficulty: ProjectDifficulty;

  // Assessment structure
  questions: QuizQuestion[];
  totalQuestions: number;
  estimatedTime: number; // minutes

  // Scoring
  passingScore: number; // 0-100
  proficiencyLevels: {
    beginner: { min: number; max: number }; // e.g., 0-49
    intermediate: { min: number; max: number }; // e.g., 50-74
    advanced: { min: number; max: number }; // e.g., 75-89
    expert: { min: number; max: number }; // e.g., 90-100
  };

  // Certificate
  certificateAvailable: boolean;
  certificateTemplate?: string;

  // Metadata
  attemptCount: number;
  averageScore?: number;
  isPremium: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResult {
  id: string;
  userId: string;
  assessmentId: string;
  skill: string;

  // Results
  score: number; // 0-100
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // minutes

  // Detailed breakdown
  topicScores: {
    topic: string;
    score: number; // 0-100
    questionsCount: number;
  }[];
  strengthAreas: string[];
  weaknessAreas: string[];
  recommendations: string[];

  // Certificate
  certificateEarned: boolean;
  certificateUrl?: string;
  certificateIssuedAt?: string;

  // Metadata
  completedAt: string;
  expiresAt?: string; // assessment validity period
}

// ============================================================================
// Search & Filtering
// ============================================================================

export interface ProjectFilter {
  type?: ProjectType | ProjectType[];
  difficulty?: ProjectDifficulty | ProjectDifficulty[];
  skills?: string[];
  tags?: string[];
  category?: string;
  minPortfolioScore?: number;
  maxHours?: number;
  isPremium?: boolean;
}

export interface QuizFilter {
  type?: QuizType | QuizType[];
  difficulty?: ProjectDifficulty | ProjectDifficulty[];
  skills?: string[];
  category?: string;
  minQuestions?: number;
  maxTime?: number;
  isPremium?: boolean;
}
