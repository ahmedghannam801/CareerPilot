// ============================================================================
// Job Intelligence Types
// Phase 7: Real Job Data + Market Intelligence + Skill Demand Analysis
// ============================================================================

export type JobSource = 'linkedin' | 'indeed' | 'glassdoor' | 'remote-ok' | 'weworkremotely' | 'stackoverflow' | 'github-jobs' | 'company-direct' | 'manual';
export type JobVerificationStatus = 'verified' | 'pending' | 'suspicious' | 'expired' | 'removed';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | 'temporary';
export type RemotePolicy = 'remote' | 'hybrid' | 'onsite' | 'flexible';
export type SalaryPeriod = 'hourly' | 'monthly' | 'yearly';
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

// ============================================================================
// Job Data & Verification
// ============================================================================

export interface JobSalaryRange {
  min: number;
  max: number;
  currency: string;
  period: SalaryPeriod;
  verified: boolean;
  source: string;
  lastVerifiedAt: string | null;
}

export interface JobCompany {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  size?: string; // "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
  industry?: string;
  founded?: number;
  location?: string;
  description?: string;
  glassdoorRating?: number; // 0-5
  verified: boolean;
}

export interface JobPosting {
  id: string;
  externalId: string; // ID from source platform
  source: JobSource;
  verificationStatus: JobVerificationStatus;

  // Basic info
  title: string;
  company: JobCompany;
  location: string;
  remotePolicy: RemotePolicy;
  type: JobType;
  experienceLevel: ExperienceLevel;

  // Description
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];

  // Skills & Technologies
  skills: {
    required: string[];
    preferred: string[];
  };

  // Compensation
  salary?: JobSalaryRange;
  benefits?: string[];

  // Application
  applyUrl: string;
  applicationDeadline?: string;

  // Metadata
  postedAt: string;
  scrapedAt: string;
  lastVerifiedAt: string | null;
  expiresAt?: string;
  viewCount: number;
  applicationCount?: number;

  // Quality indicators
  qualityScore: number; // 0-100
  qualityFactors: {
    hasVerifiedCompany: boolean;
    hasSalary: boolean;
    hasDetailedDescription: boolean;
    hasSkillsList: boolean;
    isRecent: boolean; // posted < 7 days
    hasValidUrl: boolean;
  };
}

export interface JobVerification {
  jobId: string;
  status: JobVerificationStatus;
  verifiedAt: string;
  verifiedBy: 'system' | 'manual' | 'api';

  checks: {
    urlReachable: boolean;
    companyExists: boolean;
    dataConsistent: boolean;
    noDuplicates: boolean;
    notExpired: boolean;
  };

  issues?: string[];
  lastCheckAt: string;
  nextCheckAt: string;
}

// ============================================================================
// Market Intelligence
// ============================================================================

export interface SkillDemand {
  skill: string;
  category: 'technical' | 'soft' | 'domain' | 'tool';

  // Demand metrics
  jobCount: number; // jobs requiring this skill
  growthRate: number; // percentage change vs last period
  trend: 'rising' | 'stable' | 'declining';

  // Salary impact
  salaryPremium: number; // percentage increase vs average
  averageSalaryWithSkill: number;

  // Related data
  topRoles: string[];
  topCompanies: string[];
  topLocations: string[];
  relatedSkills: string[];

  // Time series
  historicalData: {
    date: string;
    jobCount: number;
    avgSalary: number;
  }[];

  // Metadata
  lastUpdatedAt: string;
}

export interface RoleMarketData {
  role: string;

  // Job market
  totalJobs: number;
  newJobsThisWeek: number;
  growthRate: number; // percentage

  // Salary
  salaryRange: {
    p10: number; // 10th percentile
    p25: number;
    p50: number; // median
    p75: number;
    p90: number;
    currency: string;
  };

  // Geographic distribution
  topLocations: {
    location: string;
    jobCount: number;
    avgSalary: number;
  }[];

  // Skills in demand
  topSkills: {
    skill: string;
    percentage: number; // % of jobs requiring this skill
    avgSalary: number;
  }[];

  // Companies hiring
  topCompanies: {
    company: string;
    jobCount: number;
    avgSalary: number;
  }[];

  // Experience level distribution
  experienceLevels: {
    level: ExperienceLevel;
    percentage: number;
    avgSalary: number;
  }[];

  // Remote vs onsite
  remotePolicyDistribution: {
    policy: RemotePolicy;
    percentage: number;
  }[];

  // Metadata
  dataPoints: number;
  lastUpdatedAt: string;
  confidenceScore: number; // 0-100
}

export interface MarketTrend {
  id: string;
  type: 'skill' | 'role' | 'technology' | 'industry';
  name: string;

  // Trend data
  trend: 'rising' | 'stable' | 'declining';
  trendStrength: number; // 0-100
  changePercentage: number;

  // Context
  description: string;
  drivers: string[]; // what's driving this trend
  predictions: string[];

  // Time series
  dataPoints: {
    date: string;
    value: number;
    context?: string;
  }[];

  // Metadata
  startDate: string;
  lastUpdatedAt: string;
  sources: string[];
}

// ============================================================================
// Job Recommendations & Alerts
// ============================================================================

export interface JobRecommendation {
  job: JobPosting;
  matchScore: number; // 0-100

  matchFactors: {
    skillsMatch: number; // 0-100
    experienceMatch: number;
    locationMatch: number;
    salaryMatch: number;
    companyMatch: number;
    roleMatch: number;
  };

  whyRecommended: string[];
  missingSkills: string[];

  // Opportunity score
  opportunityScore: number; // 0-100
  opportunityFactors: {
    skillGapSize: 'small' | 'medium' | 'large';
    salaryPotential: 'low' | 'medium' | 'high';
    careerGrowth: 'low' | 'medium' | 'high';
    companyReputation: 'low' | 'medium' | 'high';
  };

  recommendedAt: string;
}

export interface JobAlert {
  id: string;
  userId: string;
  name: string;

  // Alert criteria
  criteria: {
    keywords?: string[];
    roles?: string[];
    skills?: string[];
    locations?: string[];
    remotePolicy?: RemotePolicy[];
    experienceLevel?: ExperienceLevel[];
    minSalary?: number;
    maxSalary?: number;
    companies?: string[];
  };

  // Notification settings
  frequency: 'instant' | 'daily' | 'weekly';
  enabled: boolean;

  // Stats
  matchedJobs: number;
  lastNotificationAt: string | null;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface JobAlertNotification {
  id: string;
  alertId: string;
  userId: string;

  // Matched jobs
  jobs: JobPosting[];
  newJobsCount: number;

  // Summary
  summary: string;
  highlights: string[];

  // Status
  sent: boolean;
  sentAt: string | null;
  viewed: boolean;
  viewedAt: string | null;

  createdAt: string;
}

// ============================================================================
// Salary Intelligence
// ============================================================================

export interface SalaryDataPoint {
  id: string;
  role: string;
  experienceLevel: ExperienceLevel;
  location: string;

  salary: number;
  currency: string;
  period: SalaryPeriod;

  // Context
  company?: string;
  companySize?: string;
  industry?: string;
  skills: string[];

  // Verification
  verified: boolean;
  source: string;
  reportedAt: string;

  // Metadata
  createdAt: string;
}

export interface SalaryEstimate {
  role: string;
  experienceLevel: ExperienceLevel;
  location: string;
  skills: string[];

  // Estimate
  estimated: {
    low: number;
    mid: number;
    high: number;
    currency: string;
    period: SalaryPeriod;
  };

  // Confidence
  confidenceScore: number; // 0-100
  dataPoints: number;

  // Breakdown
  factors: {
    baseForRole: number;
    experienceAdjustment: number;
    locationAdjustment: number;
    skillsPremium: number;
  };

  // Comparison
  percentile: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };

  marketContext: string;

  // Metadata
  calculatedAt: string;
  sources: string[];
}

// ============================================================================
// Search & Filtering
// ============================================================================

export interface JobSearchFilter {
  keywords?: string[];
  roles?: string[];
  skills?: string[];
  locations?: string[];
  remotePolicy?: RemotePolicy | RemotePolicy[];
  experienceLevel?: ExperienceLevel | ExperienceLevel[];
  jobType?: JobType | JobType[];
  minSalary?: number;
  maxSalary?: number;
  companies?: string[];
  postedSince?: string; // ISO date
  verifiedOnly?: boolean;
  hasRemote?: boolean;
  hasSalary?: boolean;
}

export interface JobSearchResult {
  jobs: JobPosting[];
  total: number;
  filters: JobSearchFilter;

  // Aggregations
  aggregations: {
    locations: { location: string; count: number }[];
    companies: { company: string; count: number }[];
    skills: { skill: string; count: number }[];
    experienceLevels: { level: ExperienceLevel; count: number }[];
    remotePolicies: { policy: RemotePolicy; count: number }[];
    salaryRanges: { range: string; count: number }[];
  };

  // Metadata
  searchedAt: string;
  duration: number; // ms
}
