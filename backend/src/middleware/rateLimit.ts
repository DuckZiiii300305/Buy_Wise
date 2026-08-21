import rateLimit from 'express-rate-limit';

// Giới hạn chung cho toàn bộ API: chống spam / brute-force.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please slow down.' },
});

// Giới hạn riêng cho pipeline phân tích (gọi Gemini = tốn tiền/latency).
export const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Quá nhiều yêu cầu phân tích. Vui lòng thử lại sau.' },
});