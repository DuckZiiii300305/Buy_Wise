import { prisma, VerdictType } from '../db/prisma.js';

export interface CreateAnalysisInput {
  productId: string;
  userId?: string;
  currentPrice?: number;
  verdict: VerdictType;
  score?: number;
  confidence?: number;
  reasoning?: any;
  evidences?: Array<{
    sourceUrl: string;
    title?: string;
    sourceType?: string;
    snippet?: string;
    relevance?: number;
  }>;
  reviews?: Array<{
    aspect: string;
    sentiment: string;
    confidence?: number;
    evidenceIds?: any;
  }>;
  alternatives?: Array<{
    productName: string;
    price?: number;
    score?: number;
    reason?: string;
  }>;
}

export class AnalysisService {
  static async createAnalysis(data: CreateAnalysisInput) {
    return prisma.analysis.create({
      data: {
        productId: data.productId,
        userId: data.userId || null,
        currentPrice: data.currentPrice || null,
        verdict: data.verdict,
        score: data.score || null,
        confidence: data.confidence || null,
        reasoning: data.reasoning || null,
        evidences: data.evidences
          ? {
              create: data.evidences.map((e) => ({
                sourceUrl: e.sourceUrl,
                title: e.title || null,
                sourceType: e.sourceType || 'web',
                snippet: e.snippet || null,
                relevance: e.relevance || 0.9,
              })),
            }
          : undefined,
        reviews: data.reviews
          ? {
              create: data.reviews.map((r) => ({
                aspect: r.aspect,
                sentiment: r.sentiment,
                confidence: r.confidence || 0.85,
                evidenceIds: r.evidenceIds || null,
              })),
            }
          : undefined,
        alternatives: data.alternatives
          ? {
              create: data.alternatives.map((a) => ({
                productName: a.productName,
                price: a.price || null,
                score: a.score || null,
                reason: a.reason || null,
              })),
            }
          : undefined,
      },
      include: {
        product: true,
        evidences: true,
        reviews: true,
        alternatives: true,
      },
    });
  }

  static async getAnalysisById(id: string) {
    return prisma.analysis.findUnique({
      where: { id },
      include: {
        product: true,
        evidences: true,
        reviews: true,
        alternatives: true,
      },
    });
  }

  static async getAllAnalyses(limit = 20) {
    return prisma.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: true,
        evidences: true,
        reviews: true,
        alternatives: true,
      },
    });
  }
}
