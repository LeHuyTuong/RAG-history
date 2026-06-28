# Baseline & Related Work — Paper RAG (SSE vs WebSocket Observability for AI Streaming)

> Bổ sung cho `baseline-related-work.vi.md` (23 nguồn, nghiêng về lib Viettel).
> File này tập trung phần **mỏng** của paper RAG: SSE-vs-WebSocket trong bối cảnh **LLM/token streaming** + **token-level metrics**.
> Ngày search: **23/06/2026**. Hướng: **(A) systematic review thật** → mục tiêu điền số PRISMA flow.

---

## 0. Cách dùng file này

- Phần 1 = search log (PRISMA item 6–7: nguồn + ngày + search string).
- Phần 2 = PRISMA flow numbers (working — cần bạn đọc full-text để chốt).
- Phần 3 = extraction table mới (R1…Rn), **phân tầng chất lượng** cho risk-of-bias.
- Phần 4 = synthesis sơ bộ theo RQ1–RQ5 (bằng chứng để viết Results).

---

## 1. Search log (PRISMA item 6–7)

| Cụm | Search string (rút gọn) | Ngày | Kết quả chính |
|---|---|---|---|
| C1 — Performance | SSE vs WebSocket latency/throughput/scalability | 23/6 | academic (WWW21, IEEE) + blog so sánh |
| C2 — Observability | tracing/telemetry SSE/WebSocket/long-lived + OTel | 23/6 | OneUptime SSE & WS, OTel docs |
| C3 — AI streaming | LLM/token streaming SSE/WebSocket, TTFT, inter-token | 23/6 | NVIDIA/Anyscale/BentoML + arXiv inference-serving |
| C4 — OTel/tracing | OTel GenAI semantic conventions, W3C trace context streaming | 23/6 | OTel GenAI semconv (chuẩn mới) |

> Nguồn academic chính dùng: IEEE Xplore, ACM DL, arXiv, Google Scholar. Nguồn kỹ thuật: OpenTelemetry/Spring/MDN docs + vendor engineering blogs.

## 2. PRISMA flow (working numbers — chốt sau khi đọc full-text)

```
IDENTIFICATION
  Records identified — academic DBs (IEEE/ACM/Springer/arXiv/Scholar): ~28
  Records identified — docs/standards (OTel, W3C, RFC, MDN, Spring, NVIDIA, Anyscale): ~12
  Records identified — engineering blogs/repos (OneUptime, Alibaba, Splunk, vendor): ~15
  → Tổng identified: ~55   (gồm 23 nguồn baseline cũ + ~32 mới)

SCREENING
  Sau dedup: ~48
  Screen title/abstract → loại (frontend-only, marketing, off-topic): ~13
  Full-text assessed: ~35
  Full-text excluded (no metric / no observability / outdated): ~10  [điền sau khi đọc]

INCLUDED
  Studies included in synthesis: ~25   [con số cuối cần bạn xác nhận]
```

> ⚠️ Đây là **khung + ước lượng làm việc**, KHÔNG phải số đã chốt. Để PRISMA hợp lệ bạn phải thật sự đọc full-text từng nguồn rồi điền số cuối. Tôi không bịa số "đã screen" thay bạn.

## 3. Extraction table — nguồn mới cho paper RAG

> Tier chất lượng (cho risk-of-bias, PRISMA item 11–12):
> **T1** = peer-reviewed (conference/journal) · **T2** = standard/spec hoặc vendor-tech doc có thẩm quyền · **T3** = engineering blog/repo (dùng làm minh hoạ thực hành, KHÔNG làm proof).

| ID | Title | Year | Tier | Protocol | Context | Metrics nhắc tới | Trace granularity | Strength | Limitation | RQ |
|---|---|---|---|---|---|---|---|---|---|---|
| R1 | WebSocket Adoption and the Landscape of the Real-Time Web (WWW '21, ACM) — [PDF](https://faculty.cc.gatech.edu/~mbailey/publications/www21_websocket.pdf) | 2021 | T1 | WebSocket | Real-time web (đo 71k WS connections, Tranco 1M) | adoption, connection count, usage patterns, security | connection-level | Bằng chứng empirical lớn nhất về WS thực tế dùng thế nào | Không so SSE; không về tracing | RQ2, RQ3 |
| R2 | Performance evaluation of WebSocket protocol for full-duplex web streams (IEEE MIPRO) — [IEEE](https://ieeexplore.ieee.org/document/6859715) | 2014 | T1 | WebSocket vs TCP | Web streams | latency, generated network traffic | n/a | Định lượng overhead WS | Cũ; không có SSE | RQ1 |
| R3 | Performance Analysis of Data Transmission on WebSocket for Real-time Communication (IEEE) — [IEEE](https://ieeexplore.ieee.org/document/8898135/) | 2019 | T1 | WebSocket | RTC | throughput, latency | n/a | Đo data transmission WS | Single-protocol | RQ1 |
| R4 | Introduction to a WebSocket benchmarking infrastructure (IEEE) — [IEEE](https://ieeexplore.ieee.org/document/7513661/) | 2016 | T1 | WebSocket | Server-side benchmark | server-side throughput, black-box measurement | n/a | Phương pháp benchmark độc lập implementation | Không SSE; không tracing | RQ1 |
| R5 | On Evaluating Performance of LLM Inference Serving Systems (arXiv 2507.09019) — [PDF](https://arxiv.org/pdf/2507.09019) | 2025 | T1 | n/a (serving) | LLM serving | TTFT, ITL, TPS, e2e latency, RPS; pitfalls đo lường | request/token-level | Định nghĩa chuẩn + cạm bẫy đo token metrics | Không bàn transport SSE/WS | RQ1, RQ5 |
| R6 | Meta-Metrics & Best Practices for System-Level Inference Benchmarking (arXiv 2508.10251) | 2025 | T1 | n/a | LLM serving | best-practice metrics đo inference | request-level | Khung "đo cho đúng" | Không transport-aware | RQ1 |
| R7 | LLM Inference Benchmarking: Fundamental Concepts — [NVIDIA](https://developer.nvidia.com/blog/llm-benchmarking-fundamental-concepts/) | 2025 | T2 | n/a | LLM serving | TTFT (queue+prefill+network), ITL, TPS | token-level | Định nghĩa metric token rõ ràng, hay trích | Vendor doc | RQ1, RQ5 |
| R8 | Understand LLM latency and throughput metrics — [Anyscale](https://docs.anyscale.com/llm/serving/benchmarking/metrics) | 2026 | T2 | n/a | LLM serving | TTFT, ITL, TPS | token-level | Công thức ITL (loại token đầu) | Vendor doc | RQ1 |
| R9 | Key metrics for LLM inference — [BentoML](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) | 2026 | T2 | n/a | LLM serving | TTFT, ITL, throughput, cost | token-level | Tổng hợp metric gọn | Vendor doc | RQ1 |
| R10 | OTel Semantic Conventions for GenAI spans — [OTel](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) | 2026 | T2 | n/a | LLM observability | gen_ai.usage.input/output_tokens, model, finish_reasons | span-level (per LLM call) | **Chuẩn mới** để trace LLM call — định vị paper | Experimental status; chưa cover streaming lifecycle | RQ3, RQ4 |
| R11 | Inside the LLM Call: GenAI Observability with OpenTelemetry — [OTel blog](https://opentelemetry.io/blog/2026/genai-observability/) | 2026 | T2 | n/a | LLM observability | token usage, latency spans | span/event | Cách OTel nhìn observability cho GenAI | Blog (nhưng của OTel) | RQ3 |
| R12 | How to Monitor SSE Stream Lifecycle and Delivery Latency with OpenTelemetry — [OneUptime](https://oneuptime.com/blog/post/2026-02-06-sse-stream-lifecycle-opentelemetry/view) | 2026 | T3 | SSE | SSE streaming | connection-lifetime span + per-event span, delivery latency từ producer timestamp | connection + event-level | **Precedent two-tier cho SSE** — đối xứng với WS của bạn | Blog/vendor | RQ4, RQ5 |
| R13 | How to Trace WebSocket Connections and Real-Time Events with OpenTelemetry — [OneUptime](https://oneuptime.com/blog/post/2026-02-06-trace-websocket-connections-realtime-events-opentelemetry/view) | 2026 | T3 | WebSocket | WS streaming | connection duration, messages, error/close; "span per message overwhelms collector" | connection + message-level | Nêu đúng vấn đề cardinality → biện minh session-anchored | Blog/vendor | RQ4, RQ5 |
| R14 | Master WebSocket End-to-end Observability in One Article — [Alibaba](https://www.alibabacloud.com/blog/master-websocket-end-to-end-observability-in-one-article_602915) | 2026 | T3 | WebSocket | AI real-time | time-to-first/last chunk, chunk count, avg interval | connection+message+frame | Engineering baseline + LoongSuite agent | Vendor; agent-based | RQ3, RQ4 |
| R15 | SSE vs WebSockets for Streaming LLM Responses — [buildmvpfast](https://www.buildmvpfast.com/blog/streaming-llm-responses-sse-vs-websockets-2026) | 2026 | T3 | SSE vs WS | LLM chat | latency diff ~5-7ms vs token gen 10-12ms; "model is bottleneck, not pipe" | n/a | Số liệu thực hành cho RQ2 | Blog, không peer-review | RQ2 |
| R16 | Why SSE Still Wins for LLM Streaming in 2026 — [Procedure](https://procedure.tech/blogs/the-streaming-backbone-of-llms-why-server-sent-events-(sse)-still-wins-in-2025) | 2026 | T3 | SSE vs WS | LLM streaming | reconnection, CDN, no sticky session | n/a | Lập luận SSE-đủ | Blog | RQ2 |
| R17 | WebSocket vs SSE — Key Differences — [getstream](https://getstream.io/blog/websocket-sse/) / [websocket.org](https://websocket.org/comparisons/sse/) | 2026 | T3 | SSE vs WS | General | so sánh feature, latency, reconnection | n/a | Bảng so sánh tiện trích | Blog | RQ2 |
| R18 | WebSockets vs SSE vs Long-Polling vs WebRTC vs WebTransport — [RxDB](https://rxdb.info/articles/websockets-sse-polling-webrtc-webtransport.html) | 2026 | T3 | nhiều | Real-time web | so sánh transport rộng | n/a | Đặt SSE/WS trong phổ rộng | Blog | RQ2 |

> Standards/specs nền (đã có trong baseline cũ, **dùng lại**): RFC 6455 (WebSocket), RFC 6202 (long polling/streaming), WHATWG SSE/EventSource, W3C Trace Context. Academic nền real-time web: Appelqvist & Örnmyr 2017 (thesis, T1), Słodziak & Nowak 2016 (T1). Tracing nền: Dapper 2010, OpenTelemetry docs.

## 4. Synthesis sơ bộ theo RQ (để viết Results §4.3)

**RQ1 — Metrics so sánh SSE/WS.** Hai lớp tách biệt:
- *Transport-level* (từ T1 academic): latency, throughput, bandwidth, CPU/memory, số TCP connection, message frequency.
- *LLM/token-level* (R5–R9): **TTFT** (gồm queue + prefill + network), **inter-token latency / TPOT**, **tokens/s**, e2e latency. → Đây là bộ metric mà paper bạn nên đo, KHÁC bộ REST cũ.

**RQ2 — Khi nào SSE đủ, khi nào cần WS.** Hội tụ rõ trong nguồn: với AI text streaming một chiều server→client, **SSE đủ và đơn giản hơn** (OpenAI & Anthropic đều dùng SSE; tự reconnect, hợp CDN, không cần sticky session). Khác biệt latency transport (~5–7ms) **không đáng kể** so với tốc độ sinh token (~10–12ms/token) — *model là bottleneck, không phải pipe* (R15). **WebSocket cần** khi có input giữa chừng 2 chiều: interrupt, voice, collaborative (R13, R17).

**RQ3 — Tool hỗ trợ tracing REST vs SSE vs WS.** REST mature. LLM call giờ có **chuẩn OTel GenAI semconv** (R10–R11) — nhưng đa số *experimental* và **chưa cover streaming lifecycle**. SSE/WS tracing vẫn phải **instrument thủ công có chủ ý** (R12–R14), không tự động như REST.

**RQ4 — Gap message/token-level.** (i) Sau handshake, frame/event không mang HTTP header → không propagate traceparent kiểu REST. (ii) Tạo 1 span/message hoặc /token → **nổ cardinality, ngập collector** (R13 nói thẳng). → Cần mô hình **two-tier** (connection span + per-event/token record). Đây chính là gap paper bạn lấp.

**RQ5 — Mô hình instrument chung SSE+WS.** R12 (SSE) và R13–R14 (WS) độc lập nhau **cùng hội tụ về two-tier**. Chưa thấy nguồn nào đưa ra **một mô hình thống nhất, backend-independent, no-agent** đo token-level cho cả hai. → **Đây là novelty của bạn** (lib Viettel là hiện thực).

## 5. Điểm thành thật cần ghi vào Limitations

- Phần lớn nguồn SSE-vs-WS-cho-LLM là **engineering blog (T3)**, không peer-review → đánh dấu rõ, dùng làm "current practice" chứ không phải "evidence". PRISMA review về chủ đề mới này vốn thiếu nguồn T1 — chính nó là một phát hiện (gap academic).
- Số PRISMA flow ở §2 là **working**, phải đọc full-text để chốt.
- TTFT/ITL định nghĩa **không thống nhất giữa tool** (genAI-perf không tính token đầu vào ITL, LLMPerf thì có — R5/R8) → khi đo phải nói rõ định nghĩa dùng.
