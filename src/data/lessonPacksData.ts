import type { LessonPack, Guide } from '../types/lessonPacks';

// ============================================================================
// Lesson Packs Seed Data
// Phase 5: Structured Learning Paths
// ============================================================================

export const lessonPacks: LessonPack[] = [
  // 1. Frontend Development Fundamentals
  {
    id: 'frontend-fundamentals',
    title: 'Frontend Development Fundamentals',
    titleAr: 'أساسيات تطوير الواجهات الأمامية',
    slug: 'frontend-fundamentals',
    description: 'Master HTML, CSS, and JavaScript fundamentals. Build responsive, accessible web interfaces from scratch.',
    descriptionAr: 'أتقن أساسيات HTML و CSS و JavaScript. ابن واجهات ويب متجاوبة وسهلة الوصول من الصفر.',
    category: 'Web Development',
    categoryAr: 'تطوير الويب',
    difficulty: 'Beginner',
    estimatedHours: 40,
    totalLessons: 12,
    outcomes: [
      'Build semantic HTML pages',
      'Style with modern CSS (Flexbox, Grid, animations)',
      'Write clean, maintainable JavaScript',
      'Understand DOM manipulation and events',
      'Create responsive layouts for all devices',
      'Follow web accessibility standards (WCAG)'
    ],
    outcomesAr: [
      'بناء صفحات HTML دلالية',
      'التصميم باستخدام CSS الحديثة (Flexbox, Grid, animations)',
      'كتابة JavaScript نظيفة وقابلة للصيانة',
      'فهم DOM manipulation و events',
      'إنشاء تخطيطات متجاوبة لجميع الأجهزة',
      'اتباع معايير إمكانية الوصول (WCAG)'
    ],
    skills: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Responsive Design', 'Web Accessibility', 'DOM APIs'],
    prerequisites: ['Basic computer literacy', 'Text editor familiarity'],
    prerequisitesAr: ['معرفة أساسية بالحاسوب', 'معرفة بمحرر النصوص'],
    targetRoles: ['Frontend Developer', 'Web Developer', 'UI Developer'],
    targetRolesAr: ['مطور واجهات أمامية', 'مطور ويب', 'مطور UI'],
    lessons: [], // Will be populated by lesson generation service
    isPremium: false,
    isPublished: true,
    rating: 4.8,
    enrollmentCount: 15420,
    completionRate: 78,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  },

  // 2. React Essentials
  {
    id: 'react-essentials',
    title: 'React Essentials: From Hooks to Production',
    titleAr: 'أساسيات React: من Hooks إلى الإنتاج',
    slug: 'react-essentials',
    description: 'Learn modern React development with hooks, context, and best practices. Build real-world applications.',
    descriptionAr: 'تعلم تطوير React الحديث مع hooks و context وأفضل الممارسات. ابن تطبيقات حقيقية.',
    category: 'Frontend Frameworks',
    categoryAr: 'أطر العمل الأمامية',
    difficulty: 'Intermediate',
    estimatedHours: 35,
    totalLessons: 10,
    outcomes: [
      'Master React hooks (useState, useEffect, useContext, custom hooks)',
      'Manage application state effectively',
      'Build reusable component libraries',
      'Optimize performance (memoization, lazy loading)',
      'Handle forms and validation',
      'Integrate with REST APIs',
      'Write testable React code'
    ],
    outcomesAr: [
      'إتقان React hooks (useState, useEffect, useContext, custom hooks)',
      'إدارة حالة التطبيق بفعالية',
      'بناء مكتبات مكونات قابلة لإعادة الاستخدام',
      'تحسين الأداء (memoization, lazy loading)',
      'التعامل مع النماذج والتحقق',
      'التكامل مع REST APIs',
      'كتابة كود React قابل للاختبار'
    ],
    skills: ['React', 'React Hooks', 'Context API', 'React Router', 'Performance Optimization', 'Component Design'],
    prerequisites: ['HTML, CSS, JavaScript fundamentals', 'ES6+ syntax', 'Async/await understanding'],
    prerequisitesAr: ['أساسيات HTML, CSS, JavaScript', 'صيغة ES6+', 'فهم Async/await'],
    targetRoles: ['Frontend Developer', 'React Developer', 'Full Stack Developer'],
    targetRolesAr: ['مطور واجهات أمامية', 'مطور React', 'مطور Full Stack'],
    lessons: [],
    isPremium: false,
    isPublished: true,
    rating: 4.9,
    enrollmentCount: 12890,
    completionRate: 82,
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  },

  // 3. Node.js Backend Development
  {
    id: 'nodejs-backend',
    title: 'Node.js Backend Development',
    titleAr: 'تطوير Backend بـ Node.js',
    slug: 'nodejs-backend',
    description: 'Build scalable REST APIs with Node.js, Express, and databases. Learn authentication, validation, and deployment.',
    descriptionAr: 'ابن REST APIs قابلة للتوسع باستخدام Node.js و Express وقواعد البيانات. تعلم المصادقة والتحقق والنشر.',
    category: 'Backend Development',
    categoryAr: 'تطوير Backend',
    difficulty: 'Intermediate',
    estimatedHours: 45,
    totalLessons: 14,
    outcomes: [
      'Build RESTful APIs with Express',
      'Design database schemas (SQL and NoSQL)',
      'Implement JWT authentication',
      'Validate input and handle errors',
      'Write secure backend code',
      'Deploy to production (Docker, CI/CD)',
      'Monitor and debug production issues'
    ],
    outcomesAr: [
      'بناء RESTful APIs باستخدام Express',
      'تصميم مخططات قواعد البيانات (SQL و NoSQL)',
      'تنفيذ مصادقة JWT',
      'التحقق من المدخلات ومعالجة الأخطاء',
      'كتابة كود backend آمن',
      'النشر إلى الإنتاج (Docker, CI/CD)',
      'مراقبة وتصحيح مشاكل الإنتاج'
    ],
    skills: ['Node.js', 'Express', 'REST APIs', 'JWT', 'PostgreSQL', 'MongoDB', 'Docker', 'Security'],
    prerequisites: ['JavaScript proficiency', 'Basic SQL knowledge', 'HTTP/REST understanding'],
    prerequisitesAr: ['إتقان JavaScript', 'معرفة أساسية بـ SQL', 'فهم HTTP/REST'],
    targetRoles: ['Backend Developer', 'Full Stack Developer', 'API Developer'],
    targetRolesAr: ['مطور Backend', 'مطور Full Stack', 'مطور API'],
    lessons: [],
    isPremium: false,
    isPublished: true,
    rating: 4.7,
    enrollmentCount: 9840,
    completionRate: 74,
    createdAt: '2026-10-03T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  },

  // 4. TypeScript Mastery
  {
    id: 'typescript-mastery',
    title: 'TypeScript Mastery: Type-Safe JavaScript',
    titleAr: 'إتقان TypeScript: JavaScript آمن نوعياً',
    slug: 'typescript-mastery',
    description: 'Master TypeScript from basics to advanced patterns. Build type-safe applications with confidence.',
    descriptionAr: 'أتقن TypeScript من الأساسيات إلى الأنماط المتقدمة. ابن تطبيقات آمنة نوعياً بثقة.',
    category: 'Programming Languages',
    categoryAr: 'لغات البرمجة',
    difficulty: 'Intermediate',
    estimatedHours: 25,
    totalLessons: 8,
    outcomes: [
      'Understand TypeScript type system',
      'Use generics and utility types',
      'Configure strict TypeScript projects',
      'Migrate JavaScript projects to TypeScript',
      'Write type-safe React components',
      'Build type-safe APIs',
      'Leverage advanced TypeScript patterns'
    ],
    outcomesAr: [
      'فهم نظام الأنواع في TypeScript',
      'استخدام generics و utility types',
      'تكوين مشاريع TypeScript صارمة',
      'ترحيل مشاريع JavaScript إلى TypeScript',
      'كتابة مكونات React آمنة نوعياً',
      'بناء APIs آمنة نوعياً',
      'استخدام أنماط TypeScript المتقدمة'
    ],
    skills: ['TypeScript', 'Type System', 'Generics', 'Type Guards', 'Advanced Types', 'tsconfig'],
    prerequisites: ['Strong JavaScript knowledge', 'ES6+ features', 'Basic OOP concepts'],
    prerequisitesAr: ['معرفة قوية بـ JavaScript', 'ميزات ES6+', 'مفاهيم OOP الأساسية'],
    targetRoles: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer'],
    targetRolesAr: ['مطور واجهات أمامية', 'مطور Backend', 'مطور Full Stack'],
    lessons: [],
    isPremium: false,
    isPublished: true,
    rating: 4.9,
    enrollmentCount: 8230,
    completionRate: 85,
    createdAt: '2026-10-04T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  },

  // 5. Git & GitHub Workflow
  {
    id: 'git-github-workflow',
    title: 'Git & GitHub Professional Workflow',
    titleAr: 'سير عمل احترافي مع Git و GitHub',
    slug: 'git-github-workflow',
    description: 'Master version control, branching strategies, pull requests, and collaborative development workflows.',
    descriptionAr: 'أتقن التحكم في الإصدارات واستراتيجيات التفريع وطلبات السحب وسير العمل التعاوني.',
    category: 'Developer Tools',
    categoryAr: 'أدوات المطورين',
    difficulty: 'Beginner',
    estimatedHours: 15,
    totalLessons: 6,
    outcomes: [
      'Use Git for version control',
      'Master branching and merging',
      'Resolve merge conflicts',
      'Create effective pull requests',
      'Use GitHub Actions for CI/CD',
      'Collaborate in team environments',
      'Follow Git best practices'
    ],
    outcomesAr: [
      'استخدام Git للتحكم في الإصدارات',
      'إتقان التفريع والدمج',
      'حل تعارضات الدمج',
      'إنشاء طلبات سحب فعالة',
      'استخدام GitHub Actions لـ CI/CD',
      'التعاون في بيئات الفريق',
      'اتباع أفضل ممارسات Git'
    ],
    skills: ['Git', 'GitHub', 'Version Control', 'Branching Strategies', 'CI/CD', 'Code Review'],
    prerequisites: ['Command line basics', 'Text editor usage'],
    prerequisitesAr: ['أساسيات سطر الأوامر', 'استخدام محرر النصوص'],
    targetRoles: ['All Developers', 'DevOps Engineer', 'Software Engineer'],
    targetRolesAr: ['جميع المطورين', 'مهندس DevOps', 'مهندس برمجيات'],
    lessons: [],
    isPremium: false,
    isPublished: true,
    rating: 4.8,
    enrollmentCount: 18540,
    completionRate: 88,
    createdAt: '2026-10-05T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  }
];

// ============================================================================
// Guides Library
// Technical & Career Best Practices
// ============================================================================

export const guides: Guide[] = [
  // Technical Guides
  {
    id: 'clean-code-principles',
    title: 'Clean Code Principles',
    titleAr: 'مبادئ الكود النظيف',
    slug: 'clean-code-principles',
    category: 'best-practices',
    categoryAr: 'أفضل الممارسات',
    description: 'Write maintainable, readable code that your team will thank you for. Learn naming, functions, comments, and refactoring.',
    descriptionAr: 'اكتب كوداً قابلاً للصيانة وسهل القراءة سيشكرك فريقك عليه. تعلم التسمية والدوال والتعليقات وإعادة البناء.',
    difficulty: 'Intermediate',
    estimatedReadTime: 45,
    content: { sections: [] },
    tableOfContents: [],
    relatedGuides: ['code-review-best-practices', 'refactoring-patterns'],
    relatedPacks: ['frontend-fundamentals', 'nodejs-backend'],
    tags: ['clean-code', 'best-practices', 'maintainability', 'readability'],
    resources: [],
    isPremium: false,
    isPublished: true,
    rating: 4.9,
    views: 25430,
    bookmarks: 3210,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  },

  {
    id: 'api-design-best-practices',
    title: 'RESTful API Design Best Practices',
    titleAr: 'أفضل ممارسات تصميم RESTful API',
    slug: 'api-design-best-practices',
    category: 'technical',
    categoryAr: 'تقني',
    description: 'Design intuitive, scalable APIs. Learn resource naming, HTTP methods, versioning, pagination, and error handling.',
    descriptionAr: 'صمم APIs بديهية وقابلة للتوسع. تعلم تسمية الموارد وطرق HTTP والإصدارات والترقيم ومعالجة الأخطاء.',
    difficulty: 'Intermediate',
    estimatedReadTime: 35,
    content: { sections: [] },
    tableOfContents: [],
    relatedGuides: ['nodejs-security-checklist', 'database-design-patterns'],
    relatedPacks: ['nodejs-backend'],
    tags: ['api-design', 'rest', 'backend', 'architecture'],
    resources: [],
    isPremium: false,
    isPublished: true,
    rating: 4.8,
    views: 18920,
    bookmarks: 2840,
    createdAt: '2026-10-02T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  },

  // Career Guides
  {
    id: 'technical-interview-preparation',
    title: 'Technical Interview Preparation Guide',
    titleAr: 'دليل التحضير للمقابلات التقنية',
    slug: 'technical-interview-preparation',
    category: 'career',
    categoryAr: 'مسار وظيفي',
    description: 'Ace your technical interviews. Learn data structures, algorithms, system design, and behavioral questions.',
    descriptionAr: 'انجح في مقابلاتك التقنية. تعلم هياكل البيانات والخوارزميات وتصميم الأنظمة والأسئلة السلوكية.',
    difficulty: 'Intermediate',
    estimatedReadTime: 60,
    content: { sections: [] },
    tableOfContents: [],
    relatedGuides: ['resume-writing-tips', 'salary-negotiation-strategies'],
    relatedPacks: [],
    tags: ['interview', 'career', 'preparation', 'coding-interviews'],
    resources: [],
    isPremium: false,
    isPublished: true,
    rating: 4.9,
    views: 32150,
    bookmarks: 5420,
    createdAt: '2026-10-03T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  },

  {
    id: 'remote-work-productivity',
    title: 'Remote Work Productivity for Developers',
    titleAr: 'إنتاجية العمل عن بعد للمطورين',
    slug: 'remote-work-productivity',
    category: 'soft-skills',
    categoryAr: 'مهارات شخصية',
    description: 'Stay productive, communicate effectively, and maintain work-life balance while working remotely.',
    descriptionAr: 'ابق منتجاً وتواصل بفعالية وحافظ على التوازن بين العمل والحياة أثناء العمل عن بعد.',
    difficulty: 'Beginner',
    estimatedReadTime: 25,
    content: { sections: [] },
    tableOfContents: [],
    relatedGuides: ['effective-communication', 'time-management'],
    relatedPacks: [],
    tags: ['remote-work', 'productivity', 'work-life-balance', 'communication'],
    resources: [],
    isPremium: false,
    isPublished: true,
    rating: 4.7,
    views: 14280,
    bookmarks: 1950,
    createdAt: '2026-10-04T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  },

  // Tools Guide
  {
    id: 'vscode-productivity-tips',
    title: 'VS Code Productivity Tips & Extensions',
    titleAr: 'نصائح إنتاجية VS Code والإضافات',
    slug: 'vscode-productivity-tips',
    category: 'tools',
    categoryAr: 'أدوات',
    description: 'Master VS Code shortcuts, extensions, and configurations to boost your coding productivity.',
    descriptionAr: 'أتقن اختصارات VS Code والإضافات والتكوينات لتعزيز إنتاجية الكود الخاص بك.',
    difficulty: 'Beginner',
    estimatedReadTime: 30,
    content: { sections: [] },
    tableOfContents: [],
    relatedGuides: ['git-github-workflow'],
    relatedPacks: [],
    tags: ['vscode', 'tools', 'productivity', 'extensions'],
    resources: [],
    isPremium: false,
    isPublished: true,
    rating: 4.8,
    views: 21340,
    bookmarks: 3680,
    createdAt: '2026-10-05T00:00:00Z',
    updatedAt: '2026-10-16T17:11:00Z'
  }
];

// Helper function to get pack by ID
export function getLessonPackById(id: string): LessonPack | undefined {
  return lessonPacks.find(pack => pack.id === id);
}

// Helper function to get packs by difficulty
export function getLessonPacksByDifficulty(difficulty: 'Beginner' | 'Intermediate' | 'Advanced'): LessonPack[] {
  return lessonPacks.filter(pack => pack.difficulty === difficulty);
}

// Helper function to get packs by category
export function getLessonPacksByCategory(category: string): LessonPack[] {
  return lessonPacks.filter(pack => pack.category === category);
}

// Helper function to get guide by ID
export function getGuideById(id: string): Guide | undefined {
  return guides.find(guide => guide.id === id);
}

// Helper function to get guides by category
export function getGuidesByCategory(category: string): Guide[] {
  return guides.filter(guide => guide.category === category);
}
