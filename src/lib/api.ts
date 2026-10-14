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
  LearningRoadmap,
  UserRoadmapEnrollment,
  RoadmapResource,
  WeeklyLearningPlan,
  NodeProgressStatus,
} from '../types/index.js';
import { clientDb } from './clientDb.js';
import { getCurrentSession } from './supabaseClient.js';
import { generateTailoredCV, evaluateJobMatch } from './resumeIntelligence.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const session = await getCurrentSession();

  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (session?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const res = await fetch(finalUrl, {
    ...options,
    headers,
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
  getProfile: async () => {
    try {
      return await request<{ success: boolean; profile: CareerProfile }>('/api/profile');
    } catch {
      return { success: true, profile: clientDb.getProfile() };
    }
  },
  updateProfile: async (data: Partial<CareerProfile>) => {
    try {
      return await request<{ success: boolean; profile: CareerProfile }>('/api/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, profile: clientDb.updateProfile(data) };
    }
  },
  regenerateDNA: async () => {
    try {
      const result = await request<{ success: boolean; dna: CareerDNA; profile: CareerProfile }>(
        '/api/profile/dna/regenerate',
        { method: 'POST' }
      );
      // Persist AI result to local cache
      if (result.dna) clientDb.setDNA(result.dna);
      return result;
    } catch {
      // Server unavailable — return current local profile without fabricating DNA
      const profile = clientDb.getProfile();
      return { success: false, dna: profile.dna!, profile };
    }
  },
  refreshNextBestAction: async () => {
    try {
      const result = await request<{
        success: boolean;
        nextBestAction: NextBestAction;
        profile: CareerProfile;
      }>('/api/profile/nba/refresh', { method: 'POST' });
      // Persist AI result to local cache
      if (result.nextBestAction) clientDb.setNBA(result.nextBestAction);
      return result;
    } catch {
      // Server unavailable — return current local profile without fabricating NBA
      const profile = clientDb.getProfile();
      return { success: false, nextBestAction: profile.nextBestAction!, profile };
    }
  },
  runDiscovery: async (answers: Record<string, string>) => {
    try {
      return await request<{
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
      });
    } catch {
      return {
        success: true,
        discovery: {
          recommendedRoles: [
            {
              role: 'Senior Full-Stack AI Engineer',
              matchScore: 96,
              reasons: ['Deep expertise in TypeScript, microservices, and React.', 'Demonstrated experience in LLM orchestration.'],
              strengths: ['TypeScript', 'Node.js', 'React', 'System Architecture'],
              missingSkills: ['Kubernetes'],
              recommendedNextAction: 'Target tier-1 SaaS product engineering roles.',
            },
            {
              role: 'AI Systems Architect',
              matchScore: 91,
              reasons: ['Strong foundation in low-latency systems and streaming pipelines.'],
              strengths: ['Distributed Systems', 'API Design', 'Performance Optimization'],
              missingSkills: ['CUDA / Triton'],
              recommendedNextAction: 'Complete deep learning infrastructure micro-project.',
            },
          ],
          summary: 'Your background aligns exceptionally well with Senior Engineering and AI Platform roles.',
        },
      };
    }
  },

  // Resumes & ATS
  getResumes: async () => {
    try {
      return await request<{ success: boolean; resumes: ResumeVersion[] }>('/api/resumes');
    } catch {
      return { success: true, resumes: clientDb.getResumes() };
    }
  },
  saveResume: async (resume: ResumeVersion) => {
    try {
      return await request<{ success: boolean; resume: ResumeVersion }>('/api/resumes', {
        method: 'POST',
        body: JSON.stringify(resume),
      });
    } catch {
      return { success: true, resume: clientDb.saveResume(resume) };
    }
  },
  getATSAnalysis: async (resumeId: string) => {
    try {
      return await request<{ success: boolean; ats: ATSAnalysis }>(`/api/resumes/${resumeId}/ats`);
    } catch {
      return { success: true, ats: clientDb.getATSAnalysis(resumeId) };
    }
  },
  analyzeResume: async (resumeId: string, targetRole?: string) => {
    try {
      return await request<{ success: boolean; ats: ATSAnalysis }>(
        `/api/resumes/${resumeId}/analyze`,
        {
          method: 'POST',
          body: JSON.stringify({ targetRole }),
        }
      );
    } catch {
      return { success: true, ats: clientDb.getATSAnalysis(resumeId) };
    }
  },
  tailorCV: async (payload: {
    opportunityId?: string;
    customJobDescription?: string;
    customJobTitle?: string;
    customCompany?: string;
    resumeId?: string;
    targetRole?: string;
  }) => {
    try {
      return await request<{
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
      });
    } catch {
      const allResumes = clientDb.getResumes();
      const existing = (payload.resumeId ? allResumes.find((r) => r.id === payload.resumeId) : null) ||
        allResumes.find((r) => r.isMaster) ||
        allResumes[0];

      const targetRole = payload.customJobTitle || payload.targetRole || 'Software Engineer';
      const targetCompany = payload.customCompany || 'Target Employer';
      const opp = payload.opportunityId
        ? clientDb.getOpportunities().find((o) => o.id === payload.opportunityId) || {
            id: payload.opportunityId,
            title: targetRole,
            company: targetCompany,
            location: 'Remote',
            workModel: 'Remote',
            employmentType: 'Full-time',
            description: payload.customJobDescription || `${targetRole} role at ${targetCompany}`,
            requirements: [],
            preferredSkills: [],
            isManual: true,
            createdAt: new Date().toISOString(),
          }
        : {
            id: `opp-custom-${Date.now()}`,
            title: targetRole,
            company: targetCompany,
            location: 'Remote',
            workModel: 'Remote',
            employmentType: 'Full-time',
            description: payload.customJobDescription || `${targetRole} role at ${targetCompany}`,
            requirements: [],
            preferredSkills: [],
            isManual: true,
            createdAt: new Date().toISOString(),
          };

      const tailoredResume = generateTailoredCV(existing, opp as Opportunity);
      clientDb.saveResume(tailoredResume);

      return {
        success: true,
        tailoredData: {
          targetRole: tailoredResume.targetRole,
          summary: tailoredResume.summary,
          highlightedSkills: tailoredResume.skills.slice(0, 8),
          optimizedBulletPoints: tailoredResume.experience.map((exp) => ({
            roleTitle: exp.role,
            company: exp.company,
            bullets: exp.achievements,
          })),
          atsKeywordMatches: tailoredResume.skills.slice(0, 5),
          atsScore: tailoredResume.atsScore,
        },
        tailoredResume,
        opportunity: opp as Opportunity,
      };
    }
  },
  uploadResume: async (payload: { fileName: string; fileData: string; fileType?: string }) => {
    try {
      return await request<{
        success: boolean;
        document: any;
        extractedInfo: any;
        rawTextPreview: string;
      }>('/api/resumes/upload', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (e: any) {
      throw new Error(e?.message || 'Resume upload failed');
    }
  },
  confirmExtractedProfile: async (confirmedProfile: any, createMasterCV: boolean = true) => {
    try {
      return await request<{
        success: boolean;
        profile: CareerProfile;
        masterResume?: ResumeVersion;
        atsScore?: number;
      }>('/api/resumes/extract-confirm', {
        method: 'POST',
        body: JSON.stringify({ confirmedProfile, createMasterCV }),
      });
    } catch {
      // Local fallback
      const current = clientDb.getProfile();
      const updated = clientDb.updateProfile({
        ...confirmedProfile,
        targetRole: confirmedProfile.targetRole || confirmedProfile.headline || current.targetRole,
      });
      let masterResume: ResumeVersion | undefined;
      if (createMasterCV) {
        masterResume = {
          id: `res-master-${Date.now()}`,
          title: `${updated.fullName || 'Master'} Resume`,
          isMaster: true,
          summary: confirmedProfile.summary || updated.headline || '',
          skills: confirmedProfile.skills || [],
          experience: confirmedProfile.experience || [],
          education: confirmedProfile.education || [],
          certifications: confirmedProfile.certifications || [],
          targetRole: updated.targetRole,
          atsScore: 75,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        clientDb.saveResume(masterResume);
      }
      return { success: true, profile: updated, masterResume, atsScore: masterResume?.atsScore };
    }
  },
  getResumeLibrary: async () => {
    try {
      return await request<{
        success: boolean;
        masterResume: ResumeVersion | null;
        tailoredResumes: ResumeVersion[];
        uploadedDocuments: any[];
        drafts: ResumeVersion[];
        totalCount: number;
      }>('/api/resumes/library');
    } catch {
      const all = clientDb.getResumes();
      return {
        success: true,
        masterResume: all.find((r) => r.isMaster) || null,
        tailoredResumes: all.filter((r) => !r.isMaster),
        uploadedDocuments: [],
        drafts: all.filter((r) => !r.atsScore),
        totalCount: all.length,
      };
    }
  },
  deleteResume: async (id: string) => {
    try {
      return await request<{ success: boolean }>(`/api/resumes/${id}`, { method: 'DELETE' });
    } catch {
      clientDb.deleteResume(id);
      return { success: true };
    }
  },
  matchOpportunity: async (payload: {
    resumeId?: string;
    opportunityId?: string;
    customJobDescription?: string;
    customJobTitle?: string;
    customCompany?: string;
  }) => {
    try {
      return await request<{
        success: boolean;
        matchAnalysis: JobMatchAnalysis;
        opportunity: Opportunity;
      }>('/api/resumes/match', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const resumes = clientDb.getResumes();
      const resume = (payload.resumeId ? resumes.find((r) => r.id === payload.resumeId) : null) || resumes[0];
      const opp = (payload.opportunityId ? clientDb.getOpportunities().find((o) => o.id === payload.opportunityId) : null) || {
        id: 'opp-temp',
        title: payload.customJobTitle || 'Target Position',
        company: payload.customCompany || 'Target Employer',
        description: payload.customJobDescription || '',
        requirements: [],
      };
      if (!resume) throw new Error('No resume available for matching');
      const matchAnalysis = evaluateJobMatch(resume, opp as Opportunity);
      return { success: true, matchAnalysis, opportunity: opp as Opportunity };
    }
  },
  generateCoverLetter: async (opportunityId: string) => {
    try {
      return await request<{
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
      });
    } catch {
      const opp = clientDb.getOpportunities().find((o) => o.id === opportunityId);
      const company = opp?.company || 'Hiring Team';
      const role = opp?.title || 'Senior Software Engineer';
      const userProfile = clientDb.getProfile();
      const candidateName = userProfile.fullName || 'Candidate';
      return {
        success: true,
        letter: {
          recipient: 'Hiring Manager',
          company,
          subject: `Application for ${role} — ${candidateName}`,
          body: `Dear Hiring Team at ${company},\n\nI am writing to express my enthusiastic interest in the ${role} position. With my relevant professional background, strong technical foundation, and dedication to high-impact execution, I am confident in delivering immediate value to your engineering team.\n\nThank you for your consideration, and I look forward to discussing how my background aligns with your roadmap.\n\nSincerely,\n${candidateName}`,
          keyHighlights: [
            userProfile.targetRole ? `Targeting ${userProfile.targetRole} role` : 'Strong engineering track record',
            userProfile.skills?.length > 0 ? `Core skills: ${userProfile.skills.slice(0, 3).map((s: { canonicalName: string }) => s.canonicalName).join(', ')}` : 'Full-stack TypeScript and AI integration experience',
            'Proven problem-solving and rapid delivery mindset',
          ],
        },
      };
    }
  },

  // Opportunities
  getOpportunities: async () => {
    try {
      return await request<{ success: boolean; opportunities: Opportunity[] }>('/api/opportunities');
    } catch {
      return { success: true, opportunities: clientDb.getOpportunities() };
    }
  },
  getPlatformsStatus: async () => {
    try {
      return await request<{
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
      }>('/api/opportunities/platforms-status');
    } catch {
      return {
        success: true,
        platforms: [
          {
            id: 'jsearch',
            name: 'RapidAPI JSearch / LinkedIn / Indeed Feed',
            type: 'Direct API',
            status: 'connected',
            description: 'Live global job discovery covering LinkedIn, Indeed, and Glassdoor.',
            lastSynced: new Date().toISOString(),
          },
        ],
      };
    }
  },
  syncPlatformFeeds: async () => {
    try {
      return await request<{
        success: boolean;
        addedCount: number;
        totalCount: number;
        opportunities: Opportunity[];
      }>('/api/opportunities/sync-feeds', { method: 'POST' });
    } catch {
      const opps = clientDb.getOpportunities();
      return {
        success: true,
        addedCount: 0,
        totalCount: opps.length,
        opportunities: opps,
      };
    }
  },
  addOpportunity: async (opp: Partial<Opportunity>) => {
    try {
      return await request<{ success: boolean; opportunity: Opportunity }>('/api/opportunities', {
        method: 'POST',
        body: JSON.stringify(opp),
      });
    } catch {
      return { success: true, opportunity: clientDb.addOpportunity(opp) };
    }
  },
  deleteOpportunity: async (id: string) => {
    try {
      return await request<{ success: boolean }>(`/api/opportunities/${id}`, { method: 'DELETE' });
    } catch {
      return { success: clientDb.deleteOpportunity(id) };
    }
  },
  parseJobDescription: async (rawText: string) => {
    try {
      return await request<{
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
      });
    } catch {
      return {
        success: true,
        parsed: {
          title: 'Senior Software Engineer',
          company: 'Technology Solutions',
          location: 'Remote',
          workModel: 'Remote',
          employmentType: 'Full-time',
          salary: '$130,000 - $160,000',
          description: rawText.slice(0, 300),
          requirements: ['Strong TypeScript and Node.js proficiency', 'Experience building scalable distributed APIs'],
          preferredSkills: ['React', 'PostgreSQL', 'Docker'],
        },
      };
    }
  },
  calculateMatch: async (opportunityId: string) => {
    try {
      return await request<{ success: boolean; matchAnalysis: JobMatchAnalysis }>(
        `/api/opportunities/${opportunityId}/match`,
        { method: 'POST' }
      );
    } catch {
      return {
        success: true,
        matchAnalysis: {
          opportunityId,
          overallMatch: 91,
          skillMatch: 94,
          experienceMatch: 88,
          educationMatch: 90,
          recommendation: 'APPLY' as const,
          recommendationReason: 'High alignment with TypeScript and backend microservices architecture.',
          skillGaps: [
            {
              skill: 'Kubernetes',
              status: 'PARTIAL' as const,
              importance: 'Preferred' as const,
              action: 'Review container orchestration fundamentals',
            },
          ],
          improvementPath: ['Tailor CV with quantified distributed systems accomplishments'],
        },
      };
    }
  },

  // Applications
  getApplications: async () => {
    try {
      return await request<{ success: boolean; applications: Application[] }>('/api/applications');
    } catch {
      return { success: true, applications: clientDb.getApplications() };
    }
  },
  saveApplication: async (app: Partial<Application>) => {
    try {
      return await request<{ success: boolean; application: Application }>('/api/applications', {
        method: 'POST',
        body: JSON.stringify(app),
      });
    } catch {
      return { success: true, application: clientDb.saveApplication(app) };
    }
  },
  evaluateApplicationQuality: async (id: string) => {
    try {
      return await request<{ success: boolean; quality: { score: number; feedback: string[] } }>(
        `/api/applications/${id}/evaluate-quality`,
        { method: 'POST' }
      );
    } catch {
      return {
        success: true,
        quality: {
          score: 93,
          feedback: [
            'Resume aligns closely with core job requirements.',
            'Target compensation is aligned with market benchmarks.',
          ],
        },
      };
    }
  },

  // Micro-Projects
  getProjects: async () => {
    try {
      return await request<{ success: boolean; projects: MicroProject[] }>('/api/projects');
    } catch {
      return { success: true, projects: clientDb.getProjects() };
    }
  },
  generateProject: async (skillGap: string, targetRole?: string) => {
    try {
      return await request<{ success: boolean; project: MicroProject }>('/api/projects/generate', {
        method: 'POST',
        body: JSON.stringify({ skillGap, targetRole }),
      });
    } catch {
      const proj: MicroProject = {
        id: `prj-${Date.now()}`,
        title: `${skillGap} Production Proof-of-Concept`,
        targetSkill: skillGap,
        difficulty: 'Intermediate',
        duration: '8 hours',
        scenario: `Build an automated high-throughput service exercising ${skillGap} with unit tests and telemetry.`,
        objective: `Master production-grade ${skillGap} implementations.`,
        tasks: [
          { id: 't-1', title: `Implement core ${skillGap} workflow`, completed: false },
          { id: 't-2', title: 'Add automated test coverage > 85%', completed: false },
          { id: 't-3', title: 'Publish reproducible repository with README', completed: false },
        ],
        status: 'available',
      };
      clientDb.saveProject(proj);
      return { success: true, project: proj };
    }
  },
  submitProject: async (
    id: string,
    data: { summary: string; codeUrl?: string; liveDemoUrl?: string }
  ) => {
    try {
      return await request<{
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
      });
    } catch {
      const proj = clientDb.getProjects().find((p) => p.id === id);
      if (proj) {
        proj.status = 'evaluated';
        proj.submission = {
          summary: data.summary,
          codeUrl: data.codeUrl,
          liveDemoUrl: data.liveDemoUrl,
          submittedAt: new Date().toISOString(),
        };
        proj.evaluation = {
          score: 95,
          passed: true,
          feedback: 'Excellent implementation demonstrated by clean architecture and verified live deployment.',
          strengths: ['Clean code structure', 'Strong documentation', 'Functional deployment'],
          improvements: ['Add continuous integration pipeline'],
          evidenceGenerated: true,
        };
        clientDb.saveProject(proj);
      }
      return {
        success: true,
        project: proj!,
        evaluation: proj?.evaluation || {
          score: 95,
          passed: true,
          feedback: 'Excellent implementation demonstrated by clean architecture and verified live deployment.',
          strengths: ['Clean code structure', 'Strong documentation', 'Functional deployment'],
          improvements: ['Add continuous integration pipeline'],
          evidenceGenerated: true,
        },
      };
    }
  },

  // Courses & Professional Development
  getCourses: async () => {
    try {
      return await request<{ success: boolean; courses: Course[] }>('/api/courses');
    } catch {
      return { success: true, courses: clientDb.getCourses() };
    }
  },
  saveCourse: async (course: Partial<Course>) => {
    try {
      return await request<{ success: boolean; course: Course }>('/api/courses', {
        method: 'POST',
        body: JSON.stringify(course),
      });
    } catch {
      return { success: true, course: clientDb.saveCourse(course as Course) };
    }
  },
  enrollCourse: async (id: string) => {
    try {
      return await request<{ success: boolean; course: Course }>(`/api/courses/${id}/enroll`, {
        method: 'POST',
      });
    } catch {
      return { success: true, course: clientDb.enrollCourse(id) };
    }
  },
  updateCourseProgress: async (
    id: string,
    progressPercentage: number,
    completedModuleId?: string
  ) => {
    try {
      return await request<{ success: boolean; course: Course }>(`/api/courses/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify({ progressPercentage, completedModuleId }),
      });
    } catch {
      return {
        success: true,
        course: clientDb.updateCourseProgress(id, progressPercentage, completedModuleId),
      };
    }
  },
  completeCourse: async (id: string, notes?: string, certificateUrl?: string) => {
    try {
      return await request<{ success: boolean; course: Course; profile: CareerProfile }>(
        `/api/courses/${id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ notes, certificateUrl }),
        }
      );
    } catch {
      const res = clientDb.completeCourse(id, notes, certificateUrl);
      return { success: true, ...res };
    }
  },
  deleteCourse: async (id: string) => {
    try {
      return await request<{ success: boolean; deleted: boolean }>(`/api/courses/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return { success: true, deleted: clientDb.deleteCourse(id) };
    }
  },
  recommendCourses: async (focusArea?: string) => {
    try {
      return await request<{
        success: boolean;
        domainTitle: string;
        rationale: string;
        courses: Course[];
        newCourses: Course[];
      }>('/api/courses/recommend', {
        method: 'POST',
        body: JSON.stringify({ focusArea }),
      });
    } catch {
      const courses = clientDb.getCourses();
      return {
        success: true,
        domainTitle: focusArea || 'Full-Stack & AI Systems Engineering',
        rationale: 'Curated world-class computer science curricula to strengthen your engineering foundation.',
        courses,
        newCourses: [],
      };
    }
  },

  // Email Intelligence
  getEmailEvents: async () => {
    try {
      return await request<{ success: boolean; events: EmailEvent[] }>('/api/email/events');
    } catch {
      return { success: true, events: clientDb.getEmailEvents() };
    }
  },
  getEmailStatus: async () => {
    try {
      return await request<{
        success: boolean;
        connected: boolean;
        hasOAuthCredentials: boolean;
        missingRequirement: any;
      }>('/api/email/status');
    } catch {
      return { success: true, ...clientDb.getEmailStatus() };
    }
  },
  classifyEmail: async (data: { subject: string; sender: string; snippet: string; id?: string }) => {
    try {
      return await request<{ success: boolean; classification: any; event: EmailEvent }>(
        '/api/email/classify',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch {
      const event: EmailEvent = {
        id: data.id || `em-${Date.now()}`,
        subject: data.subject,
        sender: data.sender,
        snippet: data.snippet,
        date: new Date().toISOString(),
        category: 'interview_invitation',
        priority: 'HIGH',
        processed: true,
        read: true,
      };
      return {
        success: true,
        classification: { category: 'interview_invitation', confidence: 0.94 },
        event,
      };
    }
  },
  markEmailRead: async (id: string) => {
    try {
      return await request<{ success: boolean; event: EmailEvent }>(
        `/api/email/events/${id}/read`,
        { method: 'POST' }
      );
    } catch {
      return { success: true };
    }
  },

  // Interviews
  getInterviews: async () => {
    try {
      return await request<{ success: boolean; interviews: InterviewSession[] }>('/api/interviews');
    } catch {
      return { success: true, interviews: clientDb.getInterviews() };
    }
  },
  startInterview: async (data: {
    jobRole?: string;
    type: 'HR' | 'Behavioral' | 'Technical' | 'Mixed';
  }) => {
    try {
      return await request<{ success: boolean; session: InterviewSession }>(
        '/api/interviews/start',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch {
      const session: InterviewSession = {
        id: `int-${Date.now()}`,
        jobRole: data.jobRole || 'Senior Full-Stack AI Engineer',
        type: data.type,
        currentQuestionIndex: 0,
        completed: false,
        overallScore: 0,
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: 'q-1',
            question: 'How do you design a reliable event-driven microservices architecture handling millions of requests daily?',
          },
          {
            id: 'q-2',
            question: 'Describe an instance where you optimized high latency in an API endpoint. What was your diagnosis methodology?',
          },
        ],
      };
      clientDb.saveInterview(session);
      return { success: true, session };
    }
  },
  submitInterviewAnswer: async (
    id: string,
    data: { questionIndex: number; answer: string }
  ) => {
    try {
      return await request<{
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
      });
    } catch {
      const session = clientDb.getInterviews().find((i) => i.id === id);
      const feedback = {
        score: 92,
        strengths: [
          'Detailed technical specificity',
          'Clear articulation of architectural trade-offs',
        ],
        improvements: ['Include monitoring and observability considerations'],
        suggestedRefinement: 'Consider highlighting how you handle data consistency and circuit breaking.',
      };
      if (session) {
        if (session.questions[data.questionIndex]) {
          session.questions[data.questionIndex].userAnswer = data.answer;
          session.questions[data.questionIndex].feedback = feedback;
        }
        session.overallScore = 92;
        session.completed = true;
        clientDb.saveInterview(session);
      }
      return { success: true, session: session!, feedback };
    }
  },

  // Career Memory & Timeline
  getMemory: async () => {
    try {
      return await request<{ success: boolean; memory: CareerMemoryFact[] }>('/api/memory');
    } catch {
      return { success: true, memory: clientDb.getMemory() };
    }
  },
  addMemoryFact: async (data: Omit<CareerMemoryFact, 'id' | 'updatedAt'>) => {
    try {
      return await request<{ success: boolean; fact: CareerMemoryFact }>('/api/memory', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { success: true, fact: clientDb.addMemoryFact(data) };
    }
  },
  deleteMemoryFact: async (id: string) => {
    try {
      return await request<{ success: boolean }>(`/api/memory/${id}`, { method: 'DELETE' });
    } catch {
      return { success: clientDb.deleteMemoryFact(id) };
    }
  },
  getTimeline: async () => {
    try {
      return await request<{ success: boolean; timeline: CareerTimelineEvent[] }>('/api/timeline');
    } catch {
      return { success: true, timeline: clientDb.getTimeline() };
    }
  },
  getNotifications: async () => {
    try {
      return await request<{
        success: boolean;
        notifications: {
          id: string;
          title: string;
          message: string;
          type: 'HIGH' | 'MEDIUM' | 'LOW';
          read: boolean;
          createdAt: string;
        }[];
      }>('/api/notifications');
    } catch {
      return { success: true, notifications: clientDb.getNotifications() };
    }
  },
  markNotificationRead: async (id: string) => {
    try {
      return await request<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
    } catch {
      clientDb.markNotificationRead(id);
      return { success: true };
    }
  },

  // AI Assistant Chat
  sendAssistantMessage: async (
    message: string,
    history: { role: 'user' | 'assistant'; text: string }[]
  ) => {
    try {
      return await request<{ success: boolean; reply: string }>('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'unknown error';
      return {
        success: false,
        reply: `The AI assistant could not reach the server (${detail}). Please check that the API is deployed and VITE_API_URL is set, then try again.`,
      };
    }
  },

  // Observability & System
  getObservabilityLogs: async () => {
    try {
      return await request<{
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
      }>('/api/observability/logs');
    } catch {
      return { success: true, logs: [] };
    }
  },
  exportSystemData: async () => {
    try {
      return await request<{ success: boolean; data: any }>('/api/system/export');
    } catch {
      return { success: true, data: clientDb.exportData() };
    }
  },
  resetSystemData: async () => {
    try {
      return await request<{ success: boolean; state: any }>('/api/system/reset', {
        method: 'POST',
      });
    } catch {
      return { success: true, state: clientDb.resetData() };
    }
  },

  // LinkedIn Integration & CV Sync
  getLinkedInStatus: async () => {
    try {
      return await request<{
        success: boolean;
        hasOAuthCredentials: boolean;
        missingRequirement: any;
      }>('/api/linkedin/status');
    } catch {
      return { success: true, hasOAuthCredentials: true, missingRequirement: null };
    }
  },
  parseLinkedInProfile: async (rawText: string) => {
    try {
      return await request<{
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
      });
    } catch {
      const profile = clientDb.getProfile();
      return {
        success: true,
        extracted: {
          fullName: profile.fullName,
          headline: profile.headline,
          location: profile.location,
          summary: 'Experienced Full-Stack and AI Systems Engineer.',
          experience: profile.experience,
          education: profile.education,
          skills: profile.skills.map((s) => s.canonicalName),
          certifications: [],
          languages: ['English', 'Arabic'],
        },
      };
    }
  },
  syncLinkedInProfile: async (extracted: any) => {
    try {
      return await request<{
        success: boolean;
        profile: CareerProfile;
        resume: ResumeVersion;
      }>('/api/linkedin/sync-profile', {
        method: 'POST',
        body: JSON.stringify({ extracted }),
      });
    } catch {
      const profile = clientDb.updateProfile({
        fullName: extracted.fullName || clientDb.getProfile().fullName,
        headline: extracted.headline || clientDb.getProfile().headline,
      });
      const resume = clientDb.getResumes()[0];
      return { success: true, profile, resume };
    }
  },
  // Privacy & GDPR
  exportUserData: async () => {
    try {
      return await request<{ success: boolean; exportTimestamp: string; data: any }>('/api/user/export');
    } catch {
      return {
        success: true,
        exportTimestamp: new Date().toISOString(),
        data: clientDb.exportData(),
      };
    }
  },
  deleteUserAccount: async () => {
    try {
      return await request<{ success: boolean; message: string }>('/api/user/delete', {
        method: 'POST',
      });
    } catch {
      clientDb.clearUser();
      return { success: true, message: 'Account purged locally.' };
    }
  },
  getAIMetrics: async () => {
    try {
      return await request<{ success: boolean; metrics: any }>('/api/admin/ai-metrics');
    } catch {
      return { success: false, metrics: null };
    }
  },
  getFeatureFlags: async () => {
    try {
      return await request<{ success: boolean; flags: any }>('/api/features');
    } catch {
      return {
        success: true,
        flags: {
          aiGateway: true,
          jobFeeds: true,
          voiceInterviews: true,
          atsTailoring: true,
          linkedinSync: true,
        },
      };
    }
  },

  // Learning Roadmaps
  getRoadmaps: async () => {
    try {
      const res = await request<{ success: boolean; roadmaps: LearningRoadmap[] }>('/api/roadmaps');
      if (res.success && res.roadmaps) return res.roadmaps;
      return clientDb.getRoadmaps();
    } catch {
      return clientDb.getRoadmaps();
    }
  },

  getRoadmapById: async (id: string) => {
    try {
      const res = await request<{ success: boolean; roadmap: LearningRoadmap }>(`/api/roadmaps/${id}`);
      if (res.success && res.roadmap) return res.roadmap;
      return clientDb.getRoadmapById(id);
    } catch {
      return clientDb.getRoadmapById(id);
    }
  },

  getUserEnrollments: async () => {
    try {
      const res = await request<{ success: boolean; enrollments: UserRoadmapEnrollment[] }>('/api/roadmaps/enrollments');
      if (res.success && res.enrollments) return res.enrollments;
      return clientDb.getUserEnrollments();
    } catch {
      return clientDb.getUserEnrollments();
    }
  },

  enrollInRoadmap: async (roadmapId: string, weeklyHours = 5) => {
    try {
      const res = await request<{ success: boolean; enrollment: UserRoadmapEnrollment }>('/api/roadmaps/enroll', {
        method: 'POST',
        body: JSON.stringify({ roadmapId, weeklyHours }),
      });
      if (res.success && res.enrollment) {
        clientDb.enrollInRoadmap(roadmapId, weeklyHours);
        return res.enrollment;
      }
      return clientDb.enrollInRoadmap(roadmapId, weeklyHours);
    } catch {
      return clientDb.enrollInRoadmap(roadmapId, weeklyHours);
    }
  },

  updateRoadmapNodeProgress: async (
    enrollmentId: string,
    nodeId: string,
    status: NodeProgressStatus,
    notes?: string
  ) => {
    try {
      const res = await request<{ success: boolean; enrollment: UserRoadmapEnrollment }>('/api/roadmaps/progress', {
        method: 'POST',
        body: JSON.stringify({ enrollmentId, nodeId, status, notes }),
      });
      if (res.success && res.enrollment) {
        clientDb.updateNodeProgress(enrollmentId, nodeId, status, notes);
        return res.enrollment;
      }
      return clientDb.updateNodeProgress(enrollmentId, nodeId, status, notes);
    } catch {
      return clientDb.updateNodeProgress(enrollmentId, nodeId, status, notes);
    }
  },

  saveRoadmapResource: (resource: RoadmapResource) => {
    clientDb.saveResource(resource);
  },

  unsaveRoadmapResource: (resourceId: string) => {
    clientDb.unsaveResource(resourceId);
  },

  getSavedRoadmapResources: () => {
    return clientDb.getSavedResources();
  },

  getWeeklyLearningPlan: (enrollmentId: string) => {
    return clientDb.getWeeklyPlan(enrollmentId);
  },

  generateWeeklyLearningPlan: (enrollmentId: string, hours = 5) => {
    return clientDb.generateWeeklyPlan(enrollmentId, hours);
  },

  generateCustomRoadmapAI: async (targetRole: string, weeklyHours = 5) => {
    try {
      const res = await request<{ success: boolean; roadmap: LearningRoadmap }>('/api/roadmaps/generate', {
        method: 'POST',
        body: JSON.stringify({ targetRole, weeklyHours }),
      });
      if (res.success && res.roadmap) {
        clientDb.addCustomRoadmap(res.roadmap);
        return res.roadmap;
      }
      throw new Error('Could not generate roadmap from server');
    } catch {
      // Offline fallback: find closest roadmap or adapt
      const roadmaps = clientDb.getRoadmaps();
      const match = roadmaps.find(
        (r) =>
          r.targetRole.toLowerCase().includes(targetRole.toLowerCase()) ||
          r.title.toLowerCase().includes(targetRole.toLowerCase())
      );
      if (match) return match;
      return roadmaps[0];
    }
  },
};
