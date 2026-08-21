import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { productRouter } from './routes/product.routes.js';
import { analysisRouter } from './routes/analysis.routes.js';
import { apiLimiter, analyzeLimiter } from './middleware/rateLimit.js';

const app = express();
const port = parseInt(env.PORT, 10) || 3333;

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Giới hạn kích thước body (chống payload khổng lồ / DoS)
app.use(express.json({ limit: '1mb' }));

// Rate limit toàn API
app.use('/api', apiLimiter);

// Routes
app.use('/api', healthRouter);
app.use('/api/products', analyzeLimiter, productRouter);
app.use('/api/analyses', analysisRouter);

app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to BuyWise AI Purchase Decision Engine API',
    health: '/api/health',
  });
});

// Backstop: không để lọt stack trace ra ngoài dù lỗi chưa được catch ở route.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[BuyWise] unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`=================================`);
  console.log(`🚀 BuyWise Backend API is running`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`=================================`);
});
