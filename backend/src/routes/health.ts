import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    console.error('[BuyWise] DB health check failed:', error);
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    service: 'BuyWise API',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    ports: {
      backend: process.env.PORT || 3333,
      frontendCors: process.env.CORS_ORIGIN || 'http://localhost:3003',
    },
  });
});
