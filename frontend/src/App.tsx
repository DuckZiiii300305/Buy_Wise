import { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, Sparkles, CheckCircle2, AlertTriangle, Clock,
  ArrowRight, Tag, ShieldCheck, Scale, History, RefreshCw, ThumbsUp, ThumbsDown,
  ChevronRight, ExternalLink, Zap, Sliders, DollarSign, Layers, ImagePlus, X,
  MessageCircle, Send
} from 'lucide-react';

interface AnalysisData {
  id: string;
  currentPrice: number;
  verdict: 'BUY' | 'WAIT' | 'SKIP' | 'ALTERNATIVE';
  score: number;
  confidence: number;
  createdAt: string;
  product: {
    brand: string;
    model: string;
    category: string;
    variant: string;
    rawInput: string;
    normalizedJson?: {
      imageUrl?: string;
      [key: string]: unknown;
    };
  };
  reasoning: {
    summary: string;
    pros: string[];
    cons: string[];
    hiddenConcerns?: string[];
    priceAssessment?: 'GOOD' | 'FAIR' | 'HIGH';
    priceAssessmentNote?: string;
    marketRange?: { min: number; median: number; max: number };
    isGenericCategory?: boolean;
    scoreBreakdown?: {
      weights: { quality: number; userFit: number; reviewConfidence: number; priceValue: number };
      components: { quality: number; userFit: number; reviewConfidence: number; priceValue: number };
      finalScore: number;
    };
    counterReasons?: string[];
  };
  evidences: Array<{
    id: string;
    sourceUrl: string;
    title: string;
    sourceType: string;
    snippet: string;
    relevance: number;
  }>;
  reviews: Array<{
    id: string;
    aspect: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    confidence: number;
  }>;
  alternatives: Array<{
    id: string;
    productName: string;
    price: number;
    score: number;
    reason: string;
  }>;
}

// Ảnh minh họa: tự ẩn nếu link hỏng (hallucination / hotlink bị chặn) → hiện placeholder.
function ProductImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center bg-slate-950/80 border border-slate-800 text-slate-600`}>
        <ImagePlus className="w-8 h-8" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

// Tách các trường đóng gói trong `reason` của alternative (URL / IMG / feedback).
function parseAltReason(reason: string) {
  const tokens = (reason || '').split(' | ');
  let displayReason = tokens[0] || '';
  let directUrl = '';
  let feedbackText = '';
  let imageUrl = '';
  for (const t of tokens.slice(1)) {
    if (t.startsWith('URL: ')) directUrl = t.slice(5).trim();
    else if (t.startsWith('IMG: ')) imageUrl = t.slice(5).trim();
    else if (t.startsWith('⭐')) feedbackText = t.trim();
    else if (t.trim()) displayReason += ' | ' + t;
  }
  return { displayReason, directUrl, feedbackText, imageUrl };
}

// Kết quả mẫu (seed) cho nút "Xem demo nhanh": không phụ thuộc Gemini/API key, giúp demo
// video / walkthrough luôn chạy ổn định (không lo 429/timeout giữa chừng). Số liệu minh họa,
// giữ đúng cấu trúc AnalysisData để mọi card UI hiển thị đầy đủ.
const DEMO_ANALYSIS: AnalysisData = {
  id: 'demo-air-purifier',
  currentPrice: 1890000,
  verdict: 'BUY',
  score: 91,
  confidence: 0.95,
  createdAt: new Date().toISOString(),
  product: {
    brand: 'Xiaomi',
    model: 'Smart Air Purifier 4 Compact',
    category: 'Điện gia dụng - Máy lọc không khí',
    variant: 'Màng lọc HEPA H13 diệt khuẩn & lọc bụi mịn PM2.5',
    rawInput: 'Máy lọc không khí Xiaomi Smart Air Purifier 4 Compact, ngân sách 2 triệu',
    normalizedJson: {},
  },
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
};

function RadarChart({
  components,
  finalScore,
}: {
  components: { quality: number; userFit: number; reviewConfidence: number; priceValue: number };
  finalScore: number;
}) {
  const axes = [
    { key: 'quality', label: 'Chất lượng' },
    { key: 'userFit', label: 'Hợp nhu cầu' },
    { key: 'reviewConfidence', label: 'Tin cậy review' },
    { key: 'priceValue', label: 'Giá trị / giá' },
  ] as const;
  const C = 140;
  const CY = 150;
  const R = 88;
  const angles = [-90, 0, 90, 180];
  const idx = [0, 1, 2, 3];
  const pt = (i: number, frac: number) => {
    const rad = (angles[i] * Math.PI) / 180;
    return { x: C + R * frac * Math.cos(rad), y: CY + R * frac * Math.sin(rad) };
  };
  const values = axes.map((a) => Math.max(0, Math.min(100, components[a.key])));
  const dataPoints = idx.map((i) => pt(i, values[i] / 100));
  const poly = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox="0 0 280 304" className="w-full max-w-[250px]" role="img" aria-label={`Biểu đồ 4 thành phần quyết định, tổng điểm ${finalScore}/100`}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={idx.map((i) => `${pt(i, f).x.toFixed(1)},${pt(i, f).y.toFixed(1)}`).join(' ')} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="1" />
      ))}
      {idx.map((i) => {
        const p = pt(i, 1);
        return <line key={i} x1={C} y1={CY} x2={p.x} y2={p.y} stroke="rgba(148,163,184,0.22)" strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(99,102,241,0.22)" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round" />
      {axes.map((a, i) => {
        const p = dataPoints[i];
        return <circle key={a.key} cx={p.x} cy={p.y} r="3.5" fill="#818cf8" stroke="#0f172a" strokeWidth="1.5" />;
      })}
      {axes.map((a, i) => {
        const p = pt(i, Math.max(0.16, values[i] / 100 - 0.14));
        return (
          <text key={a.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">
            {values[i]}
          </text>
        );
      })}
      {axes.map((a, i) => {
        const p = pt(i, 1.3);
        const anchor = i === 1 ? 'start' : i === 3 ? 'end' : 'middle';
        return (
          <text key={a.key} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle" fill="#94a3b8" fontSize="10.5">
            {a.label}
          </text>
        );
      })}
      <text x={C} y={CY - 4} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="30" fontWeight="800">
        {finalScore}
      </text>
      <text x={C} y={CY + 16} textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="10">
        / 100 tổng điểm
      </text>
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'verdict' | 'compare' | 'history'>('analyze');
  const [productInput, setProductInput] = useState('');
  const [budget, setBudget] = useState('30,000,000');
  const [purpose, setPurpose] = useState('Sử dụng làm việc & giải trí hàng ngày');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['Chất lượng cao', 'Độ bền cao']);
  
  const [history, setHistory] = useState<AnalysisData[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [researchStep, setResearchStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Image upload state (M01): base64 + MIME type của ảnh sản phẩm (không kèm prefix)
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  // Ảnh của lượt phân tích hiện tại (dùng hiển thị minh họa kèm kết quả nếu user có upload)
  const [resultImage, setResultImage] = useState<string>('');

  // Follow-up Q&A ("Hỏi thêm về kết luận") — Evidence → Analysis → Decision → Explain
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // API base: dùng biến môi trường khi deploy (VITE_API_URL), mặc định same-origin relative path.
  const backendUrl = import.meta.env.VITE_API_URL || '';

  // Priorities options — tiêu chí phổ quát áp dụng cho MỌI loại sản phẩm (không gắn riêng điện tử)
  const priorityOptions = [
    'Giá tốt nhất',
    'Chất lượng cao',
    'Độ bền cao',
    'Thương hiệu uy tín',
    'Bảo hành tốt',
    'An toàn & lành tính',
  ];

  const togglePriority = (item: string) => {
    if (selectedPriorities.includes(item)) {
      setSelectedPriorities(selectedPriorities.filter(p => p !== item));
    } else {
      setSelectedPriorities([...selectedPriorities, item]);
    }
  };

  // Đọc ảnh → base64 thuần (bỏ prefix) để gửi lên backend (M01, giới hạn 2.5MB).
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (PNG/JPEG/WebP...).');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ảnh vượt quá 2.5MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const comma = dataUrl.indexOf(',');
      const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
      setImagePreview(dataUrl);
      setImageBase64(base64);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview('');
    setImageBase64('');
    setImageMimeType('');
  };

  // Fetch analysis history from DB
  const fetchHistory = () => {
    fetch(`${backendUrl}/api/analyses`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          setHistory(resData.data);
          if (resData.data.length > 0 && !currentAnalysis) {
            setCurrentAnalysis(resData.data[0]);
          }
        }
      })
      .catch((err) => console.error('Error loading history:', err));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Khi đổi sang một kết luận khác, xoá hội thoại hỏi-đáp cũ (tránh nhầm ngữ cảnh).
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
  }, [currentAnalysis?.id]);

  const handleStartAnalysis = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productInput.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResultImage(imagePreview); // giữ ảnh upload (nếu có) để hiển thị kèm kết quả
    setResearchStep('🔍 Gemini AI đang nghiên cứu & phân tích sản phẩm...');

    fetch(`${backendUrl}/api/products/understand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawInput: productInput,
        budget,
        purpose,
        priorities: selectedPriorities,
        imageBase64: imageBase64 || undefined,
        imageMimeType: imageMimeType || undefined,
      }),
    })
      .then(async (res) => {
        const resData = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(resData?.error || `Lỗi máy chủ (HTTP ${res.status}).`);
        }
        return resData;
      })
      .then((resData) => {
        setLoading(false);
        setResearchStep('');
        if (resData.success && resData.data.analysis) {
          setCurrentAnalysis(resData.data.analysis);
          fetchHistory();
          setActiveTab('verdict');
        } else {
          throw new Error(resData?.error || 'Không nhận được kết quả phân tích hợp lệ.');
        }
      })
      .catch((err) => {
        console.error('Error analyzing product:', err);
        setLoading(false);
        setResearchStep('');
        // KHÔNG âm thầm hiện kết quả cũ như thể là kết quả mới — báo lỗi rõ ràng cho người dùng.
        setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.');
      });
  };

  // Hỏi thêm BuyWise về kết luận (follow-up Q&A) — gửi context + câu hỏi, nhận câu trả lời ngắn gọn.
  const handleChatSend = () => {
    const q = chatInput.trim();
    if (!q || !currentAnalysis || chatLoading) return;
    setChatMessages((m) => [...m, { role: 'user', text: q }]);
    setChatInput('');
    setChatLoading(true);

    const r = currentAnalysis.reasoning;
    const context = {
      productName: `${currentAnalysis.product.brand ?? ''} ${currentAnalysis.product.model ?? ''}`.trim(),
      category: currentAnalysis.product.category,
      verdict: currentAnalysis.verdict,
      score: currentAnalysis.score,
      priceAssessment: r.priceAssessment,
      priceAssessmentNote: r.priceAssessmentNote,
      summary: r.summary,
      pros: r.pros,
      cons: r.cons,
      hiddenConcerns: r.hiddenConcerns,
      scoreBreakdown: r.scoreBreakdown,
    };

    fetch(`${backendUrl}/api/analyses/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, question: q }),
    })
      .then(async (res) => {
        const resData = await res.json().catch(() => null);
        if (!res.ok) throw new Error(resData?.error || `Lỗi máy chủ (HTTP ${res.status}).`);
        return resData;
      })
      .then((resData) => {
        const answer = resData?.data?.answer || 'BuyWise chưa có câu trả lời lúc này.';
        setChatMessages((m) => [...m, { role: 'assistant', text: answer }]);
        setChatLoading(false);
      })
      .catch((err) => {
        setChatMessages((m) => [...m, { role: 'assistant', text: `⚠️ ${err instanceof Error ? err.message : 'Có lỗi xảy ra.'}` }]);
        setChatLoading(false);
      });
  };

  const formatPrice = (val?: number) => {
    if (!val) return 'Chưa có thông tin';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'BUY':
        return (
          <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>NÊN MUA (BUY)</span>
          </span>
        );
      case 'WAIT':
        return (
          <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-sm shadow-sm">
            <Clock className="w-4 h-4" />
            <span>NÊN CHỜ GIẢM GIÁ (WAIT)</span>
          </span>
        );
      case 'SKIP':
        return (
          <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-extrabold text-sm shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>BỎ QUA (SKIP)</span>
          </span>
        );
      case 'ALTERNATIVE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-extrabold text-sm shadow-sm">
            <RefreshCw className="w-4 h-4" />
            <span>CHỌN MẪU KHÁC (ALTERNATIVE)</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-5%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-5%] w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Main App Navigation Header */}
      <header className="border-b border-slate-800/80 bg-[#070a12]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('analyze')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent">
                  BuyWise
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold">
                  AI Advisor
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Trợ lý quyết định mua sắm thông minh</p>
            </div>
          </div>

          {/* User Nav Tabs */}
          <nav className="flex items-center bg-slate-900/90 border border-slate-800/90 rounded-xl p-1 text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition ${
                activeTab === 'analyze'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Nghiên cứu mới</span>
            </button>

            <button
              onClick={() => setActiveTab('verdict')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition ${
                activeTab === 'verdict'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Lời khuyên (Verdict)</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition ${
                activeTab === 'compare'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>So sánh đối thủ</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Lịch sử ({history.length})</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        
        {/* TAB 1: ANALYZE INPUT FORM */}
        {activeTab === 'analyze' && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero text */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-blue-400 font-semibold shadow-sm">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Nghiên cứu mua sắm dựa trên dữ liệu web thực tế</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Phân vân khi mua sắm hoặc đắn đo lựa chọn sản phẩm phù hợp? <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                  BuyWise sẽ giúp bạn ra quyết định thông minh.
                </span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Dán URL sản phẩm từ bất kỳ cửa hàng nào hoặc nhập tên sản phẩm. BuyWise sẽ quét đánh giá thực tế, phân tích biến động giá và đối chiếu lựa chọn tốt hơn.
              </p>
            </div>

            {/* Quick Demo Product Chips Across All Domains */}
            <div className="flex items-center justify-center flex-wrap gap-2 text-xs">
              <span className="text-slate-400">Gợi ý tìm kiếm nhanh các ngành hàng:</span>
              <button
                type="button"
                onClick={() => {
                  setProductInput('nồi cơm điện');
                  setBudget('1,500,000');
                  setPurpose('Nấu cơm dẻo gia đình 4 người');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-200 hover:border-blue-500 hover:text-white transition flex items-center space-x-1.5"
              >
                <Tag className="w-3 h-3 text-amber-400" />
                <span>Nồi cơm điện</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProductInput('kem chống nắng');
                  setBudget('350,000');
                  setPurpose('Kiềm dầu da mặt hàng ngày');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-200 hover:border-blue-500 hover:text-white transition flex items-center space-x-1.5"
              >
                <Tag className="w-3 h-3 text-rose-400" />
                <span>Kem chống nắng</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProductInput('ghế công thái học');
                  setBudget('3,000,000');
                  setPurpose('Chống đau lưng khi làm việc');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-200 hover:border-blue-500 hover:text-white transition flex items-center space-x-1.5"
              >
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>Ghế công thái học</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProductInput('nước giặt');
                  setBudget('250,000');
                  setPurpose('Nước giặt túi lớn tiết kiệm gia đình');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-200 hover:border-blue-500 hover:text-white transition flex items-center space-x-1.5"
              >
                <Tag className="w-3 h-3 text-emerald-400" />
                <span>Nước giặt xả</span>
              </button>
            </div>

            {/* Instant demo — nạp kết quả mẫu đầy đủ không cần gọi Gemini (demo video không lo nghẽn 429/timeout) */}
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={() => { setResultImage(''); setCurrentAnalysis(DEMO_ANALYSIS); setActiveTab('verdict'); }}
                className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/40 hover:border-violet-400 transition font-bold text-xs flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Xem demo nhanh — kết quả mẫu đầy đủ (không cần AI)</span>
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-950/30 border border-rose-500/40 text-rose-200 rounded-2xl px-4 py-3 text-sm flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-rose-300">Không thể phân tích sản phẩm</p>
                  <p className="text-xs text-rose-200/80">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Search Input Box Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
              <form onSubmit={handleStartAnalysis} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    URL Sản phẩm / Hình ảnh / Tên sản phẩm <span className="text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productInput}
                      onChange={e => setProductInput(e.target.value)}
                      placeholder="Dán link Shopee, Tiki, Lazada, CellphoneS hoặc nhập tên sản phẩm..."
                      className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
                  </div>
                </div>

                {/* Image Upload (M01) - optional, hỗ trợ nhận diện sản phẩm qua ảnh */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200 mb-1 flex items-center space-x-1.5">
                    <ImagePlus className="w-4 h-4 text-indigo-400" />
                    <span>Hình ảnh sản phẩm (tùy chọn)</span>
                  </label>
                  {imagePreview ? (
                    <div className="flex items-start gap-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
                      <img
                        src={imagePreview}
                        alt="Ảnh sản phẩm đã chọn"
                        className="w-24 h-24 object-cover rounded-xl border border-slate-700"
                      />
                      <div className="flex-1 text-xs text-slate-400 space-y-1 pt-1">
                        <p className="text-slate-300 font-medium">Ảnh đã sẵn sàng — Gemini sẽ kết hợp ảnh + mô tả để nhận diện chính xác.</p>
                        <p className="text-slate-500">Định dạng: {imageMimeType || 'image/*'}</p>
                        <button
                          type="button"
                          onClick={clearImage}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition"
                        >
                          <X className="w-3 h-3" />
                          <span>Gỡ ảnh</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-3 bg-slate-950/60 border border-dashed border-slate-700 rounded-2xl p-4 cursor-pointer hover:border-blue-500/60 transition text-xs text-slate-400">
                      <ImagePlus className="w-5 h-5 text-slate-500" />
                      <span>Click để đăng ảnh sản phẩm (PNG/JPEG, tối đa 2.5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Ngân sách dự kiến (VND)</span>
                    </label>
                    <input
                      type="text"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                      placeholder="Ví dụ: 25,000,000"
                      className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center space-x-1">
                      <Sliders className="w-4 h-4 text-blue-400" />
                      <span>Nhu cầu & Mục đích sử dụng</span>
                    </label>
                    <input
                      type="text"
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      placeholder="Ví dụ: Lập trình, chơi game, chụp ảnh..."
                      className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Priority Selectors */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Ưu tiên cá nhân quan trọng nhất với bạn
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {priorityOptions.map((item) => {
                      const active = selectedPriorities.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => togglePriority(item)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                            active
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                              : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Analyze Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:opacity-95 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-blue-600/25 transition transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-xs sm:text-sm font-medium">{researchStep || 'Đang nghiên cứu bằng chứng web...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-blue-200" />
                      <span>Phân tích & Đưa ra Lời khuyên Mua sắm</span>
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100">Bằng chứng kiểm chứng được</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mọi kết luận của BuyWise đều có trích dẫn từ bài viết, đánh giá thực tế và diễn đàn công khai. Không đưa thông tin giả định.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100">Đánh giá Vùng giá Thị trường</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Xác định xem mức giá bạn định mua đang ở mức Cao, Hợp lý hay Đang giảm giá mạnh dựa trên khoảng giá thị trường thực tế.
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-100">Đề xuất Thay thế Thông minh</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tự động đề xuất top 3 sản phẩm đối thủ cùng tầm giá có thông số tốt hơn hoặc tiết kiệm chi phí hơn cho bạn.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VERDICT & DETAILED ANALYSIS */}
        {activeTab === 'verdict' && (
          <div className="space-y-8 animate-fade-in">
            {currentAnalysis ? (
              <>
                {/* Header Summary Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <span className="font-bold text-blue-400 uppercase">{currentAnalysis.product.brand}</span>
                        <span>•</span>
                        <span>{currentAnalysis.product.category}</span>
                        <span>•</span>
                        <span className="text-slate-300">{currentAnalysis.product.variant}</span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                        {currentAnalysis.product.model}
                      </h1>

                      <div className="flex items-center space-x-4 flex-wrap gap-2">
                        {getVerdictBadge(currentAnalysis.verdict)}
                        <span className="text-sm font-semibold text-slate-300">
                          Ngân sách dự kiến: <strong className="text-emerald-400 text-lg">{formatPrice(currentAnalysis.currentPrice)}</strong>
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed pt-2">
                        {currentAnalysis.reasoning.summary}
                      </p>
                    </div>

                    {/* Product Image + Overall Score Badge */}
                    <div className="flex flex-col items-center gap-3">
                      {(resultImage || currentAnalysis.product.normalizedJson?.imageUrl) && (
                        <ProductImage
                          src={resultImage || currentAnalysis.product.normalizedJson?.imageUrl}
                          alt={currentAnalysis.product.model}
                          className="w-28 h-28 rounded-2xl object-cover border border-slate-700 shadow-lg"
                        />
                      )}
                      <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-center space-y-1 min-w-[140px]">
                        <span className="text-xs text-slate-400 font-semibold block">ĐIỂM TƯ VẤN</span>
                        <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                          {currentAnalysis.score}<span className="text-sm text-slate-500">/100</span>
                        </span>
                        <span className="text-[11px] text-emerald-400 block font-medium">
                          Độ tin cậy {(currentAnalysis.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Universal Category & Model Generations Banner & Interactive Cards */}
                {(currentAnalysis.reasoning as any).isGenericCategory && currentAnalysis.alternatives.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900/90 border border-blue-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center space-x-3 border-b border-blue-500/20 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-lg text-white">Tư vấn Các Đời Máy & Phân Khúc Giá Phù Hợp</h2>
                        <p className="text-xs text-slate-400">BuyWise đề xuất các thế hệ & đời máy xuất sắc nhất dựa trên tiêu chí hiệu năng, độ bền & giữ giá</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentAnalysis.alternatives.map((alt, idx) => {
                        // Extract productUrl, userFeedback & imageUrl encoded in reason string
                        const { displayReason, directUrl, feedbackText, imageUrl } = parseAltReason(alt.reason || '');

                        return (
                          <div
                            key={alt.id}
                            className="bg-slate-950/90 border border-slate-800 hover:border-blue-500/60 p-6 rounded-2xl space-y-4 transition flex flex-col justify-between group shadow-xl backdrop-blur-md"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-extrabold text-xs flex items-center justify-center border border-blue-500/30">
                                  #{idx + 1}
                                </span>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                  Score: {alt.score}/100
                                </span>
                              </div>

                              {/* Ảnh minh họa sản phẩm */}
                              {imageUrl && (
                                <ProductImage
                                  src={imageUrl}
                                  alt={alt.productName}
                                  className="w-full h-36 object-cover rounded-xl border border-slate-800"
                                />
                              )}

                              <h3 className="font-extrabold text-base text-white group-hover:text-blue-300 transition leading-snug">
                                {alt.productName}
                              </h3>

                              <div className="text-base font-bold text-emerald-400">
                                {formatPrice(alt.price)}
                              </div>

                              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                                💡 <strong>Ưu điểm:</strong> {displayReason}
                              </p>

                              {/* Specific User Feedback & Star Rating */}
                              {feedbackText && (
                                <div className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-start space-x-1.5">
                                  <span className="leading-relaxed font-medium">{feedbackText}</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2 pt-2">
                              {/* Direct Product Purchase / Retailer Link */}
                              {directUrl && (
                                <a
                                  href={directUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                                >
                                  <span>Xem nơi bán chính hãng</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                                </a>
                              )}

                              {/* Analyze Details Button */}
                              <button
                                onClick={() => {
                                  setProductInput(alt.productName);
                                  handleStartAnalysis();
                                }}
                                className="w-full bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                              >
                                <span>Phân tích chi tiết mẫu này</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Market Price Intelligence Card */}
                {currentAnalysis.reasoning.marketRange && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-emerald-400" />
                        <span>Phân tích & Đánh giá Vùng giá Thị trường Độc lập</span>
                      </h3>
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                        currentAnalysis.reasoning.priceAssessment === 'GOOD'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : currentAnalysis.reasoning.priceAssessment === 'HIGH'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        Đánh giá: {currentAnalysis.reasoning.priceAssessment === 'GOOD' ? 'GIÁ RẤT TỐT (HỢP LÝ)' : currentAnalysis.reasoning.priceAssessment === 'HIGH' ? 'GIÁ CAO (ĐẮT)' : 'GIÁ VỪA PHẢI'}
                      </span>
                    </div>

                    {/* Price Evaluation Note Alert */}
                    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 leading-relaxed font-medium">
                      💡 <strong>Đánh giá từ BuyWise:</strong> {(currentAnalysis.reasoning as any).priceAssessmentNote || 'Mức giá đã được kiểm chứng độc lập từ các nguồn phân phối thị trường.'}
                    </div>

                    {/* Price Slider Bar */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Giá thấp nhất: <strong className="text-slate-200">{formatPrice(currentAnalysis.reasoning.marketRange.min)}</strong></span>
                        <span className="text-blue-400 font-bold">Trung vị thị trường: {formatPrice(currentAnalysis.reasoning.marketRange.median)}</span>
                        <span>Giá trần: <strong className="text-slate-200">{formatPrice(currentAnalysis.reasoning.marketRange.max)}</strong></span>
                      </div>
                      <div className="h-3 bg-slate-950 rounded-full overflow-hidden relative border border-slate-800">
                        <div className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 opacity-90" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Score Breakdown & Counter-Reasons (Decision Engine transparency) */}
                {currentAnalysis.reasoning.scoreBreakdown && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Radar — hồ sơ 4 thành phần quyết định */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4">
                      <h3 className="font-bold text-sm text-slate-200 self-start flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span>Hồ sơ điểm cân bằng</span>
                      </h3>
                      <RadarChart
                        components={currentAnalysis.reasoning.scoreBreakdown.components}
                        finalScore={currentAnalysis.reasoning.scoreBreakdown.finalScore}
                      />
                      <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                        Bốn trục = 4 thành phần quyết định. Hình càng đầy &amp; cân đối, sản phẩm càng ít điểm yếu rõ rệt.
                      </p>
                    </div>

                    {/* Weights & Component Scores */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                          <Sliders className="w-4 h-4 text-indigo-400" />
                          <span>Điểm thành phần & Trọng số quyết định</span>
                        </h3>
                        <span className="text-xs text-slate-400">Tổng điểm: <strong className="text-blue-400 text-base">{currentAnalysis.reasoning.scoreBreakdown.finalScore}/100</strong></span>
                      </div>

                      {(() => {
                        const b = currentAnalysis.reasoning.scoreBreakdown!;
                        const rows = [
                          { key: 'quality', label: 'Chất lượng sản phẩm', color: 'from-blue-500 to-emerald-500' },
                          { key: 'userFit', label: 'Độ khớp nhu cầu', color: 'from-indigo-500 to-blue-500' },
                          { key: 'reviewConfidence', label: 'Độ tin cậy đánh giá', color: 'from-teal-500 to-emerald-500' },
                          { key: 'priceValue', label: 'Giá trị so với thị trường', color: 'from-amber-500 to-emerald-500' },
                        ] as const;
                        return (
                          <div className="space-y-4">
                            {rows.map((row) => {
                              const comp = b.components[row.key] ?? 0;
                              const weight = Math.round((b.weights[row.key] ?? 0) * 100);
                              return (
                                <div key={row.key} className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-300 font-medium">{row.label}</span>
                                    <span className="text-slate-400">
                                      <strong className="text-emerald-400">{comp}</strong>/100
                                      <span className="ml-2 text-slate-500">• trọng số {weight}%</span>
                                    </span>
                                  </div>
                                  <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                    <div
                                      className={`h-full bg-gradient-to-r ${row.color} opacity-90 transition-all`}
                                      style={{ width: `${Math.max(0, Math.min(100, comp))}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Công thức: Điểm = 0.35×Chất lượng + 0.25×Độ khớp + 0.20×Đánh giá + 0.20×Giá trị (trọng số dịch chuyển theo ưu tiên bạn chọn, sau đó chuẩn hoá về 100%).
                      </p>
                    </div>

                    {/* Counter-Reasons */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
                      <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                        <Scale className="w-4 h-4 text-amber-400" />
                        <span>Lý do phản biện (Counter-Reasons)</span>
                      </h3>
                      {currentAnalysis.reasoning.counterReasons && currentAnalysis.reasoning.counterReasons.length > 0 ? (
                        <ul className="space-y-2.5">
                          {currentAnalysis.reasoning.counterReasons.map((r, i) => (
                            <li key={i} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500">Không có lý do phản biện.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pros & Cons & Hidden Concerns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pros Card */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-3">
                    <h3 className="font-bold text-sm text-emerald-400 flex items-center space-x-2">
                      <ThumbsUp className="w-4 h-4" />
                      <span>Ưu điểm nổi bật (Pros)</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {currentAnalysis.reasoning.pros.map((pro, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons Card */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-3">
                    <h3 className="font-bold text-sm text-amber-400 flex items-center space-x-2">
                      <ThumbsDown className="w-4 h-4" />
                      <span>Nhược điểm & Hạn chế (Cons)</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {currentAnalysis.reasoning.cons.map((con, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Hidden Concerns Alert Banner */}
                {currentAnalysis.reasoning.hiddenConcerns && currentAnalysis.reasoning.hiddenConcerns.length > 0 && (
                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-6 space-y-3">
                    <h3 className="font-bold text-sm text-rose-400 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Vấn đề rủi ro tiềm ẩn người mua cần lưu ý (Hidden Concerns)</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-rose-200/90">
                      {currentAnalysis.reasoning.hiddenConcerns.map((concern, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5" />
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Evidence Sources Section */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Nguồn bằng chứng kiểm chứng (Evidence Sources)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed -mt-2">
                    <span className="text-blue-400 font-medium">Xanh dương</span> = nguồn thực tế đã xác minh (Grounding / trang bán hàng).{' '}
                    <span className="text-amber-400 font-medium">Cam</span> = link tìm kiếm tự suy, chưa xác minh — minh bạch để bạn không nhầm lẫn.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentAnalysis.evidences.map((ev) => (
                      <a
                        key={ev.id}
                        href={ev.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 p-4 rounded-xl space-y-2 transition group block"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          {ev.sourceType === 'Tìm kiếm (chưa xác minh)' ? (
                            <span className="bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                              {ev.sourceType}
                            </span>
                          ) : (
                            <span className="bg-blue-500/10 text-blue-400 font-semibold px-2 py-0.5 rounded border border-blue-500/20">
                              <ShieldCheck className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                              {ev.sourceType}
                            </span>
                          )}
                          <ExternalLink className="w-3.5 h-3.5 group-hover:text-blue-400 transition" />
                        </div>
                        <h4 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-blue-300 transition">
                          {ev.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          "{ev.snippet}"
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              {/* Follow-up Q&A — Hỏi thêm về kết luận (Evidence → Analysis → Decision → Explain) */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-violet-400" />
                    <span>Hỏi thêm BuyWise về kết luận này</span>
                  </h3>

                  {/* Conversation */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {chatMessages.length === 0 && (
                      <p className="text-xs text-slate-500">
                        Gợi ý: <em>"Nếu em chỉ có X đồng thì nên chọn gì?"</em> • <em>"Rủi ro lớn nhất khi mua là gì?"</em>
                      </p>
                    )}
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                          m.role === 'user'
                            ? 'bg-blue-600/90 text-white rounded-br-sm'
                            : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-sm'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl rounded-bl-sm text-xs text-slate-400 flex items-center space-x-2">
                          <span className="flex space-x-1">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </span>
                          <span>BuyWise đang trả lời…</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleChatSend(); }}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Đặt câu hỏi về sản phẩm hoặc kết luận…"
                      className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center space-x-1.5 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-bold text-slate-300">Chưa chọn kết quả phân tích nào</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy nhập URL sản phẩm ở tab "Nghiên cứu mới" hoặc chọn một sản phẩm từ tab "Lịch sử".
                </p>
                <button
                  onClick={() => setActiveTab('analyze')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition"
                >
                  Nghiên cứu ngay
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPETITORS & ALTERNATIVES */}
        {activeTab === 'compare' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl font-bold text-white">So sánh Lựa chọn Thay thế (Alternatives)</h2>
              <p className="text-xs text-slate-400">
                Các sản phẩm cùng phân khúc hoặc cùng khoảng giá tối ưu hơn cho nhu cầu của bạn
              </p>
            </div>

            {currentAnalysis && currentAnalysis.alternatives.length > 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[720px]">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800">
                        <th className="px-4 py-3 font-bold text-slate-300 whitespace-nowrap">Tiêu chí so sánh</th>
                        <th className="px-4 py-3 font-bold text-blue-400 uppercase whitespace-nowrap">Sản phẩm đang xem</th>
                        {currentAnalysis.alternatives.map((alt, idx) => (
                          <th key={alt.id} className="px-4 py-3 font-bold text-indigo-300 whitespace-nowrap">
                            Đề xuất thay thế #{idx + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      <tr className="bg-slate-900/40">
                        <td className="px-4 py-3 font-semibold text-slate-400">Sản phẩm / Model</td>
                        <td className="px-4 py-3 font-bold text-white">{currentAnalysis.product.model}</td>
                        {currentAnalysis.alternatives.map((alt) => (
                          <td key={alt.id} className="px-4 py-3 font-semibold text-slate-200">{alt.productName}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-400 align-top">Hình ảnh</td>
                        <td className="px-4 py-3 align-top">
                          <ProductImage
                            src={currentAnalysis.product.normalizedJson?.imageUrl}
                            alt={currentAnalysis.product.model}
                            className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                          />
                        </td>
                        {currentAnalysis.alternatives.map((alt) => (
                          <td key={alt.id} className="px-4 py-3 align-top">
                            <ProductImage
                              src={parseAltReason(alt.reason || '').imageUrl}
                              alt={alt.productName}
                              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-400">Giá tham khảo</td>
                        <td className="px-4 py-3 font-bold text-emerald-400">{formatPrice(currentAnalysis.currentPrice)}</td>
                        {currentAnalysis.alternatives.map((alt) => (
                          <td key={alt.id} className="px-4 py-3 font-semibold text-emerald-400">{formatPrice(alt.price)}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-900/40">
                        <td className="px-4 py-3 font-semibold text-slate-400">Điểm tư vấn</td>
                        <td className="px-4 py-3">
                          <span className="font-extrabold text-blue-400">{currentAnalysis.score}/100</span>
                        </td>
                        {currentAnalysis.alternatives.map((alt) => (
                          <td key={alt.id} className="px-4 py-3">
                            <span className="font-bold text-indigo-400">{alt.score}/100</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-400">Kết luận</td>
                        <td className="px-4 py-3">{getVerdictBadge(currentAnalysis.verdict)}</td>
                        {currentAnalysis.alternatives.map((alt) => (
                          <td key={alt.id} className="px-4 py-3">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-[10px]">
                              <RefreshCw className="w-3 h-3" />
                              <span>Mẫu thay thế</span>
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-slate-900/40">
                        <td className="px-4 py-3 font-semibold text-slate-400 align-top">Lý do gợi ý</td>
                        <td className="px-4 py-3 text-slate-300 leading-relaxed align-top">{currentAnalysis.reasoning.summary}</td>
                        {currentAnalysis.alternatives.map((alt) => (
                          <td key={alt.id} className="px-4 py-3 text-slate-300 leading-relaxed align-top">{alt.reason}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
                <Scale className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-bold text-slate-300">Chưa có dữ liệu so sánh đối thủ</h3>
                <p className="text-xs text-slate-500">Vui lòng chọn một sản phẩm đã phân tích ở tab "Lời khuyên" hoặc "Lịch sử".</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANALYSIS HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Lịch sử nghiên cứu sản phẩm</h2>
                <p className="text-xs text-slate-400">Danh sách các sản phẩm đã được lưu trữ trong Database</p>
              </div>
              <button
                onClick={fetchHistory}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setResultImage('');
                    setCurrentAnalysis(item);
                    setActiveTab('verdict');
                  }}
                  className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl transition cursor-pointer flex flex-wrap items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <span className="font-bold text-blue-400">{item.product.brand}</span>
                      <span>•</span>
                      <span>{item.product.category}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h3 className="font-bold text-base text-white group-hover:text-blue-300 transition">
                      {item.product.model}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
                      {item.reasoning?.summary}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Giá thị trường</div>
                      <div className="font-bold text-emerald-400 text-sm">{formatPrice(item.currentPrice)}</div>
                    </div>
                    {getVerdictBadge(item.verdict)}
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Clean Consumer Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070a12] py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-400">BuyWise AI Decision Engine</span>
          </div>
          <p>© 2026 BuyWise — Evidence → Analysis → Decision</p>
          <div className="text-slate-400">
            Powered by Google AI & Gemini
          </div>
        </div>
      </footer>
    </div>
  );
}
