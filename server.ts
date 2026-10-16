import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/routes/api.js';

import { logger } from './src/server/monitoring/logger.js';
import { aiGateway } from './src/server/ai/gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Correlation ID & Structured Telemetry Middleware
  app.use((req, res, next) => {
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    res.setHeader('X-Request-ID', correlationId);
    res.setHeader('X-Correlation-ID', correlationId);
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      logger.recordRequest(durationMs, res.statusCode);

      if (req.path !== '/health') {
        const isError = res.statusCode >= 400;
        logger.log({
          level: isError ? (res.statusCode >= 500 ? 'error' : 'warn') : 'info',
          event: `HTTP_${req.method}_${res.statusCode}`,
          correlationId,
          durationMs,
          statusCode: res.statusCode,
          metadata: {
            method: req.method,
            path: req.path,
          },
        });
      }
    });
    next();
  });

  // Security Headers Middleware
  app.use((req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Content Security Policy
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://generativelanguage.googleapis.com https://*.supabase.co" +
        (isProduction ? "" : " ws://localhost:* http://localhost:*"),
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "media-src 'self'",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "form-action 'self'",
    ];

    if (isProduction) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // HSTS - Only in production with HTTPS
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  });

  // CORS middleware with strict origin control
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const isProduction = process.env.NODE_ENV === 'production';

    // Define allowed origins
    const allowedOrigins = isProduction
      ? [
          'https://careerpilot.ai',
          'https://www.careerpilot.ai',
          'https://careerpilot-dic.pages.dev',
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
        ];

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Request-ID, X-Correlation-ID, X-User-ID, X-Goog-Api-Key'
    );
    res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-Correlation-ID');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Body parsing for JSON and text payloads
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API router mounted under /api
  app.use('/api', apiRouter);

  // Health check & Operational Telemetry endpoint
  app.get('/health', async (req, res) => {
    try {
      const mem = process.memoryUsage();
      res.json({
        status: 'ok',
        service: 'CareerPilot AI Operating System',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        aiConfigured: aiGateway.isConfigured(),
        memory: {
          rssMb: Math.round(mem.rss / (1024 * 1024)),
          heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(503).json({ status: 'error', error: msg });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev server middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CareerPilot AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CareerPilot AI] Fatal server startup error:', err);
  process.exit(1);
});
