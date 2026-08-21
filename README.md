# BuyWise — AI Purchase Decision Engine

> **"Before you buy anything, let BuyWise do the research."**

BuyWise là trợ lý quyết định mua sắm dùng **Google AI (Gemini)**. Người dùng đưa URL, ảnh hoặc mô tả sản phẩm, cùng ngân sách và ưu tiên cá nhân. Hệ thống nhận diện sản phẩm, nghiên cứu thông tin công khai trên web, tổng hợp giá, review, ưu/nhược điểm, vấn đề tiềm ẩn và sản phẩm thay thế; sau đó đưa ra verdict **BUY / WAIT / SKIP / ALTERNATIVE** kèm lý do, mức độ tin cậy và nguồn để kiểm chứng.

Nguyên tắc sản phẩm: **Evidence → Analysis → Decision**. AI không chỉ tạo văn bản — Gemini là **runtime engine** của product understanding, web research, review intelligence, comparison và personalized decision-making.

Dự án tham gia **AI Riser Vietnam 2026** (track thương mại điện tử / social-commerce).

---

## Mục lục

1. [Tính năng](#tính-năng)
2. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
3. [Công nghệ](#công-nghệ)
4. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
5. [Cài đặt & chạy local](#cài-đặt--chạy-local)
6. [Biến môi trường](#biến-môi-trường)
7. [Cách Decision Engine hoạt động](#cách-decision-engine-hoạt-động)
8. [Nguồn dữ liệu & Grounding](#nguồn-dữ-liệu--grounding)
9. [Deploy (Docker / Cloud Run)](#deploy-docker--cloud-run)
10. [Bảo mật](#bảo-mật)
11. [Tuân thủ & Giới hạn](#tuân-thủ--giới-hạn)
12. [Kịch bản demo](#kịch-bản-demo)

---

## Tính năng

Toàn bộ các module (M01–M14) trong kế hoạch triển khai đã hoàn thiện:

| Module | Chức năng | Trạng thái |
|---|---|---|
| M01 | Product Input: URL / ảnh / text / giá; validate; preview | ✅ |
| M02 | Product Understanding: Gemini Vision/Text → brand, model, category, variant, specs, confidence | ✅ |
| M03 | Research Planner: sinh tập query theo giá/review/vấn đề/alternatives | ✅ |
| M04 | Web Evidence: Google Search grounding → title, URL, source type, snippet, relevance | ✅ |
| M05 | Price Intelligence: observed market range, median, deviation, GOOD/FAIR/HIGH | ✅ |
| M06 | Review Intelligence: aspect sentiment, pros/cons, consensus | ✅ |
| M07 | Hidden Concerns: vấn đề lặp lại ngoài listing | ✅ |
| M08 | Competitor Finder: 3 sản phẩm cùng category/tầm giá | ✅ |
| M09 | User Preference: budget, purpose, priorities, price sensitivity | ✅ |
| M10 | Decision Engine: weighted score + rule guards + counter-reasons | ✅ |
| M11 | Evidence UI: claim → source, confidence, loại nguồn | ✅ |
| M12 | History: lưu analyses vào MySQL, xem lại | ✅ |
| M13 | Comparison: bảng so sánh sản phẩm đang xem vs alternatives | ✅ |
| M14 | Reliability/Safety: chống prompt-injection, validate input, giới hạn file, rate limit, bảo vệ API key | ✅ |

> **Search mọi loại sản phẩm / mọi danh mục**: BuyWise không hardcode theo ngành. Gemini tự nhận diện danh mục và suy ra khoảng giá thị trường cho bất kỳ sản phẩm nào (đồ điện tử, gia dụng, mỹ phẩm, nội thất, thời trang, thể thao…).

---

## Kiến trúc hệ thống

```
Browser ───▶ React/Vite (Frontend)
                    │  REST (JSON)
                    ▼
          Node.js/Express API (Backend)
            ├──▶ Gemini (product understanding, review analysis, reasoning)
            ├──▶ Google Search grounding (fresh public-web evidence)
            ├──▶ Decision Engine (deterministic scoring + rules)
            └──▶ MySQL (XAMPP local / Cloud SQL production)
```

Luồng chính:

```
User input → Product Understanding → Normalized Product → Research Planner
  → Web Evidence → Price + Review Intelligence → Competitor Finder
  → Recommendation Engine → BUY/WAIT/SKIP/ALTERNATIVE → Explanation + Sources
```

**Điểm khác biệt về AI**: Gemini là *runtime capability* của sản phẩm, không phải công cụ viết code. Mọi output máy-đọc (structured product, evidence, review aspects) đều ép theo **JSON schema**; verdict cuối cùng do **Decision Engine deterministic** tính, Gemini không "bịa" con số cuối cùng.

---

## Công nghệ

| Lớp | Công nghệ |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + TypeScript + Express |
| AI | Gemini (Google AI Studio API) — multimodal + reasoning |
| Web research | Google Search grounding |
| Database | MySQL (XAMPP local) + Prisma ORM |
| Deploy | Docker → Google Cloud Run |

---

## Cấu trúc thư mục

```
AI_Raiser/
├── backend/
│   ├── prisma/            # schema.prisma + seed.ts
│   ├── src/
│   │   ├── config/        # env.ts
│   │   ├── middleware/    # validate.ts, rateLimit.ts
│   │   ├── routes/        # product, analysis, health
│   │   ├── services/      # gemini, research, product-understanding,
│   │   │                  # decision, analysis, product
│   │   └── utils/         # errors.ts, timeout.ts
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # UI chính (4 tab)
│   │   └── vite-env.d.ts
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

## Cài đặt & chạy local

### Yêu cầu

- Node.js LTS (20+)
- XAMPP (MySQL) — chạy MySQL từ XAMPP Control Panel
- Google AI Studio API key (Gemini)
- Git

### Bước 1 — Cài dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Bước 2 — Cấu hình môi trường

```bash
cd backend
cp .env.example .env
# Sửa GEMINI_API_KEY bằng key thật của bạn
```

### Bước 3 — Tạo database

Tạo database `buywise` trong MySQL (phpMyAdmin hoặc CLI), rồi:

```bash
cd backend
npm run db:push      # đồng bộ Prisma schema → MySQL
npm run db:seed      # (tùy chọn) seed 2 sản phẩm demo
```

### Bước 4 — Chạy

```bash
# Terminal 1 — Backend (http://localhost:3333)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:3003)
cd frontend && npm run dev
```

Mở http://localhost:3003 để dùng thử.

---

## Biến môi trường

Backend (`.env`, **không bao giờ commit**):

| Biến | Mô tả | Mặc định |
|---|---|---|
| `PORT` | Cổng backend | `3333` |
| `DATABASE_URL` | Chuỗi kết nối MySQL | `mysql://root:@localhost:3306/buywise` |
| `CORS_ORIGIN` | Origin frontend được phép | `http://localhost:3003` |
| `GEMINI_API_KEY` | API key Google AI Studio | *(bắt buộc)* |
| `GEMINI_MODEL` | Model Gemini | `gemini-3.6-flash` |

Frontend (build-time):

| Biến | Mô tả | Mặc định |
|---|---|---|
| `VITE_API_URL` | Base URL của backend | `http://localhost:3333` |

---

## Cách Decision Engine hoạt động

Để tránh hallucination, verdict **không** do LLM tự bịa ra. Engine deterministic:

```
Final Score = 0.35×Quality + 0.25×UserFit + 0.20×ReviewConfidence + 0.20×PriceValue
```

1. **Trọng số** dịch chuyển theo ưu tiên người dùng (VD: chọn "Giá tốt nhất" → tăng trọng số giá), sau đó chuẩn hoá về 100%.
2. **Rule guards**: `HIGH` price + ưu tiên giá → `SKIP`; score ≥ 78 → `BUY`; 60–78 → `WAIT`; thấp hơn → `SKIP`; generic category → `ALTERNATIVE`.
3. **Mọi verdict** đều có lý do, counter-reason, confidence và nguồn.

Kết quả phản ánh ưu tiên cá nhân: cùng một sản phẩm, người chọn "Chất lượng cao" có thể nhận `WAIT`, người chọn "Giá tốt nhất" có thể nhận `SKIP`.

---

## Nguồn dữ liệu & Grounding

- **Google Search grounding** (cần **bật billing**: https://aistudio.google.com → billing) trả về nguồn web thật, cập nhật và ảnh sản phẩm từ Google Search. Đây là nguồn đáng tin nhất.
- Khi chưa có billing (grounding trả 429), hệ thống **tự lùi về fallback**: link tìm kiếm sản phẩm trực tiếp trên Shopee/Tiki/Lazada/Google với **đúng tên sản phẩm** (dùng cho mọi danh mục), và mọi kết luận được gắn nhãn phù hợp.
- Không scrape trái phép marketplace/mạng xã hội; không tuyên bố phân tích "toàn bộ Internet"; không giả lập historical price khi chưa có dataset.

---

## Deploy (Docker / Cloud Run)

### Build & chạy production-like bằng Docker Compose

```bash
# Tạo file .env (biến DATABASE_URL, GEMINI_API_KEY, ...) ở thư mục gốc
docker compose up --build
```

### Deploy lên Google Cloud Run (2 service)

```bash
# 1) Backend
cd backend
gcloud builds submit --tag gcr.io/$GOOGLE_PROJECT/buywise-backend
gcloud run deploy buywise-backend \
  --image gcr.io/$GOOGLE_PROJECT/buywise-backend \
  --set-env-vars DATABASE_URL=...,GEMINI_API_KEY=...,CORS_ORIGIN=... \
  --platform managed --allow-unauthenticated

# 2) Frontend (build với VITE_API_URL trỏ tới URL backend ở bước 1)
cd ../frontend
gcloud builds submit --tag gcr.io/$GOOGLE_PROJECT/buywise-frontend \
  --build-arg VITE_API_URL=https://buywise-backend-xxx.run.app
gcloud run deploy buywise-frontend \
  --image gcr.io/$GOOGLE_PROJECT/buywise-frontend \
  --platform managed --allow-unauthenticated
```

> Backend dùng biến môi trường (không bake `.env` vào image). API key được giữ ở Cloud Run secrets/env, không bao giờ nằm trong frontend hay Git.

---

## Bảo mật (M14)

- **Prompt-injection defense**: nội dung người dùng được cách ly trong ranh giới `<<<INPUT>>>…`, model chỉ đọc như dữ liệu, không thực thi.
- **Input validation**: giới hạn độ dài, chặn ký tự điều khiển, ép kiểu budget, giới hạn ảnh (≤2.5MB, chỉ `image/*`).
- **Rate limiting**: 120 req/phút toàn API, 10 req/phút cho endpoint phân tích.
- **API key protection**: key chỉ nằm ở backend `.env`; `.gitignore` loại trừ `.env`.
- **Error sanitization**: không lọt stack trace ra ngoài; trả lỗi chung chung cho client.
- **Output JSON**: `responseMimeType: application/json`.

---

## Tuân thủ & Giới hạn

Theo kế hoạch, trước deadline **không** xây: crawler toàn Internet, scrape TikTok/Facebook/Shopee/Lazada trái điều khoản, hệ thống thanh toán/mua hàng tự động, native app (khi web chưa ổn), train model riêng, historical price database, affiliate/monetization.

---

## Kịch bản demo

1. Dán URL hoặc upload ảnh sản phẩm.
2. AI nhận diện product + variant.
3. Research progress: giá / review / vấn đề / alternatives.
4. Result: WAIT / BUY / SKIP + score + confidence.
5. Hiện bằng chứng giá.
6. Hiện review intelligence theo aspect + hidden concerns.
7. Hiện 3 alternatives.
8. Đổi priority / budget → verdict thay đổi.
9. Click nguồn để kiểm chứng.
10. Roadmap: price tracking → personal shopping agent.

---

© 2026 BuyWise — Evidence → Analysis → Decision. Powered by Google AI (Gemini).