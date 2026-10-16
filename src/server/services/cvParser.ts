/**
 * CareerPilot AI — CV Parsing Service
 *
 * Server-side text extraction from PDF and DOCX files.
 * Handles file validation, parsing, and text normalization.
 */

import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export interface ParsedCVResult {
  text: string;
  pageCount?: number;
  wordCount: number;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}

/**
 * Extract text from PDF buffer using pdf-parse
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedCVResult> {
  try {
    const data = await pdf(buffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      wordCount: data.text.split(/\s+/).filter(Boolean).length,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        creationDate: data.info?.CreationDate,
      },
    };
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX buffer using mammoth
 */
export async function parseDOCX(buffer: Buffer): Promise<ParsedCVResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    if (result.messages.length > 0) {
      console.warn('[DOCX Parser] Conversion warnings:', result.messages);
    }

    return {
      text: result.value,
      wordCount: result.value.split(/\s+/).filter(Boolean).length,
    };
  } catch (error) {
    throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse TXT file (plain text)
 */
export function parseTXT(buffer: Buffer): ParsedCVResult {
  const text = buffer.toString('utf-8');

  return {
    text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

/**
 * Normalize extracted text for AI processing
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n') // Collapse excessive line breaks
    .replace(/\t/g, ' ') // Convert tabs to spaces
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Main CV parser - auto-detects file type and extracts text
 */
export async function parseCV(
  buffer: Buffer,
  fileName: string
): Promise<ParsedCVResult> {
  const extension = fileName.toLowerCase().split('.').pop();

  let result: ParsedCVResult;

  switch (extension) {
    case 'pdf':
      result = await parsePDF(buffer);
      break;
    case 'docx':
    case 'doc':
      result = await parseDOCX(buffer);
      break;
    case 'txt':
      result = parseTXT(buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }

  // Normalize the extracted text
  result.text = normalizeText(result.text);

  // Validation
  if (!result.text || result.text.length < 100) {
    throw new Error('Extracted text is too short. The document may be empty or corrupted.');
  }

  if (result.text.length > 50000) {
    // Truncate very long documents to prevent AI token overflow
    console.warn(`[CV Parser] Document is very long (${result.text.length} chars). Truncating to 50000.`);
    result.text = result.text.substring(0, 50000);
  }

  return result;
}
