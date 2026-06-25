# Outline — Protocol-Aware Observability for AI Chat Streaming (SSE vs WebSocket)

> Bản outline tinh lại từ draft `protocol_aware_observability_prisma_paper(1).docx`, map vào **PRISMA 2020** (27 items).
> Mục tiêu: paper nộp cho **dự án RAG** — trace + đo metrics token-streaming trên **cả SSE và WebSocket**.
> Lib Viettel (`observability-core` + starter) đóng vai **prototype hiện thực hoá framework** — nối 2 dự án.

---

## Quyết định cần chốt TRƯỚC khi viết tiếp

| Hướng | Nghĩa là gì | PRISMA | Công sức | Khuyến nghị |
|---|---|---|---|---|
| **(A) Review thật** | Chạy search thật, lọc ~20–30 nguồn, ĐIỀN số vào PRISMA flow | Đạt chuẩn | Trung bình (1–2 tuần đọc + lọc) | ✅ Nên — nâng hạng paper |
| **(B) Scoping review + proposal** | Giữ preliminary, đổi nhãn "scoping", không bắt buộc số đầy đủ | Đạt một phần | Nhẹ | OK nếu deadline gấp |
| (C) Review + prototype + đo thật | Như (A) + chạy benchmark SSE/WS thật bằng lib | Mạnh nhất | Nặng | Để stage 2 |

> Outline dưới viết cho **(A)**, nhưng đánh dấu rõ chỗ nào (B) có thể cắt.

---

## Title (PRISMA item 1)

**Đề xuất:** *"Protocol-Aware Observability for AI Chat Streaming: A Systematic Review of Tracing and Metrics for Server-Sent Events and WebSocket"*

- Bỏ dòng "No Experimental Measurement Conducted Yet" khỏi title → đưa vào abstract.
- Nếu chọn hướng (B): đổi "Systematic Review" → "Scoping Review".

## Abstract (item 2 — theo PRISMA for Abstracts)

~200 từ, 1 đoạn, cấu trúc: bối cảnh (AI chat stream token) → vấn đề (REST observability mature, streaming thì không) → mục tiêu review → phương pháp (PRISMA-lite, n nguồn) → phát hiện chính (gap) → đóng góp (framework 5 lớp + protocol-aware). **Viết SAU CÙNG.**

---

## 1. Introduction

- **1.1 Rationale (item 3)** — vì sao đáng review: dev mặc định WebSocket cho chat, nhưng AI text-gen chủ yếu là server→client → SSE có thể đủ & đơn giản hơn; observability cho streaming thì kém trưởng thành. *(draft đã có, giữ.)*
- **1.2 Objectives (item 4)** — phát biểu mục tiêu rõ ràng. **Gộp Sec 3 (Objectives) + Sec 4 (RQs) cũ vào đây** — đừng để 2 section riêng trùng nhau.
- **1.3 Research Questions** — tinh lại (xem dưới).
- **1.4 Contributions** — (i) review có hệ thống về metrics & tracing cho SSE/WS; (ii) **framework observability 5-lớp protocol-aware**; (iii) prototype Spring Boot (lib Viettel) chứng minh tính khả thi.

### Research Questions (tinh lại từ RQ1–RQ4 draft)

| ID | Câu hỏi | Ghi chú so với draft |
|---|---|---|
| RQ1 | Những **metric** nào được dùng để so sánh SSE và WebSocket? | giữ |
| RQ2 | Trong AI token streaming, **khi nào SSE đủ, khi nào cần WebSocket**? | giữ — đây là câu "thực dụng" hội đồng thích |
| RQ3 | Công cụ observability hiện tại hỗ trợ tracing REST vs SSE vs WebSocket **đến đâu**? | giữ |
| RQ4 | Gap nào tồn tại ở **message/token-level tracing** cho kết nối long-lived? | giữ — đây là cửa cho đóng góp của bạn |
| **RQ5 (thêm)** | Có thể đo **token-level metrics (TTFT, inter-token latency, tokens/s)** cho cả SSE và WS bằng **một mô hình instrument chung** không? | mới — nối thẳng tới framework + prototype |

---

## 2. Background

Giữ 4 mục của draft, thêm 1:

- 2.1 REST API Observability *(có)*
- 2.2 Server-Sent Events *(có)*
- 2.3 WebSocket *(có)*
- 2.4 Distributed Tracing & W3C Trace Context *(có)*
- **2.5 AI/LLM Token Streaming (THÊM)** — khái niệm TTFT, inter-token latency (TPOT), tokens/s; vì sao RAG hay dùng SSE (OpenAI-style) và khi nào cần WS (interrupt/voice/bi-directional). Đây là cầu nối topic với "AI chat".

---

## 3. Methods (PRISMA core — items 5–15)

> Đây là phần PRISMA chấm nặng nhất. Draft hiện tốt về khung nhưng **thiếu số**.

- **3.1 Eligibility criteria (item 5)** — inclusion/exclusion. *(draft Sec 5.3–5.4 đã có, giữ; thêm: year range, ngôn ngữ, report status.)*
- **3.2 Information sources (item 6)** — liệt kê DB + **ngày search cuối cùng** (PRISMA bắt buộc ghi ngày). *(draft Sec 5.1 có list, THIẾU ngày → bổ sung.)*
- **3.3 Search strategy (item 7)** — full search string từng nguồn. *(draft Sec 5.2 đã có, giữ; ghi rõ chỉnh sửa giữa các DB.)*
- **3.4 Selection process (item 8)** — ai screen, mấy người, có dùng tool không.
- **3.5 Data collection + Data items (items 9–10)** — bảng extraction. *(draft Sec 6 đã có — TỐT, giữ. Thêm cột "Trace Granularity: token-level" để phục vụ RQ4/RQ5.)*
- **3.6 Risk of bias / study quality (items 11–12)** — với nguồn blog/doc (không peer-review) → ghi cách đánh giá độ tin cậy (vendor credibility, recency). Quan trọng vì nhiều nguồn của bạn là doc/blog.
- **3.7 Synthesis methods (item 13)** — vì heterogenous → **narrative/qualitative synthesis**, nhóm theo protocol & theo metric layer.

## 4. Results (items 16–22)

- **4.1 Study selection + PRISMA flow diagram (item 16)** — **ĐIỀN SỐ THẬT.** Đây là chỗ phải hoàn thành nếu chọn hướng (A). *(draft Sec 5.5 còn `n=?`.)*
- **4.2 Study characteristics (item 17)** — bảng các nguồn đã chọn (S1..Sn) theo template extraction.
- **4.3 Results of synthesis (items 20–21)** — trả lời lần lượt RQ1–RQ5 bằng bằng chứng từ nguồn:
  - 4.3.1 Metrics dùng cho SSE/WS (RQ1)
  - 4.3.2 SSE-đủ vs WS-cần, theo workload (RQ2)
  - 4.3.3 Mức hỗ trợ tracing REST/SSE/WS của tool hiện có (RQ3)
  - 4.3.4 Gap ở message/token-level tracing (RQ4)

## 5. Gap Analysis (synthesis → đóng góp)

- Tổng hợp gap: REST tracing mature; SSE/WS thiếu **message/token-level**, propagation sau handshake không có header chuẩn.
- Định vị đóng góp: framework "protocol-aware" + mô hình **two-tier** (connection span + per-event/token span-event) áp dụng **chung** cho SSE và WS → trả lời RQ5.

## 6. Proposed Protocol-Aware Observability Framework  *(GỘP Sec 8+9+10 cũ)*

> Đây là đóng góp "beyond-review". Ghi rõ là proposal, chưa benchmark.

- **6.1 Mô hình 5 lớp** *(giữ nguyên Sec 8 draft — rất tốt)*: REST → DB/downstream → Streaming connection → Message/event → AI token.
- **6.2 Mô hình instrument thống nhất (two-tier)** — SSE và WS cùng hình dạng: 1 stream span + N span-event/token. Đây là phần lý thuyết nối RQ5.
- **6.3 Metric set** *(GỘP bảng Sec 10 vào đây — bỏ Sec 10 riêng)* — kèm cột "đo được trên SSE? trên WS?" để thấy điểm khác biệt (vd: SSE làm méo P95 latency kiểu HTTP → cần đo theo stream, không theo request).
- **6.4 Prototype scope** *(thu gọn Sec 9 thành sub-section)* — REST/JDBC/SSE/WS instrumentation trong Spring Boot starter; **trỏ tới lib Viettel** như hiện thực đang chạy (WS session-anchored đã chạy, SSE = future).

## 7. Discussion (item 23)

- 7.1 Diễn giải: protocol choice phụ thuộc workload, không theo trend. *(giữ Sec 11.)*
- 7.2 Ý nghĩa cho enterprise/RAG self-hosted.
- 7.3 So với OpenTelemetry / agent-based (LoongSuite, OneUptime SSE) — định vị no-agent/no-backend.

## 8. Limitations / Threats to Validity (item 23d)

Giữ Sec 12 draft, nhưng **thành thật hoá**: chưa benchmark, một số nguồn là doc/blog, PRISMA flow nếu (B) thì preliminary, framework chưa validate bằng đo thật.

## 9. Conclusion + Future Work

Giữ Sec 13. Future work = stage 2: implement SSE adapter + chạy benchmark SSE vs WS đo TTFT/inter-token/throughput thật bằng lib.

## Other PRISMA items (đừng quên — items 24–27)

- **Registration & protocol (24)** — review nhỏ/course thì ghi "not registered" là được, nhưng nên nói.
- **Support/funding (25)** — student project, no funding.
- **Competing interests (26)** — none.
- **Data availability (27)** — link repo lib + bảng extraction.

---

## Checklist khác biệt outline mới vs draft hiện tại

- [ ] Gộp Objectives (Sec 3) + RQ (Sec 4) → vào Introduction
- [ ] Gộp Framework + Prototype + Metrics (Sec 8+9+10) → 1 section "Proposed Framework"
- [ ] Thêm 2.5 AI/LLM Token Streaming
- [ ] Thêm RQ5 (mô hình instrument chung SSE+WS)
- [ ] Bổ sung: ngày search, selection process, risk-of-bias nguồn non-peer-review (PRISMA items 6, 8, 11–12)
- [ ] **ĐIỀN số PRISMA flow** (nếu hướng A) hoặc đổi nhãn "scoping" (hướng B)
- [ ] Sửa title — bỏ "No Experimental Measurement Yet"
- [ ] Cột "Trace Granularity = token-level" trong bảng extraction
