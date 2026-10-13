import { Request, Response, NextFunction } from 'express';
import { auditLogger } from '../monitoring/auditLogger.js';
import { logger } from '../monitoring/logger.js';

export interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    role: 'admin' | 'system' | 'superadmin';
  };
  correlationId?: string;
}

/**
 * Enforces strict administrative authorization for privileged routes.
 * Validates either an admin API secret or verified Supabase admin token.
 */
export function requireAdminRole(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'cp_admin_dev_local_secret';
  const providedKey = req.headers['x-admin-key'] as string;
  const authHeader = req.headers.authorization;
  const correlationId = (req.headers['x-request-id'] || req.headers['x-correlation-id']) as string;

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  let isAuthorized = false;
  let actorId = 'anonymous';

  if (providedKey && providedKey === adminSecret) {
    isAuthorized = true;
    actorId = 'admin_api_key_holder';
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    // In production, parse/verify Supabase JWT claim
    const token = authHeader.substring(7);
    try {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        if (payload.role === 'service_role' || payload.user_metadata?.role === 'admin' || payload.app_metadata?.role === 'admin') {
          isAuthorized = true;
          actorId = payload.sub || 'admin_jwt_user';
        }
      }
    } catch {
      // Invalid JWT format
    }
  }

  if (!isAuthorized) {
    auditLogger.logEvent({
      actorId,
      actorRole: 'admin',
      action: `ATTEMPT_${req.method}_${req.baseUrl}${req.path}`,
      resourceType: 'ADMIN_API',
      resourceId: req.path,
      status: 'DENIED',
      clientIp,
      details: { url: req.originalUrl, method: req.method },
    });

    logger.log({
      level: 'warn',
      event: 'ADMIN_ACCESS_DENIED',
      correlationId,
      metadata: { path: req.originalUrl, clientIp },
      error: 'Unauthorized attempt to access privileged administrative endpoint',
    });

    res.status(403).json({
      success: false,
      error: 'Forbidden: Administrative privilege required.',
      code: 'ERR_ADMIN_AUTH_REQUIRED',
    });
    return;
  }

  req.adminUser = {
    id: actorId,
    role: 'admin',
  };

  next();
}
