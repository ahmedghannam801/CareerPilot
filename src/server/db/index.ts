import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CareerProfile,
  ResumeVersion,
  Opportunity,
  Application,
  MicroProject,
  EmailEvent,
  InterviewSession,
  CareerMemoryFact,
  CareerTimelineEvent,
  ATSAnalysis,
  Course,
  CourseModule,
  UserSkill,
  SkillEvidence,
} from '../../types/index.js';
import { calculateCareerReadiness, calculateCVScore } from '../scoring/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');
const DB_FILE = path.join(DATA_DIR, 'careerpilot_db.json');

export interface DatabaseState {
  profile: CareerProfile;
  resumes: ResumeVersion[];
  atsAnalysis: Record<string, ATSAnalysis>;
  opportunities: Opportunity[];
  applications: Application[];
  microProjects: MicroProject[];
  courses: Course[];
  emailEvents: EmailEvent[];
  interviews: InterviewSession[];
  careerMemory: CareerMemoryFact[];
  timeline: CareerTimelineEvent[];
  emailAccountConnected: boolean;
  emailAccountAddress?: string;
  notifications: {
    id: string;
    title: string;
    message: string;
    type: 'HIGH' | 'MEDIUM' | 'LOW';
    read: boolean;
    createdAt: string;
  }[];
}

function getInitialSeed(): DatabaseState {
  const profile: CareerProfile = {
    id: 'usr-default',
    fullName: 'Mohamed Ghnnam',
    email: 'candidate@careerpilot.ai',
    headline: 'Full-Stack Software Engineer & AI Systems Architect',
    location: 'London, UK / Remote',
    careerStatus: 'experienced_professional',
    targetRole: 'Senior Full-Stack AI Engineer',
    targetIndustries: ['AI & Machine Learning', 'Developer Tools', 'Fintech / Enterprise SaaS'],
    targetSalary: '$130,000 - $160,000',
    onboardingCompleted: true,
    education: [
      {
        id: 'edu-1',
        institution: 'University of Technology',
        degree: 'B.Sc. in Computer Science & Software Engineering',
        field: 'Software Architecture & Distributed Systems',
        startDate: '2019-09',
        endDate: '2023-06',
        current: false,
        gpa: '3.8 / 4.0',
      },
    ],
    experience: [
      {
        id: 'exp-1',
        company: 'Synthetix Platforms',
        role: 'Senior Full-Stack Engineer',
        location: 'Remote',
        startDate: '2023-07',
        current: true,
        responsibilities: [
          'Engineered event-driven microservices handling 4M+ requests daily with Node.js and TypeScript',
          'Architected real-time dashboard UI with React, Vite, and Tailwind, decreasing interaction latency by 45%',
          'Built server-side LLM orchestration layer with structured schema validation and streaming',
        ],
        achievements: [
          'Reduced p95 API response times from 340ms to 78ms through redis caching and query optimization',
          'Authored high-concurrency background job processor with automated failover and telemetry',
        ],
      },
      {
        id: 'exp-2',
        company: 'CoreStack Solutions',
        role: 'Software Engineer',
        location: 'Hybrid',
        startDate: '2021-08',
        endDate: '2023-06',
        current: false,
        responsibilities: [
          'Developed REST and GraphQL APIs using Express, TypeScript, and PostgreSQL',
          'Collaborated with product teams to deliver customer-facing analytics and reporting',
        ],
        achievements: [
          'Spearheaded migration of legacy frontend to modular React components, boosting test coverage to 85%',
        ],
      },
    ],
    skills: [
      {
        id: 'sk-1',
        canonicalName: 'TypeScript',
        category: 'Technical',
        level: 'Expert',
        confidence: 96,
        evidenceCount: 3,
        lastAssessed: '2026-10-01',
        evidence: [
          {
            id: 'ev-1',
            skillName: 'TypeScript',
            type: 'experience',
            title: 'Production Lead at Synthetix Platforms',
            date: '2024-02',
            verified: true,
          },
          {
            id: 'ev-2',
            skillName: 'TypeScript',
            type: 'project',
            title: 'High-Throughput Task Pipeline',
            score: 95,
            date: '2024-06',
            verified: true,
          },
        ],
      },
      {
        id: 'sk-2',
        canonicalName: 'React & Next.js',
        category: 'Technical',
        level: 'Expert',
        confidence: 94,
        evidenceCount: 2,
        lastAssessed: '2026-09-15',
        evidence: [
          {
            id: 'ev-3',
            skillName: 'React & Next.js',
            type: 'experience',
            title: 'Lead Frontend Architecture at Synthetix',
            date: '2024-01',
            verified: true,
          },
        ],
      },
      {
        id: 'sk-3',
        canonicalName: 'PostgreSQL & Drizzle',
        category: 'Technical',
        level: 'Advanced',
        confidence: 88,
        evidenceCount: 2,
        lastAssessed: '2026-09-20',
        evidence: [
          {
            id: 'ev-4',
            skillName: 'PostgreSQL & Drizzle',
            type: 'certification',
            title: 'Advanced Relational Database Design',
            score: 92,
            date: '2023-11',
            verified: true,
          },
        ],
      },
      {
        id: 'sk-4',
        canonicalName: 'LLM Orchestration & Multi-Agent Architecture',
        category: 'Technical',
        level: 'Advanced',
        confidence: 90,
        evidenceCount: 2,
        lastAssessed: '2026-10-05',
        evidence: [
          {
            id: 'ev-5',
            skillName: 'LLM Orchestration & Multi-Agent Architecture',
            type: 'project',
            title: 'Autonomous Agent Router with Zod Validation',
            score: 94,
            date: '2024-08',
            verified: true,
          },
        ],
      },
      {
        id: 'sk-5',
        canonicalName: 'Docker & Cloud Deployment',
        category: 'Tool',
        level: 'Intermediate',
        confidence: 82,
        evidenceCount: 1,
        lastAssessed: '2026-08-10',
        evidence: [
          {
            id: 'ev-6',
            skillName: 'Docker & Cloud Deployment',
            type: 'experience',
            title: 'Synthetix CI/CD Pipeline Maintenance',
            date: '2023-10',
            verified: true,
          },
        ],
      },
      {
        id: 'sk-6',
        canonicalName: 'System Architecture & API Design',
        category: 'Technical',
        level: 'Advanced',
        confidence: 91,
        evidenceCount: 2,
        lastAssessed: '2026-09-18',
        evidence: [
          {
            id: 'ev-7',
            skillName: 'System Architecture & API Design',
            type: 'experience',
            title: '4M+ daily request microservice redesign',
            date: '2024-04',
            verified: true,
          },
        ],
      },
    ],
    dna: {
      currentLevel: 'Senior Engineer',
      primaryDirection: 'Full-Stack AI Systems Architecture',
      secondaryDirections: ['Cloud Distributed Systems', 'Developer Tooling Engineering'],
      strengths: [
        'Robust TypeScript full-stack system execution',
        'Multi-agent AI integration with deterministic schema guarantees',
        'Performance optimization and high-density dashboard UX',
      ],
      weaknesses: [
        'Deep cloud Kubernetes cluster auto-scaling orchestration (intermediate)',
        'Public open-source benchmark documentation needs expansion',
      ],
      keyCompetencies: [
        'End-to-end web apps',
        'AI agents & gateways',
        'Relational data modeling',
        'Type-safe contract design',
      ],
      workPreferences: {
        workModel: 'Remote',
        teamStyle: 'Collaborative',
        pace: 'High-growth',
      },
      summary:
        'Technical powerhouse blending high-standard frontend craftsmanship with resilient backend data pipelines and cutting-edge generative AI orchestration.',
      lastUpdated: '2026-10-10T12:00:00Z',
    },
    nextBestAction: {
      id: 'nba-1',
      title: 'Complete PostgreSQL Connection Pooling Benchmark',
      description:
        'Build the targeted connection pool stress test project to close your verified distributed database evidence gap for the ScaleOps role.',
      reason:
        'ScaleOps explicitly lists heavy transaction throughput and connection pool management as a critical competency.',
      evidenceNeeded: 'Project evaluation with >80% technical score and latency benchmark report.',
      expectedImpact: 'Increases ScaleOps Match score from 84% to 92%.',
      estimatedEffort: '3 hours',
      actionType: 'build_project',
    },
  };

  profile.readiness = calculateCareerReadiness(profile);

  const masterResume: ResumeVersion = {
    id: 'res-master',
    title: 'Master CV (Canonical)',
    isMaster: true,
    targetRole: 'Senior Full-Stack AI Engineer',
    summary:
      'Senior Full-Stack Engineer with 5+ years of experience architecting high-scale distributed web applications, type-safe APIs, and generative AI multi-agent workflows. Proven track record reducing API latency by 75% and delivering resilient production systems with TypeScript, React, and Node.js.',
    experience: profile.experience,
    education: profile.education,
    skills: profile.skills.map((s) => s.canonicalName),
    certifications: [
      'AWS Certified Developer Associate',
      'Advanced Relational Database Design & Performance Tuning',
    ],
    atsScore: 88,
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-10T14:30:00Z',
  };

  const atsMaster = calculateCVScore(masterResume);

  const opportunities: Opportunity[] = [
    {
      id: 'opp-1',
      title: 'Senior AI Full-Stack Engineer',
      company: 'ScaleOps Intelligence',
      location: 'London, UK / Remote',
      workModel: 'Remote',
      employmentType: 'Full-time',
      salary: '£110,000 - £135,000 + Equity',
      description:
        'We are seeking an experienced Full-Stack Engineer to lead the architecture of our autonomous AI infrastructure console. You will build high-frequency real-time web applications, integrate LLM agent tool calling with Zod validation, and optimize PostgreSQL database throughput.',
      requirements: [
        'TypeScript',
        'React & Next.js',
        'PostgreSQL & Drizzle',
        'LLM Orchestration & Multi-Agent Architecture',
        'System Architecture & API Design',
      ],
      preferredSkills: ['Docker & Cloud Deployment', 'Tailwind CSS', 'Redis caching'],
      deadline: '2026-11-15',
      sourceUrl: 'https://www.indeed.com/jobs?q=Senior+AI+Full-Stack+Engineer',
      sourcePlatform: 'Indeed',
      isManual: false,
      createdAt: '2026-10-08T10:00:00Z',
    },
    {
      id: 'opp-2',
      title: 'Lead Frontend & Systems Architect',
      company: 'LinearWorks Lab',
      location: 'San Francisco, CA / Remote',
      workModel: 'Remote',
      employmentType: 'Full-time',
      salary: '$145,000 - $175,000',
      description:
        'LinearWorks builds mission-critical developer tools. We are looking for an engineer with obsessive attention to UI craft, 60fps interaction performance, and resilient server-side data synchronization.',
      requirements: [
        'TypeScript',
        'React & Next.js',
        'System Architecture & API Design',
        'Tailwind CSS',
      ],
      preferredSkills: ['PostgreSQL & Drizzle', 'WebSockets', 'Offline-first sync'],
      deadline: '2026-11-30',
      sourceUrl: 'https://www.indeed.com/jobs?q=Frontend+Architect+TypeScript',
      sourcePlatform: 'Indeed',
      isManual: false,
      createdAt: '2026-10-09T14:00:00Z',
    },
    {
      id: 'opp-3',
      title: 'AI Platform Systems Engineer',
      company: 'SupraData Cloud',
      location: 'Amsterdam / Remote EU',
      workModel: 'Hybrid',
      employmentType: 'Full-time',
      salary: '€95,000 - €120,000',
      description:
        'Help us scale our real-time database query caching and generative AI indexing engine. Focus on high-throughput data processing, schema migrations, and intuitive web dashboards.',
      requirements: [
        'TypeScript',
        'PostgreSQL & Drizzle',
        'Docker & Cloud Deployment',
        'System Architecture & API Design',
      ],
      preferredSkills: ['React & Next.js', 'Python', 'Kubernetes'],
      deadline: '2026-12-01',
      sourceUrl: 'https://www.linkedin.com/jobs/search/?keywords=AI+Platform+Systems+Engineer',
      sourcePlatform: 'LinkedIn',
      isManual: false,
      createdAt: '2026-10-11T09:30:00Z',
    },
    {
      id: 'opp-4',
      title: 'Software Engineering & AI Systems Internship',
      company: 'Apex Technologies',
      location: 'Cairo, Egypt / Hybrid',
      workModel: 'Hybrid',
      employmentType: 'Internship',
      salary: '8,000 - 12,000 EGP / month',
      description:
        'Hands-on internship program working with senior engineers on full-stack web applications, TypeScript microservices, and AI workflow integration. Direct path to junior engineer offer upon completion.',
      requirements: [
        'JavaScript / TypeScript',
        'React Basics',
        'Git & Problem Solving',
        'Database Fundamentals',
      ],
      preferredSkills: ['Node.js', 'Tailwind CSS', 'REST APIs'],
      deadline: '2026-11-20',
      sourceUrl: 'https://www.indeed.com/jobs?q=Software+Engineering+Internship+Egypt',
      sourcePlatform: 'Indeed',
      isManual: false,
      createdAt: '2026-10-12T11:00:00Z',
    },
  ];

  const applications: Application[] = [
    {
      id: 'app-1',
      opportunityId: 'opp-1',
      jobTitle: 'Senior AI Full-Stack Engineer',
      company: 'ScaleOps Intelligence',
      status: 'Interview',
      appliedDate: '2026-10-09',
      tailoredResumeId: 'res-master',
      coverLetter:
        'Dear ScaleOps Hiring Team,\n\nI am writing to express my strong enthusiasm for the Senior AI Full-Stack Engineer role. Having architected high-concurrency microservices processing 4M+ daily requests and integrated strict schema-validated generative AI agent pipelines at Synthetix Platforms, I bring deep hands-on expertise with your exact technical stack: TypeScript, React, PostgreSQL, and autonomous LLM gateways.\n\nI look forward to discussing how my experience can accelerate ScaleOps\' infrastructure console.',
      answers: [
        {
          question: 'Describe your experience with multi-agent LLM systems and schema validation.',
          answer:
            'At Synthetix, I designed a multi-agent orchestration layer that routes specialized prompts through Zod schema validators before executing database operations, eliminating hallucination risks and ensuring 100% type safety.',
        },
        {
          question: 'How do you handle high-throughput database bottlenecks?',
          answer:
            'I profile slow queries using pg_stat_statements, establish connection pooling with PgBouncer, introduce redis key-space caching for hot reads, and structure composite indexes to optimize p95 latency.',
        },
      ],
      qualityScore: 94,
      qualityFeedback: [
        'High relevance to ScaleOps technology stack',
        'Clear quantifiable metrics in cover letter and screening questions',
      ],
      notes: 'Initial technical screening invitation received for Oct 18.',
      events: [
        {
          id: 'evt-1',
          date: '2026-10-09',
          type: 'APPLICATION_SUBMITTED',
          description: 'Tailored application and cover letter submitted via CareerPilot portal.',
        },
        {
          id: 'evt-2',
          date: '2026-10-10',
          type: 'APPLICATION_CONFIRMED',
          description: 'Automated receipt confirmed by ScaleOps talent system.',
        },
        {
          id: 'evt-3',
          date: '2026-10-11',
          type: 'INTERVIEW_INVITATION',
          description: 'Recruiter reached out via email to schedule Technical Round 1.',
        },
      ],
      createdAt: '2026-10-09T11:00:00Z',
      updatedAt: '2026-10-11T16:00:00Z',
    },
    {
      id: 'app-2',
      opportunityId: 'opp-2',
      jobTitle: 'Lead Frontend & Systems Architect',
      company: 'LinearWorks Lab',
      status: 'Preparing',
      appliedDate: undefined,
      tailoredResumeId: 'res-master',
      coverLetter: '',
      answers: [],
      qualityScore: 65,
      qualityFeedback: ['Drafting cover letter and tailored CV bullets in progress.'],
      notes: 'Finalizing portfolio case study before submission.',
      events: [
        {
          id: 'evt-4',
          date: '2026-10-10',
          type: 'APPLICATION_PREPARED',
          description: 'Opportunity saved and requirements matched against profile.',
        },
      ],
      createdAt: '2026-10-10T09:00:00Z',
      updatedAt: '2026-10-10T09:00:00Z',
    },
  ];

  const microProjects: MicroProject[] = [
    {
      id: 'proj-1',
      title: 'PostgreSQL Connection Pooling & Transaction Stress Benchmark',
      targetSkill: 'PostgreSQL & Drizzle',
      difficulty: 'Intermediate',
      duration: '3 hours',
      scenario:
        'A high-traffic e-commerce system experiences connection starvation and pool exhaustion during flash sales. Design an optimized connection pooler configuration with benchmark logs demonstrating zero-error query execution under 2,000 concurrent client sessions.',
      objective:
        'Demonstrate practical mastery of relational database connection pooling, max connection sizing, query timeouts, and transaction isolation.',
      tasks: [
        {
          id: 't-1',
          title: 'Implement connection pooling configuration with max connections and idle timeouts',
          completed: true,
        },
        {
          id: 't-2',
          title: 'Write load simulation script executing 2,000 concurrent ACID transactions',
          completed: true,
        },
        {
          id: 't-3',
          title: 'Record before/after latency benchmarks and connection utilization metrics',
          completed: false,
        },
      ],
      status: 'in_progress',
    },
    {
      id: 'proj-2',
      title: 'Multi-Agent Schema Guard & Prompt Router',
      targetSkill: 'LLM Orchestration & Multi-Agent Architecture',
      difficulty: 'Advanced',
      duration: '4 hours',
      scenario:
        'Build a provider-independent AI gateway that validates model output against strict Zod schemas, implements deterministic retries on schema failure, and logs token usage and latency metrics.',
      objective:
        'Produce verified evidence of resilient generative AI engineering suitable for production SaaS backends.',
      tasks: [
        {
          id: 't-4',
          title: 'Create unified AI Gateway contract with generateStructured and generateText',
          completed: true,
        },
        {
          id: 't-5',
          title: 'Implement JSON cleaning and Zod schema error handling with fallback parsing',
          completed: true,
        },
        {
          id: 't-6',
          title: 'Build in-memory telemetry observability log of agent runs',
          completed: true,
        },
      ],
      submission: {
        codeUrl: 'https://github.com/mohamedghnnam/agent-guard',
        liveDemoUrl: 'https://agent-guard.demo.dev',
        summary:
          'Created modular AI gateway supporting structured JSON validation with Zod, fallback error parsing, prompt versioning tags, and automated telemetry.',
        submittedAt: '2026-10-05T18:00:00Z',
      },
      evaluation: {
        score: 94,
        passed: true,
        feedback:
          'Outstanding implementation. Handles edge case syntax fences, conforms cleanly to TypeScript interfaces, and records latency statistics accurately.',
        strengths: [
          'Robust error handling and schema recovery',
          'Clean modular interface decoupling business logic from AI provider',
        ],
        improvements: [
          'Add exponential backoff delay between subsequent retry attempts',
        ],
        evidenceGenerated: true,
      },
      status: 'evaluated',
    },
    {
      id: 'proj-3',
      title: 'Containerized CI/CD Deployment with Docker & Health Probing',
      targetSkill: 'Docker & Cloud Deployment',
      difficulty: 'Intermediate',
      duration: '2.5 hours',
      scenario:
        'Create a multi-stage Dockerfile for a production Node.js & React full-stack application, ensuring minimal image size (<150MB), non-root execution, and HTTP health check endpoints.',
      objective: 'Prove production cloud readiness and secure deployment hygiene.',
      tasks: [
        { id: 't-7', title: 'Write multi-stage Dockerfile with builder and runner layers', completed: false },
        { id: 't-8', title: 'Configure non-root user and secure filesystem permissions', completed: false },
        { id: 't-9', title: 'Expose /health endpoint with uptime and DB status probes', completed: false },
      ],
      status: 'available',
    },
  ];

  const emailEvents: EmailEvent[] = [
    {
      id: 'em-1',
      subject: 'Interview Invitation: Senior AI Full-Stack Engineer at ScaleOps',
      sender: 'recruiting@scaleops.example.com',
      date: '2026-10-11T14:22:00Z',
      snippet:
        'Hi Mohamed, thank you for your application. Our engineering team was very impressed by your work at Synthetix. We would love to invite you to a 45-minute technical conversation next week...',
      category: 'interview_invitation',
      detectedAction: 'Schedule interview call on candidate calendar portal',
      relatedCompany: 'ScaleOps Intelligence',
      relatedJobTitle: 'Senior AI Full-Stack Engineer',
      priority: 'HIGH',
      processed: true,
    },
    {
      id: 'em-2',
      subject: 'Application Received: Lead Frontend & Systems Architect',
      sender: 'careers@linearworks.example.com',
      date: '2026-10-10T09:15:00Z',
      snippet:
        'Thank you for submitting your application to LinearWorks Lab. Your application ID is #LW-8921. Our talent review committee reviews submissions on a rolling basis.',
      category: 'application_confirmation',
      detectedAction: 'No immediate action required. Review timeline in 5 business days.',
      relatedCompany: 'LinearWorks Lab',
      relatedJobTitle: 'Lead Frontend & Systems Architect',
      priority: 'MEDIUM',
      processed: true,
    },
    {
      id: 'em-3',
      subject: 'Take-home Technical Assessment: Datadog Cloud Engineering',
      sender: 'talent-eval@datadog.example.com',
      date: '2026-10-07T11:00:00Z',
      snippet:
        'We invite you to take the 90-minute distributed systems assessment. Please complete before Friday 18:00 UTC.',
      category: 'assessment',
      detectedAction: 'Complete assessment by deadline (Friday 18:00 UTC)',
      relatedCompany: 'Datadog',
      priority: 'HIGH',
      processed: true,
    },
  ];

  const interviews: InterviewSession[] = [
    {
      id: 'int-1',
      jobRole: 'Senior AI Full-Stack Engineer',
      type: 'Technical',
      questions: [
        {
          id: 'q-1',
          question:
            'How do you design a resilient multi-agent workflow where an AI agent might return malformed JSON or fail external schema validation?',
          userAnswer:
            'I implement a multi-layered boundary. First, I use JSON mode with strict schemas in the system prompt. Second, I run the output through a Zod validator. If validation throws, the error details and original output are fed back into a targeted repair prompt or fallback parser, preventing corrupt state from reaching the database.',
          feedback: {
            score: 92,
            strengths: [
              'Clear distinction between model generation and schema validation',
              'Mentions iterative repair loops and database boundary protection',
            ],
            improvements: [
              'Could specify circuit-breaker patterns for repeated consecutive failures',
            ],
            suggestedRefinement:
              'Mentioning a circuit breaker and dead-letter queue adds enterprise reliability depth.',
          },
        },
        {
          id: 'q-2',
          question:
            'How do you handle real-time synchronization between client UI and high-frequency backend events?',
          userAnswer:
            'I prefer Server-Sent Events (SSE) or WebSockets depending on whether communication is unidirectional or bidirectional, paired with optimistic UI updates and local sequence numbering to handle out-of-order packets.',
          feedback: {
            score: 89,
            strengths: [
              'Good selection of SSE vs WebSockets',
              'Addresses optimistic updates and sequence idempotency',
            ],
            improvements: ['Can highlight reconnection backoff strategies'],
            suggestedRefinement:
              'Include exponential backoff with jitter on reconnect for extra points.',
          },
        },
      ],
      currentQuestionIndex: 1,
      completed: true,
      overallScore: 91,
      summaryFeedback:
        'Strong technical clarity and architectural maturity. Ready for senior-level systems interviews.',
      createdAt: '2026-10-10T16:00:00Z',
    },
  ];

  const careerMemory: CareerMemoryFact[] = [
    {
      id: 'mem-1',
      category: 'Career',
      fact: 'Prefers Remote or European-time-zone hybrid roles in AI Systems or Developer Tools',
      confidence: 100,
      updatedAt: '2026-10-01T10:00:00Z',
    },
    {
      id: 'mem-2',
      category: 'Skills',
      fact: 'Deeply skilled in TypeScript, React, Node.js, and PostgreSQL; verified with production achievements',
      confidence: 96,
      updatedAt: '2026-10-05T14:00:00Z',
    },
    {
      id: 'mem-3',
      category: 'Goals',
      fact: 'Targeting Senior AI Full-Stack Engineer role with compensation between $130k and $160k',
      confidence: 95,
      updatedAt: '2026-10-08T09:00:00Z',
    },
    {
      id: 'mem-4',
      category: 'Interviews',
      fact: 'ScaleOps Intelligence Technical Round 1 scheduled for Oct 18, 2026',
      confidence: 100,
      updatedAt: '2026-10-11T15:00:00Z',
    },
  ];

  const timeline: CareerTimelineEvent[] = [
    {
      id: 'tl-1',
      date: '2026-10-01',
      type: 'PROFILE_INITIALIZED',
      title: 'Career Intelligence Profile Initialized',
      description: 'Onboarding completed for Senior Full-Stack AI Engineer trajectory.',
      source: 'User',
    },
    {
      id: 'tl-2',
      date: '2026-10-05',
      type: 'PROJECT_EVALUATED',
      title: 'Multi-Agent Schema Guard Project Evaluated',
      description: 'Scored 94/100 and added verified LLM Orchestration skill evidence.',
      source: 'Project',
    },
    {
      id: 'tl-3',
      date: '2026-10-09',
      type: 'APPLICATION_SUBMITTED',
      title: 'Applied to ScaleOps Intelligence',
      description: 'Submitted tailored CV and cover letter for Senior AI Engineer.',
      source: 'Application',
    },
    {
      id: 'tl-4',
      date: '2026-10-11',
      type: 'INTERVIEW_INVITATION',
      title: 'Interview Invitation Received',
      description: 'ScaleOps talent team invited candidate for Technical Screening.',
      source: 'Email',
    },
  ];

  const notifications = [
    {
      id: 'notif-1',
      title: 'Interview Invitation',
      message: 'ScaleOps Intelligence invited you for a Technical Conversation.',
      type: 'HIGH' as const,
      read: false,
      createdAt: '2026-10-11T14:22:00Z',
    },
    {
      id: 'notif-2',
      title: 'Next Best Action Ready',
      message: 'Complete the PostgreSQL Pooling Benchmark to strengthen evidence.',
      type: 'MEDIUM' as const,
      read: false,
      createdAt: '2026-10-12T08:00:00Z',
    },
  ];

  const courses: Course[] = [
    {
      id: 'crs-1',
      title: 'Generative AI Engineering & Multi-Agent LLM Systems (2026 Edition)',
      provider: 'DeepLearning.AI',
      instructor: 'Andrew Ng & AI Research Leads',
      domain: 'AI & Machine Learning',
      targetRole: 'Senior Full-Stack AI Engineer',
      level: 'Advanced',
      duration: '18 hours',
      rating: 4.95,
      reviewsCount: 16800,
      url: 'https://www.deeplearning.ai/courses/',
      description: 'Master production-grade LLM orchestration, structured output validation with schemas, agentic tool-use, RAG retrieval architectures, and evaluation benchmarks for enterprise deployments.',
      skillsGained: ['LLM Orchestration', 'Multi-Agent Architecture', 'Vector Search / RAG', 'Schema Validation'],
      relevanceReason: 'Directly aligns with your target role of Senior Full-Stack AI Engineer and elevates your generative AI system architecture readiness.',
      cost: 'Free with Paid Cert',
      certificateAvailable: true,
      enrollmentStatus: 'in_progress',
      progressPercentage: 65,
      enrolledAt: '2026-10-02T10:00:00Z',
      modules: [
        { id: 'm-1', title: 'Foundations of Agentic Workflows & Tool Calling', duration: '3h', completed: true },
        { id: 'm-2', title: 'Structured JSON Outputs and Strict Schema Enforcement', duration: '4h', completed: true },
        { id: 'm-3', title: 'Vector Retrieval, Embedding Ingestion & Hybrid RAG', duration: '5h', completed: true },
        { id: 'm-4', title: 'Multi-Agent Collaboration, State Machines & Guardrails', duration: '6h', completed: false },
      ],
      source: 'Curated',
    },
    {
      id: 'crs-2',
      title: 'Distributed Systems Engineering (MIT 6.824)',
      provider: 'MIT CSAIL',
      instructor: 'Prof. Robert Morris',
      domain: 'System Design & Architecture',
      targetRole: 'Senior Software Engineer / Architect',
      level: 'Advanced',
      duration: '24 hours',
      rating: 4.98,
      reviewsCount: 12400,
      url: 'https://pdos.csail.mit.edu/6.824/',
      description: 'Deep dive into fault tolerance, Raft consensus algorithm, distributed transactional guarantees, replication protocols, and high-availability patterns in cloud scale systems.',
      skillsGained: ['Distributed Systems', 'Raft Consensus', 'Fault Tolerance', 'Event-Driven Systems'],
      relevanceReason: 'Strengthens your core architectural foundation for senior engineering system design interviews.',
      cost: 'Free',
      certificateAvailable: true,
      enrollmentStatus: 'in_progress',
      progressPercentage: 40,
      enrolledAt: '2026-10-06T14:30:00Z',
      modules: [
        { id: 'm-5', title: 'RPC, Concurrency & Threading in Distributed Servers', duration: '4h', completed: true },
        { id: 'm-6', title: 'Fault-tolerant Consensus with the Raft Algorithm', duration: '6h', completed: true },
        { id: 'm-7', title: 'Distributed Key-Value Stores & Linearizability', duration: '6h', completed: false },
        { id: 'm-8', title: 'Two-Phase Commit, Sagas & Distributed Transactions', duration: '8h', completed: false },
      ],
      source: 'Curated',
    },
    {
      id: 'crs-3',
      title: 'High-Performance PostgreSQL: Indexing, Pooling & Query Optimization',
      provider: 'PostgreSQL Official & Hussein Nasser',
      instructor: 'PostgreSQL Engineering Leads',
      domain: 'Full-Stack Software Engineering',
      targetRole: 'Senior Backend / Full-Stack Engineer',
      level: 'Intermediate',
      duration: '14 hours',
      rating: 4.88,
      reviewsCount: 16500,
      url: 'https://www.postgresqltutorial.com/',
      description: 'Practical database internals, B-Tree vs BRIN indexes, connection pooler tuning (PgBouncer), vacuuming internals, explain analyze query diagnostics, and lock contention avoidance.',
      skillsGained: ['PostgreSQL', 'Connection Pooling', 'Query Tuning', 'Database Internals'],
      relevanceReason: 'Directly resolves your identified skill gap in database connection starvation and pool sizing.',
      cost: 'Free',
      certificateAvailable: true,
      enrollmentStatus: 'completed',
      progressPercentage: 100,
      enrolledAt: '2026-09-20T10:00:00Z',
      completedAt: '2026-10-04T16:00:00Z',
      certificateUrl: 'https://www.postgresqltutorial.com/',
      notes: 'Completed all hands-on connection benchmark labs with 100% test pass rate.',
      modules: [
        { id: 'm-9', title: 'PostgreSQL Storage Architecture & Page Layout', duration: '3h', completed: true },
        { id: 'm-10', title: 'Advanced Index Design & EXPLAIN ANALYZE Cost Models', duration: '4h', completed: true },
        { id: 'm-11', title: 'Client Connections, Max Connections & PgBouncer Setup', duration: '4h', completed: true },
        { id: 'm-12', title: 'Transaction Isolation Levels and Lock Elimination', duration: '3h', completed: true },
      ],
      source: 'Curated',
    },
    {
      id: 'crs-4',
      title: 'Kubernetes Official Fundamentals & Cluster Architecture',
      provider: 'The Linux Foundation / CNCF',
      instructor: 'Kubernetes Documentation Team',
      domain: 'Cloud & DevOps',
      targetRole: 'DevOps / Cloud Systems Engineer',
      level: 'Intermediate',
      duration: '16 hours',
      rating: 4.9,
      reviewsCount: 18500,
      url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
      description: 'Container lifecycle management, ingress controllers, horizontal pod autoscaling, rolling deployments, ConfigMaps, Secrets, and zero-downtime cluster operations.',
      skillsGained: ['Kubernetes', 'Docker', 'Cloud Infrastructure', 'CI/CD Pipelines'],
      relevanceReason: 'Builds critical cloud deployment competencies requested by 85% of modern tech startups.',
      cost: 'Free',
      certificateAvailable: true,
      enrollmentStatus: 'not_enrolled',
      progressPercentage: 0,
      modules: [
        { id: 'm-13', title: 'Containers, Multi-stage Builds and Distroless Images', duration: '3h', completed: false },
        { id: 'm-14', title: 'K8s Architecture: Pods, Services, Deployments & ReplicaSets', duration: '4h', completed: false },
        { id: 'm-15', title: 'Ingress Routing, TLS Termination & Service Meshes', duration: '4h', completed: false },
        { id: 'm-16', title: 'Automated CI/CD with GitOps and Helm Charts', duration: '5h', completed: false },
      ],
      source: 'Curated',
    },
    {
      id: 'crs-5',
      title: 'Full-Stack React 19, Next.js & Server Actions Masterclass',
      provider: 'Vercel / Next.js Official',
      instructor: 'Vercel & Next.js Core Team',
      domain: 'Full-Stack Software Engineering',
      targetRole: 'Senior Full-Stack Engineer',
      level: 'Advanced',
      duration: '12 hours',
      rating: 4.96,
      reviewsCount: 22400,
      url: 'https://nextjs.org/learn',
      description: 'Modern full-stack web applications with React 19 Server Components, Streaming SSR, optimistic UI updates, zero-bundle size dependencies, and type-safe data fetching.',
      skillsGained: ['React 19', 'Next.js', 'TypeScript', 'Server Components', 'Optimistic UI'],
      relevanceReason: 'Keeps your frontend engineering stack at the cutting edge for lead-level engineering positions.',
      cost: 'Free',
      certificateAvailable: true,
      enrollmentStatus: 'not_enrolled',
      progressPercentage: 0,
      modules: [
        { id: 'm-17', title: 'React 19 Hooks: useTransition, useActionState & useOptimistic', duration: '3h', completed: false },
        { id: 'm-18', title: 'RSC vs Client Components: Mental Model & Architecture', duration: '3h', completed: false },
        { id: 'm-19', title: 'Server Actions, Form Mutations & Zod Validation', duration: '3h', completed: false },
        { id: 'm-20', title: 'Production Performance Profiling & Core Web Vitals', duration: '3h', completed: false },
      ],
      source: 'Curated',
    },
    {
      id: 'crs-6',
      title: 'CS50: Introduction to Computer Science & Software Engineering',
      provider: 'Harvard University',
      instructor: 'Prof. David J. Malan',
      domain: 'Computer Science & Algorithms',
      targetRole: 'Full-Stack Software Engineer',
      level: 'All Levels',
      duration: '25 hours',
      rating: 4.99,
      reviewsCount: 84000,
      url: 'https://cs50.harvard.edu/x/',
      description: 'Comprehensive computer science foundations covering memory management, C, algorithms, data structures, Python, SQL, and full-stack web application development.',
      skillsGained: ['Algorithms', 'Data Structures', 'Python', 'SQL', 'Memory Management'],
      relevanceReason: 'Gold standard global curriculum for engineering fundamentals and technical interviews.',
      cost: 'Free',
      certificateAvailable: true,
      enrollmentStatus: 'not_enrolled',
      progressPercentage: 0,
      modules: [
        { id: 'm-21', title: 'Computational Thinking & C Fundamentals', duration: '5h', completed: false },
        { id: 'm-22', title: 'Arrays, Searching & Sorting Algorithms', duration: '5h', completed: false },
        { id: 'm-23', title: 'Memory Management, Pointers & Data Structures', duration: '5h', completed: false },
        { id: 'm-24', title: 'Python, SQL & Web Development Architecture', duration: '10h', completed: false },
      ],
      source: 'Curated',
    },
    {
      id: 'crs-7',
      title: 'Full-Stack Developer Certification (freeCodeCamp 2026)',
      provider: 'freeCodeCamp',
      instructor: 'Quincy Larson & Community',
      domain: 'Full-Stack Software Engineering',
      targetRole: 'Full-Stack Developer',
      level: 'Intermediate',
      duration: '300 hours',
      rating: 4.94,
      reviewsCount: 112000,
      url: 'https://www.freecodecamp.org/learn/full-stack-developer/',
      description: 'Hands-on curriculum building 30+ interactive web applications with modern HTML, CSS, JavaScript, React, Node.js, Express, databases, and automated testing.',
      skillsGained: ['Full-Stack Development', 'React', 'Node.js', 'Express', 'Databases'],
      relevanceReason: 'Provides extensive project-based coding practice and verifiable global certification.',
      cost: 'Free',
      certificateAvailable: true,
      enrollmentStatus: 'not_enrolled',
      progressPercentage: 0,
      modules: [
        { id: 'm-25', title: 'Responsive Web Design & Modern CSS Architecture', duration: '50h', completed: false },
        { id: 'm-26', title: 'JavaScript Algorithms & Data Structures', duration: '80h', completed: false },
        { id: 'm-27', title: 'Front End Development Libraries (React, Redux)', duration: '70h', completed: false },
        { id: 'm-28', title: 'Back End Development & APIs with Node & Express', duration: '100h', completed: false },
      ],
      source: 'Curated',
    },
  ];

  return {
    profile,
    resumes: [masterResume],
    atsAnalysis: { 'res-master': atsMaster },
    opportunities,
    applications,
    microProjects,
    courses,
    emailEvents,
    interviews,
    careerMemory,
    timeline,
    emailAccountConnected: false,
    notifications,
  };
}

export class DatabaseService {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const loaded = JSON.parse(raw);
        if (!loaded.courses || !Array.isArray(loaded.courses) || loaded.courses.length === 0) {
          const seed = getInitialSeed();
          loaded.courses = seed.courses;
          this.save(loaded);
        }
        return loaded;
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing default seed:', e);
    }
    const seed = getInitialSeed();
    this.save(seed);
    return seed;
  }

  private save(state?: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dataToSave = state || this.state;
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // --- Profile Methods ---
  getProfile(): CareerProfile {
    return this.state.profile;
  }

  updateProfile(partial: Partial<CareerProfile>): CareerProfile {
    this.state.profile = {
      ...this.state.profile,
      ...partial,
    };
    // Recalculate readiness
    this.state.profile.readiness = calculateCareerReadiness(this.state.profile);
    this.save();
    return this.state.profile;
  }

  // --- Resume Methods ---
  getResumes(): ResumeVersion[] {
    return this.state.resumes;
  }

  getMasterResume(): ResumeVersion | undefined {
    return this.state.resumes.find((r) => r.isMaster) || this.state.resumes[0];
  }

  saveResume(resume: ResumeVersion): ResumeVersion {
    const existingIndex = this.state.resumes.findIndex((r) => r.id === resume.id);
    if (existingIndex >= 0) {
      this.state.resumes[existingIndex] = resume;
    } else {
      this.state.resumes.push(resume);
    }
    // Update ATS cache
    this.state.atsAnalysis[resume.id] = calculateCVScore(resume);
    this.save();
    return resume;
  }

  getATSAnalysis(resumeId: string): ATSAnalysis {
    if (!this.state.atsAnalysis[resumeId]) {
      const resume = this.state.resumes.find((r) => r.id === resumeId);
      if (resume) {
        this.state.atsAnalysis[resumeId] = calculateCVScore(resume);
      } else {
        const master = this.getMasterResume();
        if (master) {
          this.state.atsAnalysis[resumeId] = calculateCVScore(master);
        }
      }
    }
    return (
      this.state.atsAnalysis[resumeId] || {
        overallScore: 70,
        strengths: ['Structured CV formatting detected'],
        weaknesses: ['Add more metrics'],
        recommendations: ['Quantify achievements'],
        missingKeywords: [],
        formattingScore: 85,
        relevanceScore: 75,
        impactScore: 70,
      }
    );
  }

  // --- Opportunities ---
  getOpportunities(): Opportunity[] {
    return this.state.opportunities;
  }

  addOpportunity(opp: Opportunity): Opportunity {
    this.state.opportunities.unshift(opp);
    this.save();
    return opp;
  }

  deleteOpportunity(id: string): boolean {
    this.state.opportunities = this.state.opportunities.filter((o) => o.id !== id);
    this.save();
    return true;
  }

  // --- Applications ---
  getApplications(): Application[] {
    return this.state.applications;
  }

  saveApplication(app: Application): Application {
    const idx = this.state.applications.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      this.state.applications[idx] = app;
    } else {
      this.state.applications.unshift(app);
    }
    this.save();
    return app;
  }

  // --- Micro-Projects ---
  getMicroProjects(): MicroProject[] {
    return this.state.microProjects;
  }

  saveMicroProject(proj: MicroProject): MicroProject {
    const idx = this.state.microProjects.findIndex((p) => p.id === proj.id);
    if (idx >= 0) {
      this.state.microProjects[idx] = proj;
    } else {
      this.state.microProjects.unshift(proj);
    }
    this.save();
    return proj;
  }

  // --- Courses & Skill Development ---
  getCourses(): Course[] {
    return this.state.courses || [];
  }

  getCourseById(id: string): Course | undefined {
    return (this.state.courses || []).find((c) => c.id === id);
  }

  saveCourse(course: Course): Course {
    if (!this.state.courses) this.state.courses = [];
    const idx = this.state.courses.findIndex((c) => c.id === course.id);
    if (idx >= 0) {
      this.state.courses[idx] = course;
    } else {
      this.state.courses.unshift(course);
    }
    this.save();
    return course;
  }

  enrollCourse(id: string): Course {
    const course = this.getCourseById(id);
    if (!course) throw new Error('Course not found');
    course.enrollmentStatus = 'in_progress';
    course.enrolledAt = course.enrolledAt || new Date().toISOString();
    if (course.progressPercentage === 0 && course.modules.length > 0) {
      course.progressPercentage = 10;
    }
    this.save();
    return course;
  }

  updateCourseProgress(
    id: string,
    progressPercentage: number,
    completedModuleId?: string
  ): Course {
    const course = this.getCourseById(id);
    if (!course) throw new Error('Course not found');

    if (completedModuleId) {
      const mod = course.modules.find((m) => m.id === completedModuleId);
      if (mod) mod.completed = true;
    }

    course.progressPercentage = Math.min(100, Math.max(0, progressPercentage));
    if (course.progressPercentage > 0 && course.enrollmentStatus === 'not_enrolled') {
      course.enrollmentStatus = 'in_progress';
      course.enrolledAt = new Date().toISOString();
    }

    if (course.progressPercentage >= 100) {
      course.enrollmentStatus = 'completed';
      course.completedAt = new Date().toISOString();
      course.modules = course.modules.map((m) => ({ ...m, completed: true }));
    }

    this.save();
    return course;
  }

  completeCourse(
    id: string,
    notes?: string,
    certificateUrl?: string
  ): { course: Course; profile: CareerProfile } {
    const course = this.getCourseById(id);
    if (!course) throw new Error('Course not found');

    course.enrollmentStatus = 'completed';
    course.progressPercentage = 100;
    course.completedAt = new Date().toISOString();
    if (notes) course.notes = notes;
    if (certificateUrl) course.certificateUrl = certificateUrl;
    course.modules = course.modules.map((m) => ({ ...m, completed: true }));

    const dateStr = new Date().toISOString().split('T')[0];

    // For every skill gained, add/update verified skill evidence
    course.skillsGained.forEach((skillName) => {
      let userSkill = this.state.profile.skills.find(
        (s) => s.canonicalName.toLowerCase() === skillName.toLowerCase()
      );

      const evidence: SkillEvidence = {
        id: `ev-crs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        skillName,
        type: 'course',
        title: `${course.title} (${course.provider})`,
        score: 95,
        url: certificateUrl || course.url,
        date: dateStr,
        verified: true,
        notes: notes || `Successfully completed comprehensive professional track on ${course.provider}`,
      };

      if (userSkill) {
        userSkill.evidence.push(evidence);
        userSkill.evidenceCount = userSkill.evidence.length;
        userSkill.confidence = Math.min(100, userSkill.confidence + 15);
        userSkill.lastAssessed = dateStr;
        if (userSkill.level === 'Beginner') userSkill.level = 'Intermediate';
        else if (userSkill.level === 'Intermediate') userSkill.level = 'Advanced';
      } else {
        userSkill = {
          id: `skl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          canonicalName: skillName,
          category: 'Technical',
          level: 'Intermediate',
          confidence: 85,
          evidenceCount: 1,
          lastAssessed: dateStr,
          evidence: [evidence],
        };
        this.state.profile.skills.push(userSkill);
      }
    });

    // Recalculate Career Readiness across all 8 pillars
    this.state.profile.readiness = calculateCareerReadiness(this.state.profile);

    // Add timeline event
    this.addTimelineEvent({
      date: dateStr,
      type: 'COURSE_COMPLETED',
      title: `Completed Course: ${course.title}`,
      description: `Earned verified skill evidence on ${course.provider} across: ${course.skillsGained.join(', ')}. Career readiness updated to ${this.state.profile.readiness.overallScore}%.`,
      source: 'User',
    });

    // Add notification
    this.state.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Course Completed & Evidence Verified! 🎓',
      message: `Earned credential for ${course.title}. Skills and career readiness score increased.`,
      type: 'HIGH',
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.save();
    return { course, profile: this.state.profile };
  }

  deleteCourse(id: string): boolean {
    if (!this.state.courses) return false;
    this.state.courses = this.state.courses.filter((c) => c.id !== id);
    this.save();
    return true;
  }

  addGeneratedCourses(newCourses: Course[]): Course[] {
    if (!this.state.courses) this.state.courses = [];
    newCourses.forEach((nc) => {
      const exists = this.state.courses.some((c) => c.id === nc.id || c.title.toLowerCase() === nc.title.toLowerCase());
      if (!exists) {
        this.state.courses.unshift(nc);
      }
    });
    this.save();
    return this.state.courses;
  }

  // --- Email Events ---
  getEmailEvents(): EmailEvent[] {
    return this.state.emailEvents;
  }

  addEmailEvent(event: EmailEvent): EmailEvent {
    this.state.emailEvents.unshift(event);
    // Add notification if high priority
    if (event.priority === 'HIGH') {
      this.state.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: event.category === 'interview_invitation' ? 'Interview Invitation' : 'High Priority Email',
        message: `${event.sender}: ${event.subject}`,
        type: 'HIGH',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    this.save();
    return event;
  }

  // --- Interviews ---
  getInterviews(): InterviewSession[] {
    return this.state.interviews;
  }

  saveInterview(interview: InterviewSession): InterviewSession {
    const idx = this.state.interviews.findIndex((i) => i.id === interview.id);
    if (idx >= 0) {
      this.state.interviews[idx] = interview;
    } else {
      this.state.interviews.unshift(interview);
    }
    this.save();
    return interview;
  }

  // --- Career Memory ---
  getCareerMemory(): CareerMemoryFact[] {
    return this.state.careerMemory;
  }

  addCareerMemoryFact(fact: Omit<CareerMemoryFact, 'id' | 'updatedAt'>): CareerMemoryFact {
    const entry: CareerMemoryFact = {
      ...fact,
      id: `mem-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    this.state.careerMemory.unshift(entry);
    this.save();
    return entry;
  }

  deleteCareerMemoryFact(id: string): boolean {
    this.state.careerMemory = this.state.careerMemory.filter((m) => m.id !== id);
    this.save();
    return true;
  }

  // --- Timeline ---
  getTimeline(): CareerTimelineEvent[] {
    return this.state.timeline;
  }

  addTimelineEvent(event: Omit<CareerTimelineEvent, 'id'>): CareerTimelineEvent {
    const entry: CareerTimelineEvent = {
      ...event,
      id: `tl-${Date.now()}`,
    };
    this.state.timeline.unshift(entry);
    this.save();
    return entry;
  }

  // --- Notifications ---
  getNotifications() {
    return this.state.notifications;
  }

  markNotificationRead(id: string) {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    this.save();
  }

  // --- Integrations & Email Connection ---
  isEmailConnected(): boolean {
    return this.state.emailAccountConnected;
  }

  setEmailConnected(connected: boolean, address?: string) {
    this.state.emailAccountConnected = connected;
    this.state.emailAccountAddress = address;
    this.save();
  }

  // --- System Reset & Export ---
  exportFullData(): DatabaseState {
    return this.state;
  }

  resetToSeed(): DatabaseState {
    this.state = getInitialSeed();
    this.save();
    return this.state;
  }
}

export const dbService = new DatabaseService();
