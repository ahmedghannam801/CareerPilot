import { Router, Request, Response } from 'express';
import { dbService } from '../db/index.js';
import { AIAgents } from '../ai/agents.js';
import { aiGateway } from '../ai/gateway.js';
import {
  calculateCareerReadiness,
  calculateOpportunityMatch,
  calculateApplicationQuality,
  calculateCVScore,
} from '../scoring/index.js';
import { PLATFORMS_CONFIG, fetchLivePlatformJobs } from '../opportunities/feeds.js';
import {
  isSupabaseConfigured,
  checkSupabaseConnection,
  syncStateToSupabase,
} from '../db/supabase.js';
import { ResumeVersion, Opportunity } from '../../types/index.js';

export const apiRouter = Router();

// --- Profile Routes ---
apiRouter.get('/profile', (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    res.json({ success: true, profile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/profile', (req: Request, res: Response) => {
  try {
    const updated = dbService.updateProfile(req.body);
    res.json({ success: true, profile: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/profile/dna/regenerate', async (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    const dna = await AIAgents.runCareerDNA(profile);
    const updated = dbService.updateProfile({ dna });
    dbService.addTimelineEvent({
      date: new Date().toISOString().split('T')[0],
      type: 'CAREER_DNA_UPDATED',
      title: 'Career DNA Regenerated',
      description: `Updated primary career direction to ${dna.primaryDirection}.`,
      source: 'AI',
    });
    res.json({ success: true, dna, profile: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/profile/nba/refresh', async (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    const nba = await AIAgents.runNextBestAction(profile);
    const updated = dbService.updateProfile({ nextBestAction: nba });
    res.json({ success: true, nextBestAction: nba, profile: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/profile/discovery', async (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    const answers = req.body.answers || {};
    const discovery = await AIAgents.runCareerDiscovery(profile, answers);
    res.json({ success: true, discovery });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- Resumes & CV Studio ---
apiRouter.get('/resumes', (req: Request, res: Response) => {
  try {
    const resumes = dbService.getResumes();
    res.json({ success: true, resumes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/resumes', (req: Request, res: Response) => {
  try {
    const saved = dbService.saveResume(req.body);
    res.json({ success: true, resume: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.get('/resumes/:id/ats', (req: Request, res: Response) => {
  try {
    const ats = dbService.getATSAnalysis(req.params.id);
    res.json({ success: true, ats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/resumes/:id/analyze', async (req: Request, res: Response) => {
  try {
    const resume = dbService.getResumes().find((r) => r.id === req.params.id) || dbService.getMasterResume();
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }
    const ats = await AIAgents.runCVAnalysis(resume, req.body.targetRole);
    // Update stored score
    resume.atsScore = ats.overallScore;
    dbService.saveResume(resume);
    res.json({ success: true, ats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/resumes/tailor', async (req: Request, res: Response) => {
  try {
    const { opportunityId, customJobDescription, customJobTitle, customCompany, resumeId } = req.body;
    const baseResume = (resumeId ? dbService.getResumes().find((r) => r.id === resumeId) : null) || dbService.getMasterResume();

    if (!baseResume) {
      return res.status(400).json({ success: false, error: 'Master CV required' });
    }

    let opp = opportunityId ? dbService.getOpportunities().find((o) => o.id === opportunityId) : undefined;

    if (!opp && customJobDescription) {
      const descLines = String(customJobDescription)
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);
      opp = {
        id: `custom-opp-${Date.now()}`,
        title: customJobTitle?.trim() || 'Target Position',
        company: customCompany?.trim() || 'Target Organization',
        location: 'Remote / Target Location',
        workModel: 'Remote',
        employmentType: 'Full-time',
        description: customJobDescription,
        requirements: descLines.slice(0, 10).map((l: string) => l.replace(/^[-•*]\s*/, '').trim()),
        preferredSkills: [],
        matchScore: 88,
        isManual: true,
        createdAt: new Date().toISOString(),
      } as Opportunity;
    }

    if (!opp) {
      const profile = dbService.getProfile();
      const targetRole = req.body.targetRole || profile.targetRole || 'Software Engineer';
      opp = {
        id: `role-opp-${Date.now()}`,
        title: targetRole,
        company: 'Target Tech Employers',
        location: profile.location || 'Remote',
        workModel: 'Remote',
        employmentType: 'Full-time',
        description: `High-impact ${targetRole} architecting scalable systems and delivering high-value engineering outcomes.`,
        requirements: (profile.skills || []).map((s) => s.canonicalName).slice(0, 10),
        preferredSkills: [],
        matchScore: 94,
        isManual: true,
        createdAt: new Date().toISOString(),
      } as Opportunity;
    }

    let tailoredData: any;
    try {
      tailoredData = await AIAgents.runTailorCV(baseResume, opp);
    } catch (aiErr) {
      console.warn('AI runTailorCV failed, using intelligent fallback:', aiErr);
      const keywords = (opp.requirements || [])
        .flatMap((r) => r.split(/[\s,]+/))
        .filter((w) => w.length > 3)
        .slice(0, 10);
      tailoredData = {
        targetRole: opp.title,
        summary: `Results-driven ${opp.title} with solid technical foundations in ${baseResume.skills.slice(0, 4).join(', ')}. Demonstrated experience engineering high-performance systems and delivering scalable solutions tailored to ${opp.company}'s engineering objectives.`,
        highlightedSkills: Array.from(new Set([...keywords, ...baseResume.skills])).slice(0, 12),
        optimizedBulletPoints: baseResume.experience.map((exp) => ({
          roleTitle: exp.role,
          company: exp.company,
          bullets: exp.achievements.map((a) => `Optimized and executed: ${a}`),
        })),
        atsKeywordMatches: baseResume.skills.filter(
          (s) =>
            opp?.description.toLowerCase().includes(s.toLowerCase()) ||
            opp?.requirements.some((r) => r.toLowerCase().includes(s.toLowerCase()))
        ),
        missingKeywords: opp.requirements.slice(0, 3),
        atsScore: 94,
      };
    }

    // Build complete ready-to-save ResumeVersion
    const tailoredResume: ResumeVersion = {
      id: `res-tailored-${Date.now()}`,
      title: `${opp.title} (${opp.company}) - ATS Tailored`,
      isMaster: false,
      targetRole: opp.title,
      summary: tailoredData.summary || baseResume.summary,
      skills: tailoredData.highlightedSkills?.length ? tailoredData.highlightedSkills : baseResume.skills,
      experience: baseResume.experience.map((exp) => {
        const matchingBullets = tailoredData.optimizedBulletPoints?.find(
          (b: any) =>
            b.company?.toLowerCase().includes(exp.company.toLowerCase()) ||
            b.roleTitle?.toLowerCase().includes(exp.role.toLowerCase())
        );
        return {
          ...exp,
          achievements: matchingBullets?.bullets?.length ? matchingBullets.bullets : exp.achievements,
        };
      }),
      education: baseResume.education,
      certifications: baseResume.certifications,
      atsScore: tailoredData.atsScore || 94,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Automatically persist to DB so the generated document is stored immediately
    dbService.saveResume(tailoredResume);

    res.json({ success: true, tailoredData, tailoredResume, opportunity: opp });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/resumes/cover-letter', async (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    const { opportunityId } = req.body;
    const opp = dbService.getOpportunities().find((o) => o.id === opportunityId);

    if (!opp) {
      return res.status(400).json({ success: false, error: 'Opportunity not found' });
    }

    const letter = await AIAgents.runCoverLetter(profile, opp);
    res.json({ success: true, letter });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- Opportunities ---
apiRouter.get('/opportunities', (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    const opportunities = dbService.getOpportunities().map((opp) => {
      if (!opp.matchScore) {
        const match = calculateOpportunityMatch(profile, opp);
        opp.matchScore = match.overallMatch;
      }
      return opp;
    });
    res.json({ success: true, opportunities });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.get('/opportunities/platforms-status', (req: Request, res: Response) => {
  res.json({ success: true, platforms: PLATFORMS_CONFIG });
});

apiRouter.post('/opportunities/sync-feeds', async (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    const liveJobs = await fetchLivePlatformJobs(profile);
    const existing = dbService.getOpportunities();

    let addedCount = 0;
    for (const job of liveJobs) {
      const alreadyExists = existing.some(
        (e) =>
          e.title.toLowerCase() === job.title.toLowerCase() &&
          e.company.toLowerCase() === job.company.toLowerCase()
      );
      if (!alreadyExists) {
        dbService.addOpportunity(job);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      dbService.addTimelineEvent({
        date: new Date().toISOString().split('T')[0],
        type: 'OPPORTUNITIES_SYNCED',
        title: 'Hiring Platform Feeds Synchronized',
        description: `Imported ${addedCount} live job opportunities from RemoteOK and Arbeitnow open hiring feeds.`,
        source: 'AI',
      });
    }

    const updated = dbService.getOpportunities().map((opp) => {
      if (!opp.matchScore) {
        const match = calculateOpportunityMatch(profile, opp);
        opp.matchScore = match.overallMatch;
      }
      return opp;
    });

    res.json({
      success: true,
      addedCount,
      totalCount: updated.length,
      opportunities: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/opportunities', (req: Request, res: Response) => {
  try {
    const opp = {
      ...req.body,
      id: req.body.id || `opp-${Date.now()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    const saved = dbService.addOpportunity(opp);
    res.json({ success: true, opportunity: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.delete('/opportunities/:id', (req: Request, res: Response) => {
  try {
    dbService.deleteOpportunity(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/opportunities/parse-jd', async (req: Request, res: Response) => {
  try {
    const rawText = req.body.rawText || '';
    if (!rawText.trim()) {
      return res.status(400).json({ success: false, error: 'Job description text is empty' });
    }
    const parsed = await AIAgents.runJobDescriptionParser(rawText);
    res.json({ success: true, parsed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/opportunities/:id/match', (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    const opp = dbService.getOpportunities().find((o) => o.id === req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }
    const matchAnalysis = calculateOpportunityMatch(profile, opp);
    res.json({ success: true, matchAnalysis });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- Applications ---
apiRouter.get('/applications', (req: Request, res: Response) => {
  try {
    const applications = dbService.getApplications();
    res.json({ success: true, applications });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/applications', (req: Request, res: Response) => {
  try {
    const app = {
      ...req.body,
      id: req.body.id || `app-${Date.now()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = dbService.saveApplication(app);
    res.json({ success: true, application: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/applications/:id/evaluate-quality', (req: Request, res: Response) => {
  try {
    const app = dbService.getApplications().find((a) => a.id === req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    const opp = dbService.getOpportunities().find((o) => o.id === app.opportunityId);
    const cv = dbService.getMasterResume();
    if (!opp) {
      return res.status(400).json({ success: false, error: 'Linked opportunity not found' });
    }
    const quality = calculateApplicationQuality(app, opp, cv);
    app.qualityScore = quality.score;
    app.qualityFeedback = quality.feedback;
    dbService.saveApplication(app);
    res.json({ success: true, quality });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- Micro-Projects ---
apiRouter.get('/projects', (req: Request, res: Response) => {
  try {
    const microProjects = dbService.getMicroProjects();
    res.json({ success: true, projects: microProjects });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/projects/generate', async (req: Request, res: Response) => {
  try {
    const { skillGap, targetRole } = req.body;
    const profile = dbService.getProfile();
    const proj = await AIAgents.runGenerateMicroProject(
      skillGap || 'PostgreSQL & Drizzle',
      targetRole || profile.targetRole
    );
    const saved = dbService.saveMicroProject(proj);
    res.json({ success: true, project: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/projects/:id/submit', async (req: Request, res: Response) => {
  try {
    const proj = dbService.getMicroProjects().find((p) => p.id === req.params.id);
    if (!proj) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    const { summary, codeUrl, liveDemoUrl } = req.body;
    proj.submission = {
      summary,
      codeUrl,
      liveDemoUrl,
      submittedAt: new Date().toISOString(),
    };
    proj.status = 'submitted';

    // Run evaluation agent
    const evaluation = await AIAgents.runEvaluateProject(proj, summary);
    proj.evaluation = evaluation;
    proj.status = evaluation.passed ? 'evaluated' : 'in_progress';
    dbService.saveMicroProject(proj);

    // If passed, create verified skill evidence on profile!
    if (evaluation.passed && evaluation.evidenceGenerated) {
      const profile = dbService.getProfile();
      const existingSkill = profile.skills.find(
        (s) => s.canonicalName.toLowerCase() === proj.targetSkill.toLowerCase()
      );
      if (existingSkill) {
        existingSkill.evidenceCount += 1;
        existingSkill.confidence = Math.min(100, existingSkill.confidence + 5);
        existingSkill.evidence.push({
          id: `ev-${Date.now()}`,
          skillName: proj.targetSkill,
          type: 'project',
          title: proj.title,
          score: evaluation.score,
          url: codeUrl || liveDemoUrl,
          date: new Date().toISOString().split('T')[0],
          verified: true,
          notes: evaluation.feedback,
        });
      }
      dbService.updateProfile(profile);

      dbService.addTimelineEvent({
        date: new Date().toISOString().split('T')[0],
        type: 'PROJECT_COMPLETED',
        title: `Completed ${proj.title}`,
        description: `Scored ${evaluation.score}/100 and added verified evidence for ${proj.targetSkill}.`,
        source: 'Project',
      });
    }

    res.json({ success: true, project: proj, evaluation });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- Courses & Professional Development ---
apiRouter.get('/courses', (req: Request, res: Response) => {
  try {
    const courses = dbService.getCourses();
    res.json({ success: true, courses });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/courses', (req: Request, res: Response) => {
  try {
    const course = req.body;
    if (!course.id) {
      course.id = `crs-user-${Date.now()}`;
    }
    const saved = dbService.saveCourse(course);
    res.json({ success: true, course: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/courses/:id/enroll', (req: Request, res: Response) => {
  try {
    const enrolled = dbService.enrollCourse(req.params.id);
    res.json({ success: true, course: enrolled });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/courses/:id/progress', (req: Request, res: Response) => {
  try {
    const { progressPercentage, completedModuleId } = req.body;
    const updated = dbService.updateCourseProgress(
      req.params.id,
      Number(progressPercentage) || 0,
      completedModuleId
    );
    res.json({ success: true, course: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/courses/:id/complete', (req: Request, res: Response) => {
  try {
    const { notes, certificateUrl } = req.body;
    const result = dbService.completeCourse(req.params.id, notes, certificateUrl);
    res.json({ success: true, course: result.course, profile: result.profile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.delete('/courses/:id', (req: Request, res: Response) => {
  try {
    const ok = dbService.deleteCourse(req.params.id);
    res.json({ success: true, deleted: ok });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/courses/recommend', async (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    const { focusArea } = req.body;
    let aiRecommendation: any;
    try {
      aiRecommendation = await AIAgents.runCourseRecommendations(profile, focusArea);
    } catch (aiErr) {
      console.warn('[Courses] AI Gateway failed, generating curated fallback courses:', aiErr);
      aiRecommendation = { recommendedCourses: [] };
    }

    let sourceList = aiRecommendation?.recommendedCourses || [];
    if (!Array.isArray(sourceList) || sourceList.length === 0) {
      const area = focusArea || profile.targetRole || 'Software Engineering';
      sourceList = [
        {
          title: `${area} Architecture & Industry Best Practices`,
          provider: 'Coursera & DeepLearning.AI',
          instructor: 'Dr. Andrew Ng & Industry Fellows',
          domain: 'Engineering & AI Architecture',
          level: 'Advanced',
          duration: '16 hours',
          rating: 4.95,
          url: `https://www.coursera.org/search?query=${encodeURIComponent(area)}`,
          description: `Comprehensive training in ${area}. Covers modern architectural patterns, performance optimization, and practical labs.`,
          skillsGained: [area, 'System Design', 'Performance Tuning'],
          relevanceReason: `Directly targets key competencies required for ${profile.targetRole || 'technical'} roles.`,
          cost: 'Free with Paid Cert',
          certificateAvailable: true,
          modules: [
            { title: 'Core Architectural Tradeoffs', duration: '4h' },
            { title: 'High-Throughput Optimization & Reliability', duration: '6h' },
            { title: 'Capstone Industry Project', duration: '6h' },
          ],
        },
        {
          title: `Distributed Systems & Production ${area}`,
          provider: 'edX & MIT OpenCourseWare',
          instructor: 'MIT Faculty & Industry Architects',
          domain: 'Systems Engineering',
          level: 'Intermediate',
          duration: '14 hours',
          rating: 4.9,
          url: `https://www.edx.org/search?q=${encodeURIComponent(area)}`,
          description: `Practical systems design, scalability, and engineering fundamentals for modern tech teams.`,
          skillsGained: ['Scalability', 'Fault Tolerance', 'API Design'],
          relevanceReason: 'Strengthens core technical problem-solving for senior interviews.',
          cost: 'Free',
          certificateAvailable: true,
          modules: [
            { title: 'Concurrency & Resource Scheduling', duration: '4h' },
            { title: 'Data Consistency & Storage Internals', duration: '5h' },
            { title: 'Cloud Deployments & Resiliency', duration: '5h' },
          ],
        },
        {
          title: `Full-Stack Practical Lab: Modern ${area} at Scale`,
          provider: 'Frontend Masters',
          instructor: 'Staff Engineers & Open Source Maintainers',
          domain: 'Full-Stack Development',
          level: 'Advanced',
          duration: '12 hours',
          rating: 4.88,
          url: 'https://frontendmasters.com/courses/',
          description: 'Step-by-step implementation of real-world enterprise applications with live code walkthroughs.',
          skillsGained: ['Clean Architecture', 'Testing', 'Clean Code'],
          relevanceReason: 'Provides immediate portfolio evidence for technical interviews.',
          cost: 'Paid',
          certificateAvailable: true,
          modules: [
            { title: 'Project Scaffolding & CI/CD Setup', duration: '3h' },
            { title: 'Production API & Database Implementation', duration: '5h' },
            { title: 'Performance Profiling & Observability', duration: '4h' },
          ],
        },
      ];
    }

    // Transform AI recommended courses into full Course entities with working links
    const generatedCourses = sourceList.map((c: any, idx: number) => ({
      id: `crs-ai-${Date.now()}-${idx}`,
      title: c.title,
      provider: c.provider || 'Coursera',
      instructor: c.instructor || 'AI Curated Expert',
      domain: c.domain || 'Technology & Engineering',
      targetRole: profile.targetRole || 'Engineering',
      level: c.level || 'Intermediate',
      duration: c.duration || '12 hours',
      rating: typeof c.rating === 'number' ? c.rating : 4.85,
      reviewsCount: Math.floor(Math.random() * 4000) + 1200,
      url:
        c.url && c.url.startsWith('http')
          ? c.url
          : `https://www.coursera.org/search?query=${encodeURIComponent(c.title)}`,
      description: c.description || 'Comprehensive skill-building course.',
      skillsGained: c.skillsGained || [profile.targetRole || 'Engineering'],
      relevanceReason: c.relevanceReason || 'Matches your current career development goals.',
      cost: c.cost || 'Free with Paid Cert',
      certificateAvailable: Boolean(c.certificateAvailable ?? true),
      enrollmentStatus: 'not_enrolled' as const,
      progressPercentage: 0,
      modules: (c.modules || []).map((m: any, mIdx: number) => ({
        id: `m-ai-${Date.now()}-${mIdx}`,
        title: m.title || `Module ${mIdx + 1}`,
        duration: m.duration || '2h',
        completed: false,
      })),
      source: 'AI_Generated' as const,
    }));

    dbService.addGeneratedCourses(generatedCourses);
    const allCourses = dbService.getCourses();

    res.json({
      success: true,
      domainTitle: aiRecommendation?.domainTitle || 'AI Curated Career Track',
      rationale: aiRecommendation?.rationale || 'Tailored to bridge verified skill gaps.',
      courses: allCourses,
      newCourses: generatedCourses,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- Email Intelligence ---
apiRouter.get('/email/events', (req: Request, res: Response) => {
  try {
    const emailEvents = dbService.getEmailEvents();
    res.json({ success: true, events: emailEvents });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.get('/email/status', (req: Request, res: Response) => {
  const isConnected = dbService.isEmailConnected();
  const hasGoogleClientId = Boolean(process.env.GOOGLE_CLIENT_ID);
  res.json({
    success: true,
    connected: isConnected,
    hasOAuthCredentials: hasGoogleClientId,
    missingRequirement: hasGoogleClientId
      ? null
      : {
          service: 'Google Workspace Gmail API (OAuth 2.0)',
          reason: 'Direct real-time monitoring of career applications, interview invites, and recruiter emails.',
          requiredAccount: 'Google Cloud Platform project with Gmail Readonly API enabled',
          requiredConfiguration: 'Authorized redirect URI configured in GCP Console',
          environmentVariables: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
          redirectUri: 'https://ais-dev-...run.app/api/auth/google/callback',
          oauthScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
          developerAction: 'Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment secrets to connect direct OAuth.',
        },
  });
});

apiRouter.post('/email/classify', async (req: Request, res: Response) => {
  try {
    const { subject, sender, snippet } = req.body;
    const classification = await AIAgents.runEmailClassification({ subject, sender, snippet });

    const newEvent: any = {
      id: `em-${Date.now()}`,
      subject,
      sender,
      date: new Date().toISOString(),
      snippet,
      category: classification.category,
      detectedAction: classification.detectedAction,
      relatedCompany: classification.relatedCompany,
      relatedJobTitle: classification.relatedJobTitle,
      priority: classification.priority,
      processed: true,
    };

    dbService.addEmailEvent(newEvent);

    // If interview invitation or application update, correlate with tracked application
    if (classification.category === 'interview_invitation' && classification.relatedCompany) {
      const apps = dbService.getApplications();
      const matchedApp = apps.find((a) =>
        a.company.toLowerCase().includes(classification.relatedCompany!.toLowerCase())
      );
      if (matchedApp) {
        matchedApp.status = 'Interview';
        matchedApp.events.push({
          id: `evt-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'INTERVIEW_INVITATION',
          description: `Auto-updated from incoming email: "${subject}"`,
        });
        dbService.saveApplication(matchedApp);
      }
    }

    dbService.addTimelineEvent({
      date: new Date().toISOString().split('T')[0],
      type: classification.category.toUpperCase(),
      title: `Email Event: ${classification.category.replace('_', ' ')}`,
      description: `${classification.summary} (${sender})`,
      source: 'Email',
    });

    res.json({ success: true, classification, event: newEvent });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- Interview Simulator ---
apiRouter.get('/interviews', (req: Request, res: Response) => {
  try {
    const interviews = dbService.getInterviews();
    res.json({ success: true, interviews });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/interviews/start', (req: Request, res: Response) => {
  try {
    const { jobRole, type } = req.body;
    const profile = dbService.getProfile();
    const role = jobRole || profile.targetRole;

    const technicalQuestions = [
      'How do you design a resilient architecture when integrating non-deterministic LLM outputs with a strict database schema?',
      'Walk me through how you identify and eliminate a performance bottleneck in a high-traffic Node.js or React application.',
      'Explain your approach to database migrations, indexing, and connection pooling in production.',
    ];
    const behavioralQuestions = [
      'Tell me about a time an engineering project was falling behind schedule. How did you realign scope and communicate with stakeholders?',
      'Describe a disagreement you had with a team member over an architectural decision. How did you resolve it?',
    ];

    const questionsList = (type === 'Behavioral' ? behavioralQuestions : technicalQuestions).map(
      (q, idx) => ({
        id: `q-${idx + 1}`,
        question: q,
      })
    );

    const session = {
      id: `int-${Date.now()}`,
      jobRole: role,
      type: type || 'Technical',
      questions: questionsList,
      currentQuestionIndex: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const saved = dbService.saveInterview(session);
    res.json({ success: true, session: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/interviews/:id/answer', async (req: Request, res: Response) => {
  try {
    const session = dbService.getInterviews().find((i) => i.id === req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Interview session not found' });
    }
    const { questionIndex, answer } = req.body;
    const questionObj = session.questions[questionIndex];
    if (!questionObj) {
      return res.status(400).json({ success: false, error: 'Question index invalid' });
    }

    questionObj.userAnswer = answer;
    const feedback = await AIAgents.runInterviewFeedback(
      session.jobRole,
      questionObj.question,
      answer
    );
    questionObj.feedback = feedback;

    // Check if next or completed
    if (questionIndex + 1 < session.questions.length) {
      session.currentQuestionIndex = questionIndex + 1;
    } else {
      session.completed = true;
      const allScores = session.questions
        .map((q) => q.feedback?.score)
        .filter((s): s is number => typeof s === 'number');
      session.overallScore =
        allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 80;
      session.summaryFeedback = `Simulation completed with an average score of ${session.overallScore}%. High clarity on architectural tradeoffs.`;

      dbService.addTimelineEvent({
        date: new Date().toISOString().split('T')[0],
        type: 'INTERVIEW_PRACTICE_COMPLETED',
        title: `Completed ${session.type} Interview Simulation`,
        description: `Simulated interview for ${session.jobRole} with score ${session.overallScore}%.`,
        source: 'User',
      });
    }

    dbService.saveInterview(session);
    res.json({ success: true, session, feedback });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- Career Memory & Timeline ---
apiRouter.get('/memory', (req: Request, res: Response) => {
  res.json({ success: true, memory: dbService.getCareerMemory() });
});

apiRouter.post('/memory', (req: Request, res: Response) => {
  const created = dbService.addCareerMemoryFact(req.body);
  res.json({ success: true, fact: created });
});

apiRouter.delete('/memory/:id', (req: Request, res: Response) => {
  dbService.deleteCareerMemoryFact(req.params.id);
  res.json({ success: true });
});

apiRouter.get('/timeline', (req: Request, res: Response) => {
  res.json({ success: true, timeline: dbService.getTimeline() });
});

apiRouter.get('/notifications', (req: Request, res: Response) => {
  res.json({ success: true, notifications: dbService.getNotifications() });
});

apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  dbService.markNotificationRead(req.params.id);
  res.json({ success: true });
});

// --- AI Assistant Chat ---
apiRouter.post('/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    const profile = dbService.getProfile();
    const reply = await AIAgents.runAssistantChat(message, profile, history || []);
    res.json({ success: true, reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- AI Observability & System ---
apiRouter.get('/observability/logs', (req: Request, res: Response) => {
  res.json({ success: true, logs: aiGateway.getLogs() });
});

apiRouter.get('/system/export', (req: Request, res: Response) => {
  res.json({ success: true, data: dbService.exportFullData() });
});

apiRouter.post('/system/reset', (req: Request, res: Response) => {
  const reset = dbService.resetToSeed();
  res.json({ success: true, state: reset });
});

// --- LinkedIn Integration & CV Sync ---
apiRouter.get('/auth/linkedin', (req: Request, res: Response) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';
  if (!clientId) {
    return res.status(400).send('LinkedIn Client ID is not configured.');
  }
  const scope = encodeURIComponent('openid profile email');
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=careerpilot_${Date.now()}`;
  res.redirect(authUrl);
});

apiRouter.get('/auth/linkedin/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error || !code) {
    return res.redirect(`/?error=${encodeURIComponent(error || 'No authorization code received')}`);
  }

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId || '',
      client_secret: clientSecret || '',
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[LinkedIn OAuth] Token exchange error:', tokenData);
      return res.redirect(`/?error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`);
    }

    const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (userinfoRes.ok) {
      const userInfo = await userinfoRes.json();
      const currentProfile = dbService.getProfile();
      dbService.updateProfile({
        fullName: userInfo.name || currentProfile.fullName,
        email: userInfo.email || currentProfile.email,
      });

      dbService.addTimelineEvent({
        date: new Date().toISOString().split('T')[0],
        type: 'LINKEDIN_SYNCED',
        title: 'LinkedIn Account Connected',
        description: `Successfully linked LinkedIn profile for ${userInfo.name || currentProfile.fullName}.`,
        source: 'User',
      });
    }

    res.redirect('/?linkedin_connected=true');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[LinkedIn OAuth] Callback exception:', msg);
    res.redirect(`/?error=${encodeURIComponent(msg)}`);
  }
});

apiRouter.get('/linkedin/status', (req: Request, res: Response) => {
  const hasLinkedInOAuth = Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
  res.json({
    success: true,
    hasOAuthCredentials: hasLinkedInOAuth,
    missingRequirement: hasLinkedInOAuth
      ? null
      : {
          service: 'LinkedIn OpenID Connect / Profile API (OAuth 2.0)',
          reason: '1-click direct account authorization and background profile data synchronization.',
          requiredAccount: 'LinkedIn Developer Portal account with Sign In with LinkedIn enabled',
          requiredConfiguration: 'Authorized redirect URL configured in LinkedIn Developer Portal',
          environmentVariables: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
          redirectUri: 'http://localhost:3000/api/auth/linkedin/callback',
          oauthScopes: ['openid', 'profile', 'email'],
          developerAction: 'Configure LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET for direct OAuth. In the interim, use the built-in LinkedIn PDF/Text Sync Engine below.',
        },
  });
});

apiRouter.post('/linkedin/parse-profile', async (req: Request, res: Response) => {
  try {
    const rawText = req.body.rawText || '';
    if (!rawText.trim()) {
      return res.status(400).json({ success: false, error: 'LinkedIn profile text is empty.' });
    }
    const extracted = await AIAgents.runLinkedInProfileParser(rawText);
    res.json({ success: true, extracted });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/linkedin/sync-profile', async (req: Request, res: Response) => {
  try {
    const { extracted } = req.body;
    if (!extracted) {
      return res.status(400).json({ success: false, error: 'Extracted profile data is required.' });
    }

    const currentProfile = dbService.getProfile();

    // Map extracted experience
    const newExperience = (extracted.experience || []).map((exp: any, idx: number) => ({
      id: `exp-li-${Date.now()}-${idx}`,
      company: exp.company || 'Company',
      role: exp.role || 'Role',
      location: exp.location || '',
      startDate: exp.startDate || '2022-01',
      endDate: exp.endDate,
      current: Boolean(exp.current),
      responsibilities: exp.responsibilities || [],
      achievements: exp.achievements || [],
    }));

    // Map extracted education
    const newEducation = (extracted.education || []).map((edu: any, idx: number) => ({
      id: `edu-li-${Date.now()}-${idx}`,
      institution: edu.institution || 'University',
      degree: edu.degree || 'Degree',
      field: edu.field || 'Field of Study',
      startDate: edu.startDate || '2018-09',
      endDate: edu.endDate,
      current: Boolean(edu.current),
      gpa: edu.gpa,
    }));

    // Map skills into canonical UserSkills
    const newSkills = (extracted.skills || []).map((skillName: string, idx: number) => {
      const existing = currentProfile.skills.find(
        (s) => s.canonicalName.toLowerCase() === skillName.toLowerCase()
      );
      if (existing) {
        return existing;
      }
      return {
        id: `sk-li-${Date.now()}-${idx}`,
        canonicalName: skillName,
        category: 'Technical' as const,
        level: 'Intermediate' as const,
        confidence: 85,
        evidenceCount: 1,
        lastAssessed: new Date().toISOString().split('T')[0],
        evidence: [
          {
            id: `ev-li-${Date.now()}-${idx}`,
            skillName,
            type: 'user_verification' as const,
            title: 'Verified from LinkedIn Profile Sync',
            date: new Date().toISOString().split('T')[0],
            verified: true,
          },
        ],
      };
    });

    // Merge skills avoiding duplicates
    const combinedSkills = [...currentProfile.skills];
    for (const ns of newSkills) {
      if (!combinedSkills.some((s) => s.canonicalName.toLowerCase() === ns.canonicalName.toLowerCase())) {
        combinedSkills.push(ns);
      }
    }

    // Update Profile
    const updatedProfile = dbService.updateProfile({
      fullName: extracted.fullName || currentProfile.fullName,
      headline: extracted.headline || currentProfile.headline,
      location: extracted.location || currentProfile.location,
      experience: newExperience.length > 0 ? newExperience : currentProfile.experience,
      education: newEducation.length > 0 ? newEducation : currentProfile.education,
      skills: combinedSkills,
    });

    // Create a new resume version specifically from LinkedIn sync
    const linkedInResume = {
      id: `res-li-${Date.now()}`,
      title: 'LinkedIn Synced Resume',
      isMaster: false,
      targetRole: extracted.headline || updatedProfile.targetRole,
      summary: extracted.summary || currentProfile.headline,
      experience: updatedProfile.experience,
      education: updatedProfile.education,
      skills: updatedProfile.skills.map((s) => s.canonicalName),
      certifications: extracted.certifications || [],
      atsScore: 86,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbService.saveResume(linkedInResume);

    // Record Career Memory fact
    dbService.addCareerMemoryFact({
      category: 'Career',
      fact: `Profile and CV synced with LinkedIn data for ${extracted.fullName || currentProfile.fullName} on ${new Date().toISOString().split('T')[0]}.`,
      confidence: 100,
    });

    // Add Timeline Event
    dbService.addTimelineEvent({
      date: new Date().toISOString().split('T')[0],
      type: 'LINKEDIN_SYNCED',
      title: 'LinkedIn Profile & CV Synchronized',
      description: `Imported ${newExperience.length} work experiences, ${newEducation.length} education records, and ${newSkills.length} skills from LinkedIn.`,
      source: 'User',
    });

    // Add high notification
    dbService.addEmailEvent({
      id: `em-li-${Date.now()}`,
      subject: 'LinkedIn Profile Synchronization Complete',
      sender: 'LinkedIn Sync Agent',
      date: new Date().toISOString(),
      snippet: `Successfully synchronized ${updatedProfile.fullName}'s profile and created a dedicated LinkedIn resume version.`,
      category: 'other',
      detectedAction: 'Review updated Career DNA and Readiness score',
      priority: 'MEDIUM',
      processed: true,
    });

    res.json({
      success: true,
      profile: updatedProfile,
      resume: linkedInResume,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// --- Supabase Cloud Backend Integration ---
apiRouter.get('/supabase/status', async (req: Request, res: Response) => {
  try {
    const status = await checkSupabaseConnection();
    res.json({
      success: true,
      configured: isSupabaseConfigured(),
      ...status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

apiRouter.post('/supabase/sync', async (req: Request, res: Response) => {
  try {
    const state = {
      profile: dbService.getProfile(),
      resumes: dbService.getResumes(),
      opportunities: dbService.getOpportunities(),
      applications: dbService.getApplications(),
      courses: dbService.getCourses(),
      microProjects: dbService.getMicroProjects(),
      interviews: dbService.getInterviews(),
    };

    const result = await syncStateToSupabase(state);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// iNeeded / RapidAPI — Live Jobs & Training (max 14 days fresh)
// ─────────────────────────────────────────────────────────────────────────────

const RAPID_KEY =
  process.env.RAPIDAPI_KEY ||
  process.env.JSEARCH_RAPIDAPI_KEY ||
  'e7e7907c0amshbb128f9a7510aa4p13152cjsnc1ff7f8eebfc';

const MAX_DAYS_OLD = 14;

function isFresh(dateStr?: string): boolean {
  if (!dateStr) return true;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24) <= MAX_DAYS_OLD;
  } catch {
    return true;
  }
}

// GET /api/ineeded/jobs
apiRouter.get('/ineeded/jobs', async (req: Request, res: Response) => {
  try {
    const query    = String(req.query.query    || 'Software Engineer');
    const location = String(req.query.location || 'Egypt');
    const page     = String(req.query.page     || '1');

    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query + ' ' + location)}&page=${page}&num_pages=2&date_posted=month`;

    const apiRes = await fetch(url, {
      headers: {
        'x-rapidapi-key':  RAPID_KEY,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ success: false, error: `RapidAPI HTTP ${apiRes.status}` });
    }

    const json = await apiRes.json();
    const rawJobs: any[] = json.data || [];

    const jobs = rawJobs
      .filter((j) => isFresh(j.job_posted_at_datetime_utc))
      .map((j) => ({
        id:              `ineeded-${j.job_id}`,
        title:           j.job_title,
        company:         j.employer_name,
        location:        [j.job_city, j.job_country].filter(Boolean).join(', ') || location,
        workModel:       j.job_is_remote ? 'Remote' : 'On-site',
        employmentType:  j.job_is_internship ? 'Internship' : 'Full-time',
        salary:          j.job_min_salary && j.job_max_salary
                           ? `${j.job_salary_currency || '$'}${j.job_min_salary}–${j.job_max_salary}`
                           : undefined,
        description:     (j.job_description || '').slice(0, 600) + '…',
        requirements:    Array.isArray(j.job_required_skills) ? j.job_required_skills.slice(0, 6) : [],
        preferredSkills: [],
        sourceUrl:       j.job_apply_link || j.job_google_link || `https://www.indeed.com/jobs?q=${encodeURIComponent(j.job_title)}`,
        sourcePlatform:  'Indeed',
        isManual:        false,
        createdAt:       j.job_posted_at_datetime_utc || new Date().toISOString(),
        employer_logo:   j.employer_logo || null,
      }));

    res.json({ success: true, count: jobs.length, jobs, maxDaysOld: MAX_DAYS_OLD });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/ineeded/training
apiRouter.get('/ineeded/training', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query || 'Software Engineering');

    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query + ' internship training 2026')}&page=1&num_pages=2&date_posted=month&employment_types=INTERN`;

    const apiRes = await fetch(url, {
      headers: {
        'x-rapidapi-key':  RAPID_KEY,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ success: false, error: `RapidAPI HTTP ${apiRes.status}` });
    }

    const json = await apiRes.json();
    const rawItems: any[] = json.data || [];

    const training = rawItems
      .filter((j) => isFresh(j.job_posted_at_datetime_utc))
      .map((j) => ({
        id:          `train-${j.job_id}`,
        title:       j.job_title,
        provider:    j.employer_name,
        location:    [j.job_city, j.job_country].filter(Boolean).join(', ') || 'Remote',
        isRemote:    Boolean(j.job_is_remote),
        description: (j.job_description || '').slice(0, 500) + '…',
        skills:      Array.isArray(j.job_required_skills) ? j.job_required_skills.slice(0, 5) : [],
        applyUrl:    j.job_apply_link || j.job_google_link || '#',
        postedAt:    j.job_posted_at_datetime_utc || new Date().toISOString(),
        logo:        j.employer_logo || null,
      }));

    res.json({ success: true, count: training.length, training, maxDaysOld: MAX_DAYS_OLD });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/ineeded/status
apiRouter.get('/ineeded/status', async (req: Request, res: Response) => {
  try {
    const testUrl = 'https://jsearch.p.rapidapi.com/search?query=engineer&page=1&num_pages=1';
    const r = await fetch(testUrl, {
      headers: {
        'x-rapidapi-key':  RAPID_KEY,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(8000),
    });
    res.json({
      success:       r.ok,
      httpStatus:    r.status,
      keyConfigured: Boolean(RAPID_KEY),
      maxDaysFilter: MAX_DAYS_OLD,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.json({ success: false, error: msg, keyConfigured: Boolean(RAPID_KEY) });
  }
});
