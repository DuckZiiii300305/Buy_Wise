import { prisma } from '../db/prisma.js';

export interface CreateProductInput {
  rawInput: string;
  brand?: string;
  model?: string;
  category?: string;
  variant?: string;
  normalizedJson?: any;
}

export class ProductService {
  static async createProduct(data: CreateProductInput) {
    return prisma.product.create({
      data: {
        rawInput: data.rawInput,
        brand: data.brand || null,
        model: data.model || null,
        category: data.category || null,
        variant: data.variant || null,
        normalizedJson: data.normalizedJson || null,
      },
    });
  }

  static async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  static async getRecentProducts(limit = 10) {
    return prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
