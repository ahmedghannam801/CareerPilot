import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { NavigationRail } from './components/layout/NavigationRail.js';
import { ContextualRightPanel } from './components/layout/ContextualRightPanel.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { CareerView } from './components/career/CareerView.js';
import { CVStudioView } from './components/cv/CVStudioView.js';
import { OpportunitiesView } from './components/opportunities/OpportunitiesView.js';
import { ApplicationsTrackerView } from './components/applications/ApplicationsTrackerView.js';
import { MicroProjectsView } from './components/projects/MicroProjectsView.js';
import { EmailIntelligenceView } from './components/email/EmailIntelligenceView.js';
import { InterviewSimulatorView } from './components/interviews/InterviewSimulatorView.js';
import { AIAssistantView } from './components/assistant/AIAssistantView.js';
import { SettingsAndPrivacyView } from './components/settings/SettingsAndPrivacyView.js';
import { OnboardingModal } from './components/onboarding/OnboardingModal.js';
import { LinkedInSyncModal } from './components/linkedin/LinkedInSyncModal.js';
import { CommandPaletteModal } from './components/common/CommandPaletteModal.js';
import { FloatingAICopilot } from './components/common/FloatingAICopilot.js';
import { MobileNav } from './components/layout/MobileNav.js';
import { LoginPage } from './components/auth/LoginPage.js';
import { LearningRoadmapsView } from './components/roadmaps/LearningRoadmapsView.js';
import { api } from './lib/api.js';
import { clientDb } from './lib/clientDb.js';
import { onAuthStateChange, signOut, loadProfileFromCloud, loadResumesFromCloud } from './lib/supabaseClient.js';
import {
  CareerProfile,
  ResumeVersion,
  Opportunity,
  Application,
  MicroProject,
  Course,
  EmailEvent,
  InterviewSession,
  CareerMemoryFact,
  CareerTimelineEvent,
} from './types/index.js';

const VALID_TABS: Record<string, string> = {
  '': 'dashboard',
  'dashboard': 'dashboard',
  'home': 'dashboard',
  'career': 'career',
  'journey': 'career',
  'cv': 'cv',
  'workspace': 'cv',
  'cv-builder': 'cv',
  'resume': 'cv',
  'opportunities': 'opportunities',
  'jobs': 'opportunities',
  'applications': 'applications',
  'tracker': 'applications',
  'projects': 'projects',
  'courses': 'courses',
  'learning': 'courses',
  'roadmap': 'courses',
  'roadmaps': 'courses',
  'email': 'email',
  'interviews': 'interviews',
  'assistant': 'assistant',
  'ai': 'assistant',
  'settings': 'settings',
};

function getTabFromPathname(pathname: string): { tab: string; isNotFound: boolean } {
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const firstSegment = clean.split('/')[0];
  if (firstSegment in VALID_TABS) {
    return { tab: VALID_TABS[firstSegment], isNotFound: false };
  }
  return { tab: 'not-found', isNotFound: true };
}

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar'>(() => {
    return (localStorage.getItem('careerpilot_lang') as 'en' | 'ar') || 'ar';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('careerpilot_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('careerpilot_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [currentTab, setCurrentTab] = useState<string>(() => {
    return getTabFromPathname(window.location.pathname).tab;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Entities
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<MicroProject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [emailEvents, setEmailEvents] = useState<EmailEvent[]>([]);
  const [emailStatus, setEmailStatus] = useState<any>({
    connected: false,
    hasOAuthCredentials: false,
    missingRequirement: null,
  });
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [memoryFacts, setMemoryFacts] = useState<CareerMemoryFact[]>([]);
  const [timeline, setTimeline] = useState<CareerTimelineEvent[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Selection states
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedProject, setSelectedProject] = useState<MicroProject | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLinkedInSync, setShowLinkedInSync] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [linkedinNotification, setLinkedinNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auth session state: 'checking' | 'authenticated' | 'unauthenticated'
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const isAuthenticated = authState === 'authenticated';

  // Auth state for onboarding
  const [authUser, setAuthUser] = useState<{ id: string; email?: string; fullName?: string } | null>(null);

  // Subscribe to real Supabase auth changes (fires on page load + after OAuth redirect)
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (_event, user, _session) => {
      if (user) {
        setAuthUser({ id: user.id, email: user.email, fullName: user.user_metadata?.full_name });
        clientDb.setUserId(user.id, {
          email: user.email,
          fullName: user.user_metadata?.full_name,
        });
        setAuthState('authenticated');
        // Attempt cloud profile load
        const cloudProfile = await loadProfileFromCloud();
        if (cloudProfile) {
          clientDb.setProfile(cloudProfile);
          setProfile(cloudProfile);
          // Trigger onboarding if user hasn't completed it
          if (!cloudProfile.onboardingCompleted) {
            setShowOnboarding(true);
          }
        } else {
          // New user with no cloud profile yet
          const localProfile = clientDb.getProfile();
          setProfile(localProfile);
          if (!localProfile.onboardingCompleted) {
            setShowOnboarding(true);
          }
        }
        // Load cloud resumes if available
        const cloudResumes = await loadResumesFromCloud();
        if (cloudResumes && cloudResumes.length > 0) {
          setResumes(cloudResumes);
        }
        await loadAllData();
      } else {
        setAuthUser(null);
        clientDb.clearUser();
        setAuthState('unauthenticated');
        // Clear state to prevent cross-user contamination
        setProfile(null);
        setResumes([]);
        setOpportunities([]);
        setApplications([]);
        setProjects([]);
        setCourses([]);
        setEmailEvents([]);
        setInterviews([]);
        setMemoryFacts([]);
        setTimeline([]);
        setNotifications([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Called by LoginPage for demo/fallback login (Supabase handles real auth)
  const handleLogin = (user?: { email: string; name: string }) => {
    if (user?.email) {
      setAuthState('authenticated');
      loadAllData();
      const currentProf = clientDb.getProfile();
      if (!currentProf.onboardingCompleted) {
        setShowOnboarding(true);
      }
    }
    setCurrentTab('dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    clientDb.clearUser();
    setAuthUser(null);
    setAuthState('unauthenticated');
    setProfile(null);
    setResumes([]);
    setOpportunities([]);
    setApplications([]);
    setProjects([]);
    setCourses([]);
    setCurrentTab('dashboard');
  };

  // Navigation that syncs URL history and respects browser back/forward
  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    const targetPath = tab === 'dashboard' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const { tab } = getTabFromPathname(window.location.pathname);
      setCurrentTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch initial state with resilient Promise.allSettled
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        api.getProfile(),
        api.getResumes(),
        api.getOpportunities(),
        api.getApplications(),
        api.getProjects(),
        api.getCourses(),
        api.getEmailEvents(),
        api.getEmailStatus(),
        api.getInterviews(),
        api.getMemory(),
        api.getTimeline(),
        api.getNotifications(),
      ]);

      const [
        profileRes,
        resumesRes,
        oppsRes,
        appsRes,
        projectsRes,
        coursesRes,
        emailEventsRes,
        emailStatusRes,
        interviewsRes,
        memoryRes,
        timelineRes,
        notifsRes,
      ] = results;

      if (profileRes.status === 'fulfilled' && profileRes.value?.profile) {
        setProfile(profileRes.value.profile);
      } else {
        setProfile(clientDb.getProfile());
      }
      if (resumesRes.status === 'fulfilled' && resumesRes.value?.resumes) {
        setResumes(resumesRes.value.resumes);
      } else {
        setResumes(clientDb.getResumes());
      }
      if (oppsRes.status === 'fulfilled' && oppsRes.value?.opportunities) {
        setOpportunities(oppsRes.value.opportunities);
      } else {
        setOpportunities(clientDb.getOpportunities());
      }
      if (appsRes.status === 'fulfilled' && appsRes.value?.applications) {
        setApplications(appsRes.value.applications);
      } else {
        setApplications(clientDb.getApplications());
      }
      if (projectsRes.status === 'fulfilled' && projectsRes.value?.projects) {
        setProjects(projectsRes.value.projects);
      } else {
        setProjects(clientDb.getProjects());
      }
      if (coursesRes.status === 'fulfilled' && coursesRes.value?.courses) {
        setCourses(coursesRes.value.courses);
      } else {
        setCourses(clientDb.getCourses());
      }
      if (emailEventsRes.status === 'fulfilled' && emailEventsRes.value?.events) {
        setEmailEvents(emailEventsRes.value.events);
      } else {
        setEmailEvents(clientDb.getEmailEvents());
      }
      if (emailStatusRes.status === 'fulfilled' && emailStatusRes.value) {
        setEmailStatus(emailStatusRes.value);
      } else {
        setEmailStatus(clientDb.getEmailStatus());
      }
      if (interviewsRes.status === 'fulfilled' && interviewsRes.value?.interviews) {
        setInterviews(interviewsRes.value.interviews);
      } else {
        setInterviews(clientDb.getInterviews());
      }
      if (memoryRes.status === 'fulfilled' && memoryRes.value?.memory) {
        setMemoryFacts(memoryRes.value.memory);
      } else {
        setMemoryFacts(clientDb.getMemory());
      }
      if (timelineRes.status === 'fulfilled' && timelineRes.value?.timeline) {
        setTimeline(timelineRes.value.timeline);
      } else {
        setTimeline(clientDb.getTimeline());
      }
      if (notifsRes.status === 'fulfilled' && notifsRes.value?.notifications) {
        setNotifications(notifsRes.value.notifications);
      } else {
        setNotifications(clientDb.getNotifications());
      }
    } catch (err: unknown) {
      console.warn('Network unavailable, running in resilient client mode:', err);
      setProfile(clientDb.getProfile());
      setResumes(clientDb.getResumes());
      setOpportunities(clientDb.getOpportunities());
      setApplications(clientDb.getApplications());
      setProjects(clientDb.getProjects());
      setCourses(clientDb.getCourses());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authState === 'authenticated') {
      loadAllData();
    }
  }, [authState]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('linkedin_connected') === 'true') {
      setLinkedinNotification({
        type: 'success',
        message:
          lang === 'ar'
            ? 'تم ربط حسابك في LinkedIn ومزامنة بيانات الملف الشخصي بنجاح!'
            : 'LinkedIn profile connected and synchronized successfully!',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      loadAllData();
    } else if (params.get('error')) {
      setLinkedinNotification({
        type: 'error',
        message:
          lang === 'ar'
            ? `تعذر الربط مع LinkedIn: ${params.get('error')}`
            : `LinkedIn OAuth error: ${params.get('error')}`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [lang]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => {
      const next = prev === 'en' ? 'ar' : 'en';
      localStorage.setItem('careerpilot_lang', next);
      return next;
    });
  };

  // Handlers
  const handleUpdateProfile = async (partial: Partial<CareerProfile>) => {
    const res = await api.updateProfile(partial);
    setProfile(res.profile);
  };

  const handleRegenerateDNA = async () => {
    const res = await api.regenerateDNA();
    setProfile(res.profile);
    const tlRes = await api.getTimeline();
    setTimeline(tlRes.timeline);
  };

  const handleRefreshNBA = async () => {
    const res = await api.refreshNextBestAction();
    setProfile(res.profile);
  };

  const handleSaveResume = async (resume: ResumeVersion) => {
    const res = await api.saveResume(resume);
    setResumes((prev) => {
      const exists = prev.some((r) => r.id === res.resume.id);
      if (exists) {
        return prev.map((r) => (r.id === res.resume.id ? res.resume : r));
      }
      return [res.resume, ...prev];
    });
  };

  const handleAnalyzeResume = async (resumeId: string) => {
    const res = await api.analyzeResume(resumeId, profile?.targetRole);
    return res.ats;
  };

  const handleTailorCV = async (payload: {
    opportunityId?: string;
    customJobDescription?: string;
    customJobTitle?: string;
    customCompany?: string;
    resumeId?: string;
    targetRole?: string;
  }) => {
    const res = await api.tailorCV(payload);
    if (res?.tailoredResume) {
      setResumes((prev) => {
        const exists = prev.some((r) => r.id === res.tailoredResume.id);
        if (exists) {
          return prev.map((r) => (r.id === res.tailoredResume.id ? res.tailoredResume : r));
        }
        return [res.tailoredResume, ...prev];
      });
    }
    return res;
  };

  // String-based wrapper used by OpportunitiesView / TailoredCVModal
  const handleTailorCVById = async (opportunityId: string) => {
    return handleTailorCV({ opportunityId });
  };

  const handleAddOpportunity = async (opp: Partial<Opportunity>) => {
    const res = await api.addOpportunity(opp);
    setOpportunities((prev) => [res.opportunity, ...prev]);
  };

  const handleDeleteOpportunity = async (id: string) => {
    await api.deleteOpportunity(id);
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
  };

  const handleCalculateMatch = async (opportunityId: string) => {
    const res = await api.calculateMatch(opportunityId);
    return res.matchAnalysis;
  };

  const handlePrepareApplication = async (opportunityId: string) => {
    const opp = opportunities.find((o) => o.id === opportunityId);
    if (!opp) return;

    // Check if application exists
    let app = applications.find((a) => a.opportunityId === opportunityId);
    if (!app) {
      const res = await api.saveApplication({
        opportunityId: opp.id,
        jobTitle: opp.title,
        company: opp.company,
        status: 'Preparing',
        answers: [],
        events: [
          {
            id: `evt-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'APPLICATION_CREATED',
            description: `Started preparation for ${opp.title} at ${opp.company}`,
          },
        ],
      });
      app = res.application;
      setApplications((prev) => [app!, ...prev]);
    }
    handleNavigate('applications');
  };

  const handleSaveApplication = async (app: Partial<Application>) => {
    const res = await api.saveApplication(app);
    setApplications((prev) => {
      const idx = prev.findIndex((a) => a.id === res.application.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = res.application;
        return copy;
      }
      return [res.application, ...prev];
    });
  };

  const handleGenerateProject = async (skillGap: string) => {
    const res = await api.generateProject(skillGap, profile?.targetRole);
    setProjects((prev) => [res.project, ...prev]);
    return res.project;
  };

  const handleSubmitProject = async (
    id: string,
    data: { summary: string; codeUrl?: string; liveDemoUrl?: string }
  ) => {
    const res = await api.submitProject(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? res.project : p)));
    // Refresh profile to reflect added evidence
    const profRes = await api.getProfile();
    setProfile(profRes.profile);
    const tlRes = await api.getTimeline();
    setTimeline(tlRes.timeline);
    return res;
  };

  const handleEnrollCourse = async (id: string) => {
    const res = await api.enrollCourse(id);
    setCourses((prev) => prev.map((c) => (c.id === id ? res.course : c)));
    return res;
  };

  const handleUpdateCourseProgress = async (
    id: string,
    progress: number,
    completedModuleId?: string
  ) => {
    const res = await api.updateCourseProgress(id, progress, completedModuleId);
    setCourses((prev) => prev.map((c) => (c.id === id ? res.course : c)));
    return res;
  };

  const handleCompleteCourse = async (
    id: string,
    notes?: string,
    certUrl?: string
  ) => {
    const res = await api.completeCourse(id, notes, certUrl);
    setCourses((prev) => prev.map((c) => (c.id === id ? res.course : c)));
    setProfile(res.profile);
    const tlRes = await api.getTimeline();
    setTimeline(tlRes.timeline);
    const notifs = await api.getNotifications();
    setNotifications(notifs.notifications);
    return res;
  };

  const handleAddCourse = async (course: Partial<Course>) => {
    const res = await api.saveCourse(course);
    setCourses((prev) => [res.course, ...prev]);
    return res;
  };

  const handleDeleteCourse = async (id: string) => {
    await api.deleteCourse(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRecommendCourses = async (focusArea?: string) => {
    const res = await api.recommendCourses(focusArea);
    setCourses(res.courses);
    return res;
  };

  const handleClassifyEmail = async (data: {
    subject: string;
    sender: string;
    snippet: string;
    id?: string;
  }) => {
    const res = await api.classifyEmail(data);
    setEmailEvents((prev) => {
      const idx = prev.findIndex((e) => (data.id && e.id === data.id) || e.subject === data.subject);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...res.event, processed: true, read: true };
        return copy;
      }
      return [{ ...res.event, processed: true, read: true }, ...prev];
    });
    const appsRes = await api.getApplications();
    setApplications(appsRes.applications);
    const tlRes = await api.getTimeline();
    setTimeline(tlRes.timeline);
    return res;
  };

  const handleMarkEmailRead = async (id: string) => {
    await api.markEmailRead(id);
    setEmailEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, read: !e.read, processed: true } : e))
    );
  };

  const handleStartInterview = async (data: {
    jobRole?: string;
    type: 'HR' | 'Behavioral' | 'Technical' | 'Mixed';
  }) => {
    const res = await api.startInterview(data);
    setInterviews((prev) => [res.session, ...prev]);
    return res.session;
  };

  const handleSubmitInterviewAnswer = async (
    id: string,
    data: { questionIndex: number; answer: string }
  ) => {
    const res = await api.submitInterviewAnswer(id, data);
    setInterviews((prev) => prev.map((i) => (i.id === id ? res.session : i)));
    const tlRes = await api.getTimeline();
    setTimeline(tlRes.timeline);
    return res;
  };

  const handleAddMemory = async (data: Omit<CareerMemoryFact, 'id' | 'updatedAt'>) => {
    const res = await api.addMemoryFact(data);
    setMemoryFacts((prev) => [res.fact, ...prev]);
  };

  const handleDeleteMemory = async (id: string) => {
    await api.deleteMemoryFact(id);
    setMemoryFacts((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleResetData = async () => {
    await api.resetSystemData();
    await loadAllData();
  };

  const handleParseLinkedInProfile = async (rawText: string) => {
    return api.parseLinkedInProfile(rawText);
  };

  const handleSyncLinkedInProfile = async (extracted: any) => {
    const res = await api.syncLinkedInProfile(extracted);
    setProfile(res.profile);
    setResumes((prev) => [res.resume, ...prev]);
    const tlRes = await api.getTimeline();
    setTimeline(tlRes.timeline);
    const notifs = await api.getNotifications();
    setNotifications(notifs.notifications);
    return res;
  };

  const handleSyncPlatformFeeds = async () => {
    const res = await api.syncPlatformFeeds();
    setOpportunities(res.opportunities);
    const tlRes = await api.getTimeline();
    setTimeline(tlRes.timeline);
    return res;
  };

  // While Supabase resolves the initial session (e.g. after OAuth redirect) show a neutral spinner
  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">CareerPilot AI</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        lang={lang}
        onToggleLang={handleToggleLang}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 text-xs text-neutral-600">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-medium">Initializing CareerPilot AI Operating System...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    const fallbackProfile = clientDb.getProfile();
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 text-xs text-neutral-800">
        <div className="bg-white border border-neutral-200 p-6 rounded-xl max-w-md w-full text-center space-y-4">
          <h2 className="text-sm font-bold text-neutral-900">CareerPilot AI</h2>
          <p className="text-neutral-600">Initializing your career workspace...</p>
          <button
            onClick={() => {
              setProfile(fallbackProfile);
            }}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold"
          >
            Launch Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#f8fafc] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white"
    >
      {/* Top Bar Contract (Brand - Nav Links - Primary Action) */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        lang={lang}
        onToggleLang={handleToggleLang}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onStartOnboarding={() => setShowOnboarding(true)}
        onOpenLinkedInSync={() => setShowLinkedInSync(true)}
        onOpenSearch={() => setShowCommandPalette(true)}
        onLogout={handleLogout}
        profile={profile}
      />
      {/* LinkedIn OAuth Status Banner */}
      {linkedinNotification && (
        <div
          className={`px-4 py-2.5 text-xs flex items-center justify-between border-b transition-all ${
            linkedinNotification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">
              {linkedinNotification.type === 'success' ? 'LinkedIn:' : 'LinkedIn Notice:'}
            </span>
            <span>{linkedinNotification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setLinkedinNotification(null)}
            className="p-1 hover:opacity-70 text-slate-500 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1">
        {/* Modern Compact Navigation Rail */}
        <NavigationRail
          currentTab={currentTab}
          onNavigate={handleNavigate}
          lang={lang}
          onToggleLang={handleToggleLang}
          onLogout={handleLogout}
          profile={profile}
          metrics={{
            applicationsCount: applications.length,
            projectsCount: projects.length,
            coursesCount: courses.length,
            emailEventsCount: emailEvents.filter((e) => !e.read && !e.processed).length,
            readinessScore: profile.readiness?.overallScore,
          }}
        />

        {/* Central Workspace Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {currentTab === 'dashboard' && (
                <DashboardView
              profile={profile}
              opportunities={opportunities}
              applications={applications}
              emailEvents={emailEvents}
              projects={projects}
              courses={courses}
              resumes={resumes}
              interviews={interviews}
              onNavigate={handleNavigate}
              onRefreshNBA={handleRefreshNBA}
              onSelectOpportunity={(opp) => {
                setSelectedOpportunity(opp);
                handleNavigate('opportunities');
              }}
              onSelectProject={(proj) => {
                setSelectedProject(proj);
                handleNavigate('projects');
              }}
              lang={lang}
            />
          )}

          {currentTab === 'career' && (
            <CareerView
              profile={profile}
              timeline={timeline}
              resumes={resumes}
              opportunities={opportunities}
              applications={applications}
              projects={projects}
              courses={courses}
              interviews={interviews}
              onNavigate={handleNavigate}
              onUpdateProfile={handleUpdateProfile}
              onRegenerateDNA={handleRegenerateDNA}
              onRunDiscovery={(answers) => api.runDiscovery(answers)}
              onOpenLinkedInSync={() => setShowLinkedInSync(true)}
              lang={lang}
            />
          )}

          {currentTab === 'cv' && (
            <CVStudioView
              resumes={resumes}
              opportunities={opportunities}
              profile={profile}
              onSaveResume={handleSaveResume}
              onAnalyzeResume={handleAnalyzeResume}
              onTailorCV={handleTailorCV}
              onOpenLinkedInSync={() => setShowLinkedInSync(true)}
              lang={lang}
            />
          )}

          {currentTab === 'opportunities' && (
            <OpportunitiesView
              opportunities={opportunities}
              onAddOpportunity={handleAddOpportunity}
              onDeleteOpportunity={handleDeleteOpportunity}
              onParseJD={(rawText) => api.parseJobDescription(rawText)}
              onCalculateMatch={handleCalculateMatch}
              onPrepareApplication={handlePrepareApplication}
              onSyncFeeds={handleSyncPlatformFeeds}
              onGetPlatformsStatus={api.getPlatformsStatus}
              onTailorCV={handleTailorCVById}
              onSaveResume={handleSaveResume}
              onNavigateToCV={() => handleNavigate('cv')}
              lang={lang}
            />
          )}

          {currentTab === 'applications' && (
            <ApplicationsTrackerView
              applications={applications}
              opportunities={opportunities}
              resumes={resumes}
              onSaveApplication={handleSaveApplication}
              onGenerateCoverLetter={(oppId) => api.generateCoverLetter(oppId)}
              onEvaluateQuality={(id) => api.evaluateApplicationQuality(id)}
              onNavigateToCV={() => handleNavigate('cv')}
              lang={lang}
            />
          )}

          {currentTab === 'projects' && (
            <MicroProjectsView
              projects={projects}
              profile={profile}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
              onGenerateProject={handleGenerateProject}
              onSubmitProject={handleSubmitProject}
              lang={lang}
            />
          )}

          {currentTab === 'courses' && (
            <LearningRoadmapsView
              profile={profile}
              projects={projects}
              onNavigateTab={handleNavigate}
              lang={lang}
            />
          )}

          {currentTab === 'email' && (
            <EmailIntelligenceView
              emailEvents={emailEvents}
              emailStatus={emailStatus}
              onClassifyEmail={handleClassifyEmail}
              onMarkEmailRead={handleMarkEmailRead}
              lang={lang}
            />
          )}

          {currentTab === 'interviews' && (
            <InterviewSimulatorView
              interviews={interviews}
              profile={profile}
              onStartInterview={handleStartInterview}
              onSubmitAnswer={handleSubmitInterviewAnswer}
              lang={lang}
            />
          )}

          {currentTab === 'assistant' && (
            <AIAssistantView
              profile={profile}
              onSendMessage={(msg, hist) =>
                api.sendAssistantMessage(msg, hist).then((r) => r.reply)
              }
              onNavigate={handleNavigate}
              lang={lang}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsAndPrivacyView
              memoryFacts={memoryFacts}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onExportData={() => api.exportSystemData()}
              onResetData={handleResetData}
              lang={lang}
              theme={theme}
              onSetTheme={setTheme}
            />
          )}

          {/* 404 Route Fallback - Never silently dump to homepage */}
          {currentTab === 'not-found' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-black text-lg">
                404
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'الصفحة المطلوبة غير موجودة' : 'Page Not Found'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'ar'
                  ? `المسار (${window.location.pathname}) غير مسجل في النظام. يمكنك العودة إلى مساحة العمل أو الانتقال لأحد الأقسام الرئيسية مباشرة.`
                  : `The requested path "${window.location.pathname}" does not resolve to an active section.`}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigate('dashboard')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'العودة للرئيسية' : 'Return to Dashboard'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('cv')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'استوديو السيرة الذاتية' : 'CV Studio'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('opportunities')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'اكتشف الوظائف' : 'Opportunities'}
                </button>
              </div>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Adaptive Contextual Right Panel (Desktop) */}
        <ContextualRightPanel
          currentTab={currentTab}
          profile={profile}
          resumes={resumes}
          opportunities={opportunities}
          applications={applications}
          projects={projects}
          courses={courses}
          onNavigate={handleNavigate}
          lang={lang}
        />
      </div>

      {/* Progressive AI Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={async (data, selectedRoadmapId, weeklyHours) => {
          // 1. Save profile (syncs to Supabase automatically via clientDb)
          await handleUpdateProfile({ ...data, onboardingCompleted: true });

          // 2. Enroll into matching roadmap
          if (selectedRoadmapId) {
            try {
              clientDb.enrollInRoadmap(selectedRoadmapId, weeklyHours || 5);
            } catch (e) {
              console.warn('[Onboarding] Roadmap enrollment warning:', e);
            }
          }

          // 3. Generate Career DNA from real AI using new profile
          try { await handleRegenerateDNA(); } catch { /* non-fatal */ }

          // 4. Generate NBA from real AI
          try { await handleRefreshNBA(); } catch { /* non-fatal */ }

          // 5. Reload all data to refresh dashboards & journeys
          await loadAllData();

          setShowOnboarding(false);
          handleNavigate('dashboard');
        }}
        lang={lang}
        userId={authUser?.id}
        userEmail={authUser?.email}
        userFullName={authUser?.fullName}
      />

      {/* LinkedIn Profile & CV Sync Modal */}
      <LinkedInSyncModal
        isOpen={showLinkedInSync}
        onClose={() => setShowLinkedInSync(false)}
        onParseProfile={handleParseLinkedInProfile}
        onSyncProfile={handleSyncLinkedInProfile}
        lang={lang}
      />

      {/* Global Quick Search & Command Palette (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={handleNavigate}
        opportunities={opportunities}
        onOpenLinkedInSync={() => setShowLinkedInSync(true)}
        onStartOnboarding={() => setShowOnboarding(true)}
        lang={lang}
      />

      {/* Floating AI Career Copilot on every page */}
      <FloatingAICopilot
        profile={profile}
        onSendMessage={(msg, hist) =>
          api.sendAssistantMessage(msg, hist).then((r) => r.reply)
        }
        onNavigate={handleNavigate}
        lang={lang}
      />

      {/* Mobile Sticky Bottom Navigation & Menu Drawer */}
      <MobileNav
        currentTab={currentTab}
        onNavigate={handleNavigate}
        lang={lang}
        onToggleLang={handleToggleLang}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onStartOnboarding={() => setShowOnboarding(true)}
        onOpenLinkedInSync={() => setShowLinkedInSync(true)}
        metrics={{
          applicationsCount: applications.length,
          projectsCount: projects.length,
          coursesCount: courses.length,
          emailEventsCount: emailEvents.filter((e) => !e.read && !e.processed).length,
          readinessScore: profile.readiness?.overallScore,
        }}
      />
    </div>
  );
}
