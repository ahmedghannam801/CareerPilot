/**
 * Rate Limiting Middleware for Authentication Endpoints
 * Prevents brute-force attacks with exponential backoff
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const attempts = new Map<string, AttemptRecord>();

// Configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout after max attempts

/**
 * Check if identifier is rate limited
 * @param identifier - Email or IP address to check
 * @returns Rate limit status
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts?: number;
  lockedUntil?: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const record = attempts.get(identifier);

  // Check if currently locked
  if (record?.lockedUntil && record.lockedUntil > now) {
    return {
      allowed: false,
      lockedUntil: record.lockedUntil,
      retryAfter: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // Reset window if expired
  if (!record || (now - record.firstAttempt) > WINDOW_MS) {
    attempts.set(identifier, {
      count: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
    };
  }

  // Check if within limits
  if (record.count < MAX_ATTEMPTS) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - record.count - 1,
    };
  }

  // Exceeded attempts - lock out
  record.lockedUntil = now + LOCKOUT_MS;
  attempts.set(identifier, record);

  return {
    allowed: false,
    lockedUntil: record.lockedUntil,
    retryAfter: Math.ceil(LOCKOUT_MS / 1000),
  };
}

/**
 * Record a failed attempt
 * @param identifier - Email or IP address
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const record = attempts.get(identifier);

  if (!record || (now - record.firstAttempt) > WINDOW_MS) {
    attempts.set(identifier, {
      count: 1,
      firstAttempt: now,
    });
  } else {
    record.count++;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
    }
    attempts.set(identifier, record);
  }
}

/**
 * Reset attempts for identifier (call on successful login)
 * @param identifier - Email or IP address
 */
export function resetAttempts(identifier: string): void {
  attempts.delete(identifier);
}

/**
 * Clean up old records periodically
 */
function cleanupOldRecords(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, record] of attempts.entries()) {
    // Remove records older than window + lockout duration
    if ((now - record.firstAttempt) > (WINDOW_MS + LOCKOUT_MS)) {
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach(key => attempts.delete(key));
}

// Run cleanup every 5 minutes
setInterval(cleanupOldRecords, 5 * 60 * 1000);
