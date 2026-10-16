/**
 * CareerPilot AI — Updated CV Generation Endpoints
 *
 * CRITICAL FIXES:
 * 1. Added authorization checks with getReqUserId()
 * 2. Proper DOCX generation via docx library
 * 3. Document validation before returning success
 * 4. Strict AI response validation (no fallback fabrication)
 * 5. Comprehensive error handling and user feedback
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { generateResumeDOCX, generateATSFriendlyDOCX } from '../services/docxGenerator.js';
import { validateDOCX, validateResumeContent } from '../validation/documentValidator.js';
import { getReqUserId } from './api.js';
import { dbService } from '../db/index.js';
import { AIAgents } from '../ai/agents.js';
import { strictValidate } from '../validation/strictSchemas.js';
import {
  StrictATSAnalysisSchema,
  StrictTailoredCVSchema,
} from '../validation/strictSchemas.js';
import {
  generateTailoredCV,
  extractCandidateInfoFromText,
} from '../../lib/resumeIntelligence.js';
import { ResumeVersion } from '../../types/index.js';
import { parseCV } from '../services/cvParser.js';

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
    }
  },
});

export const cvRouter = Router();

/**
 * POST /api/resumes/upload
 * Upload and parse CV file (PDF/DOCX/TXT)
 */
cvRouter.post('/resumes/upload', upload.single('cv'), async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select a CV file.',
      });
    }

    try {
      // Parse the CV file
      const parsedResult = await parseCV(req.file.buffer, req.file.originalname);

      // Extract candidate information from parsed text
      const candidateInfo = extractCandidateInfoFromText(parsedResult.text);

      // Create resume version from parsed data
      const newResume: ResumeVersion = {
        id: `res-uploaded-${Date.now()}`,
        title: req.file.originalname.replace(/\.[^/.]+$/, ''), // Remove extension
        isMaster: false, // User can mark as master later
        summary: candidateInfo.summary || '',
        experience: candidateInfo.experience || [],
        education: candidateInfo.education || [],
        skills: candidateInfo.skills || [],
        certifications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to database
      const saved = dbService.saveResume(newResume, userId);

      res.json({
        success: true,
        resume: saved,
        parsedData: {
          text: parsedResult.text.substring(0, 1000), // Return preview only
          wordCount: parsedResult.wordCount,
          pageCount: parsedResult.pageCount,
        },
        candidateInfo,
        message: 'CV uploaded and parsed successfully',
      });
    } catch (parseError) {
      const msg = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      console.error('[CV Upload] Parsing failed:', msg);

      return res.status(400).json({
        success: false,
        error: 'CV parsing failed',
        details: msg,
        userMessage: 'Unable to read your CV. Please ensure it is a valid PDF, DOCX, or TXT file.',
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CV Upload] Error:', msg);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/resumes
 * Save a resume with authorization check
 */
cvRouter.post('/resumes', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required. Must provide valid authorization token.',
      });
    }

    const resume = req.body as ResumeVersion;

    // Validate resume structure
    const contentValidation = validateResumeContent(resume);
    if (!contentValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Resume validation failed',
        issues: contentValidation.issues,
      });
    }

    // Save with user association
    const saved = dbService.saveResume(resume, userId);

    res.json({
      success: true,
      resume: saved,
      message: 'Resume saved successfully',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CV Save] Error:', msg);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/resumes
 * List user's resumes with authorization check
 */
cvRouter.get('/resumes', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
      });
    }

    const resumes = dbService.getResumes(userId);
    res.json({ success: true, resumes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * DELETE /api/resumes/:id
 * Delete a resume with ownership verification
 */
cvRouter.delete('/resumes/:id', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
      });
    }

    const resumeId = req.params.id;
    const allResumes = dbService.getResumes(userId);
    const resume = allResumes.find(r => r.id === resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found or access denied',
      });
    }

    dbService.deleteResume(resumeId);
    res.json({ success: true, deleted: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/resumes/:id/analyze
 * Analyze resume ATS score with STRICT validation
 */
cvRouter.post('/resumes/:id/analyze', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User authentication required' });
    }

    const resumeId = req.params.id;
    const allResumes = dbService.getResumes(userId);
    const resume = allResumes.find(r => r.id === resumeId);

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const { targetRole } = req.body;

    try {
      // STRICT validation - will throw on failure
      const atsAnalysis = await AIAgents.runCVAnalysis(resume, targetRole);

      // Validate response strictly
      const validated = strictValidate(StrictATSAnalysisSchema, atsAnalysis, 'CV Analysis Agent');

      // Save analysis to resume
      resume.analysisDetails = validated;
      resume.atsScore = validated.overallScore;
      dbService.saveResume(resume, userId);

      res.json({
        success: true,
        ats: validated,
        message: 'Resume analysis completed successfully',
      });
    } catch (aiErr) {
      // AI failed validation - report clearly
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.error('[CV Analysis] AI validation failed:', msg);

      res.status(400).json({
        success: false,
        error: 'Resume analysis failed',
        details: msg,
        userMessage: 'Unable to analyze resume. The AI service returned invalid data. Please try again.',
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/resumes/tailor
 * Generate tailored CV with STRICT validation
 */
cvRouter.post('/resumes/tailor', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User authentication required' });
    }

    const { resumeId, opportunityId, customJobDescription, customJobTitle, customCompany, targetRole } =
      req.body;

    // Get source resume
    const allResumes = dbService.getResumes(userId);
    const sourceResume = resumeId
      ? allResumes.find(r => r.id === resumeId)
      : allResumes.find(r => r.isMaster);

    if (!sourceResume) {
      return res.status(404).json({
        success: false,
        error: 'No resume found to tailor. Create a master resume first.',
      });
    }

    // Get opportunity
    const opportunities = dbService.getOpportunities(userId);
    let opportunity = opportunityId ? opportunities.find(o => o.id === opportunityId) : null;

    if (!opportunity && (customJobTitle || customJobDescription)) {
      // Create temporary opportunity from custom job description
      opportunity = {
        id: `opp-custom-${Date.now()}`,
        title: customJobTitle || 'Target Position',
        company: customCompany || 'Target Company',
        location: 'Remote',
        workModel: 'Remote' as const,
        employmentType: 'Full-time' as const,
        description: customJobDescription || '',
        requirements: [],
        preferredSkills: [],
        isManual: true,
        createdAt: new Date().toISOString(),
      };
    }

    if (!opportunity) {
      return res.status(400).json({
        success: false,
        error: 'Must provide either opportunityId or customJobDescription',
      });
    }

    try {
      // Use server-side AI tailoring
      const tailoredData = await AIAgents.runTailorCV(sourceResume, opportunity);

      // STRICT validation
      const validated = strictValidate(StrictTailoredCVSchema, tailoredData, 'Tailored CV Agent');

      // Create tailored resume (never overwrites master)
      const tailoredResume: ResumeVersion = {
        id: `res-tailored-${Date.now()}`,
        title: `${sourceResume.title} - Tailored for ${opportunity.title}`,
        isMaster: false,
        isTailored: true,
        sourceResumeId: sourceResume.id,
        targetRole: validated.targetRole,
        summary: validated.summary,
        experience: sourceResume.experience, // Keep original experience
        education: sourceResume.education,
        skills: validated.highlightedSkills,
        certifications: sourceResume.certifications,
        atsScore: validated.atsScore,
        opportunityId: opportunity.id,
        companyName: opportunity.company,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save tailored resume
      dbService.saveResume(tailoredResume, userId);

      res.json({
        success: true,
        tailoredData: validated,
        tailoredResume,
        opportunity,
        message: 'CV tailored successfully for the target opportunity',
      });
    } catch (aiErr) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.error('[Tailor CV] AI validation failed:', msg);

      res.status(400).json({
        success: false,
        error: 'CV tailoring failed',
        details: msg,
        userMessage: 'Unable to tailor CV. The AI service failed validation. Please try again.',
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/resumes/:id/export-docx
 * Generate and validate DOCX file
 */
cvRouter.post('/resumes/:id/export-docx', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User authentication required' });
    }

    const resumeId = req.params.id;
    const allResumes = dbService.getResumes(userId);
    const resume = allResumes.find(r => r.id === resumeId);

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const { templateType = 'google_doc', useAtsOptimized = false } = req.body;

    try {
      // Generate DOCX
      const docxBuffer = useAtsOptimized
        ? await generateATSFriendlyDOCX(resume)
        : await generateResumeDOCX(resume, templateType || 'google_doc');

      // Validate generated document
      const validation = await validateDOCX(docxBuffer, {
        resumeId,
        templateType: templateType || 'google_doc',
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0',
      });

      if (!validation.isValid) {
        const errorList = validation.detectedIssues
          .filter(i => i.severity === 'error')
          .map(i => i.message)
          .join('; ');

        console.error('[DOCX Validation] Generated document is INVALID:', errorList);

        return res.status(500).json({
          success: false,
          error: 'Document generation failed validation',
          details: errorList,
          userMessage: 'Generated document is corrupted. Please try again.',
        });
      }

      // Document is valid - return it
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${resume.title.replace(/[^\w\s-]/g, '_')}.docx"`
      );
      res.setHeader('Content-Length', docxBuffer.length);

      res.send(docxBuffer);
    } catch (genErr) {
      const msg = genErr instanceof Error ? genErr.message : String(genErr);
      console.error('[DOCX Generation] Error:', msg);

      res.status(500).json({
        success: false,
        error: 'Document generation failed',
        details: msg,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/resumes/:id/library
 * Get resume library for user
 */
cvRouter.get('/resumes/library', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User authentication required' });
    }

    const allResumes = dbService.getResumes(userId);

    return res.json({
      success: true,
      masterResume: allResumes.find(r => r.isMaster) || null,
      tailoredResumes: allResumes.filter(r => r.isTailored),
      uploadedDocuments: [],
      drafts: allResumes.filter(r => !r.atsScore),
      totalCount: allResumes.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});