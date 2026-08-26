import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { env } from './backend/src/config/env.js';
import { healthRouter } from './backend/src/routes/health.js';
import { productRouter } from './backend/src/routes/product.routes.js';
import { analysisRouter } from './backend/src/routes/analysis.routes.js';
import { apiLimiter, analyzeLimiter } from './backend/src/middleware/rateLimit.js';
import { securityHeaders } from './backend/src/middleware/securityHeaders.js';
import { GeminiService } from './backend/src/services/gemini.service.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for rate limiting behind reverse proxy
  app.set('trust proxy', 1);

  // CORS support
  app.use(cors({
    origin: '*',
    credentials: false,
  }));

  // Security headers for API
  app.use(securityHeaders);

  // Body parser with 10mb limit for base64 product images
  app.use(express.json({ limit: '10mb' }));

  // Apply API rate limiting
  app.use('/api', apiLimiter);

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api/products', analyzeLimiter, productRouter);
  app.use('/api/analyses', analysisRouter);

  // Vite Middleware in development / Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), 'frontend/vite.config.ts'),
      root: path.resolve(process.cwd(), 'frontend'),
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist/public');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[BuyWise] Unhandled error:', err);
    const status = Number(err?.status || err?.statusCode) || 500;
    const message = err?.type === 'entity.too.large'
      ? 'Nội dung gửi lên quá lớn.'
      : 'Internal server error.';
    res.status(status).json({ success: false, error: message });
  });

  // Probe Gemini (key + model) lúc startup — best-effort, không chặn server.
  void GeminiService.probe().catch((err) => {
    console.warn('[BuyWise] Gemini probe failed:', err);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================`);
    console.log(`🚀 BuyWise Unified Server running`);
    console.log(`📡 URL: http://0.0.0.0:${PORT}`);
    console.log(`=================================`);
  });
}

startServer().catch((err) => {
  console.error('[BuyWise] Fatal error during startup:', err);
  process.exit(1);
});
