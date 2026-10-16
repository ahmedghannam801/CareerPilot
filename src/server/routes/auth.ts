import { Router } from 'express';
import { checkRateLimit, recordFailedAttempt, resetAttempts } from '../middleware/rateLimiter.js';

const authRouter = Router();

/**
 * Rate-limited email/password authentication endpoint
 * POST /api/auth/login
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Check rate limit by email
    const identifier = email.toLowerCase().trim();
    const rateLimitCheck = checkRateLimit(identifier);

    if (!rateLimitCheck.allowed) {
      const minutesLocked = Math.ceil((rateLimitCheck.retryAfter || 0) / 60);
      return res.status(429).json({
        error: 'Too many login attempts',
        retryAfter: rateLimitCheck.retryAfter,
        message: `Too many attempts. Try again in ${minutesLocked} minute${minutesLocked !== 1 ? 's' : ''}`,
      });
    }

    // Authentication is handled client-side via Supabase
    // This endpoint only enforces rate limiting
    // Return success - client will handle actual Supabase auth
    res.json({
      success: true,
      remainingAttempts: rateLimitCheck.remainingAttempts,
    });

  } catch (error) {
    console.error('[AuthAPI] Login error:', error);
    res.status(500).json({
      error: 'Authentication service error',
    });
  }
});

/**
 * Record failed login attempt
 * POST /api/auth/login-failed
 */
authRouter.post('/login-failed', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const identifier = email.toLowerCase().trim();
    recordFailedAttempt(identifier);

    res.json({ success: true });
  } catch (error) {
    console.error('[AuthAPI] Record failed attempt error:', error);
    res.status(500).json({ error: 'Service error' });
  }
});

/**
 * Reset rate limit on successful login
 * POST /api/auth/login-success
 */
authRouter.post('/login-success', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const identifier = email.toLowerCase().trim();
    resetAttempts(identifier);

    res.json({ success: true });
  } catch (error) {
    console.error('[AuthAPI] Reset attempts error:', error);
    res.status(500).json({ error: 'Service error' });
  }
});

/**
 * Check rate limit status without attempting login
 * POST /api/auth/check-rate-limit
 */
authRouter.post('/check-rate-limit', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const identifier = email.toLowerCase().trim();
    const status = checkRateLimit(identifier);

    res.json(status);
  } catch (error) {
    console.error('[AuthAPI] Check rate limit error:', error);
    res.status(500).json({ error: 'Service error' });
  }
});

export { authRouter };
