import { Request, Response, NextFunction } from 'express';

/**
 * Bảo mật headers cho API (tương đương helmet, không thêm dependency).
 * Lưu ý: CSP / HSTS áp dụng cho HTML (đặt ở frontend/nginx.conf). Ở đây chỉ đặt
 * các header bảo vệ cơ bản cho mọi response JSON của API.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}