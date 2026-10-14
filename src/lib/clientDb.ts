import initialDbData from '../../data/careerpilot_db.json';
import { INITIAL_ROADMAPS } from '../data/roadmapsData.js';
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
  LearningRoadmap,
  UserRoadmapEnrollment,
  RoadmapResource,
  WeeklyLearningPlan,
  NodeProgressStatus,
} from '../types/index.js';
import {
  syncProfileToCloud,
  syncOpportunityToCloud,
  syncApplicationToCloud,
  syncResumeToCloud,
} from './supabaseClient.js';

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
  roadmaps?: LearningRoadmap[];
  userEnrollments?: UserRoadmapEnrollment[];
  savedResources?: RoadmapResource[];
  weeklyLearningPlans?: WeeklyLearningPlan[];
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
  private currentUserId: string | null = null;
  private memoryStore: Map<string, LocalDatabaseState> = new Map();

  constructor() {
    this.state = this.loadState();
  }

  private getStorageKey(): string {
    return this.currentUserId
      ? `careerpilot_client_db_${this.currentUserId}`
      : 'careerpilot_client_db_guest';
  }

  public getUserId(): string | null {
    return this.currentUserId;
  }

  public setUserId(userId: string | null, userMeta?: { email?: string; fullName?: string }): void {
    if (this.currentUserId === userId) return;
    if (this.state) {
      this.memoryStore.set(this.getStorageKey(), JSON.parse(JSON.stringify(this.state)));
    }
    this.currentUserId = userId;
    this.state = this.loadState(userMeta);
  }

  public clearUser(): void {
    if (this.state) {
      this.memoryStore.set(this.getStorageKey(), JSON.parse(JSON.stringify(this.state)));
    }
    this.currentUserId = null;
    this.state = this.loadState();
  }

  public setProfile(profile: CareerProfile): void {
    this.state.profile = profile;
    this.persist();
  }

  public setOpportunities(opps: Opportunity[]): void {
    this.state.opportunities = opps;
    this.persist();
  }

  public setApplications(apps: Application[]): void {
    this.state.applications = apps;
    this.persist();
  }

  private loadState(userMeta?: { email?: string; fullName?: string }): LocalDatabaseState {
    const key = this.getStorageKey();
    if (this.memoryStore.has(key)) {
      return JSON.parse(JSON.stringify(this.memoryStore.get(key)!));
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.profile) {
            this.memoryStore.set(key, parsed);
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[ClientDB] Failed to load from localStorage:', e);
      }
    }

    // Authenticated user with no existing cache — create an isolated blank state
    if (this.currentUserId && this.currentUserId !== 'demo-user') {
      const freshUserState: LocalDatabaseState = {
        profile: {
          id: this.currentUserId,
          fullName: userMeta?.fullName || '',
          email: userMeta?.email || '',
          headline: '',
          location: '',
          careerStatus: 'fresh_graduate',
          targetRole: '',
          targetIndustries: [],
          targetSalary: '',
          onboardingCompleted: false,
          education: [],
          experience: [],
          skills: [],
        },
        resumes: [],
        atsAnalysis: {},
        opportunities: [],
        applications: [],
        microProjects: [],
        courses: [],
        emailEvents: [],
        interviews: [],
        careerMemory: [],
        timeline: [],
        emailAccountConnected: false,
        roadmaps: [...INITIAL_ROADMAPS],
        userEnrollments: [],
        savedResources: [],
        weeklyLearningPlans: [],
        notifications: [],
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(key, JSON.stringify(freshUserState));
        } catch {}
      }
      return freshUserState;
    }

    return JSON.parse(JSON.stringify(initialDbData)) as LocalDatabaseState;
  }

  private persist() {
    const key = this.getStorageKey();
    this.memoryStore.set(key, JSON.parse(JSON.stringify(this.state)));
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, JSON.stringify(this.state));
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
    syncProfileToCloud(this.state.profile).catch(() => {});
    return this.state.profile;
  }

  /** DNA is generated server-side via AI from the real profile. This only persists the result. */
  setDNA(dna: CareerDNA): CareerProfile {
    this.state.profile.dna = dna;
    this.persist();
    syncProfileToCloud(this.state.profile).catch(() => {});
    return this.state.profile;
  }

  /** NBA is generated server-side via AI. This only persists the result. */
  setNBA(nba: NextBestAction): CareerProfile {
    this.state.profile.nextBestAction = nba;
    this.persist();
    return this.state.profile;
  }

  /** User-scoped template preference */
  getCVTemplate(): string {
    if (typeof window === 'undefined') return 'google_doc';
    const key = this.currentUserId ? `careerpilot_cv_template_${this.currentUserId}` : 'careerpilot_cv_template';
    return window.localStorage.getItem(key) || 'google_doc';
  }

  setCVTemplate(template: string): void {
    if (typeof window === 'undefined') return;
    const key = this.currentUserId ? `careerpilot_cv_template_${this.currentUserId}` : 'careerpilot_cv_template';
    window.localStorage.setItem(key, template);
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
    syncResumeToCloud(resume).catch(() => {});
    return resume;
  }

  deleteResume(id: string): boolean {
    this.state.resumes = this.state.resumes.filter((r) => r.id !== id);
    delete this.state.atsAnalysis[id];
    this.persist();
    return true;
  }

  getATSAnalysis(resumeId: string): ATSAnalysis {
    if (this.state.atsAnalysis[resumeId]) {
      return this.state.atsAnalysis[resumeId];
    }
    const resume = this.state.resumes.find((r) => r.id === resumeId);
    if (resume) {
      // Import evaluateResumeQuality logic
      const analysis: ATSAnalysis = {
        overallScore: resume.atsScore || 0,
        strengths: resume.atsScore ? ['Structured CV formatting detected'] : [],
        weaknesses: resume.atsScore ? [] : ['Resume has not been analyzed yet'],
        recommendations: resume.atsScore ? [] : ['Click Analyze to audit resume quality'],
        missingKeywords: [],
        formattingScore: resume.atsScore ? 85 : 0,
        relevanceScore: resume.atsScore || 0,
        impactScore: resume.atsScore || 0,
      };
      this.state.atsAnalysis[resumeId] = analysis;
      return analysis;
    }
    return {
      overallScore: 0,
      strengths: [],
      weaknesses: ['Resume not found or not analyzed yet.'],
      recommendations: ['Upload or create your CV to get your score.'],
      missingKeywords: [],
      formattingScore: 0,
      relevanceScore: 0,
      impactScore: 0,
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
    syncOpportunityToCloud(newOpp).catch(() => {});
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
    syncApplicationToCloud(fullApp).catch(() => {});
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

  markEmailEventRead(id: string, explicitReadState?: boolean): EmailEvent | null {
    const event = this.state.emailEvents.find((e) => e.id === id);
    if (event) {
      const target = explicitReadState !== undefined ? explicitReadState : !(event.read || event.processed);
      event.read = target;
      event.processed = target;
      this.persist();
      return event;
    }
    return null;
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

  // --- Learning Roadmaps & Progress ---
  getRoadmaps(): LearningRoadmap[] {
    if (!this.state.roadmaps || this.state.roadmaps.length === 0) {
      this.state.roadmaps = [...INITIAL_ROADMAPS];
      this.persist();
    }
    return this.state.roadmaps;
  }

  getRoadmapById(id: string): LearningRoadmap | undefined {
    return this.getRoadmaps().find((r) => r.id === id || r.slug === id);
  }

  getUserEnrollments(): UserRoadmapEnrollment[] {
    return this.state.userEnrollments || [];
  }

  getUserEnrollment(roadmapId: string): UserRoadmapEnrollment | undefined {
    return (this.state.userEnrollments || []).find((e) => e.roadmapId === roadmapId && e.status !== 'completed');
  }

  enrollInRoadmap(roadmapId: string, weeklyHours = 5): UserRoadmapEnrollment {
    if (!this.state.userEnrollments) this.state.userEnrollments = [];
    const roadmap = this.getRoadmapById(roadmapId);
    if (!roadmap) throw new Error('Roadmap not found');

    const existing = this.state.userEnrollments.find((e) => e.roadmapId === roadmapId);
    if (existing) {
      existing.weeklyHoursCommitted = weeklyHours;
      existing.status = 'active';
      this.persist();
      return existing;
    }

    const firstStage = roadmap.stages[0];
    const firstNode = firstStage?.nodes[0];

    const initialNodeProgress: Record<string, { status: NodeProgressStatus; startedAt?: string }> = {};
    if (firstNode) {
      initialNodeProgress[firstNode.id] = {
        status: 'available',
      };
    }

    const enrollment: UserRoadmapEnrollment = {
      id: `enr-${Date.now()}`,
      userId: this.currentUserId || 'guest',
      roadmapId,
      targetRole: roadmap.targetRole,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      weeklyHoursCommitted: weeklyHours,
      currentStageId: firstStage?.id,
      currentNodeId: firstNode?.id,
      progressPercentage: 0,
      nodeProgress: initialNodeProgress,
      savedResourceIds: [],
      updatedAt: new Date().toISOString(),
    };

    this.state.userEnrollments.unshift(enrollment);
    this.addTimelineEvent({
      date: new Date().toISOString().split('T')[0],
      type: 'ROADMAP_ENROLLED',
      title: `Enrolled in ${roadmap.title}`,
      description: `Committed ${weeklyHours} hrs/week toward becoming a ${roadmap.targetRole}.`,
      source: 'User',
    });

    this.persist();
    return enrollment;
  }

  updateNodeProgress(
    enrollmentId: string,
    nodeId: string,
    status: NodeProgressStatus,
    notes?: string
  ): UserRoadmapEnrollment {
    if (!this.state.userEnrollments) this.state.userEnrollments = [];
    const enrollment = this.state.userEnrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const roadmap = this.getRoadmapById(enrollment.roadmapId);
    const existing = enrollment.nodeProgress[nodeId] || { status: 'not_started' };

    enrollment.nodeProgress[nodeId] = {
      ...existing,
      status,
      notes: notes ?? existing.notes,
      startedAt: status === 'in_progress' ? existing.startedAt || new Date().toISOString() : existing.startedAt,
      completedAt: status === 'completed' ? new Date().toISOString() : existing.completedAt,
    };

    // Recalculate percentage
    if (roadmap) {
      const allNodes: string[] = [];
      roadmap.stages.forEach((s) => s.nodes.forEach((n) => allNodes.push(n.id)));
      const completedCount = allNodes.filter((id) => enrollment.nodeProgress[id]?.status === 'completed').length;
      enrollment.progressPercentage = Math.round((completedCount / (allNodes.length || 1)) * 100);

      // If completed, add timeline milestone & skill
      if (status === 'completed') {
        const nodeObj = roadmap.stages.flatMap((s) => s.nodes).find((n) => n.id === nodeId);
        if (nodeObj) {
          this.addTimelineEvent({
            date: new Date().toISOString().split('T')[0],
            type: 'SKILL_COMPLETED',
            title: `Completed Skill: ${nodeObj.title}`,
            description: `Validated completion criteria for ${nodeObj.title} in ${roadmap.title}.`,
            source: 'User',
          });

          // Add or level up skill in profile
          const existingSkill = this.state.profile.skills.find(
            (s) => s.canonicalName.toLowerCase() === nodeObj.title.toLowerCase()
          );
          if (!existingSkill) {
            this.state.profile.skills.push({
              id: `sk-${Date.now()}`,
              canonicalName: nodeObj.title,
              category: 'Technical',
              level: nodeObj.difficulty,
              confidence: 85,
              evidenceCount: 1,
              lastAssessed: new Date().toISOString().split('T')[0],
              evidence: [
                {
                  id: `ev-${Date.now()}`,
                  skillName: nodeObj.title,
                  type: 'course',
                  title: `${roadmap.title} Node Mastery`,
                  date: new Date().toISOString().split('T')[0],
                  verified: true,
                },
              ],
            });
          }
        }
      }
    }

    enrollment.updatedAt = new Date().toISOString();
    this.persist();
    return enrollment;
  }

  saveResource(resource: RoadmapResource): void {
    if (!this.state.savedResources) this.state.savedResources = [];
    if (!this.state.savedResources.some((r) => r.id === resource.id)) {
      this.state.savedResources.unshift(resource);
      this.persist();
    }
  }

  unsaveResource(resourceId: string): void {
    if (!this.state.savedResources) return;
    this.state.savedResources = this.state.savedResources.filter((r) => r.id !== resourceId);
    this.persist();
  }

  getSavedResources(): RoadmapResource[] {
    return this.state.savedResources || [];
  }

  getWeeklyPlan(enrollmentId: string): WeeklyLearningPlan | undefined {
    return (this.state.weeklyLearningPlans || []).find((p) => p.enrollmentId === enrollmentId);
  }

  generateWeeklyPlan(enrollmentId: string, hours = 5): WeeklyLearningPlan {
    if (!this.state.weeklyLearningPlans) this.state.weeklyLearningPlans = [];
    const enrollment = this.state.userEnrollments?.find((e) => e.id === enrollmentId);
    const roadmap = enrollment ? this.getRoadmapById(enrollment.roadmapId) : undefined;

    const availableNodes = roadmap?.stages
      .flatMap((s) => s.nodes)
      .filter((n) => enrollment?.nodeProgress[n.id]?.status !== 'completed') || [];

    const selectedNodes = availableNodes.slice(0, 3);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const activities: WeeklyLearningPlan['activities'] = selectedNodes.flatMap((n, i) => [
      {
        id: `act-${n.id}-1`,
        nodeId: n.id,
        nodeTitle: n.title,
        activityTitle: `Study Core Theory: ${n.title}`,
        estimatedMinutes: Math.round((hours * 60 * 0.4) / selectedNodes.length),
        completed: false,
        resourceTitle: n.resources[0]?.title,
        resourceUrl: n.resources[0]?.url,
        dayOfWeek: days[i * 2] || 'Monday',
      },
      {
        id: `act-${n.id}-2`,
        nodeId: n.id,
        nodeTitle: n.title,
        activityTitle: `Hands-on Exercise: ${n.practicalExercise || n.completionCriteria}`,
        estimatedMinutes: Math.round((hours * 60 * 0.6) / selectedNodes.length),
        completed: false,
        dayOfWeek: days[i * 2 + 1] || 'Wednesday',
      },
    ]);

    const plan: WeeklyLearningPlan = {
      id: `wplan-${Date.now()}`,
      userId: this.currentUserId || 'guest',
      enrollmentId,
      weekNumber: 1,
      weekStartDate: new Date().toISOString().split('T')[0],
      targetHours: hours,
      completedHours: 0,
      activities,
    };

    this.state.weeklyLearningPlans = this.state.weeklyLearningPlans.filter((p) => p.enrollmentId !== enrollmentId);
    this.state.weeklyLearningPlans.push(plan);
    this.persist();
    return plan;
  }

  addCustomRoadmap(roadmap: LearningRoadmap): LearningRoadmap {
    if (!this.state.roadmaps) this.state.roadmaps = [...INITIAL_ROADMAPS];
    this.state.roadmaps.unshift(roadmap);
    this.persist();
    return roadmap;
  }

  // --- Reset & Export ---
  exportData(): LocalDatabaseState {
    return this.state;
  }

  resetData(): LocalDatabaseState {
    this.state = JSON.parse(JSON.stringify(initialDbData)) as LocalDatabaseState;
    this.state.roadmaps = [...INITIAL_ROADMAPS];
    this.persist();
    return this.state;
  }
}

export const clientDb = new ClientDatabaseService();
