/**
 * Input Validation Middleware
 * Comprehensive validation for all API endpoints
 */

import { Request, Response, NextFunction } from 'express';

// ─── Validation Schemas ────────────────────────────────────────────────────

const MAX_LENGTHS = {
  email: 254,
  name: 100,
  password: 128,
  title: 200,
  description: 5000,
  summary: 2000,
  jobDescription: 10000,
  skill: 100,
  company: 200,
  location: 200,
  url: 2048,
  message: 5000,
  notes: 2000,
};

// ─── Validation Helpers ────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  if (!email || email.length > MAX_LENGTHS.email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  if (!url || url.length > MAX_LENGTHS.url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function sanitizeString(str: string, maxLength: number): string {
  if (!str) return '';
  // Trim and limit length
  return str.trim().slice(0, maxLength);
}

function validateStringLength(str: string | undefined, maxLength: number): boolean {
  if (!str) return true;
  return str.length <= maxLength;
}

function validateArrayLength(arr: any[] | undefined, maxLength: number): boolean {
  if (!arr) return true;
  return Array.isArray(arr) && arr.length <= maxLength;
}

// ─── Validation Middleware Functions ───────────────────────────────────────

export function validateProfile(req: Request, res: Response, next: NextFunction) {
  const { fullName, email, headline, location, targetRole } = req.body;

  if (fullName && !validateStringLength(fullName, MAX_LENGTHS.name)) {
    return res.status(400).json({ error: 'Full name too long' });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (headline && !validateStringLength(headline, MAX_LENGTHS.title)) {
    return res.status(400).json({ error: 'Headline too long' });
  }

  if (location && !validateStringLength(location, MAX_LENGTHS.location)) {
    return res.status(400).json({ error: 'Location too long' });
  }

  if (targetRole && !validateStringLength(targetRole, MAX_LENGTHS.title)) {
    return res.status(400).json({ error: 'Target role too long' });
  }

  // Sanitize strings
  if (fullName) req.body.fullName = sanitizeString(fullName, MAX_LENGTHS.name);
  if (headline) req.body.headline = sanitizeString(headline, MAX_LENGTHS.title);
  if (location) req.body.location = sanitizeString(location, MAX_LENGTHS.location);
  if (targetRole) req.body.targetRole = sanitizeString(targetRole, MAX_LENGTHS.title);

  next();
}

export function validateResume(req: Request, res: Response, next: NextFunction) {
  const { title, summary, skills, experience, education } = req.body;

  if (title && !validateStringLength(title, MAX_LENGTHS.title)) {
    return res.status(400).json({ error: 'Resume title too long' });
  }

  if (summary && !validateStringLength(summary, MAX_LENGTHS.summary)) {
    return res.status(400).json({ error: 'Summary too long' });
  }

  if (skills && !validateArrayLength(skills, 100)) {
    return res.status(400).json({ error: 'Too many skills' });
  }

  if (experience && !validateArrayLength(experience, 50)) {
    return res.status(400).json({ error: 'Too many experience entries' });
  }

  if (education && !validateArrayLength(education, 20)) {
    return res.status(400).json({ error: 'Too many education entries' });
  }

  // Sanitize title and summary
  if (title) req.body.title = sanitizeString(title, MAX_LENGTHS.title);
  if (summary) req.body.summary = sanitizeString(summary, MAX_LENGTHS.summary);

  next();
}

export function validateOpportunity(req: Request, res: Response, next: NextFunction) {
  const { title, company, description, location, requirements } = req.body;

  if (!title || !validateStringLength(title, MAX_LENGTHS.title)) {
    return res.status(400).json({ error: 'Invalid or missing job title' });
  }

  if (!company || !validateStringLength(company, MAX_LENGTHS.company)) {
    return res.status(400).json({ error: 'Invalid or missing company name' });
  }

  if (description && !validateStringLength(description, MAX_LENGTHS.jobDescription)) {
    return res.status(400).json({ error: 'Job description too long' });
  }

  if (location && !validateStringLength(location, MAX_LENGTHS.location)) {
    return res.status(400).json({ error: 'Location too long' });
  }

  if (requirements && !validateArrayLength(requirements, 50)) {
    return res.status(400).json({ error: 'Too many requirements' });
  }

  // Sanitize
  req.body.title = sanitizeString(title, MAX_LENGTHS.title);
  req.body.company = sanitizeString(company, MAX_LENGTHS.company);
  if (location) req.body.location = sanitizeString(location, MAX_LENGTHS.location);

  next();
}

export function validateApplication(req: Request, res: Response, next: NextFunction) {
  const { jobTitle, company, notes, coverLetter } = req.body;

  if (jobTitle && !validateStringLength(jobTitle, MAX_LENGTHS.title)) {
    return res.status(400).json({ error: 'Job title too long' });
  }

  if (company && !validateStringLength(company, MAX_LENGTHS.company)) {
    return res.status(400).json({ error: 'Company name too long' });
  }

  if (notes && !validateStringLength(notes, MAX_LENGTHS.notes)) {
    return res.status(400).json({ error: 'Notes too long' });
  }

  if (coverLetter && !validateStringLength(coverLetter, MAX_LENGTHS.description)) {
    return res.status(400).json({ error: 'Cover letter too long' });
  }

  // Sanitize
  if (jobTitle) req.body.jobTitle = sanitizeString(jobTitle, MAX_LENGTHS.title);
  if (company) req.body.company = sanitizeString(company, MAX_LENGTHS.company);

  next();
}

export function validateProject(req: Request, res: Response, next: NextFunction) {
  const { title, description, skills } = req.body;

  if (title && !validateStringLength(title, MAX_LENGTHS.title)) {
    return res.status(400).json({ error: 'Project title too long' });
  }

  if (description && !validateStringLength(description, MAX_LENGTHS.description)) {
    return res.status(400).json({ error: 'Project description too long' });
  }

  if (skills && !validateArrayLength(skills, 20)) {
    return res.status(400).json({ error: 'Too many skills' });
  }

  // Sanitize
  if (title) req.body.title = sanitizeString(title, MAX_LENGTHS.title);

  next();
}

export function validateAIPrompt(req: Request, res: Response, next: NextFunction) {
  const { message, prompt, query } = req.body;
  const input = message || prompt || query;

  if (!input) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!validateStringLength(input, MAX_LENGTHS.message)) {
    return res.status(400).json({ error: 'Message too long' });
  }

  // Sanitize
  if (message) req.body.message = sanitizeString(message, MAX_LENGTHS.message);
  if (prompt) req.body.prompt = sanitizeString(prompt, MAX_LENGTHS.message);
  if (query) req.body.query = sanitizeString(query, MAX_LENGTHS.message);

  next();
}

export function validateJobDescription(req: Request, res: Response, next: NextFunction) {
  const { jobDescription, jd, description } = req.body;
  const jdText = jobDescription || jd || description;

  if (!jdText) {
    return res.status(400).json({ error: 'Job description is required' });
  }

  if (!validateStringLength(jdText, MAX_LENGTHS.jobDescription)) {
    return res.status(400).json({ error: 'Job description too long' });
  }

  // Sanitize
  if (jobDescription) req.body.jobDescription = sanitizeString(jobDescription, MAX_LENGTHS.jobDescription);
  if (jd) req.body.jd = sanitizeString(jd, MAX_LENGTHS.jobDescription);
  if (description) req.body.description = sanitizeString(description, MAX_LENGTHS.jobDescription);

  next();
}

export function validateQueryParams(req: Request, res: Response, next: NextFunction) {
  // Validate common query parameters
  const { page, limit, search, filter } = req.query;

  if (page) {
    const pageNum = parseInt(page as string, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
  }

  if (limit) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit' });
    }
  }

  if (search && typeof search === 'string') {
    if (search.length > 200) {
      return res.status(400).json({ error: 'Search query too long' });
    }
  }

  if (filter && typeof filter === 'string') {
    if (filter.length > 100) {
      return res.status(400).json({ error: 'Filter too long' });
    }
  }

  next();
}

export function validateInterview(req: Request, res: Response, next: NextFunction) {
  const { answer, role, level } = req.body;

  if (answer && !validateStringLength(answer, MAX_LENGTHS.description)) {
    return res.status(400).json({ error: 'Answer too long' });
  }

  if (role && !validateStringLength(role, MAX_LENGTHS.title)) {
    return res.status(400).json({ error: 'Role too long' });
  }

  if (level && !['junior', 'mid', 'senior', 'lead'].includes(level)) {
    return res.status(400).json({ error: 'Invalid level' });
  }

  // Sanitize
  if (role) req.body.role = sanitizeString(role, MAX_LENGTHS.title);

  next();
}
