import initialDbData from '../../data/careerpilot_db.json';
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
  CareerDNA,
  NextBestAction,
} from '../types/index.js';

const STORAGE_KEY = 'careerpilot_client_db_v2';

interface LocalDatabaseState {
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

class ClientDatabaseService {
  private state: LocalDatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): LocalDatabaseState {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.profile && parsed.resumes) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[ClientDB] Failed to load from localStorage, using initial seed:', e);
      }
    }
    return JSON.parse(JSON.stringify(initialDbData)) as LocalDatabaseState;
  }

  private persist() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn('[ClientDB] Failed to persist state to localStorage:', e);
      }
    }
  }

  // --- Profile ---
  getProfile(): CareerProfile {
    return this.state.profile;
  }

  updateProfile(partial: Partial<CareerProfile>): CareerProfile {
    this.state.profile = {
      ...this.state.profile,
      ...partial,
    };
    this.persist();
    return this.state.profile;
  }

  regenerateDNA(): { dna: CareerDNA; profile: CareerProfile } {
    const dna: CareerDNA = {
      currentLevel: 'Senior Engineer',
      primaryDirection: 'Full-Stack Software Engineering',
      secondaryDirections: ['AI Systems Architecture', 'Cloud & Distributed Systems'],
      strengths: [
        'Full-Stack Architecture & Distributed Systems',
        'LLM Orchestration & Prompt Optimization',
        'High-Concurrency Telemetry Pipelines',
      ],
      weaknesses: ['Kubernetes Cluster Federation', 'Multi-tenant Vector Partitioning'],
      keyCompetencies: ['System Design', 'Event-Driven Architecture', 'AI Prompt Engineering'],
      workPreferences: {
        workModel: 'Remote',
        teamStyle: 'Collaborative',
        pace: 'High-growth',
      },
      summary: 'Senior Full-Stack AI Engineer with extensive experience in high-concurrency systems.',
      lastUpdated: new Date().toISOString(),
    };
    this.state.profile.dna = dna;
    this.persist();
    return { dna, profile: this.state.profile };
  }

  refreshNBA(): { nextBestAction: NextBestAction; profile: CareerProfile } {
    const nba: NextBestAction = {
      id: `nba-${Date.now()}`,
      title: 'Target Top Match: Senior Full-Stack AI Engineer',
      description: 'Your ATS profile matches 95% with Synthetix Platforms. Submit tailored application now.',
      reason: 'High alignment with your verified TypeScript and AI skills.',
      evidenceNeeded: 'Tailored resume and portfolio link',
      expectedImpact: '+18% interview callback probability',
      estimatedEffort: '30 mins',
      actionType: 'apply',
      targetUrl: '/opportunities',
    };
    this.state.profile.nextBestAction = nba;
    this.persist();
    return { nextBestAction: nba, profile: this.state.profile };
  }

  // --- Resumes ---
  getResumes(): ResumeVersion[] {
    return this.state.resumes;
  }

  saveResume(resume: ResumeVersion): ResumeVersion {
    const idx = this.state.resumes.findIndex((r) => r.id === resume.id);
    if (idx >= 0) {
      this.state.resumes[idx] = resume;
    } else {
      this.state.resumes.unshift(resume);
    }
    this.persist();
    return resume;
  }

  getATSAnalysis(resumeId: string): ATSAnalysis {
    if (this.state.atsAnalysis[resumeId]) {
      return this.state.atsAnalysis[resumeId];
    }
    return {
      overallScore: 88,
      strengths: [
        'Clear metric-driven accomplishments (e.g. reduced p95 latency by 78%)',
        'Standard ATS-compliant hierarchy and typography',
      ],
      weaknesses: ['Consider tailoring bullet points to emphasize cloud infrastructure'],
      recommendations: ['Emphasize Kubernetes and distributed cache experience'],
      missingKeywords: ['Kubernetes', 'GraphQL Federation'],
      formattingScore: 95,
      relevanceScore: 92,
      impactScore: 86,
    };
  }

  // --- Opportunities ---
  getOpportunities(): Opportunity[] {
    return this.state.opportunities;
  }

  addOpportunity(opp: Partial<Opportunity>): Opportunity {
    const newOpp: Opportunity = {
      id: opp.id || `opp-${Date.now()}`,
      title: opp.title || 'Senior Software Engineer',
      company: opp.company || 'Innovative Tech Corp',
      location: opp.location || 'Remote',
      workModel: opp.workModel || 'Remote',
      employmentType: opp.employmentType || 'Full-time',
      salary: opp.salary || '$120,000 - $150,000',
      description: opp.description || '',
      requirements: opp.requirements || [],
      preferredSkills: opp.preferredSkills || [],
      sourcePlatform: 'Direct',
      isManual: true,
      createdAt: new Date().toISOString(),
    };
    this.state.opportunities.unshift(newOpp);
    this.persist();
    return newOpp;
  }

  deleteOpportunity(id: string): boolean {
    this.state.opportunities = this.state.opportunities.filter((o) => o.id !== id);
    this.persist();
    return true;
  }

  // --- Applications ---
  getApplications(): Application[] {
    return this.state.applications;
  }

  saveApplication(app: Partial<Application>): Application {
    const fullApp: Application = {
      id: app.id || `app-${Date.now()}`,
      opportunityId: app.opportunityId || '',
      jobTitle: app.jobTitle || 'Software Engineer',
      company: app.company || 'Target Company',
      status: app.status || 'Applied',
      appliedDate: app.appliedDate || new Date().toISOString(),
      tailoredResumeId: app.tailoredResumeId,
      coverLetter: app.coverLetter,
      answers: app.answers || [],
      qualityScore: app.qualityScore || 92,
      qualityFeedback: app.qualityFeedback || ['Cover letter tailored to role'],
      events: app.events || [
        {
          id: `ev-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'Applied',
          description: 'Application recorded in CareerPilot.',
        },
      ],
      createdAt: app.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const idx = this.state.applications.findIndex((a) => a.id === fullApp.id);
    if (idx >= 0) {
      this.state.applications[idx] = fullApp;
    } else {
      this.state.applications.unshift(fullApp);
    }
    this.persist();
    return fullApp;
  }

  // --- Projects ---
  getProjects(): MicroProject[] {
    return this.state.microProjects;
  }

  saveProject(proj: MicroProject): MicroProject {
    const idx = this.state.microProjects.findIndex((p) => p.id === proj.id);
    if (idx >= 0) {
      this.state.microProjects[idx] = proj;
    } else {
      this.state.microProjects.unshift(proj);
    }
    this.persist();
    return proj;
  }

  // --- Courses ---
  getCourses(): Course[] {
    return this.state.courses;
  }

  saveCourse(course: Course): Course {
    const idx = this.state.courses.findIndex((c) => c.id === course.id);
    if (idx >= 0) {
      this.state.courses[idx] = course;
    } else {
      this.state.courses.unshift(course);
    }
    this.persist();
    return course;
  }

  enrollCourse(id: string): Course {
    const course = this.state.courses.find((c) => c.id === id);
    if (!course) throw new Error('Course not found');
    course.enrollmentStatus = 'in_progress';
    course.enrolledAt = course.enrolledAt || new Date().toISOString();
    if (course.progressPercentage === 0) course.progressPercentage = 10;
    this.persist();
    return course;
  }

  updateCourseProgress(id: string, progress: number, modId?: string): Course {
    const course = this.state.courses.find((c) => c.id === id);
    if (!course) throw new Error('Course not found');
    course.progressPercentage = Math.min(100, Math.max(0, progress));
    if (modId) {
      const mod = course.modules.find((m) => m.id === modId);
      if (mod) mod.completed = true;
    }
    if (course.progressPercentage === 100) {
      course.enrollmentStatus = 'completed';
      course.completedAt = new Date().toISOString();
    }
    this.persist();
    return course;
  }

  completeCourse(id: string, notes?: string, certificateUrl?: string): { course: Course; profile: CareerProfile } {
    const course = this.state.courses.find((c) => c.id === id);
    if (!course) throw new Error('Course not found');
    course.enrollmentStatus = 'completed';
    course.progressPercentage = 100;
    course.completedAt = new Date().toISOString();
    if (certificateUrl) course.certificateUrl = certificateUrl;
    if (notes) course.notes = notes;
    course.modules.forEach((m) => (m.completed = true));

    // Add timeline event
    this.addTimelineEvent({
      type: 'SKILL_EVALUATION',
      title: `Completed ${course.title}`,
      description: `Verified completion of ${course.title} from ${course.provider}.`,
      date: new Date().toISOString(),
      source: 'Project',
    });

    this.persist();
    return { course, profile: this.state.profile };
  }

  deleteCourse(id: string): boolean {
    this.state.courses = this.state.courses.filter((c) => c.id !== id);
    this.persist();
    return true;
  }

  // --- Email ---
  getEmailEvents(): EmailEvent[] {
    return this.state.emailEvents;
  }

  getEmailStatus() {
    return {
      connected: this.state.emailAccountConnected,
      hasOAuthCredentials: true,
      missingRequirement: null,
    };
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
    this.persist();
    return interview;
  }

  // --- Memory ---
  getMemory(): CareerMemoryFact[] {
    return this.state.careerMemory;
  }

  addMemoryFact(fact: Omit<CareerMemoryFact, 'id' | 'updatedAt'>): CareerMemoryFact {
    const newFact: CareerMemoryFact = {
      ...fact,
      id: `mem-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    this.state.careerMemory.unshift(newFact);
    this.persist();
    return newFact;
  }

  deleteMemoryFact(id: string): boolean {
    this.state.careerMemory = this.state.careerMemory.filter((m) => m.id !== id);
    this.persist();
    return true;
  }

  // --- Timeline ---
  getTimeline(): CareerTimelineEvent[] {
    return this.state.timeline;
  }

  addTimelineEvent(event: Omit<CareerTimelineEvent, 'id'>): CareerTimelineEvent {
    const newEvent: CareerTimelineEvent = {
      ...event,
      id: `tl-${Date.now()}`,
    };
    this.state.timeline.unshift(newEvent);
    this.persist();
    return newEvent;
  }

  // --- Notifications ---
  getNotifications() {
    return this.state.notifications;
  }

  markNotificationRead(id: string) {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    this.persist();
  }

  // --- Reset & Export ---
  exportData(): LocalDatabaseState {
    return this.state;
  }

  resetData(): LocalDatabaseState {
    this.state = JSON.parse(JSON.stringify(initialDbData)) as LocalDatabaseState;
    this.persist();
    return this.state;
  }
}

export const clientDb = new ClientDatabaseService();
