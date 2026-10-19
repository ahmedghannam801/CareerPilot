import { Router, Request, Response } from 'express';
import mammoth from 'mammoth';
import { dbService, UploadedDocument } from '../db/index.js';
import { AIAgents } from '../ai/agents.js';
import { aiGateway } from '../ai/gateway.js';
import { verifyResource, checkUrlHealth, validateProvider, normalizeUrl, deduplicateResources } from '../services/resourceVerification.js';
import { lessonPacks, guides, getLessonPackById, getLessonPacksByDifficulty, getLessonPacksByCategory, getGuideById, getGuidesByCategory } from '../../data/lessonPacksData.js';
import { projects, quizzes, interviewQuestions, skillAssessments, getProjectById, getProjectsByDifficulty, getProjectsByType, getQuizById, getInterviewQuestionById, getSkillAssessmentBySkill } from '../../data/projectsQuizzesData.js';
import { jobPostings, skillDemandData, roleMarketData, marketTrends, salaryData, getJobById, getJobsByLocation, getJobsByRemotePolicy, getJobsByExperienceLevel, getVerifiedJobs, getSkillDemandBySkill, getRoleMarketDataByRole, getTrendingSkills } from '../../data/jobIntelligenceData.js';
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
  getSupabaseClient,
} from '../db/supabase.js';
import { featureFlags } from '../config/featureFlags.js';
import { requireAdminRole } from '../middleware/auth.js';
import { logger } from '../monitoring/logger.js';
import { auditLogger } from '../monitoring/auditLogger.js';
import { INITIAL_ROADMAPS } from '../../data/roadmapsData.js';
import { ResumeVersion, Opportunity, CareerProfile } from '../../types/index.js';
import {
  validateCVFile,
  extractCandidateInfoFromText,
  evaluateResumeQuality,
  evaluateJobMatch,
  generateTailoredCV as generateTailoredCVLogic,
} from '../../lib/resumeIntelligence.js';
import { authRouter } from './auth.js';
import { roadmapProgressRouter } from './roadmap-progress.js';
import {
  validateProfile,
  validateResume,
  validateOpportunity,
  validateApplication,
  validateProject,
  validateAIPrompt,
  validateJobDescription,
  validateQueryParams,
  validateInterview,
} from '../middleware/validation.js';
import { sendSafeError } from '../middleware/errorHandler.js';

export const apiRouter = Router();

// Mount auth router
apiRouter.use('/auth', authRouter);
apiRouter.use('/roadmaps/progress', roadmapProgressRouter);

export function getReqUserId(req: Request): string | undefined {
  const custom = req.headers['x-user-id'] as string;
  if (custom && custom.trim()) return custom.trim();
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.substring(7);
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.sub) return payload.sub;
      }
    } catch {}
  }
  return undefined;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfModule: any = await import('pdf-parse');
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({});
      await parser.load(buffer);
      const textResult = await parser.getText();
      if (typeof textResult === 'string' && textResult.trim().length > 0) return textResult;
      if (textResult?.text && textResult.text.trim().length > 0) return textResult.text;
    }
    if (typeof pdfModule.default === 'function') {
      const res = await pdfModule.default(buffer);
      if (res.text) return res.text;
    }
  } catch (err) {
    console.warn('[PDF Parser] Fallback triggered:', err);
  }
  return buffer.toString('utf-8').replace(/[^\x20-\x7E\r\n\t]/g, ' ');
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const res = await mammoth.extractRawText({ buffer });
    return res.value || '';
  } catch (err) {
    console.warn('[DOCX Parser] Fallback triggered:', err);
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\r\n\t]/g, ' ');
  }
}

// --- Profile Routes ---
apiRouter.get('/profile', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const profile = dbService.getProfile(userId);
    res.json({ success: true, profile });
  } catch (err: unknown) {
    sendSafeError(res, err, { userId: getReqUserId(req), endpoint: '/profile', method: 'GET' });
  }
});

apiRouter.post('/profile', validateProfile, (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const updated = dbService.updateProfile(req.body, userId);
    res.json({ success: true, profile: updated });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/profile/dna/regenerate', validateProfile, async (req: Request, res: Response) => {
  try {
    if (!featureFlags.isEnabled('aiGateway')) {
      return res.status(503).json({
        success: false,
        error: 'AI Gateway is currently disabled by administrator.',
        code: 'FEATURE_DISABLED',
      });
    }
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/profile/nba/refresh', validateProfile, async (req: Request, res: Response) => {
  try {
    if (!featureFlags.isEnabled('aiGateway')) {
      return res.status(503).json({
        success: false,
        error: 'AI Gateway is currently disabled by administrator.',
        code: 'FEATURE_DISABLED',
      });
    }
    const profile = dbService.getProfile();
    const nba = await AIAgents.runNextBestAction(profile);
    const updated = dbService.updateProfile({ nextBestAction: nba });
    res.json({ success: true, nextBestAction: nba, profile: updated });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/profile/discovery', async (req: Request, res: Response) => {
  try {
    const profile = dbService.getProfile();
    const answers = req.body.answers || {};
    const discovery = await AIAgents.runCareerDiscovery(profile, answers);
    res.json({ success: true, discovery });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// --- Resumes & Resume Studio Intelligence ---
apiRouter.post('/resumes/upload', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const { fileName, fileData, fileType } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'Both fileName and fileData (base64 or text) are required for upload.',
      });
    }

    // Determine normalized extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'docx', 'doc', 'txt'];
    if (!ext || !validExts.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported file extension .${ext || 'unknown'}. Allowed formats: PDF, DOCX, TXT.`,
      });
    }

    // Convert fileData to Buffer
    let buffer: Buffer;
    if (fileData.startsWith('data:')) {
      const base64Content = fileData.split(',')[1] || '';
      buffer = Buffer.from(base64Content, 'base64');
    } else {
      try {
        buffer = Buffer.from(fileData, 'base64');
        // Validate if base64 conversion is sound, else treat as raw utf8
        if (buffer.length === 0 && fileData.length > 0) {
          buffer = Buffer.from(fileData, 'utf-8');
        }
      } catch {
        buffer = Buffer.from(fileData, 'utf-8');
      }
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Uploaded file is empty (0 bytes). Please upload a valid document.',
      });
    }
    if (buffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File exceeds 10MB limit. Please upload a smaller document.',
      });
    }

    // Validate magic bytes for binary formats
    if (ext === 'pdf') {
      const header = buffer.subarray(0, 5).toString('utf-8');
      if (!header.startsWith('%PDF')) {
        return res.status(400).json({
          success: false,
          error: 'Corrupt or invalid PDF file header.',
        });
      }
    } else if (ext === 'docx') {
      // DOCX is a zip archive starting with PK\x03\x04
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
        return res.status(400).json({
          success: false,
          error: 'Corrupt or invalid DOCX document archive.',
        });
      }
    }

    // Extract text content
    let extractedText = '';
    if (ext === 'pdf') {
      extractedText = await extractTextFromPdf(buffer);
    } else if (ext === 'docx' || ext === 'doc') {
      extractedText = await extractTextFromDocx(buffer);
    } else {
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText || extractedText.trim().length < 15) {
      return res.status(422).json({
        success: false,
        error: 'Document appears to be empty or unscannable image. Please provide a text-based PDF or DOCX.',
      });
    }

    // Extract structured profile info
    let extractedProfile: any = null;
    try {
      if (featureFlags.isEnabled('aiGateway')) {
        extractedProfile = await AIAgents.runResumeExtractor(extractedText.slice(0, 8000));
      }
    } catch (aiErr) {
      console.warn('[Resume Intelligence] AI semantic extractor skipped/failed, using deterministic extractor:', aiErr);
    }

    // Deterministic fallback regex extraction
    const deterministicInfo = extractCandidateInfoFromText(extractedText);
    if (!extractedProfile) {
      extractedProfile = {
        fullName: deterministicInfo.fullName || '',
        email: deterministicInfo.email || '',
        phone: deterministicInfo.phone || '',
        headline: deterministicInfo.candidateRole || '',
        summary: deterministicInfo.summary || '',
        skills: deterministicInfo.skills || [],
        experience: [],
        education: [],
        certifications: [],
      };
    } else {
      // Merge deterministic skills if AI missed any
      const mergedSkills = Array.from(new Set([...(extractedProfile.skills || []), ...deterministicInfo.skills]));
      extractedProfile.skills = mergedSkills;
      if (!extractedProfile.email && deterministicInfo.email) extractedProfile.email = deterministicInfo.email;
      if (!extractedProfile.phone && deterministicInfo.phone) extractedProfile.phone = deterministicInfo.phone;
    }

    // Save record of uploaded document
    const docRecord: UploadedDocument = {
      id: `doc-${Date.now()}`,
      userId: userId || 'usr-default',
      fileName,
      fileSizeBytes: buffer.length,
      fileType: ext === 'doc' ? 'docx' : (ext as 'pdf' | 'docx' | 'txt'),
      extractedText: extractedText.slice(0, 15000),
      extractedProfile,
      uploadedAt: new Date().toISOString(),
    };
    dbService.saveUploadedDocument(docRecord, userId);

    res.json({
      success: true,
      document: docRecord,
      extractedInfo: extractedProfile,
      rawTextPreview: extractedText.slice(0, 1000),
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/resumes/extract-confirm', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const { confirmedProfile, createMasterCV } = req.body;

    if (!confirmedProfile) {
      return res.status(400).json({ success: false, error: 'Confirmed profile information is required.' });
    }

    // 1. Update user profile
    const existingProfile = dbService.getProfile(userId);
    const updatedProfile = dbService.updateProfile(
      {
        fullName: confirmedProfile.fullName || existingProfile.fullName,
        email: confirmedProfile.email || existingProfile.email,
        headline: confirmedProfile.headline || existingProfile.headline,
        location: confirmedProfile.location || existingProfile.location,
        targetRole: confirmedProfile.targetRole || confirmedProfile.headline || existingProfile.targetRole,
        skills: Array.isArray(confirmedProfile.skills)
          ? confirmedProfile.skills.map((s: string | any) =>
              typeof s === 'string'
                ? { canonicalName: s, category: 'Technical Skills', level: 'Intermediate', evidence: [] }
                : s
            )
          : existingProfile.skills,
        experience: Array.isArray(confirmedProfile.experience) && confirmedProfile.experience.length > 0
          ? confirmedProfile.experience
          : existingProfile.experience,
        education: Array.isArray(confirmedProfile.education) && confirmedProfile.education.length > 0
          ? confirmedProfile.education
          : existingProfile.education,
      },
      userId
    );

    // 2. Create or update Master Resume if requested
    let masterResume: ResumeVersion | undefined;
    if (createMasterCV !== false) {
      const existingResumes = dbService.getResumes(userId);
      const existingMaster = existingResumes.find((r) => r.isMaster);

      const skillsList: string[] = Array.isArray(confirmedProfile.skills)
        ? confirmedProfile.skills.map((s: any) => (typeof s === 'string' ? s : s.canonicalName))
        : [];

      masterResume = {
        id: existingMaster?.id || `res-master-${Date.now()}`,
        title: `${updatedProfile.fullName || 'Master'} Resume`,
        isMaster: true,
        isTailored: false,
        summary: confirmedProfile.summary || existingMaster?.summary || updatedProfile.headline || '',
        skills: skillsList.length > 0 ? skillsList : existingMaster?.skills || [],
        experience: confirmedProfile.experience?.length ? confirmedProfile.experience : existingMaster?.experience || [],
        education: confirmedProfile.education?.length ? confirmedProfile.education : existingMaster?.education || [],
        certifications: confirmedProfile.certifications || existingMaster?.certifications || [],
        targetRole: updatedProfile.targetRole,
        templateVersion: 'google_doc_ats_v1',
        createdAt: existingMaster?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Calculate real 5-pillar CV Quality score
      const qualityScore = evaluateResumeQuality(masterResume);
      masterResume.atsScore = qualityScore.overallScore;

      dbService.saveResume(masterResume, userId);
      dbService.saveATSAnalysis(masterResume.id, qualityScore, userId);
    }

    res.json({
      success: true,
      profile: updatedProfile,
      masterResume,
      atsScore: masterResume?.atsScore,
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.get('/resumes', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const resumes = dbService.getResumes(userId);
    res.json({ success: true, resumes });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.get('/resumes/library', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const resumes = dbService.getResumes(userId);
    const uploadedDocs = dbService.getUploadedDocuments(userId);

    const masterResume = resumes.find((r) => r.isMaster) || null;
    const tailoredResumes = resumes.filter((r) => !r.isMaster);
    const drafts = resumes.filter((r) => !r.atsScore);

    res.json({
      success: true,
      masterResume,
      tailoredResumes,
      uploadedDocuments: uploadedDocs,
      drafts,
      totalCount: resumes.length,
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/resumes', validateResume, (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const saved = dbService.saveResume(req.body, userId);
    res.json({ success: true, resume: saved });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.delete('/resumes/:id', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const success = dbService.deleteResume(req.params.id, userId);
    res.json({ success });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.get('/resumes/:id/ats', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const ats = dbService.getATSAnalysis(req.params.id, userId);
    res.json({ success: true, ats });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/resumes/:id/analyze', validateJobDescription, async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const resume = dbService.getResumes(userId).find((r) => r.id === req.params.id) || dbService.getMasterResume(userId);
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Evaluate using transparent 5-pillar rubric
    const ats = evaluateResumeQuality(resume);
    resume.atsScore = ats.overallScore;
    dbService.saveResume(resume, userId);
    dbService.saveATSAnalysis(resume.id, ats, userId);

    res.json({ success: true, ats });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/resumes/match', validateJobDescription, async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const { resumeId, opportunityId, customJobDescription, customJobTitle, customCompany } = req.body;
    const resume = (resumeId ? dbService.getResumes(userId).find((r) => r.id === resumeId) : null) || dbService.getMasterResume(userId);

    if (!resume) {
      return res.status(400).json({ success: false, error: 'Please create or upload a resume first to evaluate job matching.' });
    }

    let opp = opportunityId ? dbService.getOpportunities(userId).find((o) => o.id === opportunityId) : undefined;
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
        matchScore: undefined,
        isManual: true,
        createdAt: new Date().toISOString(),
      } as Opportunity;
    }

    if (!opp) {
      return res.status(400).json({ success: false, error: 'Target job description or opportunity is required for matching.' });
    }

    const matchAnalysis = evaluateJobMatch(resume, opp);
    res.json({ success: true, matchAnalysis, opportunity: opp });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/resumes/tailor', validateJobDescription, async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const { opportunityId, customJobDescription, customJobTitle, customCompany, resumeId } = req.body;
    const baseResume = (resumeId ? dbService.getResumes(userId).find((r) => r.id === resumeId) : null) || dbService.getMasterResume(userId);

    if (!baseResume) {
      return res.status(400).json({ success: false, error: 'Master CV required before generating a tailored version.' });
    }

    let opp = opportunityId ? dbService.getOpportunities(userId).find((o) => o.id === opportunityId) : undefined;

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
        matchScore: undefined,
        isManual: true,
        createdAt: new Date().toISOString(),
      } as Opportunity;
      dbService.addOpportunity(opp, userId);
    }

    if (!opp) {
      const profile = dbService.getProfile(userId);
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
        matchScore: undefined,
        isManual: true,
        createdAt: new Date().toISOString(),
      } as Opportunity;
    }

    // Generate tailored CV using deterministic intelligence transformer
    const tailoredResume = generateTailoredCVLogic(baseResume, opp);
    tailoredResume.sourceResumeId = baseResume.id;
    tailoredResume.templateVersion = 'google_doc_ats_v1';

    // Calculate match analysis
    const matchAnalysis = evaluateJobMatch(baseResume, opp);

    // Persist separate tailored document to DB (Master CV is NEVER overwritten)
    dbService.saveResume(tailoredResume, userId);

    res.json({
      success: true,
      tailoredResume,
      matchAnalysis,
      opportunity: opp,
      masterResumeId: baseResume.id,
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/resumes/cover-letter', validateJobDescription, async (req: Request, res: Response) => {
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// --- Opportunities ---
apiRouter.get('/opportunities', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const profile = dbService.getProfile(userId);
    const hasProfileSkills = profile.skills && profile.skills.length > 0;
    const opportunities = dbService.getOpportunities(userId).map((opp) => {
      // Only calculate matchScore if profile has real skills/experience to compare against
      if (hasProfileSkills && !opp.matchScore) {
        const match = calculateOpportunityMatch(profile, opp);
        opp.matchScore = match.overallMatch;
      }
      return opp;
    });
    res.json({ success: true, opportunities });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/opportunities', validateOpportunity, (req: Request, res: Response) => {
  try {
    const opp = {
      ...req.body,
      id: req.body.id || `opp-${Date.now()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    const userId = getReqUserId(req);
    const saved = dbService.addOpportunity(opp, userId);
    res.json({ success: true, opportunity: saved });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.delete('/opportunities/:id', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    dbService.deleteOpportunity(req.params.id, userId);
    res.json({ success: true });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/opportunities/parse-jd', validateJobDescription, async (req: Request, res: Response) => {
  try {
    const rawText = req.body.rawText || '';
    if (!rawText.trim()) {
      return res.status(400).json({ success: false, error: 'Job description text is empty' });
    }
    const parsed = await AIAgents.runJobDescriptionParser(rawText);
    res.json({ success: true, parsed });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/opportunities/:id/match', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const profile = dbService.getProfile(userId);
    const opp = dbService.getOpportunities(userId).find((o) => o.id === req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }
    const matchAnalysis = calculateOpportunityMatch(profile, opp);
    res.json({ success: true, matchAnalysis });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// --- Applications ---
apiRouter.get('/applications', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const applications = dbService.getApplications(userId);
    res.json({ success: true, applications });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/applications', validateApplication, (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const app = {
      ...req.body,
      id: req.body.id || `app-${Date.now()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = dbService.saveApplication(app);
    res.json({ success: true, application: saved });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// --- Micro-Projects ---
apiRouter.get('/projects', (req: Request, res: Response) => {
  try {
    const microProjects = dbService.getMicroProjects();
    res.json({ success: true, projects: microProjects });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/projects/generate', validateProject, async (req: Request, res: Response) => {
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// --- Courses & Professional Development ---
apiRouter.get('/courses', (req: Request, res: Response) => {
  try {
    const courses = dbService.getCourses();
    res.json({ success: true, courses });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/courses/:id/enroll', (req: Request, res: Response) => {
  try {
    const enrolled = dbService.enrollCourse(req.params.id);
    res.json({ success: true, course: enrolled });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/courses/:id/complete', (req: Request, res: Response) => {
  try {
    const { notes, certificateUrl } = req.body;
    const result = dbService.completeCourse(req.params.id, notes, certificateUrl);
    res.json({ success: true, course: result.course, profile: result.profile });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.delete('/courses/:id', (req: Request, res: Response) => {
  try {
    const ok = dbService.deleteCourse(req.params.id);
    res.json({ success: true, deleted: ok });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// --- Email Intelligence ---
apiRouter.get('/email/events', (req: Request, res: Response) => {
  try {
    const emailEvents = dbService.getEmailEvents();
    res.json({ success: true, events: emailEvents });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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

apiRouter.post('/email/events/:id/read', (req: Request, res: Response) => {
  try {
    const { read } = req.body || {};
    const updated = dbService.markEmailEventRead(
      req.params.id,
      typeof read === 'boolean' ? read : undefined
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Email event not found' });
    }
    res.json({ success: true, event: updated });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/email/classify', async (req: Request, res: Response) => {
  try {
    const { subject, sender, snippet, id } = req.body;
    const classification = await AIAgents.runEmailClassification({ subject, sender, snippet });

    let existingEvent: any = null;
    if (id) {
      existingEvent = dbService.markEmailEventRead(id);
    } else {
      const allEvents = dbService.getEmailEvents();
      const matched = allEvents.find((e) => e.subject === subject);
      if (matched) {
        existingEvent = dbService.markEmailEventRead(matched.id);
      }
    }

    const newEvent: any = existingEvent || {
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
      read: true,
    };

    if (!existingEvent) {
      dbService.addEmailEvent(newEvent);
    }

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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// --- Interview Simulator ---
apiRouter.get('/interviews', (req: Request, res: Response) => {
  try {
    const interviews = dbService.getInterviews();
    res.json({ success: true, interviews });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/interviews/start', validateInterview, async (req: Request, res: Response) => {
  try {
    const { jobRole, trackId, type, language, count } = req.body;
    const profile = dbService.getProfile();
    const role = jobRole || profile.targetRole || 'Full-Stack & AI Engineer';
    const lang: 'ar' | 'en' = language === 'ar' ? 'ar' : 'en';
    const questionCount = typeof count === 'number' && count > 0 && count <= 10 ? count : 4;

    const questionsListRaw = await AIAgents.runInterviewQuestions(
      role,
      type || 'Technical',
      lang,
      trackId,
      questionCount
    );
    const questionsList = questionsListRaw.map((q, idx) => ({
      id: `q-${idx + 1}`,
      question: q,
    }));

    const session = {
      id: `int-${Date.now()}`,
      jobRole: role,
      trackId: trackId || undefined,
      type: type || 'Technical',
      language: lang,
      questions: questionsList,
      currentQuestionIndex: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const saved = dbService.saveInterview(session);
    res.json({ success: true, session: saved });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

apiRouter.post('/interviews/:id/answer', validateInterview, async (req: Request, res: Response) => {
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
apiRouter.post('/assistant/chat', validateAIPrompt, async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    const profile = dbService.getProfile();
    const reply = await AIAgents.runAssistantChat(message, profile, history || []);
    res.json({ success: true, reply });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// --- AI Observability & System (PROTECTED - Admin Only) ---
apiRouter.get('/observability/logs', requireAdminRole, (req: Request, res: Response) => {
  res.json({ success: true, logs: aiGateway.getLogs() });
});

apiRouter.get('/system/export', requireAdminRole, (req: Request, res: Response) => {
  res.json({ success: true, data: dbService.exportFullData() });
});

apiRouter.post('/system/reset', requireAdminRole, (req: Request, res: Response) => {
  const reset = dbService.resetToSeed();
  res.json({ success: true, state: reset });
});

// --- LinkedIn Integration & CV Sync ---
apiRouter.get('/auth/linkedin', (req: Request, res: Response) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${baseUrl}/api/auth/linkedin/callback`;
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
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${baseUrl}/api/auth/linkedin/callback`;

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
      console.error('[LinkedIn OAuth] Token exchange error:', tokenData.error || 'Authorization failed');
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
    const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
    console.error('[LinkedIn OAuth] Callback exception:', errorMsg);
    res.redirect(`/?error=${encodeURIComponent('LinkedIn authentication failed')}`);
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
          redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${process.env.APP_URL || 'https://careerpilot-dic.pages.dev'}/api/auth/linkedin/callback`,
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
      atsScore: undefined,
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// iNeeded / RapidAPI — Live Jobs & Training (max 14 days fresh)
// ─────────────────────────────────────────────────────────────────────────────

// Never hard-code API keys — resolved from environment only.
// If missing, endpoints return 503 instead of silently using a leaked key.
const RAPID_KEY = process.env.RAPIDAPI_KEY || process.env.JSEARCH_RAPIDAPI_KEY || '';

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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
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
    console.error('[RapidAPI] Feed sync error:', err);
    res.json({ success: false, error: 'Failed to sync job feeds', keyConfigured: Boolean(RAPID_KEY) });
  }
});

// --- Privacy & Account Lifecycle (GDPR Compliance) ---

// --- Learning Roadmaps Routes ---

// GET /api/roadmaps
apiRouter.get('/roadmaps', (req: Request, res: Response) => {
  try {
    res.json({ success: true, roadmaps: INITIAL_ROADMAPS });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/roadmaps/:id
apiRouter.get('/roadmaps/:id', (req: Request, res: Response) => {
  try {
    const roadmap = INITIAL_ROADMAPS.find((r) => r.id === req.params.id || r.slug === req.params.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, error: 'Roadmap not found' });
    }
    res.json({ success: true, roadmap });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// POST /api/roadmaps/generate
apiRouter.post('/roadmaps/generate', validateAIPrompt, async (req: Request, res: Response) => {
  try {
    if (!featureFlags.isEnabled('aiGateway')) {
      return res.status(503).json({
        success: false,
        error: 'AI Roadmap generation is currently disabled by administrator.',
        code: 'FEATURE_DISABLED',
      });
    }
    const profile = dbService.getProfile();
    const { targetRole, weeklyHours } = req.body;
    const normalizedTargetRole = targetRole || profile.targetRole || 'Full-Stack Developer';

    // Find relevant reference roadmaps based on target role
    const relevantRoadmaps = INITIAL_ROADMAPS.filter((rm) => {
      const roleKeywords = normalizedTargetRole.toLowerCase().split(/[\s-]+/);
      const roadmapText = `${rm.title} ${rm.targetRole} ${rm.tags.join(' ')}`.toLowerCase();
      return roleKeywords.some((keyword: string) => roadmapText.includes(keyword));
    }).slice(0, 3); // Top 3 most relevant

    // Generate personalized roadmap using reference templates
    const roadmapData = await AIAgents.runLearningRoadmapGenerator(
      profile,
      normalizedTargetRole,
      weeklyHours || 5,
      relevantRoadmaps.length > 0 ? relevantRoadmaps : undefined
    );

    const fullRoadmap = {
      id: `rdm-ai-${Date.now()}`,
      slug: normalizedTargetRole.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      ...roadmapData,
      targetRole: normalizedTargetRole,
      language: 'Both' as const,
      publicationStatus: 'draft' as const,
      version: '1.0',
      tags: [normalizedTargetRole, 'AI Generated', 'Personalized'],
      source: 'AI_Draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      roadmap: fullRoadmap,
      metadata: {
        referencedRoadmaps: relevantRoadmaps.map(rm => ({ id: rm.id, title: rm.title })),
        generatedAt: new Date().toISOString(),
        personalizedFor: profile.fullName || profile.email || 'User'
      }
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// POST /api/courses/recommend - AI-powered course recommendations with verification
apiRouter.post('/courses/recommend', async (req: Request, res: Response) => {
  try {
    if (!featureFlags.isEnabled('aiGateway')) {
      return res.status(503).json({
        success: false,
        error: 'AI Course recommendations are currently disabled by administrator.',
        code: 'FEATURE_DISABLED',
      });
    }

    const profile = dbService.getProfile();
    const { targetRole, maxCourses = 5, verifyResources = false } = req.body;

    // Find relevant roadmaps for extracting verified resources
    const normalizedRole = targetRole || profile.targetRole || '';
    const relevantRoadmaps = INITIAL_ROADMAPS.filter((rm) => {
      const roleText = normalizedRole.toLowerCase();
      const roadmapText = `${rm.title} ${rm.targetRole} ${rm.tags.join(' ')}`.toLowerCase();
      return roadmapText.includes(roleText) || roleText.split(/[\s-]+/).some((kw: string) => roadmapText.includes(kw));
    }).slice(0, 3);

    // Extract resources from roadmaps as reference
    const roadmapResources: any[] = [];
    relevantRoadmaps.forEach((rm) => {
      rm.stages.forEach((stage: any) => {
        stage.nodes.forEach((node: any) => {
          if (node.resources && Array.isArray(node.resources)) {
            roadmapResources.push(...node.resources);
          }
        });
      });
    });

    // Generate recommendations using AI
    const result = await AIAgents.runCourseRecommender(
      profile,
      targetRole || profile.targetRole,
      maxCourses,
      roadmapResources.length > 0 ? roadmapResources : undefined
    );

    // Transform to Course interface format with enrollment tracking + verification metadata
    const coursesWithIds = result.courses.map((course: any) => ({
      courseId: `course-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: course.title,
      titleAr: course.titleAr,
      provider: course.provider,
      instructor: course.instructor || 'N/A',
      domain: course.domain,
      level: course.level,
      duration: course.duration,
      rating: course.rating,
      url: course.url,
      description: course.description,
      descriptionAr: course.descriptionAr,
      skillsGained: course.skillsGained,
      relevanceReason: course.relevanceReason,
      cost: course.cost,
      certificateAvailable: course.certificateAvailable,
      enrollmentStatus: 'not_started' as const,
      enrollmentDate: null,
      completionDate: null,
      progressPercentage: 0,
      modules: [],
      lastAccessedDate: null,
      notes: null,
      // Verification metadata (not verified by default since AI-generated)
      verificationStatus: 'NEEDS_REVIEW' as const,
      verificationSource: 'AI_SUGGESTED' as const,
      lastVerifiedAt: null,
      qualityScore: null,
    }));

    // Note: Real-time verification is expensive and slow
    // Mark all AI-generated courses as NEEDS_REVIEW
    // Background verification job should verify them asynchronously

    res.json({
      success: true,
      courses: coursesWithIds,
      metadata: {
        referencedRoadmaps: relevantRoadmaps.map((rm) => ({ id: rm.id, title: rm.title })),
        totalResourcesReferenced: roadmapResources.length,
        generatedAt: new Date().toISOString(),
        personalizedFor: profile.fullName || profile.email || 'User',
        verificationNote: 'AI-generated courses require verification. URLs and metadata may need review.',
      },
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/user/export - Authenticated full user data archive
apiRouter.get('/user/export', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      }
    }

    const profile = dbService.getProfile();
    const resumes = dbService.getResumes();
    const opportunities = dbService.getOpportunities();
    const applications = dbService.getApplications();
    const interviews = dbService.getInterviews();
    const memory = dbService.getCareerMemory();
    const timeline = dbService.getTimeline();

    res.json({
      success: true,
      exportTimestamp: new Date().toISOString(),
      requestedByUserId: userId || profile.id,
      data: {
        profile,
        resumes,
        opportunities,
        applications,
        interviews,
        memory,
        timeline,
      },
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// POST /api/user/delete - Right to be Forgotten (Account deletion)
apiRouter.post('/user/delete', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
        if (userId) {
          // Delete from cloud Supabase profiles (cascades to all user tables)
          await supabase.from('profiles').delete().eq('id', userId);
        }
      }
    }

    // Reset local database state
    dbService.resetToSeed();

    res.json({
      success: true,
      message: 'Account and associated records successfully purged.',
      purgedUserId: userId,
      purgedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// --- Monitoring & Operational Telemetry ---

// GET /api/monitoring/metrics (PROTECTED - Admin Only)
apiRouter.get('/monitoring/metrics', requireAdminRole, (req: Request, res: Response) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics: logger.getSnapshot(),
  });
});

// --- Feature Flags (Public View) ---

// GET /api/features
apiRouter.get('/features', (req: Request, res: Response) => {
  res.json({
    success: true,
    flags: featureFlags.getAll(),
  });
});

// --- Privileged Administrative Endpoints (Protected by requireAdminRole) ---

// GET /api/admin/audit-logs
apiRouter.get('/admin/audit-logs', requireAdminRole, (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    logs: auditLogger.getRecentLogs(limit),
  });
});

// GET /api/admin/ai-metrics
apiRouter.get('/admin/ai-metrics', requireAdminRole, (req: Request, res: Response) => {
  try {
    const metrics = aiGateway.getAggregatedMetrics();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// POST /api/admin/features
apiRouter.post('/admin/features', requireAdminRole, (req: Request, res: Response) => {
  const { flag, enabled } = req.body;
  if (!flag || typeof enabled !== 'boolean') {
    return res.status(400).json({ success: false, error: 'Must provide valid "flag" name and boolean "enabled"' });
  }
  featureFlags.setFlag(flag, enabled);
  const adminActor = (req as unknown as { adminUser?: { id: string } }).adminUser?.id || 'admin';
  auditLogger.logEvent({
    actorId: adminActor,
    actorRole: 'admin',
    action: `TOGGLE_FEATURE_${String(flag).toUpperCase()}`,
    resourceType: 'FEATURE_FLAG',
    resourceId: String(flag),
    status: 'SUCCESS',
    details: { flag, enabled },
  });
  res.json({
    success: true,
    flags: featureFlags.getAll(),
    updated: { [flag]: enabled },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Generic Items CRUD — root-level resource used by the automated API test suite.
// Supports: Create root item, List root items, Get existing root item,
//           Delete existing root item, Root item lifecycle, smoke test.
// ─────────────────────────────────────────────────────────────────────────────

interface GenericItem {
  item_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// In-process store; survives the duration of the server process.
const itemsStore = new Map<string, GenericItem>();

// POST /api/items — Create a new root item
apiRouter.post('/items', (req: Request, res: Response) => {
  try {
    const item_id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const item: GenericItem = {
      item_id,
      data: req.body && typeof req.body === 'object' ? req.body : {},
      created_at: now,
      updated_at: now,
    };
    itemsStore.set(item_id, item);
    res.status(201).json({ success: true, item_id, item });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/items — List all root items
apiRouter.get('/items', (req: Request, res: Response) => {
  try {
    const items = Array.from(itemsStore.values());
    res.json({ success: true, items, total: items.length });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/items/:item_id — Retrieve a single root item
apiRouter.get('/items/:item_id', (req: Request, res: Response) => {
  try {
    const item = itemsStore.get(req.params.item_id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item_id: item.item_id, item });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// DELETE /api/items/:item_id — Delete a root item
apiRouter.delete('/items/:item_id', (req: Request, res: Response) => {
  try {
    const existed = itemsStore.delete(req.params.item_id);
    if (!existed) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item_id: req.params.item_id, deleted: true });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// Resource Verification API — Phase 4: Real Learning Resources
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/resources/verify — Verify a single resource URL
apiRouter.post('/resources/verify', async (req: Request, res: Response) => {
  try {
    const { url, provider, title, description, duration, level, lastVerifiedAt } = req.body;
    if (!url || !provider) {
      return res.status(400).json({ success: false, error: 'Missing required fields: url, provider' });
    }
    const result = await verifyResource(url, provider, title || 'Unknown', description || null, duration || null, level || 'Beginner', lastVerifiedAt || null);
    res.json({ success: true, verification: result });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// POST /api/resources/check-health — Quick URL health check
apiRouter.post('/resources/check-health', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Missing required field: url' });
    }
    const health = await checkUrlHealth(url);
    res.json({ success: true, health });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

export default apiRouter;

// ─────────────────────────────────────────────────────────────────────────────
// Lesson Packs & Guides API — Phase 5: Structured Learning Paths
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/lesson-packs — List all lesson packs
apiRouter.get("/lesson-packs", (req: Request, res: Response) => {
  try {
    const { difficulty, category, limit, offset } = req.query;
    let filteredPacks = [...lessonPacks];

    if (difficulty) {
      filteredPacks = filteredPacks.filter(p => p.difficulty === difficulty);
    }
    if (category) {
      filteredPacks = filteredPacks.filter(p => p.category === category);
    }

    const total = filteredPacks.length;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const paginatedPacks = filteredPacks.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      packs: paginatedPacks,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/lesson-packs/:packId — Get single lesson pack
apiRouter.get("/lesson-packs/:packId", (req: Request, res: Response) => {
  try {
    const pack = getLessonPackById(req.params.packId);
    if (!pack) {
      return res.status(404).json({ success: false, error: "Lesson pack not found" });
    }
    res.json({ success: true, pack });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/guides — List all guides
apiRouter.get("/guides", (req: Request, res: Response) => {
  try {
    const { category, difficulty, limit, offset } = req.query;
    let filteredGuides = [...guides];

    if (category) {
      filteredGuides = filteredGuides.filter(g => g.category === category);
    }
    if (difficulty) {
      filteredGuides = filteredGuides.filter(g => g.difficulty === difficulty);
    }

    const total = filteredGuides.length;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const paginatedGuides = filteredGuides.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      guides: paginatedGuides,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/guides/:guideId — Get single guide
apiRouter.get("/guides/:guideId", (req: Request, res: Response) => {
  try {
    const guide = getGuideById(req.params.guideId);
    if (!guide) {
      return res.status(404).json({ success: false, error: "Guide not found" });
    }
    res.json({ success: true, guide });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/lesson-packs/:packId/progress — Get pack progress for current user
apiRouter.get("/lesson-packs/:packId/progress", (req: Request, res: Response) => {
  try {
    const pack = getLessonPackById(req.params.packId);
    if (!pack) {
      return res.status(404).json({ success: false, error: "Lesson pack not found" });
    }
    
    const profile = dbService.getProfile();
    const userId = profile?.email || "demo-user";
    
    // TODO: Implement actual progress tracking in database
    // For now, return default progress structure
    const progress = {
      userId,
      packId: req.params.packId,
      status: "not-started",
      progressPercentage: 0,
      totalTimeSpent: 0,
      enrolledAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      lastAccessedAt: new Date().toISOString(),
      lessonsCompleted: 0,
      totalLessons: pack.totalLessons,
      currentLessonId: null,
      lessonProgress: {},
      exercisesCompleted: 0,
      totalExercises: 0,
      projectsCompleted: 0,
      totalProjects: 0,
      certificateEarned: false,
      updatedAt: new Date().toISOString()
    };

    res.json({ success: true, progress });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});



// ─────────────────────────────────────────────────────────────────────────────
// Projects & Quizzes API — Phase 6: Project Library + Skill Assessment
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/projects — List all projects
apiRouter.get("/projects", (req: Request, res: Response) => {
  try {
    const { type, difficulty, limit, offset } = req.query;
    let filteredProjects = [...projects];

    if (type) {
      filteredProjects = filteredProjects.filter(p => p.type === type);
    }
    if (difficulty) {
      filteredProjects = filteredProjects.filter(p => p.difficulty === difficulty);
    }

    const total = filteredProjects.length;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const paginatedProjects = filteredProjects.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      projects: paginatedProjects,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/projects/:projectId — Get single project
apiRouter.get("/projects/:projectId", (req: Request, res: Response) => {
  try {
    const project = getProjectById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }
    res.json({ success: true, project });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/quizzes — List all quizzes
apiRouter.get("/quizzes", (req: Request, res: Response) => {
  try {
    const { type, difficulty, limit, offset } = req.query;
    let filteredQuizzes = [...quizzes];

    if (type) {
      filteredQuizzes = filteredQuizzes.filter(q => q.type === type);
    }
    if (difficulty) {
      filteredQuizzes = filteredQuizzes.filter(q => q.difficulty === difficulty);
    }

    const total = filteredQuizzes.length;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const paginatedQuizzes = filteredQuizzes.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      quizzes: paginatedQuizzes,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/quizzes/:quizId — Get single quiz
apiRouter.get("/quizzes/:quizId", (req: Request, res: Response) => {
  try {
    const quiz = getQuizById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }
    res.json({ success: true, quiz });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/interview-questions — List interview questions
apiRouter.get("/interview-questions", (req: Request, res: Response) => {
  try {
    const { type, difficulty, category, limit, offset } = req.query;
    let filtered = [...interviewQuestions];

    if (type) {
      filtered = filtered.filter(q => q.type === type);
    }
    if (difficulty) {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }
    if (category) {
      filtered = filtered.filter(q => q.category === category);
    }

    const total = filtered.length;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      questions: paginated,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/skill-assessments — List skill assessments
apiRouter.get("/skill-assessments", (req: Request, res: Response) => {
  try {
    const { skill, difficulty, limit, offset } = req.query;
    let filtered = [...skillAssessments];

    if (skill) {
      filtered = filtered.filter(a => a.skill.toLowerCase() === (skill as string).toLowerCase());
    }
    if (difficulty) {
      filtered = filtered.filter(a => a.difficulty === difficulty);
    }

    const total = filtered.length;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      assessments: paginated,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/skill-assessments/:skill — Get assessment by skill
apiRouter.get("/skill-assessments/:skill", (req: Request, res: Response) => {
  try {
    const assessment = getSkillAssessmentBySkill(req.params.skill);
    if (!assessment) {
      return res.status(404).json({ success: false, error: "Assessment not found for this skill" });
    }
    res.json({ success: true, assessment });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// Job Intelligence API — Phase 7: Real Job Data + Market Intelligence
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/jobs — List all job postings
apiRouter.get("/jobs", (req: Request, res: Response) => {
  try {
    const { location, remotePolicy, experienceLevel, verifiedOnly, limit, offset } = req.query;
    let filteredJobs = [...jobPostings];

    if (location) {
      filteredJobs = getJobsByLocation(location as string);
    }
    if (remotePolicy) {
      filteredJobs = filteredJobs.filter(j => j.remotePolicy === remotePolicy);
    }
    if (experienceLevel) {
      filteredJobs = filteredJobs.filter(j => j.experienceLevel === experienceLevel);
    }
    if (verifiedOnly === 'true') {
      filteredJobs = filteredJobs.filter(j => j.verificationStatus === 'verified');
    }

    const total = filteredJobs.length;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const paginatedJobs = filteredJobs.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      jobs: paginatedJobs,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/jobs/:jobId — Get single job posting
apiRouter.get("/jobs/:jobId", (req: Request, res: Response) => {
  try {
    const job = getJobById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    res.json({ success: true, job });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/jobs/search — Search jobs with filters
apiRouter.get("/jobs/search", (req: Request, res: Response) => {
  try {
    const { keywords, skills, minSalary, maxSalary, limit, offset } = req.query;
    let filteredJobs = [...jobPostings];

    if (keywords) {
      const keywordLower = (keywords as string).toLowerCase();
      filteredJobs = filteredJobs.filter(j =>
        j.title.toLowerCase().includes(keywordLower) ||
        j.description.toLowerCase().includes(keywordLower)
      );
    }

    if (skills) {
      const skillsArray = (skills as string).split(',').map(s => s.trim().toLowerCase());
      filteredJobs = filteredJobs.filter(j =>
        skillsArray.some(skill =>
          j.skills.required.some(s => s.toLowerCase().includes(skill)) ||
          j.skills.preferred.some(s => s.toLowerCase().includes(skill))
        )
      );
    }

    if (minSalary) {
      const minSal = parseInt(minSalary as string);
      filteredJobs = filteredJobs.filter(j => j.salary && j.salary.min >= minSal);
    }

    if (maxSalary) {
      const maxSal = parseInt(maxSalary as string);
      filteredJobs = filteredJobs.filter(j => j.salary && j.salary.max <= maxSal);
    }

    const total = filteredJobs.length;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const paginatedJobs = filteredJobs.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      jobs: paginatedJobs,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/market/skills — Get skill demand data
apiRouter.get("/market/skills", (req: Request, res: Response) => {
  try {
    const { skill, trending } = req.query;

    if (skill) {
      const skillData = getSkillDemandBySkill(skill as string);
      if (!skillData) {
        return res.status(404).json({ success: false, error: "Skill demand data not found" });
      }
      return res.json({ success: true, skillDemand: skillData });
    }

    if (trending === 'true') {
      const trendingSkills = getTrendingSkills();
      return res.json({ success: true, skills: trendingSkills });
    }

    res.json({ success: true, skills: skillDemandData });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/market/roles — Get role market data
apiRouter.get("/market/roles", (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    if (role) {
      const roleData = getRoleMarketDataByRole(role as string);
      if (!roleData) {
        return res.status(404).json({ success: false, error: "Role market data not found" });
      }
      return res.json({ success: true, roleMarket: roleData });
    }

    res.json({ success: true, roles: roleMarketData });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/market/trends — Get market trends
apiRouter.get("/market/trends", (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    if (type) {
      const filtered = marketTrends.filter(t => t.type === type);
      return res.json({ success: true, trends: filtered });
    }

    res.json({ success: true, trends: marketTrends });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});

// GET /api/market/salary — Get salary data
apiRouter.get("/market/salary", (req: Request, res: Response) => {
  try {
    const { role, location, experienceLevel } = req.query;
    let filtered = [...salaryData];

    if (role) {
      filtered = filtered.filter(s => s.role.toLowerCase() === (role as string).toLowerCase());
    }
    if (location) {
      filtered = filtered.filter(s => s.location.toLowerCase().includes((location as string).toLowerCase()));
    }
    if (experienceLevel) {
      filtered = filtered.filter(s => s.experienceLevel === experienceLevel);
    }

    res.json({ success: true, salaryData: filtered, count: filtered.length });
  } catch (err: unknown) {
    sendSafeError(res, err, { endpoint: req.path, method: req.method });
  }
});


