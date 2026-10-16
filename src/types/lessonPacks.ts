// ============================================================================
// Lesson Packs & Guides Types
// Phase 5: Structured Learning Paths with Progress Tracking
// ============================================================================

export type LessonDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type LessonType = 'tutorial' | 'exercise' | 'project' | 'quiz' | 'reading' | 'video' | 'interactive';
export type GuideCategory = 'technical' | 'career' | 'best-practices' | 'tools' | 'soft-skills';
export type ExerciseType = 'coding' | 'multiple-choice' | 'fill-in-blank' | 'practical' | 'discussion';

export interface LessonExercise {
  id: string;
  type: ExerciseType;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  difficulty: LessonDifficulty;
  estimatedTime: number; // minutes
  instructions: string;
  instructionsAr?: string;
  hints?: string[];
  hintsAr?: string[];
  solution?: string;
  solutionAr?: string;
  validationRules?: {
    mustInclude?: string[];
    mustNotInclude?: string[];
    minLength?: number;
    maxLength?: number;
  };
}

export interface MiniProject {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  difficulty: LessonDifficulty;
  estimatedHours: number;
  skills: string[];
  objectives: string[];
  objectivesAr?: string[];
  requirements: string[];
  requirementsAr?: string[];
  steps: {
    step: number;
    title: string;
    titleAr?: string;
    description: string;
    descriptionAr?: string;
    estimatedTime: number;
  }[];
  deliverables: string[];
  deliverablesAr?: string[];
  resources: {
    title: string;
    url: string;
    type: 'documentation' | 'tutorial' | 'video' | 'article';
  }[];
  evaluationCriteria: {
    criterion: string;
    weight: number; // 0-100
  }[];
}

export interface Lesson {
  id: string;
  packId: string;
  order: number;
  title: string;
  titleAr?: string;
  type: LessonType;
  difficulty: LessonDifficulty;
  estimatedTime: number; // minutes
  description: string;
  descriptionAr?: string;
  objectives: string[];
  objectivesAr?: string[];
  prerequisites: string[];

  // Content
  content: {
    sections: {
      id: string;
      title: string;
      titleAr?: string;
      content: string;
      contentAr?: string;
      codeExamples?: {
        language: string;
        code: string;
        explanation: string;
        explanationAr?: string;
      }[];
    }[];
  };

  // Learning activities
  exercises: LessonExercise[];
  miniProject?: MiniProject;
  quiz?: {
    id: string;
    questions: {
      id: string;
      question: string;
      questionAr?: string;
      type: 'single-choice' | 'multiple-choice' | 'true-false';
      options: string[];
      optionsAr?: string[];
      correctAnswer: number | number[]; // index or indices
      explanation: string;
      explanationAr?: string;
    }[];
    passingScore: number; // 0-100
  };

  // Resources
  resources: {
    title: string;
    titleAr?: string;
    url: string;
    type: 'documentation' | 'video' | 'article' | 'interactive';
    estimatedTime?: number;
  }[];

  // Metadata
  skills: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonPack {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  description: string;
  descriptionAr?: string;
  category: string;
  categoryAr?: string;
  difficulty: LessonDifficulty;
  estimatedHours: number;

  // Structure
  lessons: Lesson[];
  totalLessons: number;

  // Learning outcomes
  outcomes: string[];
  outcomesAr?: string[];
  skills: string[];
  prerequisites: string[];
  prerequisitesAr?: string[];

  // Target audience
  targetRoles: string[];
  targetRolesAr?: string[];

  // Resources
  coverImage?: string;
  instructor?: {
    name: string;
    bio: string;
    avatar?: string;
  };

  // Metadata
  isPremium: boolean;
  isPublished: boolean;
  rating?: number; // 0-5
  enrollmentCount: number;
  completionRate?: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
  userId: string;
  lessonId: string;
  packId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'skipped';
  progressPercentage: number; // 0-100

  // Time tracking
  timeSpent: number; // minutes
  startedAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string;

  // Activity tracking
  sectionsCompleted: string[]; // section IDs
  exercisesCompleted: string[]; // exercise IDs
  exerciseScores: Record<string, number>; // exerciseId -> score (0-100)
  quizScore?: number; // 0-100
  quizAttempts?: number;
  projectSubmitted: boolean;
  projectScore?: number; // 0-100

  // Notes & bookmarks
  notes?: string;
  bookmarks?: string[]; // section IDs

  // Metadata
  updatedAt: string;
}

export interface PackProgress {
  userId: string;
  packId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'abandoned';
  progressPercentage: number; // 0-100

  // Time tracking
  totalTimeSpent: number; // minutes
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string;

  // Lesson tracking
  lessonsCompleted: number;
  totalLessons: number;
  currentLessonId: string | null;
  lessonProgress: Record<string, LessonProgress>; // lessonId -> progress

  // Achievement tracking
  exercisesCompleted: number;
  totalExercises: number;
  projectsCompleted: number;
  totalProjects: number;
  averageQuizScore?: number; // 0-100

  // Certificate
  certificateEarned: boolean;
  certificateIssuedAt?: string;
  certificateUrl?: string;

  // Metadata
  updatedAt: string;
}

export interface Guide {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  category: GuideCategory;
  categoryAr?: string;
  description: string;
  descriptionAr?: string;
  difficulty: LessonDifficulty;
  estimatedReadTime: number; // minutes

  // Content
  content: {
    sections: {
      id: string;
      title: string;
      titleAr?: string;
      content: string;
      contentAr?: string;
      order: number;
      codeExamples?: {
        language: string;
        code: string;
        explanation: string;
        explanationAr?: string;
      }[];
    }[];
  };

  // Structure
  tableOfContents: {
    sectionId: string;
    title: string;
    titleAr?: string;
    level: number;
  }[];

  // Related content
  relatedGuides: string[]; // guide IDs
  relatedPacks: string[]; // pack IDs
  tags: string[];

  // Resources
  resources: {
    title: string;
    url: string;
    type: 'documentation' | 'article' | 'video' | 'tool';
  }[];

  // Metadata
  author?: {
    name: string;
    bio: string;
    avatar?: string;
  };
  isPremium: boolean;
  isPublished: boolean;
  rating?: number; // 0-5
  views: number;
  bookmarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuideProgress {
  userId: string;
  guideId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progressPercentage: number; // 0-100

  // Tracking
  sectionsCompleted: string[]; // section IDs
  timeSpent: number; // minutes
  isBookmarked: boolean;

  // Notes
  notes?: string;
  highlights?: {
    sectionId: string;
    text: string;
    note?: string;
  }[];

  // Metadata
  startedAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string;
  updatedAt: string;
}

// Search & Filtering
export interface LessonPackFilter {
  category?: string;
  difficulty?: LessonDifficulty | LessonDifficulty[];
  skills?: string[];
  tags?: string[];
  isPremium?: boolean;
  minRating?: number;
  maxHours?: number;
  targetRole?: string;
}

export interface GuideFilter {
  category?: GuideCategory | GuideCategory[];
  difficulty?: LessonDifficulty | LessonDifficulty[];
  tags?: string[];
  isPremium?: boolean;
  minRating?: number;
  maxReadTime?: number;
}
