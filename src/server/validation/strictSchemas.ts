import { z } from 'zod';

/**
 * CareerPilot AI — STRICT Validation Schemas
 *
 * CRITICAL: These schemas do NOT use .catch() fallbacks.
 * Invalid AI responses will FAIL FAST rather than being replaced with fabricated data.
 *
 * All validation errors are logged and propagated to the user.
 */

const strictString = (minLen = 1, fieldName = 'field') =>
  z.string().min(minLen, `${fieldName} is required and cannot be empty`);

const strictOptionalString = () => z.string().optional();

// ============================================================================
// ATS Analysis - STRICT
// ============================================================================

export const StrictATSAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  structureScore: z.number().min(0).max(100).optional(),
  contentScore: z.number().min(0).max(100).optional(),
  actionVerbsScore: z.number().min(0).max(100).optional(),
  metricsScore: z.number().min(0).max(100).optional(),
  skillsScore: z.number().min(0).max(100).optional(),
  strengths: z.array(z.string().min(5)).min(1, 'At least one strength is required'),
  weaknesses: z.array(z.string().min(5)).min(1, 'At least one weakness is required'),
  recommendations: z.array(z.string().min(10)).min(1, 'At least one recommendation is required'),
  missingKeywords: z.array(z.string()),
  formattingScore: z.number().min(0).max(100),
  relevanceScore: z.number().min(0).max(100),
  impactScore: z.number().min(0).max(100),
});

// ============================================================================
// Tailored CV - STRICT
// ============================================================================

export const StrictTailoredCVSchema = z.object({
  targetRole: z.string().min(1, 'Target role cannot be empty'),
  summary: z.string().min(30, 'Tailored summary must be at least 30 characters'),
  highlightedSkills: z.array(z.string().min(1)).min(1, 'Must highlight at least one skill from job requirements'),
  optimizedBulletPoints: z.array(
    z.object({
      roleTitle: z.string().min(1, 'Role title is required'),
      company: z.string().min(1, 'Company name is required'),
      bullets: z.array(z.string().min(10)).min(1, 'Each experience must have at least one achievement bullet'),
    })
  ).min(0), // Allow empty for entry-level
  atsKeywordMatches: z.array(z.string().min(1)),
  missingKeywords: z.array(z.string()),
  atsScore: z.number().min(0).max(100),
});

// ============================================================================
// Career DNA - STRICT
// ============================================================================

export const StrictCareerDNASchema = z.object({
  currentLevel: z.string().min(1, 'Current career level is required'),
  primaryDirection: z.string().min(1, 'Primary career direction is required'),
  secondaryDirections: z.array(z.string()).default([]),
  strengths: z.array(z.string().min(1)).min(1, 'At least one strength is required'),
  weaknesses: z.array(z.string().min(1)).min(1, 'At least one weakness is required'),
  keyCompetencies: z.array(z.string().min(1)).default([]),
  workPreferences: z.object({
    workModel: z.enum(['Remote', 'Hybrid', 'On-site', 'Flexible']),
    teamStyle: z.enum(['Collaborative', 'Independent', 'Mixed']),
    pace: z.enum(['High-growth', 'Balanced', 'Structured']),
  }),
  summary: z.string().min(20, 'Career DNA summary must be at least 20 characters'),
});

// ============================================================================
// Next Best Action - STRICT
// ============================================================================

export const StrictNextBestActionSchema = z.object({
  id: z.string().min(1, 'Action ID is required'),
  title: z.string().min(5, 'Action title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  evidenceNeeded: z.string().min(5, 'Evidence requirement must be at least 5 characters'),
  expectedImpact: z.string().min(5, 'Expected impact must be at least 5 characters'),
  estimatedEffort: z.string().min(3, 'Estimated effort must be at least 3 characters'),
  actionType: z.enum([
    'build_project',
    'tailor_cv',
    'apply',
    'practice_interview',
    'learn_skill',
    'review_email',
  ]),
});

// ============================================================================
// Cover Letter - STRICT
// ============================================================================

export const StrictCoverLetterSchema = z.object({
  recipient: z.string().min(1, 'Recipient is required'),
  company: z.string().min(1, 'Company name is required'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  body: z.string().min(50, 'Cover letter body must be at least 50 characters'),
  keyHighlights: z.array(z.string().min(1)).min(1, 'At least one key highlight is required'),
});

// ============================================================================
// Job Description Parser - STRICT
// ============================================================================

export const StrictJobDescriptionSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().default('Remote'),
  workModel: z.enum(['Remote', 'Hybrid', 'On-site']).default('Remote'),
  employmentType: z.enum(['Full-time', 'Contract', 'Internship', 'Part-time']).default('Full-time'),
  salary: z.string().optional(),
  description: z.string().min(20, 'Job description must be at least 20 characters'),
  requirements: z.array(z.string().min(1)).default([]),
  preferredSkills: z.array(z.string().min(1)).default([]),
});

// ============================================================================
// LinkedIn/Resume Profile Extractor - STRICT
// ============================================================================

export const StrictProfileExtractorSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  headline: z.string().min(5, 'Professional headline is required'),
  location: z.string().default(''),
  summary: z.string().min(20, 'Professional summary must be at least 20 characters'),
  experience: z.array(
    z.object({
      company: z.string().min(1, 'Company name is required'),
      role: z.string().min(1, 'Role/title is required'),
      location: z.string().default(''),
      startDate: z.string().default(''),
      endDate: z.string().optional(),
      current: z.boolean().default(false),
      responsibilities: z.array(z.string()).default([]),
      achievements: z.array(z.string()).default([]),
    })
  ).default([]),
  education: z.array(
    z.object({
      institution: z.string().min(1, 'Institution name is required'),
      degree: z.string().min(1, 'Degree is required'),
      field: z.string().min(1, 'Field of study is required'),
      startDate: z.string().default(''),
      endDate: z.string().optional(),
      current: z.boolean().default(false),
      gpa: z.string().optional(),
    })
  ).default([]),
  skills: z.array(z.string().min(1)).default([]),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

// ============================================================================
// Micro Project - STRICT
// ============================================================================

export const StrictMicroProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  title: z.string().min(5, 'Project title must be at least 5 characters'),
  targetSkill: z.string().min(1, 'Target skill is required'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  duration: z.string().min(1, 'Duration is required'),
  scenario: z.string().min(20, 'Scenario must be at least 20 characters'),
  objective: z.string().min(10, 'Objective must be at least 10 characters'),
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      completed: z.boolean(),
    })
  ).min(1, 'At least one task is required'),
});

// ============================================================================
// Project Evaluation - STRICT
// ============================================================================

export const StrictProjectEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  strengths: z.array(z.string().min(1)).min(1, 'At least one strength is required'),
  improvements: z.array(z.string().min(1)).min(1, 'At least one improvement is required'),
  evidenceGenerated: z.boolean(),
});

// ============================================================================
// Interview Feedback - STRICT
// ============================================================================

export const StrictInterviewFeedbackSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string().min(1)).min(1, 'At least one strength is required'),
  improvements: z.array(z.string().min(1)).min(1, 'At least one improvement is required'),
  suggestedRefinement: z.string().min(10, 'Suggested refinement must be at least 10 characters'),
});

// ============================================================================
// Career Discovery - STRICT
// ============================================================================

export const StrictCareerDiscoverySchema = z.object({
  recommendedRoles: z.array(
    z.object({
      role: z.string().min(1, 'Role name is required'),
      matchScore: z.number().min(0).max(100),
      reasons: z.array(z.string().min(1)).min(1, 'At least one reason is required'),
      strengths: z.array(z.string().min(1)).default([]),
      missingSkills: z.array(z.string()).default([]),
      recommendedNextAction: z.string().min(1, 'Next action is required'),
    })
  ).min(1, 'At least one recommended role is required'),
  summary: z.string().min(20, 'Summary must be at least 20 characters'),
});

// ============================================================================
// Validation Helper - STRICT (No Fallbacks)
// ============================================================================

/**
 * Validates AI response with STRICT schema - NO FALLBACKS
 * Throws error if validation fails instead of silently using defaults
 */
export function strictValidate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  agentName: string
): T {
  try {
    return schema.parse(data);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const errorDetails = (err as z.ZodError).issues
        .map((e: any) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');

      console.error(`[STRICT_VALIDATION] ${agentName} failed:`, errorDetails);

      throw new Error(
        `AI response validation failed for ${agentName}. ` +
        `The AI returned incomplete or malformed data. ` +
        `Error: ${errorDetails}. ` +
        `This is NOT a user data issue - the AI failed to produce valid output. ` +
        `Please try again or use a different input.`
      );
    }

    // Non-Zod error - re-throw
    console.error(`[STRICT_VALIDATION] ${agentName} non-Zod error:`, err);
    throw new Error(
      `Unexpected validation error from ${agentName}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ============================================================================
// Graceful Degradation Helper
// ============================================================================

/**
 * Creates a validation result that clearly indicates AI failure
 * Use this when you want to fail but provide useful context
 */
export function createValidationFailure(
  agentName: string,
  originalError: unknown,
  userMessage = 'Unable to generate content. Please try again.'
): { valid: false; error: string; userMessage: string; needsRetry: boolean } {
  const errorDetails = originalError instanceof Error
    ? originalError.message
    : String(originalError);

  console.error(`[VALIDATION_FAILURE] ${agentName}:`, errorDetails);

  return {
    valid: false,
    error: `${agentName} validation failed: ${errorDetails}`,
    userMessage,
    needsRetry: true,
  };
}