/**
 * Safe Error Response Utility
 * Prevents information disclosure while maintaining internal logging
 */

import { Response } from 'express';
import { logger } from '../monitoring/logger.js';

// Generic user-facing error messages
const SAFE_ERROR_MESSAGES = {
  INTERNAL_ERROR: 'An internal error occurred. Please try again later.',
  DATABASE_ERROR: 'Unable to process your request. Please try again.',
  AI_SERVICE_ERROR: 'AI service temporarily unavailable. Please try again.',
  VALIDATION_ERROR: 'Invalid request data. Please check your input.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
};

interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
}

/**
 * Send safe error response to client while logging full details internally
 */
export function sendSafeError(
  res: Response,
  error: unknown,
  context?: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log full error details internally (no PII/secrets)
  console.error('[API Error]', {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
  });

  // Determine user-facing message
  let userMessage = SAFE_ERROR_MESSAGES.INTERNAL_ERROR;
  let statusCode = 500;

  // Check for specific error patterns
  if (errorMessage.toLowerCase().includes('not found')) {
    userMessage = SAFE_ERROR_MESSAGES.NOT_FOUND;
    statusCode = 404;
  } else if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('forbidden')) {
    userMessage = SAFE_ERROR_MESSAGES.UNAUTHORIZED;
    statusCode = 403;
  } else if (errorMessage.toLowerCase().includes('validation') || errorMessage.toLowerCase().includes('invalid')) {
    userMessage = SAFE_ERROR_MESSAGES.VALIDATION_ERROR;
    statusCode = 400;
  } else if (errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('supabase')) {
    userMessage = SAFE_ERROR_MESSAGES.DATABASE_ERROR;
    statusCode = 500;
  } else if (errorMessage.toLowerCase().includes('ai') || errorMessage.toLowerCase().includes('model')) {
    userMessage = SAFE_ERROR_MESSAGES.AI_SERVICE_ERROR;
    statusCode = 503;
  } else if (errorMessage.toLowerCase().includes('rate limit')) {
    userMessage = SAFE_ERROR_MESSAGES.RATE_LIMIT;
    statusCode = 429;
  }

  // Send safe response
  res.status(statusCode).json({
    success: false,
    error: userMessage,
  });
}

/**
 * Check if error message contains sensitive information
 */
export function containsSensitiveInfo(message: string): boolean {
  const sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /bearer/i,
    /authorization/i,
    /supabase.*url/i,
    /connection.*string/i,
    /file.*path/i,
    /c:\\/i,
    /\/home\//i,
    /\/usr\//i,
    /stack trace/i,
    /at.*\(.*:\d+:\d+\)/i, // Stack trace pattern
  ];

  return sensitivePatterns.some(pattern => pattern.test(message));
}
