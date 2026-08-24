# Nộp bài — AI Riser Vietnam 2026

> Checklist + tài liệu để nộp **Form Hoàn thành** (mở khóa hạng mục). Tất cả phần bắt buộc đều **free 100%**.

---

## 1. Yêu cầu bắt buộc

- [ ] **AI Studio Link** — sản phẩm được xây dựng bằng Google AI Studio.
- [ ] **Demo Video** — YouTube chế độ **Công khai**.
- [ ] **LinkedIn Post** — chia sẻ video + hành trình.
- ( ) *(Không bắt buộc)* Link app chạy thực tế trên Google Cloud Run / Google Play.

---

## 2. Build 100% free được không?

| Hạng mục | Bắt buộc? | Chi phí |
|---|---|---|
| AI Studio app | ✅ | Free (free tier — **không cần thẻ**; cần "active project/free trial") |
| YouTube public | ✅ | Free |
| LinkedIn post | ✅ | Free |
| **Grounding with Google Search** (nguồn web thật + ảnh) | tùy | Cần **paid tier** (nạp tối thiểu ~$10) + phí theo query |
| Cloud Run app | ❌ optional | Cloud Run có free tier; nhưng MySQL Cloud SQL ~$8/tháng → dùng MySQL host free |

**Kết luận:** phần bắt buộc = 100% free. Chỉ "nâng cấp" (grounding thật, hoặc deploy Cloud Run + DB) mới phát sinh chi phí, và đều là tự chọn.

---

## 3. AI Studio App — System Prompt (copy-paste)

### Cách tạo
1. Mở **https://aistudio.google.com**
2. Tạo **App / Gem** (nút "Create" → chọn app dạng chat).
3. Dán đoạn dưới đây vào ô **System Instructions**.
4. *(Tùy chọn)* Bật **Grounding / "Search" tool** nếu bạn đã lên paid tier. Nếu chưa, cứ để trống — app vẫn chạy, chỉ thiếu nguồn web thật.
5. Đặt tên app **BuyWise**, bấm **Share/Publish** → sao chép link (đây chính là "AI Studio Link").

### System Instructions (dán nguyên đoạn này)

```
Bạn là BuyWise — trợ lý AI giúp người dùng Việt Nam quyết định mua sắm.
Nguyên tắc: Evidence → Analysis → Decision (Bằng chứng → Phân tích → Quyết định). KHÔNG bịa số liệu, giá hoặc review.

Khi người dùng đưa sản phẩm (tên, mô tả, hoặc link) kèm ngân sách và ưu tiên, trả lời tiếng Việt, đúng cấu trúc sau:

1. NHẬN DIỆN SẢN PHẨM
   - Thương hiệu, model, danh mục, phân khúc.
   - Khoảng giá thị trường hợp lý: min – median – max (VNĐ). Nếu không chắc, ghi "ước lượng".

2. ƯU / NHƯỢC ĐIỂM
   - Tối đa 4 ưu, 3 nhược, dựa trên thông số và review phổ biến.
   - Điều gì không xác minh được phải ghi rõ "chưa xác minh".

3. PHÂN TÍCH REVIEW (theo khía cạnh)
   - Mỗi khía cạnh (hiệu năng, độ bền, giá trị, dịch vụ/hậu mãi…) gán 1 trong: tích cực / tiêu cực / trung tính.

4. VẤN ĐỀ TIỀM ẨN
   - Điểm yếu / hạn chế thường bị phàn nàn ngoài phần quảng cáo.

5. 3 SẢN PHẨM THAY THẾ
   - Cùng danh mục, cùng tầm giá hoặc theo nhu cầu; mỗi cái kèm giá ước lượng + 1 câu lý do.

6. CHẤM ĐIỂM (thang 100)
   - Bốn thành phần, trọng số mặc định:
     • Chất lượng (35%)
     • Mức độ hợp nhu cầu (25%)
     • Độ tin cậy review (20%)
     • Giá trị so với giá (20%)
   - Nếu người dùng chọn ưu tiên (VD "Giá tốt nhất"), tăng trọng số tương ứng rồi chuẩn hóa về 100%.
   - Nêu rõ ĐIỂM TỪNG THÀNH PHẦN + TRỌNG SỐ đã dùng.

7. KẾT LUẬN
   - Verdict: BUY / WAIT / SKIP / ALTERNATIVE (≥78 BUY; 60–78 WAIT; <60 SKIP; thiếu dữ liệu/không rõ thì ALTERNATIVE).
   - 1 câu lý do + 1 phản biện (counter-reason) + mức tin cậy (%).

NGUỒN THAM KHẢO:
- Nếu có công cụ tìm kiếm: dùng để tìm nguồn/giá thật và dẫn link thật.
- Nếu không có: đưa link TÌM KIẾM đúng tên sản phẩm trên Shopee/Tiki/Lazada/Google và ghi rõ "(link tìm kiếm, chưa phải nguồn xác minh)".

Trả lời gọn, dễ đọc, dễ chụp màn hình. Khi không chắc chắn, nói rõ độ không chắc chắn thay vì bịa.
```

### Đầu vào mẫu để test/demo
1. `"Máy xay sinh tố Philips HR2228, ngân sách 900k, ưu tiên: Độ bền cao"` → kỳ vọng: BUY/WAIT + 3 thay thế.
2. `"Đồng hồ Galaxy Watch6, ngân sách 5 triệu, ưu tiên: Giá tốt nhất"` → kỳ vọng: SKIP/WAIT, thấy ưu tiên làm đổi verdict.

---

## 4. Kịch bản video demo (30–60 giây, quay màn hình)

| Thời gian | Cảnh |
|---|---|
| 0–5s | Intro: "BuyWise — trợ lý quyết định mua sắm bằng AI" + logo |
| 5–15s | Nhập sản phẩm (máy xay sinh tố) + ngân sách + ưu tiên → AI nhận diện brand/model/danh mục |
| 15–30s | Hiện khoảng giá thị trường + ưu/nhược + review theo khía cạnh + vấn đề tiềm ẩn |
| 30–40s | 3 sản phẩm thay thế + bảng so sánh |
| 40–50s | Verdict (BUY/WAIT/SKIP) + chấm điểm 4 thành phần + phản biện |
| 50–60s | **Đổi ưu tiên → verdict thay đổi** (điểm khác biệt: cá nhân hóa), rồi kết "Evidence → Analysis → Decision" |

Mẹo: quay bằng OBS/Xbox Game Bar miễn phí; up YouTube chọn **Public**; đặt tiêu đề `BuyWise — AI Purchase Decision Engine | AI Riser Vietnam 2026`.

---

## 5. Draft LinkedIn Post (copy — sửa theo ý bạn)

> 🛒 **BuyWise — trợ lý AI trước khi mua sắm** (Evidence → Analysis → Decision)
>
> Mình tham gia **#AIRiserVietnam** và build BuyWise — một AI giúp bạn quyết định mua/nghĩ/chờ cho BẤT KỲ sản phẩm nào: nhận diện sản phẩm, so giá thị trường, phân tích review theo khía cạnh, chỉ ra vấn đề tiềm ẩn, gợi ý 3 sản phẩm thay thế, rồi ra verdict **BUY / WAIT / SKIP** kèm lý do + phản biện + độ tin cậy.
>
> Điểm mình tâm đắc: verdict không do AI "bịa" — nó chạy qua một bộ chấm điểm có trọng số thay đổi theo ưu tiên cá nhân (giá tốt / độ bền / chất lượng…), đúng tinh thần "AI có trách nhiệm".
>
> 🎬 Xem demo: [link YouTube]
> 🧪 Dùng thử: [link AI Studio]
>
> #AIRiserVietnam #AI #Gemini #BuildAI #Ecommerce #ShopAssistant

---

## 6. Checklist việc BẠN tự làm

- [ ] Xác nhận API key ở `backend/.env` là dạng `AIza...` (lấy tại https://aistudio.google.com/app/apikey). Audit thấy giá trị trong `.env` có vẻ là token OAuth (`AQ.Ab8…`) chứ không phải API key chuẩn — cần kiểm tra/đổi.
- [ ] Tạo AI Studio app (mục 3) → lấy link chia sẻ.
- [ ] Quay video demo (mục 4) → up YouTube công khai.
- [ ] Đăng LinkedIn (mục 5) kèm link video + "hành trình".
- [ ] (Tùy chọn) Quyết định: **free tối đa** (không grounding) hay **nạp ~$10** để bật Grounding = nguồn web thật + ảnh.
- [ ] (Tùy chọn) Nếu muốn Cloud Run: tạo project Google Cloud + cấu hình MySQL free (theo `README.md` mục Deploy).

---
© 2026 BuyWise — Evidence → Analysis → Decision.