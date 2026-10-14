import { z } from 'zod';

/**
 * CareerPilot AI — Strict Resume Data Validation Schemas
 *
 * CRITICAL RULES:
 * 1. NO .catch() fallbacks that fabricate data
 * 2. Fail fast on invalid AI responses
 * 3. Never invent employers, degrees, dates, skills, or achievements
 * 4. All fields are required unless explicitly marked optional
 */

// ============================================================================
// Core Resume Structure Validation
// ============================================================================

export const ExperienceItemSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role/title is required'),
  location: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Start date must be YYYY-MM format'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'End date must be YYYY-MM format').optional(),
  current: z.boolean(),
  responsibilities: z.array(z.string().min(1)).min(1, 'At least one responsibility is required'),
  achievements: z.array(z.string().min(1)),
});

export const EducationItemSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().min(1, 'Field of study is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Start date must be YYYY-MM format'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'End date must be YYYY-MM format').optional(),
  current: z.boolean(),
  gpa: z.string().optional(),
});

export const ResumeVersionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Resume title is required'),
  isMaster: z.boolean(),
  targetRole: z.string().optional(),
  summary: z.string().min(50, 'Professional summary must be at least 50 characters'),
  experience: z.array(ExperienceItemSchema).min(0),
  education: z.array(EducationItemSchema).min(0),
  skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
  certifications: z.array(z.string()),
  atsScore: z.number().min(0).max(100).optional(),
  opportunityId: z.string().optional(),
  companyName: z.string().optional(),
  templateVersion: z.string().optional(),
  originalFileName: z.string().optional(),
  isTailored: z.boolean().optional(),
  sourceResumeId: z.string().optional(),
  analysisDetails: z.any().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// AI Agent Response Schemas (STRICT — No fallbacks)
// ============================================================================

export const ATSAnalysisResponseSchema = z.object({
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

export const TailoredCVResponseSchema = z.object({
  targetRole: z.string().min(1, 'Target role cannot be empty'),
  summary: z.string().min(50, 'Tailored summary must be at least 50 characters'),
  highlightedSkills: z.array(z.string().min(1)).min(1, 'Must highlight at least one skill'),
  optimizedBulletPoints: z.array(
    z.object({
      roleTitle: z.string().min(1),
      company: z.string().min(1),
      bullets: z.array(z.string().min(10)).min(1, 'Each role must have at least one achievement bullet'),
    })
  ).min(1, 'Must optimize at least one experience entry'),
  atsKeywordMatches: z.array(z.string().min(1)),
  missingKeywords: z.array(z.string()),
  atsScore: z.number().min(0).max(100),
});

export const ExtractedProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  headline: z.string().min(5, 'Professional headline is required'),
  location: z.string(),
  summary: z.string().min(20, 'Professional summary must be at least 20 characters'),
  experience: z.array(
    z.object({
      company: z.string().min(1),
      role: z.string().min(1),
      location: z.string(),
      startDate: z.string().min(1),
      endDate: z.string().optional(),
      current: z.boolean(),
      responsibilities: z.array(z.string()).min(0),
      achievements: z.array(z.string()).min(0),
    })
  ).min(0),
  education: z.array(
    z.object({
      institution: z.string().min(1),
      degree: z.string().min(1),
      field: z.string().min(1),
      startDate: z.string().min(1),
      endDate: z.string().optional(),
      current: z.boolean(),
      gpa: z.string().optional(),
    })
  ).min(0),
  skills: z.array(z.string().min(1)).min(1, 'Must extract at least one skill'),
  certifications: z.array(z.string()),
  languages: z.array(z.string()).optional(),
});

// ============================================================================
// Document Generation Input Validation
// ============================================================================

export const GenerateCVRequestSchema = z.object({
  resumeId: z.string().optional(),
  templateType: z.enum(['google_doc', 'classic', 'modern']).default('google_doc'),
  targetRole: z.string().optional(),
  includePhoto: z.boolean().default(false),
});

export const TailorCVRequestSchema = z.object({
  resumeId: z.string().optional(),
  opportunityId: z.string().optional(),
  customJobDescription: z.string().optional(),
  customJobTitle: z.string().optional(),
  customCompany: z.string().optional(),
  targetRole: z.string().optional(),
}).refine(
  (data) => data.opportunityId || (data.customJobTitle && data.customJobDescription),
  {
    message: 'Must provide either opportunityId or both customJobTitle and customJobDescription',
  }
);

// ============================================================================
// Document Validation Result Schema
// ============================================================================

export const DocumentValidationResultSchema = z.object({
  isValid: z.boolean(),
  format: z.enum(['docx', 'pdf']),
  fileSizeBytes: z.number().min(100, 'File size suspiciously small'),
  canBeOpened: z.boolean(),
  hasExtractableText: z.boolean(),
  pageCount: z.number().min(1),
  detectedIssues: z.array(
    z.object({
      severity: z.enum(['error', 'warning', 'info']),
      code: z.string(),
      message: z.string(),
      location: z.string().optional(),
    })
  ),
  metadata: z.object({
    generatedAt: z.string(),
    generatorVersion: z.string(),
    templateUsed: z.string(),
  }),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

export function validateResumeForGeneration(resume: unknown): {
  valid: boolean;
  errors: string[];
  data?: z.infer<typeof ResumeVersionSchema>;
} {
  try {
    const validated = ResumeVersionSchema.parse(resume);

    // Additional business rules validation
    const errors: string[] = [];

    if (validated.experience.length === 0 && validated.education.length === 0) {
      errors.push('Resume must have at least one experience entry or education record');
    }

    if (validated.summary.length < 100) {
      errors.push('Professional summary should be at least 100 characters for optimal ATS performance');
    }

    if (validated.skills.length < 3) {
      errors.push('Resume should list at least 3 skills for better job matching');
    }

    return {
      valid: errors.length === 0,
      errors,
      data: validated,
    };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return {
        valid: false,
        errors: (err as z.ZodError).issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

export function validateAIResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  agentName: string
): { success: true; data: T } | { success: false; error: string; details: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const details = (err as z.ZodError).issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
      return {
        success: false,
        error: `${agentName} returned invalid data structure`,
        details,
      };
    }
    return {
      success: false,
      error: `${agentName} validation failed`,
      details: [String(err)],
    };
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type ValidatedResumeVersion = z.infer<typeof ResumeVersionSchema>;
export type ValidatedATSAnalysis = z.infer<typeof ATSAnalysisResponseSchema>;
export type ValidatedTailoredCV = z.infer<typeof TailoredCVResponseSchema>;
export type ValidatedExtractedProfile = z.infer<typeof ExtractedProfileSchema>;
export type DocumentValidationResult = z.infer<typeof DocumentValidationResultSchema>;
