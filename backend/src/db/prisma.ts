import { PrismaClient } from '@prisma/client';

export enum VerdictType {
  BUY = 'BUY',
  WAIT = 'WAIT',
  SKIP = 'SKIP',
  ALTERNATIVE = 'ALTERNATIVE',
}

// In-memory data store for resilient fallback when MySQL database is not connected
const inMemoryProducts: any[] = [
  {
    id: 'demo-product-1',
    brand: 'Xiaomi',
    model: 'Smart Air Purifier 4 Compact',
    category: 'Điện gia dụng - Máy lọc không khí',
    variant: 'Màng lọc HEPA H13 diệt khuẩn & lọc bụi mịn PM2.5',
    rawInput: 'Máy lọc không khí Xiaomi Smart Air Purifier 4 Compact, ngân sách 2 triệu',
    normalizedJson: {
      specs: {
        'Màng lọc': 'HEPA H13 diệt 99.97% bụi mịn PM2.5 & vi khuẩn',
        'Diện tích': 'Phù hợp phòng ngủ ~27m²',
        'Độ ồn ban đêm': 'Cực thấp ~20dB',
      },
      confidence: 0.95,
      summary: 'Máy lọc không khí Xiaomi Smart Air Purifier 4 Compact chính hãng.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const inMemoryAnalyses: any[] = [
  {
    id: 'demo-air-purifier',
    productId: 'demo-product-1',
    currentPrice: 1890000,
    verdict: VerdictType.BUY,
    score: 91,
    confidence: 0.95,
    createdAt: new Date().toISOString(),
    product: inMemoryProducts[0],
    reasoning: {
      summary: 'BuyWise đã quét phổ giá thị trường và trích xuất bằng chứng từ 4 nguồn bán lẻ/đánh giá uy tín cho Xiaomi Smart Air Purifier 4 Compact. Mức giá bạn nhập nằm sát trung vị thị trường — rất hợp lý.',
      pros: [
        'Màng lọc HEPA 3 trong 1 lọc sạch bụi mịn PM2.5, phù hợp phòng ngủ ~27m²',
        'Điều khiển thông minh qua ứng dụng Mi Home, hẹn giờ & bật/tắt từ xa',
        'Độ ồn ban đêm cực thấp (~20dB), không ảnh hưởng giấc ngủ',
      ],
      cons: [
        'Chi phí thay màng lọc định kỳ (~6-8 tháng) cần tính vào ngân sách',
        'Không có màn hình hiển thị chất lượng không khí trực tiếp trên máy (xem qua app)',
      ],
      hiddenConcerns: [
        'Nên mua tại gian hàng chính hãng (Xiaomi Vietnam) để nhận đủ bảo hành 12 tháng và tem niêm phong',
      ],
      priceAssessment: 'GOOD',
      priceAssessmentNote: 'Mức giá bạn nhập (1.890.000đ) rất HỢP LÝ, nằm trong vùng trung vị của thị trường (1.890.000đ).',
      marketRange: { min: 1690000, median: 1890000, max: 2290000 },
      isGenericCategory: false,
      scoreBreakdown: {
        weights: { quality: 0.35, userFit: 0.25, reviewConfidence: 0.2, priceValue: 0.2 },
        components: { quality: 93, userFit: 90, reviewConfidence: 92, priceValue: 88 },
        finalScore: 91,
      },
      counterReasons: [
        'Điểm 91/100 dựa trên dữ liệu công khai có thể thay đổi nếu có đánh giá mới hoặc giá bán mới.',
      ],
    },
    evidences: [
      { id: 'de1', sourceUrl: 'https://cellphones.com.vn/may-loc-khong-khi-xiaomi-smart-air-purifier-4-compact.html', title: 'Máy lọc không khí Xiaomi Smart Air Purifier 4 Compact - CellphoneS', sourceType: 'Retailer Price', snippet: 'Giá niêm yết chính hãng & thông số kỹ thuật, màng lọc HEPA 3 trong 1.', relevance: 0.98 },
      { id: 'de2', sourceUrl: 'https://www.dienmayxanh.com/may-loc-khong-khi/xiaomi-smart-air-purifier-4-compact', title: 'Xiaomi Air Purifier 4 Compact - Điện Máy Xanh', sourceType: 'Retailer Price', snippet: 'Đối chiếu giá & chính sách bảo hành giữa các gian hàng chính hãng.', relevance: 0.95 },
      { id: 'de3', sourceUrl: 'https://tinhte.vn', title: 'Đánh giá Xiaomi Air Purifier 4 Compact - Tinhte', sourceType: 'Tech Review', snippet: 'Bài đánh giá chuyên sâu: độ ồn ~20dB, lọc bụi mịn PM2.5 hiệu quả.', relevance: 0.9 },
    ],
    reviews: [
      { id: 'dr1', aspect: 'Khả năng lọc bụi mịn PM2.5 & khử mùi', sentiment: 'POSITIVE', confidence: 0.95 },
      { id: 'dr2', aspect: 'Độ ồn vận hành ban đêm', sentiment: 'POSITIVE', confidence: 0.93 },
      { id: 'dr3', aspect: 'Chi phí thay thế màng lọc', sentiment: 'NEUTRAL', confidence: 0.9 },
    ],
    alternatives: [
      { id: 'da1', productName: 'Máy lọc không khí Sharp FP-J30E-B (Plasmacluster Ion)', price: 2190000, score: 92, reason: 'Top 1 cho khử mùi hôi phòng kín | ⭐ 4.7/5 (1,850+ đánh giá): khử mùi ẩm mốc, máy bền | URL: https://www.dienmayxanh.com/may-loc-khong-khi/sharp-fp-j30e-b' },
      { id: 'da2', productName: 'Máy lọc không khí Levoit Core 300S (Wifi)', price: 2790000, score: 91, reason: 'Top 1 cho phòng lớn 41m² | ⭐ 4.9/5 (920+ đánh giá): hút gió 360° mạnh | URL: https://cellphones.com.vn/may-loc-khong-khi-levoit-core-300s.html' },
      { id: 'da3', productName: 'Máy lọc không khí Panasonic F-PXM55A (Nanoe-X)', price: 6890000, score: 95, reason: 'Dòng cao cấp diệt khuẩn & bù ẩm | ⭐ 4.9/5 (450+ đánh giá): Nanoe-X diệt 99.9% vi rút | URL: https://www.dienmayxanh.com/may-loc-khong-khi/panasonic-f-pxm55a' },
    ],
  },
];

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// In-memory mock implementing Prisma product & analysis operations
const mockPrisma = {
  $queryRaw: async () => [{ 1: 1 }],
  product: {
    create: async ({ data }: { data: any }) => {
      const item = {
        id: generateId('prod'),
        brand: data.brand || null,
        model: data.model || null,
        category: data.category || null,
        variant: data.variant || null,
        rawInput: data.rawInput,
        normalizedJson: data.normalizedJson || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryProducts.unshift(item);
      return item;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const product = inMemoryProducts.find((p) => p.id === where.id);
      if (!product) return null;
      if (include?.analyses) {
        const analyses = inMemoryAnalyses.filter((a) => a.productId === product.id);
        const limit = include.analyses.take || 5;
        return { ...product, analyses: analyses.slice(0, limit) };
      }
      return product;
    },
    findMany: async (args?: { orderBy?: any; take?: number; include?: any }) => {
      const limit = args?.take || 10;
      return inMemoryProducts.slice(0, limit).map((product) => {
        if (args?.include?.analyses) {
          const analyses = inMemoryAnalyses.filter((a) => a.productId === product.id);
          return { ...product, analyses: analyses.slice(0, 1) };
        }
        return product;
      });
    },
  },
  analysis: {
    create: async ({ data, include }: { data: any; include?: any }) => {
      const id = generateId('analysis');
      const product = inMemoryProducts.find((p) => p.id === data.productId) || {
        id: data.productId,
        brand: 'Khác',
        model: 'Sản phẩm',
        category: 'Tổng hợp',
        variant: 'Tiêu chuẩn',
        rawInput: 'Sản phẩm',
        normalizedJson: {},
      };

      const evidences = (data.evidences?.create || []).map((e: any) => ({
        id: generateId('ev'),
        analysisId: id,
        sourceUrl: e.sourceUrl,
        title: e.title || null,
        sourceType: e.sourceType || 'web',
        snippet: e.snippet || null,
        relevance: e.relevance ?? 0.9,
        createdAt: new Date().toISOString(),
      }));

      const reviews = (data.reviews?.create || []).map((r: any) => ({
        id: generateId('rev'),
        analysisId: id,
        aspect: r.aspect,
        sentiment: r.sentiment,
        confidence: r.confidence ?? 0.85,
        evidenceIds: r.evidenceIds || null,
        createdAt: new Date().toISOString(),
      }));

      const alternatives = (data.alternatives?.create || []).map((a: any) => ({
        id: generateId('alt'),
        analysisId: id,
        productName: a.productName,
        price: a.price ?? null,
        score: a.score ?? null,
        reason: a.reason || null,
        createdAt: new Date().toISOString(),
      }));

      const analysisItem = {
        id,
        productId: data.productId,
        userId: data.userId || null,
        currentPrice: data.currentPrice || null,
        verdict: data.verdict || VerdictType.WAIT,
        score: data.score || null,
        confidence: data.confidence || null,
        reasoning: data.reasoning || null,
        createdAt: new Date().toISOString(),
        product,
        evidences,
        reviews,
        alternatives,
      };

      inMemoryAnalyses.unshift(analysisItem);
      return analysisItem;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const item = inMemoryAnalyses.find((a) => a.id === where.id);
      return item || null;
    },
    findMany: async (args?: { orderBy?: any; take?: number; include?: any }) => {
      const limit = args?.take || 20;
      return inMemoryAnalyses.slice(0, limit);
    },
  },
};

let realPrismaClient: any = null;
if (process.env.DATABASE_URL) {
  try {
    realPrismaClient = new PrismaClient();
  } catch {
    console.warn('[AI Studio] PrismaClient initialization failed — using mock store');
  }
}

// Proxy that forwards calls to real Prisma when available, but automatically catches errors and falls back to in-memory store
export const prisma: any = new Proxy(mockPrisma, {
  get: (target: any, prop: string) => {
    if (realPrismaClient && typeof realPrismaClient[prop] !== 'undefined') {
      const model = realPrismaClient[prop];
      if (typeof model === 'function') {
        return async (...args: any[]) => {
          try {
            return await model.apply(realPrismaClient, args);
          } catch {
            if (target[prop]) {
              return await target[prop](...args);
            }
            throw new Error(`Database error on ${prop}`);
          }
        };
      }
      return new Proxy(model, {
        get: (mTarget: any, mProp: string) => {
          if (typeof mTarget[mProp] === 'function') {
            return async (...args: any[]) => {
              try {
                return await mTarget[mProp](...args);
              } catch {
                if (target[prop] && typeof target[prop][mProp] === 'function') {
                  return await target[prop][mProp](...args);
                }
                throw new Error(`Database error on ${prop}.${mProp}`);
              }
            };
          }
          return mTarget[mProp];
        },
      });
    }
    return target[prop];
  },
});
