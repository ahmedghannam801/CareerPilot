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
  JobMatchAnalysis,
  CareerDNA,
  NextBestAction,
  Course,
} from '../types/index.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const res = await fetch(finalUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  const json = await res.json();
  return json;
}

export const api = {
  // Profile
  getProfile: () => request<{ success: boolean; profile: CareerProfile }>('/api/profile'),
  updateProfile: (data: Partial<CareerProfile>) =>
    request<{ success: boolean; profile: CareerProfile }>('/api/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  regenerateDNA: () =>
    request<{ success: boolean; dna: CareerDNA; profile: CareerProfile }>('/api/profile/dna/regenerate', {
      method: 'POST',
    }),
  refreshNextBestAction: () =>
    request<{ success: boolean; nextBestAction: NextBestAction; profile: CareerProfile }>(
      '/api/profile/nba/refresh',
      { method: 'POST' }
    ),
  runDiscovery: (answers: Record<string, string>) =>
    request<{
      success: boolean;
      discovery: {
        recommendedRoles: {
          role: string;
          matchScore: number;
          reasons: string[];
          strengths: string[];
          missingSkills: string[];
          recommendedNextAction: string;
        }[];
        summary: string;
      };
    }>('/api/profile/discovery', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Resumes & ATS
  getResumes: () => request<{ success: boolean; resumes: ResumeVersion[] }>('/api/resumes'),
  saveResume: (resume: ResumeVersion) =>
    request<{ success: boolean; resume: ResumeVersion }>('/api/resumes', {
      method: 'POST',
      body: JSON.stringify(resume),
    }),
  getATSAnalysis: (resumeId: string) =>
    request<{ success: boolean; ats: ATSAnalysis }>(`/api/resumes/${resumeId}/ats`),
  analyzeResume: (resumeId: string, targetRole?: string) =>
    request<{ success: boolean; ats: ATSAnalysis }>(`/api/resumes/${resumeId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ targetRole }),
    }),
  tailorCV: (payload: {
    opportunityId?: string;
    customJobDescription?: string;
    customJobTitle?: string;
    customCompany?: string;
    resumeId?: string;
  }) =>
    request<{
      success: boolean;
      tailoredData: {
        targetRole: string;
        summary: string;
        highlightedSkills: string[];
        optimizedBulletPoints: {
          roleTitle: string;
          company: string;
          bullets: string[];
        }[];
        atsKeywordMatches: string[];
        missingKeywords?: string[];
        atsScore?: number;
      };
      tailoredResume: ResumeVersion;
      opportunity?: Opportunity;
    }>('/api/resumes/tailor', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  generateCoverLetter: (opportunityId: string) =>
    request<{
      success: boolean;
      letter: {
        recipient: string;
        company: string;
        subject: string;
        body: string;
        keyHighlights: string[];
      };
    }>('/api/resumes/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ opportunityId }),
    }),

  // Opportunities
  getOpportunities: () =>
    request<{ success: boolean; opportunities: Opportunity[] }>('/api/opportunities'),
  getPlatformsStatus: () =>
    request<{
      success: boolean;
      platforms: {
        id: string;
        name: string;
        type: string;
        status: string;
        description: string;
        lastSynced?: string;
        missingRequirement?: any;
      }[];
    }>('/api/opportunities/platforms-status'),
  syncPlatformFeeds: () =>
    request<{
      success: boolean;
      addedCount: number;
      totalCount: number;
      opportunities: Opportunity[];
    }>('/api/opportunities/sync-feeds', { method: 'POST' }),
  addOpportunity: (opp: Partial<Opportunity>) =>
    request<{ success: boolean; opportunity: Opportunity }>('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify(opp),
    }),
  deleteOpportunity: (id: string) =>
    request<{ success: boolean }>(`/api/opportunities/${id}`, { method: 'DELETE' }),
  parseJobDescription: (rawText: string) =>
    request<{
      success: boolean;
      parsed: {
        title: string;
        company: string;
        location: string;
        workModel: 'Remote' | 'Hybrid' | 'On-site';
        employmentType: 'Full-time' | 'Contract' | 'Internship' | 'Part-time';
        salary?: string;
        description: string;
        requirements: string[];
        preferredSkills: string[];
      };
    }>('/api/opportunities/parse-jd', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    }),
  calculateMatch: (opportunityId: string) =>
    request<{ success: boolean; matchAnalysis: JobMatchAnalysis }>(
      `/api/opportunities/${opportunityId}/match`,
      { method: 'POST' }
    ),

  // Applications
  getApplications: () =>
    request<{ success: boolean; applications: Application[] }>('/api/applications'),
  saveApplication: (app: Partial<Application>) =>
    request<{ success: boolean; application: Application }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(app),
    }),
  evaluateApplicationQuality: (id: string) =>
    request<{ success: boolean; quality: { score: number; feedback: string[] } }>(
      `/api/applications/${id}/evaluate-quality`,
      { method: 'POST' }
    ),

  // Micro-Projects
  getProjects: () => request<{ success: boolean; projects: MicroProject[] }>('/api/projects'),
  generateProject: (skillGap: string, targetRole?: string) =>
    request<{ success: boolean; project: MicroProject }>('/api/projects/generate', {
      method: 'POST',
      body: JSON.stringify({ skillGap, targetRole }),
    }),
  submitProject: (
    id: string,
    data: { summary: string; codeUrl?: string; liveDemoUrl?: string }
  ) =>
    request<{
      success: boolean;
      project: MicroProject;
      evaluation: {
        score: number;
        passed: boolean;
        feedback: string;
        strengths: string[];
        improvements: string[];
        evidenceGenerated: boolean;
      };
    }>(`/api/projects/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Courses & Professional Development
  getCourses: () => request<{ success: boolean; courses: Course[] }>('/api/courses'),
  saveCourse: (course: Partial<Course>) =>
    request<{ success: boolean; course: Course }>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    }),
  enrollCourse: (id: string) =>
    request<{ success: boolean; course: Course }>(`/api/courses/${id}/enroll`, {
      method: 'POST',
    }),
  updateCourseProgress: (id: string, progressPercentage: number, completedModuleId?: string) =>
    request<{ success: boolean; course: Course }>(`/api/courses/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progressPercentage, completedModuleId }),
    }),
  completeCourse: (id: string, notes?: string, certificateUrl?: string) =>
    request<{ success: boolean; course: Course; profile: CareerProfile }>(
      `/api/courses/${id}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ notes, certificateUrl }),
      }
    ),
  deleteCourse: (id: string) =>
    request<{ success: boolean; deleted: boolean }>(`/api/courses/${id}`, {
      method: 'DELETE',
    }),
  recommendCourses: (focusArea?: string) =>
    request<{
      success: boolean;
      domainTitle: string;
      rationale: string;
      courses: Course[];
      newCourses: Course[];
    }>('/api/courses/recommend', {
      method: 'POST',
      body: JSON.stringify({ focusArea }),
    }),

  // Email Intelligence
  getEmailEvents: () => request<{ success: boolean; events: EmailEvent[] }>('/api/email/events'),
  getEmailStatus: () =>
    request<{
      success: boolean;
      connected: boolean;
      hasOAuthCredentials: boolean;
      missingRequirement: any;
    }>('/api/email/status'),
  classifyEmail: (data: { subject: string; sender: string; snippet: string }) =>
    request<{ success: boolean; classification: any; event: EmailEvent }>('/api/email/classify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Interviews
  getInterviews: () =>
    request<{ success: boolean; interviews: InterviewSession[] }>('/api/interviews'),
  startInterview: (data: { jobRole?: string; type: 'HR' | 'Behavioral' | 'Technical' | 'Mixed' }) =>
    request<{ success: boolean; session: InterviewSession }>('/api/interviews/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitInterviewAnswer: (
    id: string,
    data: { questionIndex: number; answer: string }
  ) =>
    request<{
      success: boolean;
      session: InterviewSession;
      feedback: {
        score: number;
        strengths: string[];
        improvements: string[];
        suggestedRefinement: string;
      };
    }>(`/api/interviews/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Career Memory & Timeline
  getMemory: () => request<{ success: boolean; memory: CareerMemoryFact[] }>('/api/memory'),
  addMemoryFact: (data: Omit<CareerMemoryFact, 'id' | 'updatedAt'>) =>
    request<{ success: boolean; fact: CareerMemoryFact }>('/api/memory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteMemoryFact: (id: string) =>
    request<{ success: boolean }>(`/api/memory/${id}`, { method: 'DELETE' }),
  getTimeline: () =>
    request<{ success: boolean; timeline: CareerTimelineEvent[] }>('/api/timeline'),
  getNotifications: () =>
    request<{
      success: boolean;
      notifications: {
        id: string;
        title: string;
        message: string;
        type: 'HIGH' | 'MEDIUM' | 'LOW';
        read: boolean;
        createdAt: string;
      }[];
    }>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),

  // AI Assistant Chat
  sendAssistantMessage: (message: string, history: { role: 'user' | 'assistant'; text: string }[]) =>
    request<{ success: boolean; reply: string }>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  // Observability & System
  getObservabilityLogs: () =>
    request<{
      success: boolean;
      logs: {
        id: string;
        agent: string;
        promptVersion: string;
        model: string;
        tokensEstimate: number;
        latencyMs: number;
        status: string;
        createdAt: string;
      }[];
    }>('/api/observability/logs'),
  exportSystemData: () => request<{ success: boolean; data: any }>('/api/system/export'),
  resetSystemData: () => request<{ success: boolean; state: any }>('/api/system/reset', { method: 'POST' }),

  // LinkedIn Integration & CV Sync
  getLinkedInStatus: () =>
    request<{
      success: boolean;
      hasOAuthCredentials: boolean;
      missingRequirement: any;
    }>('/api/linkedin/status'),
  parseLinkedInProfile: (rawText: string) =>
    request<{
      success: boolean;
      extracted: {
        fullName: string;
        headline: string;
        location: string;
        summary: string;
        experience: {
          company: string;
          role: string;
          location: string;
          startDate: string;
          endDate?: string;
          current: boolean;
          responsibilities: string[];
          achievements: string[];
        }[];
        education: {
          institution: string;
          degree: string;
          field: string;
          startDate: string;
          endDate?: string;
          current: boolean;
          gpa?: string;
        }[];
        skills: string[];
        certifications: string[];
        languages: string[];
      };
    }>('/api/linkedin/parse-profile', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    }),
  syncLinkedInProfile: (extracted: any) =>
    request<{
      success: boolean;
      profile: CareerProfile;
      resume: ResumeVersion;
    }>('/api/linkedin/sync-profile', {
      method: 'POST',
      body: JSON.stringify({ extracted }),
    }),
};
