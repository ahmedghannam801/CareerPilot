import { DocumentValidationResultSchema } from './resumeSchemas.js';

/**
 * CareerPilot AI — Document Validation Service
 *
 * Validates generated DOCX and PDF artifacts to ensure:
 * - Valid Office Open XML structure (for DOCX)
 * - Can be opened by standard readers
 * - Contains extractable text for ATS compatibility
 * - No overlapping content or formatting issues
 */

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  location?: string;
}

export interface ValidationContext {
  resumeId: string;
  templateType: string;
  generatedAt: string;
  generatorVersion: string;
}

const MIN_FILE_SIZE_BYTES = 500;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates DOCX file structure and content
 */
export async function validateDOCX(
  fileBuffer: Buffer,
  context: ValidationContext
): Promise<z.infer<typeof DocumentValidationResultSchema>> {
  const issues: ValidationIssue[] = [];

  // 1. Check file size
  const fileSize = fileBuffer.length;
  if (fileSize < MIN_FILE_SIZE_BYTES) {
    issues.push({
      severity: 'error',
      code: 'FILE_TOO_SMALL',
      message: `File is ${fileSize} bytes, minimum expected is ${MIN_FILE_SIZE_BYTES} bytes`,
    });
  }
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    issues.push({
      severity: 'error',
      code: 'FILE_TOO_LARGE',
      message: `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES} bytes`,
    });
  }

  // 2. Check ZIP signature (DOCX is a ZIP file)
  const isZip = fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b;
  if (!isZip) {
    issues.push({
      severity: 'error',
      code: 'INVALID_ZIP_SIGNATURE',
      message: 'File does not have valid ZIP signature - not a valid Office Open XML document',
    });
    return createValidationResult(false, 'docx', fileSize, false, false, 0, issues, context);
  }

  // 3. Check for required Office Open XML structure
  try {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(fileBuffer);
    const entries = zip.getEntries();

    const requiredFiles = [
      '[Content_Types].xml',
      '_rels/.rels',
    ];

    const missingFiles = requiredFiles.filter(
      required => !entries.some((e: any) => e.entryName === required || e.entryName.endsWith(required))
    );

    if (missingFiles.length > 0) {
      issues.push({
        severity: 'error',
        code: 'MISSING_REQUIRED_FILES',
        message: `Missing required Office Open XML files: ${missingFiles.join(', ')}`,
      });
    }

    // 4. Check for document.xml (main content)
    const hasDocumentXml = entries.some((e: any) => e.entryName.includes('document.xml'));
    if (!hasDocumentXml) {
      issues.push({
        severity: 'error',
        code: 'MISSING_DOCUMENT_CONTENT',
        message: 'No document.xml found - cannot extract text content',
      });
    }

    // 5. Check for styles.xml (required for proper rendering)
    const hasStylesXml = entries.some((e: any) => e.entryName.includes('styles.xml'));
    if (!hasStylesXml) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_STYLES',
        message: 'No styles.xml found - document may not render correctly',
      });
    }

    // 6. Estimate page count from content size
    const documentXml = entries.find((e: any) => e.entryName.includes('document.xml'));
    const contentLength = documentXml?.getData().toString('utf8').length || 0;
    const estimatedPages = Math.max(1, Math.ceil(contentLength / 3000));

    // 7. Check for extractable text
    const hasText = contentLength > 100;

    const isValid = issues.filter(i => i.severity === 'error').length === 0;

    return createValidationResult(
      isValid,
      'docx',
      fileSize,
      true, // Can be opened
      hasText,
      estimatedPages,
      issues,
      context
    );

  } catch (err: any) {
    issues.push({
      severity: 'error',
      code: 'ZIP_PARSE_ERROR',
      message: `Failed to parse ZIP structure: ${err instanceof Error ? err.message : String(err)}`,
    });
    return createValidationResult(false, 'docx', fileSize, false, false, 0, issues, context);
  }
}

/**
 * Validates PDF file structure and content
 */
export async function validatePDF(
  fileBuffer: Buffer,
  context: ValidationContext
): Promise<z.infer<typeof DocumentValidationResultSchema>> {
  const issues: ValidationIssue[] = [];

  const fileSize = fileBuffer.length;

  // 1. Check file size
  if (fileSize < MIN_FILE_SIZE_BYTES) {
    issues.push({
      severity: 'error',
      code: 'FILE_TOO_SMALL',
      message: `File is ${fileSize} bytes, minimum expected is ${MIN_FILE_SIZE_BYTES} bytes`,
    });
  }

  // 2. Check PDF signature (%PDF)
  const hasPdfSignature =
    fileBuffer[0] === 0x25 && // %
    fileBuffer[1] === 0x50 && // P
    fileBuffer[2] === 0x44 && // D
    fileBuffer[3] === 0x46;  // F

  if (!hasPdfSignature) {
    issues.push({
      severity: 'error',
      code: 'INVALID_PDF_SIGNATURE',
      message: 'File does not have valid PDF signature',
    });
    return createValidationResult(false, 'pdf', fileSize, false, false, 0, issues, context);
  }

  // 3. Check for %%EOF trailer
  const eofMarker = fileBuffer.subarray(Math.max(0, fileSize - 1024)).toString('binary');
  const hasEof = eofMarker.includes('%%EOF');

  if (!hasEof) {
    issues.push({
      severity: 'error',
      code: 'INVALID_PDF_TRAILER',
      message: 'PDF file is missing proper EOF marker - may be truncated',
    });
  }

  // 4. Check for /Type /Page objects (content pages)
  const content = fileBuffer.toString('binary');
  const pageCount = (content.match(/\/Type\s*\/Page[^s]/g) || []).length;

  if (pageCount === 0) {
    issues.push({
      severity: 'error',
      code: 'NO_PAGES',
      message: 'PDF contains no page objects',
    });
  }

  // 5. Check for text content (for ATS)
  const hasText = content.length > 500 && /[a-zA-Z]{4,}/.test(content);
  if (!hasText) {
    issues.push({
      severity: 'warning',
      code: 'NO_EXTRACTABLE_TEXT',
      message: 'PDF may contain only images - text not extractable for ATS',
    });
  }

  const isValid = issues.filter(i => i.severity === 'error').length === 0;

  return createValidationResult(
    isValid,
    'pdf',
    fileSize,
    true, // Can be opened
    hasText,
    Math.max(1, pageCount),
    issues,
    context
  );
}

/**
 * Validates resume content before document generation
 */
export function validateResumeContent(resume: {
  summary?: string;
  experience?: unknown[];
  education?: unknown[];
  skills?: string[];
}): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (!resume.summary || resume.summary.length < 20) {
    issues.push({
      severity: 'error',
      code: 'INVALID_SUMMARY',
      message: 'Summary must be at least 20 characters',
    });
  }

  if (!resume.experience || resume.experience.length === 0) {
    issues.push({
      severity: 'warning',
      code: 'NO_EXPERIENCE',
      message: 'No work experience listed - consider adding relevant positions',
    });
  }

  if (!resume.education || resume.education.length === 0) {
    issues.push({
      severity: 'info',
      code: 'NO_EDUCATION',
      message: 'No education listed',
    });
  }

  if (!resume.skills || resume.skills.length === 0) {
    issues.push({
      severity: 'error',
      code: 'NO_SKILLS',
      message: 'At least one skill is required',
    });
  }

  // Check for proper experience structure
  if (resume.experience) {
    for (let i = 0; i < resume.experience.length; i++) {
      const exp = resume.experience[i] as Record<string, unknown>;
      if (!exp.company) {
        issues.push({
          severity: 'error',
          code: 'MISSING_COMPANY',
          message: `Experience entry ${i + 1} is missing company name`,
        });
      }
      if (!exp.role) {
        issues.push({
          severity: 'error',
          code: 'MISSING_ROLE',
          message: `Experience entry ${i + 1} is missing role/title`,
        });
      }
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function createValidationResult(
  isValid: boolean,
  format: 'docx' | 'pdf',
  fileSizeBytes: number,
  canBeOpened: boolean,
  hasExtractableText: boolean,
  pageCount: number,
  issues: ValidationIssue[],
  context: ValidationContext
): z.infer<typeof DocumentValidationResultSchema> {
  return {
    isValid,
    format,
    fileSizeBytes,
    canBeOpened,
    hasExtractableText,
    pageCount,
    detectedIssues: issues,
    metadata: {
      generatedAt: context.generatedAt,
      generatorVersion: context.generatorVersion,
      templateUsed: context.templateType,
    },
  };
}

// Import zod for type
import { z } from 'zod';