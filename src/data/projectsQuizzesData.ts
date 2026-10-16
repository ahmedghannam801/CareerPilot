import type { Project, Quiz, InterviewQuestion, SkillAssessment } from '../types/projectsQuizzes';

// ============================================================================
// Projects Library Seed Data
// Phase 6: Project Library + Portfolio Scoring
// ============================================================================

export const projects: Project[] = [
  // 1. Personal Portfolio Website
  {
    id: 'portfolio-website',
    title: 'Personal Portfolio Website',
    titleAr: 'موقع محفظة أعمال شخصية',
    slug: 'portfolio-website',
    description: 'Build a responsive portfolio website showcasing your projects, skills, and experience. Deploy to production.',
    descriptionAr: 'ابن موقع محفظة أعمال متجاوب يعرض مشاريعك ومهاراتك وخبراتك. انشره على الإنتاج.',
    type: 'frontend',
    difficulty: 'Beginner',
    estimatedHours: 12,
    objectives: [
      'Design and implement responsive layouts',
      'Create semantic HTML structure',
      'Apply modern CSS (Flexbox, Grid)',
      'Deploy to production (Vercel/Netlify)',
      'Optimize for performance and SEO'
    ],
    objectivesAr: [
      'تصميم وتنفيذ تخطيطات متجاوبة',
      'إنشاء بنية HTML دلالية',
      'تطبيق CSS الحديثة (Flexbox, Grid)',
      'النشر على الإنتاج (Vercel/Netlify)',
      'التحسين للأداء وSEO'
    ],
    skills: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'Git', 'Deployment'],
    prerequisites: ['HTML basics', 'CSS fundamentals', 'Basic JavaScript'],
    prerequisitesAr: ['أساسيات HTML', 'أساسيات CSS', 'JavaScript أساسي'],
    requirements: [
      { id: 'req1', title: 'Homepage with hero section', description: 'Create compelling hero with name, tagline, CTA', priority: 'must-have', weight: 15 },
      { id: 'req2', title: 'Projects showcase', description: 'Display 3+ projects with images, descriptions, tech stack', priority: 'must-have', weight: 25 },
      { id: 'req3', title: 'Skills section', description: 'List technical skills with visual indicators', priority: 'must-have', weight: 15 },
      { id: 'req4', title: 'Contact form', description: 'Working contact form with validation', priority: 'should-have', weight: 15 },
      { id: 'req5', title: 'Responsive design', description: 'Mobile, tablet, desktop layouts', priority: 'must-have', weight: 20 },
      { id: 'req6', title: 'Dark mode', description: 'Toggle between light/dark themes', priority: 'nice-to-have', weight: 10 }
    ],
    tasks: [
      { id: 't1', title: 'Design wireframes', description: 'Sketch layout for all sections', estimatedHours: 2, dependencies: [], skills: ['Design'], completed: false },
      { id: 't2', title: 'Setup project structure', description: 'Initialize repo, folder structure, tooling', estimatedHours: 1, dependencies: [], skills: ['Git'], completed: false },
      { id: 't3', title: 'Build HTML structure', description: 'Create semantic HTML for all sections', estimatedHours: 2, dependencies: ['t2'], skills: ['HTML5'], completed: false },
      { id: 't4', title: 'Style with CSS', description: 'Implement responsive styles', estimatedHours: 4, dependencies: ['t3'], skills: ['CSS3'], completed: false },
      { id: 't5', title: 'Add interactivity', description: 'Form validation, smooth scroll, animations', estimatedHours: 2, dependencies: ['t4'], skills: ['JavaScript'], completed: false },
      { id: 't6', title: 'Deploy', description: 'Deploy to Vercel/Netlify, setup custom domain', estimatedHours: 1, dependencies: ['t5'], skills: ['Deployment'], completed: false }
    ],
    deliverables: [
      { id: 'd1', title: 'Source code', description: 'GitHub repository with clean commits', type: 'code', required: true },
      { id: 'd2', title: 'Live demo', description: 'Deployed website URL', type: 'demo', required: true },
      { id: 'd3', title: 'README', description: 'Project documentation', type: 'documentation', required: true }
    ],
    evaluationCriteria: [
      {
        id: 'e1',
        criterion: 'Visual Design',
        description: 'Professional appearance, color scheme, typography',
        weight: 20,
        rubric: {
          excellent: 'Polished, professional design with consistent branding',
          good: 'Clean design with minor inconsistencies',
          fair: 'Basic design, lacks polish',
          poor: 'Poor visual hierarchy, unprofessional'
        }
      },
      {
        id: 'e2',
        criterion: 'Responsiveness',
        description: 'Works perfectly on mobile, tablet, desktop',
        weight: 25,
        rubric: {
          excellent: 'Flawless responsive behavior across all devices',
          good: 'Responsive with minor layout issues',
          fair: 'Partially responsive, some breakpoints broken',
          poor: 'Not responsive, mobile unusable'
        }
      },
      {
        id: 'e3',
        criterion: 'Code Quality',
        description: 'Clean, semantic, well-structured code',
        weight: 20,
        rubric: {
          excellent: 'Semantic HTML, DRY CSS, clean JavaScript',
          good: 'Good structure with minor issues',
          fair: 'Functional but messy code',
          poor: 'Poorly structured, hard to read'
        }
      },
      {
        id: 'e4',
        criterion: 'Functionality',
        description: 'All features work as expected',
        weight: 20,
        rubric: {
          excellent: 'All features work flawlessly',
          good: 'Most features work, minor bugs',
          fair: 'Some features broken',
          poor: 'Major functionality missing'
        }
      },
      {
        id: 'e5',
        criterion: 'Performance',
        description: 'Fast load times, optimized assets',
        weight: 15,
        rubric: {
          excellent: 'Lighthouse score 90+, optimized assets',
          good: 'Good performance, room for optimization',
          fair: 'Slow load times, unoptimized',
          poor: 'Very slow, poor user experience'
        }
      }
    ],
    resources: [
      { title: 'MDN: Responsive Design', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design', type: 'documentation' },
      { title: 'CSS-Tricks: Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'article' }
    ],
    portfolioScore: 75,
    portfolioImpact: {
      showcasePotential: 85,
      complexity: 50,
      realWorldRelevance: 90,
      technicalDepth: 60,
      uniqueness: 70
    },
    completionCount: 8420,
    averageRating: 4.6,
    averageCompletionTime: 14,
    tags: ['frontend', 'portfolio', 'responsive', 'beginner-friendly'],
    category: 'Web Development',
    categoryAr: 'تطوير الويب',
    isPremium: false,
    isPublished: true,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-16T17:30:00Z'
  },

  // 2. Task Manager API
  {
    id: 'task-manager-api',
    title: 'RESTful Task Manager API',
    titleAr: 'API إدارة المهام RESTful',
    slug: 'task-manager-api',
    description: 'Build a production-ready REST API with authentication, validation, database, tests, and documentation.',
    descriptionAr: 'ابن REST API جاهز للإنتاج مع المصادقة والتحقق وقاعدة البيانات والاختبارات والتوثيق.',
    type: 'backend',
    difficulty: 'Intermediate',
    estimatedHours: 25,
    objectives: [
      'Design and implement RESTful API',
      'Implement JWT authentication',
      'Build CRUD operations with validation',
      'Write automated tests',
      'Deploy with Docker'
    ],
    skills: ['Node.js', 'Express', 'PostgreSQL', 'JWT', 'Docker', 'REST APIs', 'Testing'],
    prerequisites: ['JavaScript proficiency', 'Basic SQL', 'HTTP/REST understanding'],
    requirements: [
      { id: 'req1', title: 'User authentication', description: 'Register, login, JWT tokens', priority: 'must-have', weight: 20 },
      { id: 'req2', title: 'Task CRUD', description: 'Create, read, update, delete tasks', priority: 'must-have', weight: 25 },
      { id: 'req3', title: 'Data validation', description: 'Input validation, error handling', priority: 'must-have', weight: 15 },
      { id: 'req4', title: 'Database design', description: 'Normalized schema, migrations', priority: 'must-have', weight: 15 },
      { id: 'req5', title: 'API documentation', description: 'OpenAPI/Swagger docs', priority: 'should-have', weight: 10 },
      { id: 'req6', title: 'Tests', description: '80%+ code coverage', priority: 'should-have', weight: 15 }
    ],
    tasks: [],
    deliverables: [
      { id: 'd1', title: 'Source code', description: 'GitHub repo with tests', type: 'code', required: true },
      { id: 'd2', title: 'API documentation', description: 'Swagger/Postman collection', type: 'documentation', required: true },
      { id: 'd3', title: 'Deployment', description: 'Docker image or live deployment', type: 'deployment', required: true }
    ],
    evaluationCriteria: [],
    resources: [],
    portfolioScore: 88,
    portfolioImpact: {
      showcasePotential: 80,
      complexity: 85,
      realWorldRelevance: 95,
      technicalDepth: 90,
      uniqueness: 75
    },
    completionCount: 3240,
    averageRating: 4.8,
    averageCompletionTime: 28,
    tags: ['backend', 'api', 'nodejs', 'database', 'authentication'],
    category: 'Backend Development',
    isPremium: false,
    isPublished: true,
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-16T17:30:00Z'
  },

  // 3. E-commerce Platform
  {
    id: 'ecommerce-platform',
    title: 'Full-Stack E-commerce Platform',
    titleAr: 'منصة تجارة إلكترونية متكاملة',
    slug: 'ecommerce-platform',
    description: 'Build a complete e-commerce platform with product catalog, cart, checkout, payment integration, and admin dashboard.',
    descriptionAr: 'ابن منصة تجارة إلكترونية متكاملة مع كتالوج المنتجات والسلة والدفع وتكامل الدفع ولوحة الإدارة.',
    type: 'fullstack',
    difficulty: 'Advanced',
    estimatedHours: 80,
    objectives: [
      'Build scalable full-stack architecture',
      'Implement secure payment processing',
      'Create admin dashboard',
      'Optimize for performance',
      'Deploy to production'
    ],
    skills: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Redux', 'TypeScript', 'Docker', 'CI/CD'],
    prerequisites: ['React experience', 'Backend development', 'Database design', 'Payment APIs'],
    requirements: [],
    tasks: [],
    deliverables: [],
    evaluationCriteria: [],
    resources: [],
    portfolioScore: 95,
    portfolioImpact: {
      showcasePotential: 95,
      complexity: 95,
      realWorldRelevance: 100,
      technicalDepth: 95,
      uniqueness: 85
    },
    completionCount: 890,
    averageRating: 4.9,
    averageCompletionTime: 95,
    tags: ['fullstack', 'ecommerce', 'react', 'advanced', 'production'],
    category: 'Full Stack',
    isPremium: true,
    isPublished: true,
    createdAt: '2026-10-03T00:00:00Z',
    updatedAt: '2026-10-16T17:30:00Z'
  }
];

// ============================================================================
// Quizzes Library
// ============================================================================

export const quizzes: Quiz[] = [
  {
    id: 'javascript-fundamentals',
    title: 'JavaScript Fundamentals Quiz',
    titleAr: 'اختبار أساسيات JavaScript',
    slug: 'javascript-fundamentals',
    type: 'technical',
    description: 'Test your knowledge of core JavaScript concepts: variables, functions, scope, closures, and async.',
    descriptionAr: 'اختبر معرفتك بمفاهيم JavaScript الأساسية: المتغيرات والوظائف والنطاق والإغلاقات والبرمجة غير المتزامنة.',
    difficulty: 'Intermediate',
    questions: [],
    totalQuestions: 20,
    estimatedTime: 30,
    passingScore: 70,
    isRandomized: true,
    showFeedback: 'after-submit',
    allowRetry: true,
    maxAttempts: 3,
    skills: ['JavaScript', 'ES6+', 'Async/Await', 'Closures'],
    category: 'Programming Languages',
    tags: ['javascript', 'fundamentals', 'interview-prep'],
    attemptCount: 12450,
    averageScore: 72,
    completionRate: 85,
    averageRating: 4.7,
    isPremium: false,
    isPublished: true,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-16T17:30:00Z'
  },

  {
    id: 'react-hooks-quiz',
    title: 'React Hooks Mastery Quiz',
    titleAr: 'اختبار إتقان React Hooks',
    slug: 'react-hooks-quiz',
    type: 'technical',
    description: 'Deep dive into React hooks: useState, useEffect, useContext, useMemo, custom hooks.',
    descriptionAr: 'غوص عميق في React hooks: useState و useEffect و useContext و useMemo و custom hooks.',
    difficulty: 'Advanced',
    questions: [],
    totalQuestions: 15,
    estimatedTime: 25,
    passingScore: 75,
    isRandomized: true,
    showFeedback: 'after-submit',
    allowRetry: true,
    skills: ['React', 'React Hooks', 'Component Design'],
    category: 'Frontend Frameworks',
    tags: ['react', 'hooks', 'advanced'],
    attemptCount: 8920,
    averageScore: 68,
    completionRate: 78,
    averageRating: 4.8,
    isPremium: false,
    isPublished: true,
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-16T17:30:00Z'
  }
];

// ============================================================================
// Interview Questions Bank
// ============================================================================

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: 'iq-closure',
    question: 'Explain closures in JavaScript with an example.',
    questionAr: 'اشرح الإغلاقات في JavaScript مع مثال.',
    type: 'technical',
    difficulty: 'Intermediate',
    category: 'JavaScript',
    skills: ['JavaScript', 'Closures', 'Scope'],
    topics: ['closures', 'scope', 'functions'],
    keyPoints: [
      'Function has access to outer scope',
      'Inner function can reference outer variables',
      'Variables persist even after outer function returns',
      'Creates private variables'
    ],
    askedBy: ['Google', 'Amazon', 'Microsoft', 'Meta'],
    frequency: 'very-common',
    tags: ['javascript', 'closures', 'interview'],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-16T17:30:00Z'
  },

  {
    id: 'iq-event-loop',
    question: 'How does the JavaScript event loop work?',
    questionAr: 'كيف تعمل حلقة الأحداث في JavaScript؟',
    type: 'technical',
    difficulty: 'Advanced',
    category: 'JavaScript',
    skills: ['JavaScript', 'Event Loop', 'Async'],
    topics: ['event-loop', 'call-stack', 'callback-queue', 'microtasks'],
    keyPoints: [
      'Call stack executes synchronous code',
      'Web APIs handle async operations',
      'Callback queue stores callbacks',
      'Event loop moves callbacks to stack',
      'Microtask queue has priority'
    ],
    askedBy: ['Google', 'Amazon', 'Netflix', 'Uber'],
    frequency: 'very-common',
    tags: ['javascript', 'event-loop', 'async', 'interview'],
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-16T17:30:00Z'
  }
];

// ============================================================================
// Skill Assessments
// ============================================================================

export const skillAssessments: SkillAssessment[] = [
  {
    id: 'javascript-assessment',
    skill: 'JavaScript',
    title: 'JavaScript Proficiency Assessment',
    titleAr: 'تقييم إتقان JavaScript',
    description: 'Comprehensive JavaScript assessment covering ES6+, async, DOM, and best practices.',
    descriptionAr: 'تقييم JavaScript شامل يغطي ES6+ و async و DOM وأفضل الممارسات.',
    difficulty: 'Intermediate',
    questions: [],
    totalQuestions: 30,
    estimatedTime: 45,
    passingScore: 70,
    proficiencyLevels: {
      beginner: { min: 0, max: 49 },
      intermediate: { min: 50, max: 74 },
      advanced: { min: 75, max: 89 },
      expert: { min: 90, max: 100 }
    },
    certificateAvailable: true,
    attemptCount: 15820,
    averageScore: 68,
    isPremium: false,
    isPublished: true,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-16T17:30:00Z'
  },

  {
    id: 'react-assessment',
    skill: 'React',
    title: 'React Developer Assessment',
    titleAr: 'تقييم مطور React',
    description: 'Assess your React skills: components, hooks, state management, performance.',
    descriptionAr: 'قيم مهاراتك في React: المكونات و hooks وإدارة الحالة والأداء.',
    difficulty: 'Advanced',
    questions: [],
    totalQuestions: 25,
    estimatedTime: 40,
    passingScore: 75,
    proficiencyLevels: {
      beginner: { min: 0, max: 49 },
      intermediate: { min: 50, max: 74 },
      advanced: { min: 75, max: 89 },
      expert: { min: 90, max: 100 }
    },
    certificateAvailable: true,
    attemptCount: 10240,
    averageScore: 71,
    isPremium: false,
    isPublished: true,
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-16T17:30:00Z'
  }
];

// Helper functions
export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function getProjectsByDifficulty(difficulty: string): Project[] {
  return projects.filter(p => p.difficulty === difficulty);
}

export function getProjectsByType(type: string): Project[] {
  return projects.filter(p => p.type === type);
}

export function getQuizById(id: string): Quiz | undefined {
  return quizzes.find(q => q.id === id);
}

export function getInterviewQuestionById(id: string): InterviewQuestion | undefined {
  return interviewQuestions.find(q => q.id === id);
}

export function getSkillAssessmentBySkill(skill: string): SkillAssessment | undefined {
  return skillAssessments.find(a => a.skill.toLowerCase() === skill.toLowerCase());
}
