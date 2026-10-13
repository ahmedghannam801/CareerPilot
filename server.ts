import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body parsing for JSON and text payloads
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API router mounted under /api
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    try {
      res.json({
        status: 'ok',
        service: 'CareerPilot AI Operating System',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
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
