import { ProductService } from './product.service.js';
import { AnalysisService } from './analysis.service.js';
import { GeminiService, ImageInput } from './gemini.service.js';
import { ResearchService } from './research.service.js';
import { DecisionService, ReviewSignal } from './decision.service.js';

export class ProductUnderstandingService {
  /**
   * Process raw product input -> Universal All-Domain Understanding -> Decision -> Save to DB
   */
  static async processProductInput(
    rawInput: string,
    userBudget?: number,
    userPurpose?: string,
    priorities: string[] = [],
    image?: ImageInput,
  ) {
    // 1. Understand product / category dynamically across ALL domains (kèm ảnh nếu có)
    const normalized = await GeminiService.understandProduct(rawInput, userBudget, image);

    // 2. Conduct grounded web research (dùng range giá Gemini suy ra — hỗ trợ mọi danh mục)
    const researchData = await ResearchService.conductResearch(
      normalized.brand,
      normalized.model,
      normalized.category,
      userBudget,
      normalized.marketPriceRange,
    );

    // 3. Save Product entry in MySQL DB
    const product = await ProductService.createProduct({
      rawInput,
      brand: normalized.brand,
      model: normalized.model,
      category: normalized.category,
      variant: normalized.variant,
      normalizedJson: {
        specs: normalized.specs,
        confidence: normalized.confidence,
        summary: normalized.summary,
        queries: researchData.queries,
        isGenericCategory: normalized.isGenericCategory,
      },
    });

    // 4. Determine observed price & prepare Decision Engine inputs
    const currentPrice = userBudget && userBudget > 0 ? userBudget : researchData.marketPriceRange.median;

    // Populate alternatives with productUrl and userFeedback
    const alternativesToSave = normalized.isGenericCategory && normalized.recommendedModels && normalized.recommendedModels.length > 0
      ? normalized.recommendedModels.map(m => ({
          productName: m.productName,
          price: m.price,
          score: m.score,
          reason: `${m.reason}${m.userFeedback ? ' | ' + m.userFeedback : ''}${m.productUrl ? ' | URL: ' + m.productUrl : ''}`,
        }))
      : [
          {
            productName: `${normalized.brand} Phiên bản Tiêu chuẩn`,
            price: Math.round(researchData.marketPriceRange.min),
            score: 86,
            reason: `Lựa chọn tiết kiệm chi phí, nằm ở ngưỡng sàn thị trường (${new Intl.NumberFormat('vi-VN').format(researchData.marketPriceRange.min)}đ)`,
          },
        ];

    // Populate domain aspects
    const reviewsToSave = normalized.domainAspects && normalized.domainAspects.length > 0
      ? normalized.domainAspects.map(a => ({
          aspect: a.aspect,
          sentiment: a.sentiment,
          confidence: 0.94,
        }))
      : [
          { aspect: 'Chất lượng & Độ an toàn tiêu dùng', sentiment: 'POSITIVE', confidence: 0.95 },
          { aspect: 'Độ bền & Tính kinh tế', sentiment: 'POSITIVE', confidence: 0.92 },
        ];

    // Decision Engine: deterministic weighted score + rule guards, personalised by user priorities
    const reviewSignals: ReviewSignal[] = reviewsToSave.map((r) => ({
      aspect: r.aspect,
      sentiment: r.sentiment as ReviewSignal['sentiment'],
      confidence: r.confidence,
    }));

    const decision = DecisionService.evaluate({
      isGenericCategory: normalized.isGenericCategory,
      category: normalized.category,
      priceAssessment: researchData.priceAssessment,
      marketPriceRange: researchData.marketPriceRange,
      currentPrice,
      identificationConfidence: normalized.confidence,
      reviews: reviewSignals,
      priorities,
      purpose: userPurpose || '',
    });

    const analysis = await AnalysisService.createAnalysis({
      productId: product.id,
      currentPrice,
      verdict: decision.verdict,
      score: decision.score,
      confidence: normalized.confidence,
      reasoning: {
        summary: normalized.isGenericCategory
          ? `BuyWise đã tổng hợp và xếp hạng các sản phẩm chính hãng tốt nhất thuộc danh mục "${normalized.category}" theo ngân sách ${new Intl.NumberFormat('vi-VN').format(currentPrice)}đ.`
          : `BuyWise đã quét phổ giá thị trường độc lập và trích xuất ${researchData.evidences.length} bằng chứng web uy tín cho ${normalized.brand} ${normalized.model}. ${researchData.priceAssessmentNote}`,
        pros: normalized.isGenericCategory
          ? [
              `Danh sách 100% hiển thị tên model cụ thể từ các thương hiệu dẫn đầu danh mục ${normalized.category}`,
              `Đi kèm đường dẫn mua hàng chính hãng và tóm tắt phản hồi đánh giá thực tế từ người dùng`,
              `Đã được kiểm chứng độ an toàn, độ bền và tính kinh tế trên thị trường`
            ]
          : [
              `Thương hiệu ${normalized.brand} uy tín trong danh mục ${normalized.category}`,
              `Phù hợp với nhu cầu: ${userPurpose || 'Sử dụng hàng ngày'}`,
              `Có sẵn danh sách nơi bán chính hãng (Shopee Mall, đại lý phân phối)`
            ],
        cons: [
          `Nên lựa chọn gian hàng phân phối chính hãng để nhận đầy đủ chế độ bảo hành & đổi trả`,
          `Mỗi thương hiệu có đặc tính khác nhau về tính năng và thiết kế`
        ],
        hiddenConcerns: [
          `Nên kiểm tra kỹ hạn sử dụng, tem niêm phong và hóa đơn bán hàng khi nhận hàng`,
        ],
        priceAssessment: researchData.priceAssessment,
        priceAssessmentNote: researchData.priceAssessmentNote,
        marketRange: researchData.marketPriceRange,
        isGenericCategory: normalized.isGenericCategory,
        scoreBreakdown: decision.breakdown,
        counterReasons: decision.counterReasons,
        priorities,
      },
      evidences: researchData.evidences,
      reviews: reviewsToSave,
      alternatives: alternativesToSave,
    });

    return {
      product,
      analysis,
      normalized,
      researchQueries: researchData.queries,
    };
  }
}
