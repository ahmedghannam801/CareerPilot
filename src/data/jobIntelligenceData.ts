import type {
  JobPosting,
  JobCompany,
  JobVerification,
  SkillDemand,
  RoleMarketData,
  MarketTrend,
  SalaryDataPoint
} from '../types/jobIntelligence';

// ============================================================================
// Job Postings Seed Data
// Phase 7: Real Job Data + Verification System
// ============================================================================

export const verifiedCompanies: JobCompany[] = [
  {
    id: 'google',
    name: 'Google',
    logo: 'https://logo.clearbit.com/google.com',
    website: 'https://google.com',
    size: '1000+',
    industry: 'Technology',
    founded: 1998,
    location: 'Mountain View, CA',
    description: 'Global technology leader in search, cloud, and AI',
    glassdoorRating: 4.5,
    verified: true
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://logo.clearbit.com/amazon.com',
    website: 'https://amazon.com',
    size: '1000+',
    industry: 'E-commerce & Cloud',
    founded: 1994,
    location: 'Seattle, WA',
    glassdoorRating: 4.2,
    verified: true
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: 'https://logo.clearbit.com/microsoft.com',
    website: 'https://microsoft.com',
    size: '1000+',
    industry: 'Technology',
    founded: 1975,
    location: 'Redmond, WA',
    glassdoorRating: 4.4,
    verified: true
  }
];

export const jobPostings: JobPosting[] = [
  // 1. Frontend Developer (Remote)
  {
    id: 'job-frontend-react-001',
    externalId: 'linkedin-789456123',
    source: 'linkedin',
    verificationStatus: 'verified',

    title: 'Senior Frontend Developer - React',
    company: verifiedCompanies[0], // Google
    location: 'Remote (US)',
    remotePolicy: 'remote',
    type: 'full-time',
    experienceLevel: 'senior',

    description: 'Join our team building next-generation web applications with React, TypeScript, and modern tools.',
    responsibilities: [
      'Build scalable frontend applications with React and TypeScript',
      'Collaborate with designers and backend engineers',
      'Mentor junior developers',
      'Participate in code reviews and architecture decisions'
    ],
    requirements: [
      '5+ years frontend development experience',
      'Expert in React, TypeScript, and modern JavaScript',
      'Experience with state management (Redux, MobX, or Zustand)',
      'Strong CSS skills (Tailwind, styled-components, or CSS-in-JS)'
    ],
    niceToHave: [
      'Experience with Next.js or Remix',
      'GraphQL knowledge',
      'Performance optimization expertise',
      'Open source contributions'
    ],

    skills: {
      required: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Git'],
      preferred: ['Next.js', 'GraphQL', 'Performance Optimization', 'Webpack']
    },

    salary: {
      min: 140000,
      max: 200000,
      currency: 'USD',
      period: 'yearly',
      verified: true,
      source: 'levels.fyi',
      lastVerifiedAt: '2026-10-15T00:00:00Z'
    },
    benefits: [
      'Competitive salary + equity',
      'Health insurance (medical, dental, vision)',
      '401(k) with company match',
      'Unlimited PTO',
      'Remote work equipment budget',
      'Professional development budget'
    ],

    applyUrl: 'https://careers.google.com/jobs/react-senior-frontend',
    applicationDeadline: '2026-11-15T23:59:59Z',

    postedAt: '2026-10-10T08:00:00Z',
    scrapedAt: '2026-10-10T09:15:00Z',
    lastVerifiedAt: '2026-10-16T06:00:00Z',
    expiresAt: '2026-11-15T23:59:59Z',
    viewCount: 2847,
    applicationCount: 234,

    qualityScore: 95,
    qualityFactors: {
      hasVerifiedCompany: true,
      hasSalary: true,
      hasDetailedDescription: true,
      hasSkillsList: true,
      isRecent: false,
      hasValidUrl: true
    }
  },

  // 2. Backend Engineer (Hybrid)
  {
    id: 'job-backend-node-002',
    externalId: 'indeed-456789012',
    source: 'indeed',
    verificationStatus: 'verified',

    title: 'Backend Engineer - Node.js & AWS',
    company: verifiedCompanies[1], // Amazon
    location: 'Seattle, WA',
    remotePolicy: 'hybrid',
    type: 'full-time',
    experienceLevel: 'mid',

    description: 'Build scalable backend services for millions of users using Node.js, AWS, and microservices architecture.',
    responsibilities: [
      'Design and implement RESTful APIs',
      'Build microservices with Node.js and TypeScript',
      'Deploy and maintain AWS infrastructure',
      'Optimize database queries and system performance'
    ],
    requirements: [
      '3+ years backend development experience',
      'Strong Node.js and TypeScript skills',
      'Experience with AWS (Lambda, EC2, RDS, S3)',
      'Database design (PostgreSQL, MongoDB, or DynamoDB)'
    ],
    niceToHave: [
      'Docker and Kubernetes experience',
      'CI/CD pipeline setup',
      'Event-driven architecture',
      'Message queues (SQS, RabbitMQ, Kafka)'
    ],

    skills: {
      required: ['Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'REST APIs', 'Docker'],
      preferred: ['Kubernetes', 'Microservices', 'GraphQL', 'Redis']
    },

    salary: {
      min: 120000,
      max: 170000,
      currency: 'USD',
      period: 'yearly',
      verified: true,
      source: 'glassdoor',
      lastVerifiedAt: '2026-10-14T00:00:00Z'
    },

    applyUrl: 'https://amazon.jobs/en/jobs/backend-nodejs-aws',
    applicationDeadline: '2026-10-30T23:59:59Z',

    postedAt: '2026-10-08T10:00:00Z',
    scrapedAt: '2026-10-08T11:30:00Z',
    lastVerifiedAt: '2026-10-16T07:00:00Z',
    expiresAt: '2026-10-30T23:59:59Z',
    viewCount: 1923,
    applicationCount: 156,

    qualityScore: 92,
    qualityFactors: {
      hasVerifiedCompany: true,
      hasSalary: true,
      hasDetailedDescription: true,
      hasSkillsList: true,
      isRecent: false,
      hasValidUrl: true
    }
  },

  // 3. Full Stack Developer (Onsite)
  {
    id: 'job-fullstack-003',
    externalId: 'glassdoor-123456789',
    source: 'glassdoor',
    verificationStatus: 'verified',

    title: 'Full Stack Developer - React & .NET',
    company: verifiedCompanies[2], // Microsoft
    location: 'Redmond, WA',
    remotePolicy: 'onsite',
    type: 'full-time',
    experienceLevel: 'mid',

    description: 'Join our team building enterprise applications with React frontend and .NET backend.',
    responsibilities: [
      'Develop full-stack features from UI to database',
      'Work with React, TypeScript, C#, and .NET Core',
      'Collaborate with product managers and designers',
      'Write automated tests and maintain CI/CD pipelines'
    ],
    requirements: [
      '3+ years full-stack development experience',
      'Proficiency in React and TypeScript',
      'Strong C# and .NET Core skills',
      'SQL Server or PostgreSQL experience'
    ],
    niceToHave: [
      'Azure cloud experience',
      'SignalR or WebSockets',
      'Entity Framework Core',
      'Microservices architecture'
    ],

    skills: {
      required: ['React', 'TypeScript', 'C#', '.NET Core', 'SQL Server', 'Azure'],
      preferred: ['SignalR', 'Entity Framework', 'Docker', 'Azure DevOps']
    },

    salary: {
      min: 110000,
      max: 160000,
      currency: 'USD',
      period: 'yearly',
      verified: true,
      source: 'levels.fyi',
      lastVerifiedAt: '2026-10-13T00:00:00Z'
    },

    applyUrl: 'https://careers.microsoft.com/fullstack-react-dotnet',

    postedAt: '2026-10-05T09:00:00Z',
    scrapedAt: '2026-10-05T10:00:00Z',
    lastVerifiedAt: '2026-10-16T05:00:00Z',
    viewCount: 1542,
    applicationCount: 98,

    qualityScore: 90,
    qualityFactors: {
      hasVerifiedCompany: true,
      hasSalary: true,
      hasDetailedDescription: true,
      hasSkillsList: true,
      isRecent: false,
      hasValidUrl: true
    }
  }
];

// ============================================================================
// Market Intelligence Data
// ============================================================================

export const skillDemandData: SkillDemand[] = [
  {
    skill: 'React',
    category: 'technical',
    jobCount: 15847,
    growthRate: 12.5,
    trend: 'rising',
    salaryPremium: 8.2,
    averageSalaryWithSkill: 125000,
    topRoles: ['Frontend Developer', 'Full Stack Developer', 'React Developer'],
    topCompanies: ['Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix'],
    topLocations: ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX'],
    relatedSkills: ['TypeScript', 'JavaScript', 'Next.js', 'Redux', 'GraphQL'],
    historicalData: [
      { date: '2026-07-01', jobCount: 14100, avgSalary: 122000 },
      { date: '2026-08-01', jobCount: 14800, avgSalary: 123500 },
      { date: '2026-09-01', jobCount: 15200, avgSalary: 124200 },
      { date: '2026-10-01', jobCount: 15847, avgSalary: 125000 }
    ],
    lastUpdatedAt: '2026-10-16T00:00:00Z'
  },

  {
    skill: 'TypeScript',
    category: 'technical',
    jobCount: 18923,
    growthRate: 18.3,
    trend: 'rising',
    salaryPremium: 10.5,
    averageSalaryWithSkill: 130000,
    topRoles: ['Full Stack Developer', 'Frontend Developer', 'Backend Developer'],
    topCompanies: ['Google', 'Amazon', 'Microsoft', 'Airbnb', 'Stripe'],
    topLocations: ['San Francisco, CA', 'Seattle, WA', 'New York, NY', 'Boston, MA'],
    relatedSkills: ['JavaScript', 'React', 'Node.js', 'Angular', 'Vue.js'],
    historicalData: [
      { date: '2026-07-01', jobCount: 16000, avgSalary: 126000 },
      { date: '2026-08-01', jobCount: 17200, avgSalary: 127500 },
      { date: '2026-09-01', jobCount: 18000, avgSalary: 128800 },
      { date: '2026-10-01', jobCount: 18923, avgSalary: 130000 }
    ],
    lastUpdatedAt: '2026-10-16T00:00:00Z'
  },

  {
    skill: 'Node.js',
    category: 'technical',
    jobCount: 12456,
    growthRate: 9.8,
    trend: 'stable',
    salaryPremium: 7.5,
    averageSalaryWithSkill: 128000,
    topRoles: ['Backend Developer', 'Full Stack Developer', 'DevOps Engineer'],
    topCompanies: ['Amazon', 'Netflix', 'Uber', 'LinkedIn', 'PayPal'],
    topLocations: ['Seattle, WA', 'San Francisco, CA', 'New York, NY', 'Austin, TX'],
    relatedSkills: ['TypeScript', 'Express', 'MongoDB', 'PostgreSQL', 'AWS'],
    historicalData: [
      { date: '2026-07-01', jobCount: 11340, avgSalary: 126000 },
      { date: '2026-08-01', jobCount: 11800, avgSalary: 126800 },
      { date: '2026-09-01', jobCount: 12100, avgSalary: 127400 },
      { date: '2026-10-01', jobCount: 12456, avgSalary: 128000 }
    ],
    lastUpdatedAt: '2026-10-16T00:00:00Z'
  }
];

export const roleMarketData: RoleMarketData[] = [
  {
    role: 'Frontend Developer',
    totalJobs: 8942,
    newJobsThisWeek: 234,
    growthRate: 11.2,

    salaryRange: {
      p10: 75000,
      p25: 95000,
      p50: 120000,
      p75: 155000,
      p90: 185000,
      currency: 'USD'
    },

    topLocations: [
      { location: 'San Francisco, CA', jobCount: 1847, avgSalary: 145000 },
      { location: 'New York, NY', jobCount: 1234, avgSalary: 135000 },
      { location: 'Seattle, WA', jobCount: 892, avgSalary: 130000 },
      { location: 'Austin, TX', jobCount: 645, avgSalary: 115000 },
      { location: 'Remote (US)', jobCount: 2198, avgSalary: 125000 }
    ],

    topSkills: [
      { skill: 'React', percentage: 78, avgSalary: 128000 },
      { skill: 'TypeScript', percentage: 72, avgSalary: 132000 },
      { skill: 'JavaScript', percentage: 95, avgSalary: 120000 },
      { skill: 'CSS', percentage: 88, avgSalary: 118000 },
      { skill: 'Next.js', percentage: 42, avgSalary: 138000 }
    ],

    topCompanies: [
      { company: 'Google', jobCount: 145, avgSalary: 165000 },
      { company: 'Meta', jobCount: 128, avgSalary: 170000 },
      { company: 'Amazon', jobCount: 234, avgSalary: 150000 },
      { company: 'Microsoft', jobCount: 189, avgSalary: 155000 },
      { company: 'Netflix', jobCount: 67, avgSalary: 180000 }
    ],

    experienceLevels: [
      { level: 'entry', percentage: 15, avgSalary: 85000 },
      { level: 'junior', percentage: 20, avgSalary: 100000 },
      { level: 'mid', percentage: 35, avgSalary: 125000 },
      { level: 'senior', percentage: 25, avgSalary: 160000 },
      { level: 'lead', percentage: 5, avgSalary: 190000 }
    ],

    remotePolicyDistribution: [
      { policy: 'remote', percentage: 45 },
      { policy: 'hybrid', percentage: 35 },
      { policy: 'onsite', percentage: 18 },
      { policy: 'flexible', percentage: 2 }
    ],

    dataPoints: 8942,
    lastUpdatedAt: '2026-10-16T00:00:00Z',
    confidenceScore: 92
  }
];

export const marketTrends: MarketTrend[] = [
  {
    id: 'trend-ai-integration',
    type: 'technology',
    name: 'AI Integration in Development Tools',
    trend: 'rising',
    trendStrength: 95,
    changePercentage: 45.8,

    description: 'AI-powered development tools (Copilot, Cursor, etc.) are becoming standard practice.',
    drivers: [
      'GitHub Copilot adoption',
      'Cursor and AI-first IDEs gaining market share',
      'AI code review and testing tools',
      'Demand for AI prompt engineering skills'
    ],
    predictions: [
      'AI coding assistants will be required skills by 2027',
      'Traditional coding bootcamps adding AI tool training',
      'Job postings mentioning AI tools up 45% YoY'
    ],

    dataPoints: [
      { date: '2026-01-01', value: 1200, context: 'Job postings mentioning AI tools' },
      { date: '2026-04-01', value: 2400, context: 'Double from Q1' },
      { date: '2026-07-01', value: 3850, context: 'Mainstream adoption begins' },
      { date: '2026-10-01', value: 5240, context: 'Now in 15% of job postings' }
    ],

    startDate: '2026-01-01T00:00:00Z',
    lastUpdatedAt: '2026-10-16T00:00:00Z',
    sources: ['LinkedIn Jobs', 'Indeed', 'Stack Overflow Survey 2026']
  },

  {
    id: 'trend-typescript-dominance',
    type: 'skill',
    name: 'TypeScript Replacing JavaScript',
    trend: 'rising',
    trendStrength: 88,
    changePercentage: 22.5,

    description: 'TypeScript is becoming the default for new projects, with JavaScript declining.',
    drivers: [
      'Better tooling and IDE support',
      'Type safety reduces bugs',
      'Framework adoption (Next.js, Remix)',
      'Corporate preference for maintainability'
    ],
    predictions: [
      'TypeScript in 80% of new frontend projects by 2027',
      'Salary premium for TypeScript skills continues',
      'Pure JavaScript roles declining'
    ],

    dataPoints: [
      { date: '2026-01-01', value: 65, context: 'Percentage of frontend jobs requiring TypeScript' },
      { date: '2026-04-01', value: 70 },
      { date: '2026-07-01', value: 74 },
      { date: '2026-10-01', value: 78 }
    ],

    startDate: '2025-01-01T00:00:00Z',
    lastUpdatedAt: '2026-10-16T00:00:00Z',
    sources: ['Stack Overflow', 'npm trends', 'GitHub data']
  }
];

export const salaryData: SalaryDataPoint[] = [
  {
    id: 'salary-001',
    role: 'Frontend Developer',
    experienceLevel: 'mid',
    location: 'San Francisco, CA',
    salary: 145000,
    currency: 'USD',
    period: 'yearly',
    company: 'Google',
    companySize: '1000+',
    industry: 'Technology',
    skills: ['React', 'TypeScript', 'Next.js', 'GraphQL'],
    verified: true,
    source: 'levels.fyi',
    reportedAt: '2026-10-10T00:00:00Z',
    createdAt: '2026-10-10T12:00:00Z'
  },
  {
    id: 'salary-002',
    role: 'Backend Developer',
    experienceLevel: 'senior',
    location: 'Seattle, WA',
    salary: 175000,
    currency: 'USD',
    period: 'yearly',
    company: 'Amazon',
    companySize: '1000+',
    industry: 'Technology',
    skills: ['Node.js', 'AWS', 'PostgreSQL', 'Docker'],
    verified: true,
    source: 'glassdoor',
    reportedAt: '2026-10-08T00:00:00Z',
    createdAt: '2026-10-08T14:00:00Z'
  }
];

// Helper functions
export function getJobById(id: string): JobPosting | undefined {
  return jobPostings.find(j => j.id === id);
}

export function getJobsByLocation(location: string): JobPosting[] {
  return jobPostings.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
}

export function getJobsByRemotePolicy(policy: string): JobPosting[] {
  return jobPostings.filter(j => j.remotePolicy === policy);
}

export function getJobsByExperienceLevel(level: string): JobPosting[] {
  return jobPostings.filter(j => j.experienceLevel === level);
}

export function getVerifiedJobs(): JobPosting[] {
  return jobPostings.filter(j => j.verificationStatus === 'verified');
}

export function getSkillDemandBySkill(skill: string): SkillDemand | undefined {
  return skillDemandData.find(s => s.skill.toLowerCase() === skill.toLowerCase());
}

export function getRoleMarketDataByRole(role: string): RoleMarketData | undefined {
  return roleMarketData.find(r => r.role.toLowerCase() === role.toLowerCase());
}

export function getTrendingSkills(): SkillDemand[] {
  return skillDemandData.filter(s => s.trend === 'rising').sort((a, b) => b.growthRate - a.growthRate);
}
