import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { productRouter } from './routes/product.routes.js';
import { analysisRouter } from './routes/analysis.routes.js';
import { apiLimiter, analyzeLimiter } from './middleware/rateLimit.js';
import { securityHeaders } from './middleware/securityHeaders.js';

const app = express();
const port = parseInt(env.PORT, 10) || 3333;

// Tin IP thật của client khi chạy sau proxy (Cloud Run / nginx) — để rate-limit chính xác.
app.set('trust proxy', 1);

// CORS: API không dùng cookie/session nên KHÔNG bật credentials (tránh tổ hợp
// "origin: * + credentials: true" bị trình duyệt từ chối). Hỗ trợ danh sách origin cách nhau bởi dấu phẩy.
app.use(cors({
  origin: env.CORS_ORIGIN === '*'
    ? '*'
    : env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
  credentials: false,
}));

// Security headers (tương đương helmet, không thêm dependency).
app.use(securityHeaders);

// Giới hạn kích thước body (chống payload khổng lồ / DoS).
// Phải >= giới hạn ảnh base64 (~3.5MB) trong validate.ts, nếu không ảnh sẽ bị 413 trước khi validate.
app.use(express.json({ limit: '10mb' }));

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
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[BuyWise] unhandled error:', err);
  // Giữ đúng HTTP status (VD 413 của body-parser, 429 của rate-limit) thay vì luôn 500,
  // nhưng vẫn không lộ chi tiết nội bộ (stack trace / DB / key).
  const status = Number(err?.status || err?.statusCode) || 500;
  const message = err?.type === 'entity.too.large'
    ? 'Nội dung gửi lên quá lớn.'
    : 'Internal server error.';
  res.status(status).json({ success: false, error: message });
});

app.listen(port, () => {
  console.log(`=================================`);
  console.log(`🚀 BuyWise Backend API is running`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`=================================`);
});
