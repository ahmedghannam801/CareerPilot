import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Simple CSRF token management for state-changing operations
// Uses double-submit cookie pattern

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

/**
 * Generates a random CSRF token
 */
function generateToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to generate and set CSRF token in cookie
 * Call this on GET requests that will render forms
 */
export function setCsrfToken(req: CSRFRequest, res: Response, next: NextFunction): void {
  // Generate token if not present
  let token = req.cookies?.[CSRF_COOKIE_NAME];

  if (!token) {
    token = generateToken();
  }

  // Set token in cookie (HttpOnly for security)
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  // Make token available to request handler (for embedding in forms/responses)
  req.csrfToken = token;

  next();
}

/**
 * Middleware to verify CSRF token on state-changing operations
 * Call this on POST/PUT/PATCH/DELETE requests
 */
export function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF for safe methods
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  // Check if tokens exist
  if (!cookieToken) {
    res.status(403).json({
      success: false,
      error: 'CSRF token missing in cookie',
    });
    return;
  }

  if (!headerToken) {
    res.status(403).json({
      success: false,
      error: 'CSRF token missing in header',
    });
    return;
  }

  // Verify tokens match (double-submit cookie pattern)
  // Use timing-safe comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    res.status(403).json({
      success: false,
      error: 'CSRF token mismatch',
    });
    return;
  }

  // Token is valid
  next();
}

/**
 * Helper function to get current CSRF token from request
 * Use this in route handlers to send token to client
 */
export function getCsrfToken(req: CSRFRequest): string | undefined {
  return req.csrfToken || req.cookies?.[CSRF_COOKIE_NAME];
}

/**
 * Endpoint to get CSRF token for client-side usage
 * Mount this at /api/csrf-token
 */
export function csrfTokenEndpoint(req: CSRFRequest, res: Response): void {
  const token = getCsrfToken(req);

  if (!token) {
    res.status(500).json({
      success: false,
      error: 'CSRF token not generated',
    });
    return;
  }

  res.json({
    success: true,
    csrfToken: token,
  });
}
