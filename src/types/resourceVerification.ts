// ============================================================================
// Resource Verification Types
// Phase 4: Real Learning Resources - Verification System
// ============================================================================

export type VerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_REVIEW'
  | 'BROKEN'
  | 'ARCHIVED';

export type VerificationSource =
  | 'MANUAL'
  | 'AUTO_VERIFIED'
  | 'SEED_RESOURCE'
  | 'AI_SUGGESTED'
  | 'EXTERNAL_PROVIDER';

export type HealthStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNREACHABLE'
  | 'UNKNOWN';

export type ResourceSource =
  | 'SEED_DATA'
  | 'AI_GENERATED'
  | 'USER_ADDED'
  | 'PROVIDER_API'
  | 'CURATED';

export interface VerificationMetadata {
  verificationStatus: VerificationStatus;
  verificationSource: VerificationSource;
  lastVerifiedAt: string | null;
  lastCheckedAt: string | null;
  healthStatus: HealthStatus;
  failureCount: number;
  failureReason: string | null;
  httpStatus: number | null;
  finalUrl: string | null; // After redirects
  redirectCount: number;
}

export interface QualityFactors {
  urlVerified: boolean;
  officialProvider: boolean;
  recentVerification: boolean;
  completeMetadata: boolean;
  accessibilityConfirmed: boolean;
}

export interface QualityScore {
  score: number; // 0-100
  factors: QualityFactors;
  calculation: string; // Transparent explanation
}

export interface LearningResource {
  id: string;
  title: string;
  titleAr?: string;
  provider: string;
  url: string;
  canonicalUrl: string; // Normalized URL for deduplication
  resourceType: 'video' | 'course' | 'documentation' | 'tutorial' | 'interactive' | 'book' | 'article';
  skill: string[];
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  language: 'Arabic' | 'English' | 'Both';
  cost: 'Free' | 'Paid' | 'Free with Paid Cert';
  duration: string | null;
  instructor: string | null;
  description: string | null;
  descriptionAr: string | null;
  source: ResourceSource;

  // Verification fields
  verification: VerificationMetadata;
  qualityScore: QualityScore | null;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface UrlHealthCheckResult {
  healthy: boolean;
  httpStatus: number | null;
  finalUrl: string | null;
  redirectCount: number;
  responseTime: number | null;
  error: string | null;
  checkedAt: string;
}

export interface ProviderValidationResult {
  valid: boolean;
  provider: string;
  domainMatch: boolean;
  urlPatternMatch: boolean;
  knownProvider: boolean;
  error: string | null;
}

export interface ResourceVerificationResult {
  resource: LearningResource;
  urlHealth: UrlHealthCheckResult;
  providerValidation: ProviderValidationResult;
  qualityScore: QualityScore;
  verificationStatus: VerificationStatus;
  recommendations: string[];
}
