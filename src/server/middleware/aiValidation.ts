/**
 * AI Output Validation
 * Schema validation for all AI-generated responses
 */

// ─── CV Generation Schema ──────────────────────────────────────────────────

export interface CVGenerationOutput {
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  certifications?: string[];
}

export function validateCVOutput(data: any): CVGenerationOutput {
  const result: CVGenerationOutput = {};

  if (data.summary && typeof data.summary === 'string') {
    result.summary = data.summary.slice(0, 2000);
  }

  if (Array.isArray(data.skills)) {
    result.skills = data.skills
      .filter((s: any) => typeof s === 'string')
      .map((s: any) => s.slice(0, 100))
      .slice(0, 100);
  }

  if (Array.isArray(data.experience)) {
    result.experience = data.experience
      .filter((e: any) => e && typeof e === 'object' && e.title && e.company)
      .map((e: any) => ({
        title: String(e.title).slice(0, 200),
        company: String(e.company).slice(0, 200),
        startDate: String(e.startDate || '').slice(0, 20),
        endDate: e.endDate ? String(e.endDate).slice(0, 20) : undefined,
        achievements: Array.isArray(e.achievements)
          ? e.achievements.filter((a: any) => typeof a === 'string').map((a: any) => a.slice(0, 500)).slice(0, 20)
          : undefined,
      }))
      .slice(0, 50);
  }

  if (Array.isArray(data.education)) {
    result.education = data.education
      .filter((e: any) => e && typeof e === 'object' && e.degree && e.institution)
      .map((e: any) => ({
        degree: String(e.degree).slice(0, 200),
        institution: String(e.institution).slice(0, 200),
        year: String(e.year || '').slice(0, 20),
      }))
      .slice(0, 20);
  }

  if (Array.isArray(data.certifications)) {
    result.certifications = data.certifications
      .filter((c: any) => typeof c === 'string')
      .map((c: any) => c.slice(0, 200))
      .slice(0, 50);
  }

  return result;
}

// ─── Projects Generation Schema ────────────────────────────────────────────

export interface ProjectOutput {
  title: string;
  description: string;
  skills: string[];
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours?: number;
  learningOutcomes?: string[];
}

export function validateProjectOutput(data: any): ProjectOutput | null {
  if (!data || typeof data !== 'object') return null;
  if (!data.title || typeof data.title !== 'string') return null;
  if (!data.description || typeof data.description !== 'string') return null;

  return {
    title: data.title.slice(0, 200),
    description: data.description.slice(0, 5000),
    skills: Array.isArray(data.skills)
      ? data.skills.filter((s: any) => typeof s === 'string').map((s: any) => s.slice(0, 100)).slice(0, 20)
      : [],
    complexity: ['beginner', 'intermediate', 'advanced'].includes(data.complexity)
      ? data.complexity
      : undefined,
    estimatedHours: typeof data.estimatedHours === 'number' && data.estimatedHours > 0 && data.estimatedHours < 1000
      ? data.estimatedHours
      : undefined,
    learningOutcomes: Array.isArray(data.learningOutcomes)
      ? data.learningOutcomes.filter((l: any) => typeof l === 'string').map((l: any) => l.slice(0, 500)).slice(0, 10)
      : undefined,
  };
}

// ─── Roadmap Generation Schema ─────────────────────────────────────────────

export interface RoadmapOutput {
  title: string;
  description?: string;
  phases: Array<{
    title: string;
    duration?: string;
    topics?: string[];
    projects?: string[];
  }>;
}

export function validateRoadmapOutput(data: any): RoadmapOutput | null {
  if (!data || typeof data !== 'object') return null;
  if (!data.title || typeof data.title !== 'string') return null;
  if (!Array.isArray(data.phases) || data.phases.length === 0) return null;

  const validPhases = data.phases
    .filter((p: any) => p && typeof p === 'object' && p.title && typeof p.title === 'string')
    .map((p: any) => ({
      title: p.title.slice(0, 200),
      duration: p.duration && typeof p.duration === 'string' ? p.duration.slice(0, 50) : undefined,
      topics: Array.isArray(p.topics)
        ? p.topics.filter((t: any) => typeof t === 'string').map((t: any) => t.slice(0, 200)).slice(0, 30)
        : undefined,
      projects: Array.isArray(p.projects)
        ? p.projects.filter((pr: any) => typeof pr === 'string').map((pr: any) => pr.slice(0, 200)).slice(0, 10)
        : undefined,
    }))
    .slice(0, 20);

  if (validPhases.length === 0) return null;

  return {
    title: data.title.slice(0, 200),
    description: data.description && typeof data.description === 'string'
      ? data.description.slice(0, 2000)
      : undefined,
    phases: validPhases,
  };
}

// ─── Interview Result Schema ───────────────────────────────────────────────

export interface InterviewResultOutput {
  feedback: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
  nextQuestion?: string;
}

export function validateInterviewResult(data: any): InterviewResultOutput | null {
  if (!data || typeof data !== 'object') return null;
  if (!data.feedback || typeof data.feedback !== 'string') return null;

  return {
    feedback: data.feedback.slice(0, 5000),
    score: typeof data.score === 'number' && data.score >= 0 && data.score <= 100
      ? data.score
      : undefined,
    strengths: Array.isArray(data.strengths)
      ? data.strengths.filter((s: any) => typeof s === 'string').map((s: any) => s.slice(0, 500)).slice(0, 10)
      : undefined,
    improvements: Array.isArray(data.improvements)
      ? data.improvements.filter((i: any) => typeof i === 'string').map((i: any) => i.slice(0, 500)).slice(0, 10)
      : undefined,
    nextQuestion: data.nextQuestion && typeof data.nextQuestion === 'string'
      ? data.nextQuestion.slice(0, 1000)
      : undefined,
  };
}

// ─── AI Assistant Response Schema ──────────────────────────────────────────

export interface AIAssistantOutput {
  message: string;
  suggestedActions?: Array<{ label: string; action: string }>;
  relatedResources?: Array<{ title: string; url?: string }>;
}

export function validateAIAssistantOutput(data: any): AIAssistantOutput | null {
  if (!data || typeof data !== 'object') return null;
  if (!data.message || typeof data.message !== 'string') return null;

  return {
    message: data.message.slice(0, 10000),
    suggestedActions: Array.isArray(data.suggestedActions)
      ? data.suggestedActions
          .filter((a: any) => a && typeof a === 'object' && a.label && a.action)
          .map((a: any) => ({
            label: String(a.label).slice(0, 100),
            action: String(a.action).slice(0, 200),
          }))
          .slice(0, 5)
      : undefined,
    relatedResources: Array.isArray(data.relatedResources)
      ? data.relatedResources
          .filter((r: any) => r && typeof r === 'object' && r.title)
          .map((r: any) => ({
            title: String(r.title).slice(0, 200),
            url: r.url && typeof r.url === 'string' ? r.url.slice(0, 2048) : undefined,
          }))
          .slice(0, 10)
      : undefined,
  };
}

// ─── Career DNA Schema ─────────────────────────────────────────────────────

export interface CareerDNAOutput {
  primaryDirection?: string;
  strengths?: string[];
  growthAreas?: string[];
  careerStage?: string;
}

export function validateCareerDNA(data: any): CareerDNAOutput {
  const result: CareerDNAOutput = {};

  if (data.primaryDirection && typeof data.primaryDirection === 'string') {
    result.primaryDirection = data.primaryDirection.slice(0, 200);
  }

  if (Array.isArray(data.strengths)) {
    result.strengths = data.strengths
      .filter((s: any) => typeof s === 'string')
      .map((s: any) => s.slice(0, 200))
      .slice(0, 20);
  }

  if (Array.isArray(data.growthAreas)) {
    result.growthAreas = data.growthAreas
      .filter((g: any) => typeof g === 'string')
      .map((g: any) => g.slice(0, 200))
      .slice(0, 20);
  }

  if (data.careerStage && typeof data.careerStage === 'string') {
    result.careerStage = data.careerStage.slice(0, 100);
  }

  return result;
}

// ─── Safe Wrapper ──────────────────────────────────────────────────────────

export function safeParseAIOutput<T>(
  rawOutput: any,
  validator: (data: any) => T | null,
  fallback: T
): T {
  try {
    // Handle string responses that might be JSON
    let parsed = rawOutput;
    if (typeof rawOutput === 'string') {
      try {
        parsed = JSON.parse(rawOutput);
      } catch {
        // Not JSON, use as-is
      }
    }

    const validated = validator(parsed);
    return validated === null ? fallback : validated;
  } catch (error) {
    console.warn('[AI Validation] Failed to validate AI output:', error);
    return fallback;
  }
}
