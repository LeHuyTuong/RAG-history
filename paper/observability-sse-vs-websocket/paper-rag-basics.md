# Paper RAG — Phần cơ bản chốt trước (Abstract + Scope + Metrics)

> Mục tiêu: chốt 3 thứ nền — (1) vấn đề/abstract, (2) prototype scope, (3) bộ metric đo thế nào.
> Nguyên tắc: **mọi metric phải neo vào nguồn baseline có thẩm quyền** (xem `paper-rag-baseline.md`). Không tự chế công thức.
> Tier: **T1** peer-reviewed · **T2** standard/vendor-doc uy tín · **T3** engineering blog.

---

## A. "Có paper nào làm chưa?" — trả lời thẳng

| Phần | Đã có nguồn định nghĩa chưa? | Neo vào |
|---|---|---|
| Định nghĩa **TTFT, inter-token latency, tokens/s** | ✅ Có, định nghĩa chuẩn | arXiv 2507.09019 (T1), NVIDIA, Anyscale (T2) |
| Đo **percentile p50/p95/p99** | ✅ Có, thư viện uy tín | HDR Histogram (Gil Tene), Micrometer, Prometheus (T2) |
| So sánh **SSE vs WS** về latency/throughput | ✅ Có | IEEE papers, WWW'21 (T1) |
| **Gộp**: đo token-level cho CẢ SSE và WS bằng **một instrument thống nhất, no-agent** | ❌ **Chưa ai làm** | → đây là **đóng góp của bạn** |

Tức là: từng viên gạch đều có nguồn — bạn **không phát minh metric**, bạn **lắp chúng lại** theo cách mới. Đây là claim novelty an toàn.

---

## B. Abstract (bản English paste-ráp được, ~190 từ)

> AI chatbot and RAG systems stream responses token-by-token so users see partial output early. Developers often default to WebSocket, yet for server-to-client text generation, Server-Sent Events (SSE) is frequently sufficient and simpler. Observability, however, is harder for both: REST tracing relies on per-request HTTP headers, but once an SSE or WebSocket connection is established, individual events or messages no longer carry HTTP headers, so request-level instrumentation cannot see token-level behaviour. This paper reports a systematic, PRISMA-guided review of how SSE and WebSocket are compared and observed, focusing on the metrics used for streaming AI workloads. We find that (i) token-level metrics — time to first token (TTFT), inter-token latency (ITL), and output throughput — are well defined in LLM-serving literature, (ii) transport-level differences between SSE and WebSocket are minor for one-way token streaming, and (iii) no existing work provides a unified, backend-independent, agent-free instrumentation model that captures token-level observability across both protocols. We synthesise these gaps into a five-layer protocol-aware observability framework and a prototype scope for a Java/Spring Boot library, leaving experimental measurement to future work.

**Gloss tiếng Việt:** vấn đề = streaming AI (SSE/WS) khó quan sát ở mức token vì sau handshake không còn HTTP header; review chỉ ra metric token đã có định nghĩa, SSE vs WS chênh nhau ít, nhưng chưa ai có mô hình instrument thống nhất no-agent cho cả hai → đề xuất framework 5 lớp + prototype.

---

## C. Proposed Prototype Scope (gọn, đủ demo)

> Mục tiêu prototype: chứng minh **đo được token-level cho cả SSE và WS bằng cùng một mô hình**, không cần backend, không cần LLM thật (dùng mock).

| Thành phần | Làm gì | Cơ chế (Spring Boot) | Trạng thái lib Viettel |
|---|---|---|---|
| REST inbound | đo request HTTP thường | `Filter` / `HandlerInterceptor` | ✅ đã có |
| SSE stream | đo lifecycle + mỗi event | wrap `SseEmitter` / `ResponseBodyEmitter` | ⬜ cần thêm |
| WebSocket stream | đo lifecycle + mỗi message | `HandshakeInterceptor` + `WebSocketHandlerDecorator` | ✅ đã có (session-anchored) |
| Mô hình chung | 1 **stream span** + mỗi token = 1 **span-event** | dùng `Span.events` đã thiết kế | ⬜ ghép SSE vào |
| Mock AI | giả lập sinh token (delay ngẫu nhiên) | controller phát N token, mỗi token cách nhau ~10–30ms | ⬜ |
| Output | JSON `/observability/metrics` + `/traces/{id}` | đã có | ✅ |

**Cắt scope rõ ràng (ghi vào paper):** không benchmark tải cao, không dùng LLM provider thật, không so binary/multiplex — chỉ so **observability + token-level metric** giữa SSE và WS trên cùng mock workload.

---

## D. Expected Metrics — đo sao, đơn vị gì, dựa trên đâu

> Chia 2 nhóm. Nhóm 1 = transport (để **so sánh SSE vs WS**). Nhóm 2 = token/AI (đo **chất lượng streaming**, dùng chung).
> Cột "Neo baseline" = nguồn định nghĩa/công thức — đây là phần bạn lo "có uy tín không".

### Nhóm 1 — Transport-level (so sánh SSE vs WS)

| # | Metric | Công thức | Đơn vị | Neo baseline (tier) |
|---|---|---|---|---|
| 1 | Connection setup time | `t_connected − t_request_start` | ms | RFC 6455 handshake; IEEE WS perf (T1) |
| 2 | Active connections | `opened − closed` (gauge) | count | Alibaba WS observability (T3) |
| 3 | Stream/connection duration | `t_close − t_open` | ms | OneUptime WS/SSE lifecycle (T3) |
| 4 | Throughput (bytes) | `total_bytes / window_seconds` | bytes/s | baseline B0 (thesis 2017, T1) |
| 5 | Latency p50/p95/p99 | percentile của tập duration | ms | **HDR Histogram (Tene)** / Micrometer / Prometheus `histogram_quantile` (T2) |
| 6 | Error / disconnect / timeout rate | `failed / total × 100` | % | baseline streaming (T2/T3) |

### Nhóm 2 — Token / AI-level (đo chất lượng streaming, dùng cho cả 2 protocol)

| # | Metric | Công thức | Đơn vị | Neo baseline (tier) |
|---|---|---|---|---|
| 7 | **TTFT** (Time To First Token) | `t_first_token − t_request_sent` | ms | NVIDIA, Anyscale (T2); arXiv 2507.09019 (T1) |
| 8 | **Inter-token latency (ITL/TPOT)** | `(t_last_token − t_first_token) / (N_tokens − 1)` | ms/token | Anyscale, NVIDIA (T2) — **lưu ý loại token đầu** |
| 9 | **Output throughput** | `N_output_tokens / generation_time` | tokens/s | NVIDIA, BentoML (T2) |
| 10 | End-to-end latency | `t_last_token − t_request_sent` | ms | arXiv 2507.09019 (T1) |
| 11 | Tokens/chunks per stream | đếm token trong 1 stream | count | OTel GenAI semconv `gen_ai.usage.output_tokens` (T2) |

### Lưu ý đo lường BẮT BUỘC ghi vào paper (nếu không sẽ bị bắt lỗi)

1. **ITL có 2 định nghĩa** — có tool tính cả token đầu, có tool loại ra (genAI-perf loại, LLMPerf giữ). → Bạn phải nói rõ dùng công thức nào (khuyến nghị: **loại token đầu**, vì TTFT đã đo riêng).
2. **Percentile phải dùng thư viện uy tín** — đừng sort thủ công rồi lấy index (O(n log n), tốn bộ nhớ). Dùng **HDR Histogram** (Gil Tene) — đây là chuẩn công nghiệp, lib đã dùng. Ghi rõ "3 significant digits".
3. **SSE làm méo latency kiểu HTTP** — SSE là 1 HTTP response sống lâu → nếu đo "request latency" kiểu REST thì p95/p99 bị kéo méo (= tuổi stream). → Phải đo theo **stream**, không theo request. Đây là điểm tinh tế nên nêu thành finding.
4. **TTFT gồm gì** — queue + prefill + network (NVIDIA). Trong RAG nên tách thêm: **retrieval time** + **generation TTFT** nếu có thời gian.

---

## E. Bộ CORE tối thiểu nên chốt trước (đừng ôm hết)

Nếu muốn đơn giản, lock **6 metric** này trước, đủ kể chuyện so sánh:

1. Connection setup time (1)
2. Latency p50/p95/p99 (5) — dùng HDR Histogram
3. **TTFT** (7)
4. **Inter-token latency** (8)
5. **Output tokens/s** (9)
6. Active connections (2)

→ Đo cùng 1 mock workload trên SSE và WS → bảng so sánh 2 cột. Đó là kết quả "đinh" của paper.
