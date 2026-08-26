import { VerdictType } from '../db/prisma.js';

export interface ReviewSignal {
  aspect: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
}

export interface DecisionInput {
  isGenericCategory: boolean;
  category: string;
  priceAssessment: 'GOOD' | 'FAIR' | 'HIGH';
  marketPriceRange: { min: number; median: number; max: number };
  currentPrice: number;
  identificationConfidence: number;
  reviews: ReviewSignal[];
  priorities: string[];
  purpose: string;
}

export interface ScoreBreakdown {
  weights: { quality: number; userFit: number; reviewConfidence: number; priceValue: number };
  components: { quality: number; userFit: number; reviewConfidence: number; priceValue: number };
  finalScore: number;
}

export interface DecisionResult {
  verdict: VerdictType;
  score: number;
  breakdown: ScoreBreakdown;
  counterReasons: string[];
}

export class DecisionService {
  // Trọng số baseline theo plan (mục 8). Ưu tiên người dùng điều chỉnh trọng số này.
  private static readonly BASE_WEIGHTS = {
    quality: 0.35,
    userFit: 0.25,
    reviewConfidence: 0.20,
    priceValue: 0.20,
  };

  static evaluate(input: DecisionInput): DecisionResult {
    const priorities = input.priorities || [];
    const weights = this.resolveWeights(priorities);
    const components = this.computeComponents(input);
    const finalScore = Math.round(
      weights.quality * components.quality +
      weights.userFit * components.userFit +
      weights.reviewConfidence * components.reviewConfidence +
      weights.priceValue * components.priceValue
    );

    const verdict = this.applyRules(input, finalScore, priorities);
    const counterReasons = this.buildCounterReasons(input, verdict, finalScore);

    return {
      verdict,
      score: Math.min(finalScore, 100),
      breakdown: { weights, components, finalScore: Math.min(finalScore, 100) },
      counterReasons,
    };
  }

  /**
   * Ưu tiên người dùng dịch chuyển trọng số ra khỏi baseline.
   * "Giá tốt nhất" → tăng trọng số giá. "Chất lượng/Độ bền" → tăng trọng số chất lượng.
   */
  private static resolveWeights(priorities: string[]) {
    const w = { ...this.BASE_WEIGHTS };

    if (priorities.some((p) => p.includes('Giá'))) w.priceValue += 0.10;
    if (priorities.some((p) => p.includes('Chất lượng') || p.includes('Độ bền'))) w.quality += 0.10;
    if (
      priorities.some((p) => p.includes('Bảo hành') || p.includes('Thương hiệu')) &&
      w.userFit < 0.35
    ) {
      w.userFit += 0.05;
    }

    // Chuẩn hoá về tổng = 1 để điểm nằm trong [0,100]
    const total = w.quality + w.userFit + w.reviewConfidence + w.priceValue;
    return {
      quality: Number((w.quality / total).toFixed(3)),
      userFit: Number((w.userFit / total).toFixed(3)),
      reviewConfidence: Number((w.reviewConfidence / total).toFixed(3)),
      priceValue: Number((w.priceValue / total).toFixed(3)),
    };
  }

  private static computeComponents(input: DecisionInput) {
    const quality = this.computeQuality(input.reviews);
    const userFit = this.computeUserFit(input);
    const reviewConfidence = input.reviews.length
      ? Math.round((input.reviews.reduce((s, r) => s + r.confidence, 0) / input.reviews.length) * 100)
      : 60;
    const priceValue = this.computePriceValue(input);

    return { quality, userFit, reviewConfidence, priceValue };
  }

  // Chất lượng từ sentiment các aspect, có trọng số theo confidence từng review.
  private static computeQuality(reviews: ReviewSignal[]): number {
    if (!reviews.length) return 70;

    const sentimentScore = { POSITIVE: 1, NEUTRAL: 0.5, NEGATIVE: 0 } as const;
    let weighted = 0;
    let totalWeight = 0;

    for (const r of reviews) {
      const w = r.confidence;
      weighted += sentimentScore[r.sentiment] * w;
      totalWeight += w;
    }
    return Math.round((weighted / totalWeight) * 100);
  }

  // Độ khớp nhu cầu: đối chiếu ưu tiên với danh mục + aspect review (heuristic trong suốt).
  private static computeUserFit(input: DecisionInput): number {
    let fit = 65;
    const haystack = `${input.category} ${input.purpose} ${input.reviews.map((r) => r.aspect).join(' ')}`.toLowerCase();

    const matchers: Array<{ kw: string; bonus: number }> = [
      { kw: 'pin', bonus: 6 },
      { kw: 'bền', bonus: 5 },
      { kw: 'bảo hành', bonus: 5 },
      { kw: 'chính hãng', bonus: 4 },
      { kw: 'hiệu năng', bonus: 5 },
    ];

    for (const p of input.priorities) {
      const pl = p.toLowerCase();
      if (matchers.some((m) => pl.includes(m.kw) && haystack.includes(m.kw))) fit += 8;
      if (pl.includes('chất lượng') && input.identificationConfidence >= 0.9) fit += 6;
      if (pl.includes('thương hiệu') && !input.isGenericCategory) fit += 6;
    }

    if (input.purpose && input.purpose.trim().length > 3) fit += 4;
    return Math.min(fit, 95);
  }

  private static computePriceValue(input: DecisionInput): number {
    const base = { GOOD: 90, FAIR: 70, HIGH: 40 }[input.priceAssessment] ?? 70;
    // Cách xa trung vị thị trường càng nhiều thì càng bị trừ (không so historical, chỉ observed)
    const { median } = input.marketPriceRange;
    if (input.currentPrice > 0 && median > 0) {
      const deviation = Math.abs(input.currentPrice - median) / median;
      return Math.max(0, Math.round(base - deviation * 25));
    }
    return base;
  }

  // Rule-based guards theo plan (mục 8). Ưu tiên "Giá tốt nhất" làm giá cao bị trừng phạt nặng hơn.
  private static applyRules(input: DecisionInput, score: number, priorities: string[]): VerdictType {
    if (input.isGenericCategory) return VerdictType.ALTERNATIVE;

    const priceSensitive = priorities.some((p) => p.includes('Giá'));

    if (input.priceAssessment === 'HIGH') {
      return priceSensitive ? VerdictType.SKIP : VerdictType.WAIT;
    }
    if (score >= 78) return VerdictType.BUY;
    if (score >= 60) return VerdictType.WAIT;
    return VerdictType.SKIP;
  }

  // Mọi verdict phải có lý do phản biện (plan mục 8).
  private static buildCounterReasons(input: DecisionInput, verdict: VerdictType, score: number): string[] {
    const reasons: string[] = [];

    if (verdict === VerdictType.BUY || verdict === VerdictType.ALTERNATIVE) {
      reasons.push(`Điểm ${score}/100 dựa trên dữ liệu công khai có thể thay đổi nếu có đánh giá mới hoặc giá bán mới.`);
    }
    if (verdict === VerdictType.WAIT || verdict === VerdictType.SKIP) {
      reasons.push(`Giá hiện tại cao hơn trung vị thị trường (${new Intl.NumberFormat('vi-VN').format(input.marketPriceRange.median)}đ); nếu giảm về vùng này thì verdict có thể đổi thành BUY.`);
    }
    if (input.reviews.length === 0) {
      reasons.push('Chưa đủ dữ liệu review độc lập nên điểm chất lượng là ước tính (insufficient evidence).');
    }
    if (reasons.length === 0) {
      reasons.push('Kết luận phụ thuộc vào nguồn web được truy xuất tại thời điểm phân tích.');
    }
    return reasons;
  }
}