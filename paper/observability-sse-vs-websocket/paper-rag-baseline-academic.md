# Baseline học thuật (peer-reviewed only) — thay cho bản có blog

> Theo yêu cầu: **chỉ nguồn khoa học** (IEEE / ACM / Springer / Elsevier / arXiv / thesis), **bỏ toàn bộ blog** (OneUptime, Alibaba blog, BuildMVPFast, Procedure, GetStream...).
> Ngày search: 23/06/2026 (qua domain học thuật; Google Scholar bị chặn 429 trong sandbox).
> Tier: **T1** = peer-reviewed (conference/journal/thesis) · **P** = arXiv preprint (chưa qua review, đánh dấu rõ).

---

## 0. Kết luận thẳng (phải đọc trước)

Ba cụm học thuật **tồn tại độc lập**, nhưng **không cụm nào nói trúng** "SSE vs WebSocket observability cho LLM token streaming":

1. **Transport perf (SSE/WS)** — đo latency/throughput, **không nhắc LLM**.
2. **LLM serving metrics** — định nghĩa TTFT/ITL/throughput, **không nhắc transport SSE/WS**.
3. **Distributed tracing overhead** — đo overhead instrument, **không nhắc streaming protocol**.

→ **Khoảng trống nằm ở giao của 3 cụm = đóng góp của bạn.** Đây là framing MẠNH HƠN bản cũ: thay vì dựa blog để nói "chưa ai làm", giờ bạn chứng minh bằng 3 thân tài liệu học thuật rằng *literature peer-reviewed chưa nối 3 mảng này lại*.

---

## 1. Cụm A — SSE / WebSocket performance (measurement baseline transport)

| ID | Nguồn | Venue/Year | Tier | Đo gì (baseline) |
|---|---|---|---|---|
| A1 | Appelqvist & Örnmyr, *Performance comparison of XHR polling, long polling, SSE, WebSocket* — [DiVA](https://www.diva-portal.org/smash/get/diva2:1133465/FULLTEXT01.pdf) | Thesis 2017 | T1 | CPU, memory, network traffic, TCP connections, message freq |
| A2 | Słodziak & Nowak, *Performance Analysis of Web Systems Based on XMLHttpRequest, SSE and WebSocket* — [Springer](https://link.springer.com/chapter/10.1007/978-3-319-28561-0_6) | Springer 2016 | T1 | latency, throughput các kỹ thuật web real-time |
| A3 | *Latency evaluation for MQTT and WebSocket Protocols: an Industry 4.0 perspective* — [IEEE](https://ieeexplore.ieee.org/document/8538692/) | IEEE 2018 | T1 | latency WebSocket vs MQTT |
| A4 | *Mobile HTML5: Efficiency and Performance of WebSockets and SSE* — [DiVA](https://www.diva-portal.org/smash/get/diva2:874674/FULLTEXT01.pdf) | Thesis | T1 | đo SSE & WS qua 3G/4G/WiFi, nhiều device |
| A5 | Murley et al., *WebSocket Adoption and the Landscape of the Real-Time Web* — [PDF](https://faculty.cc.gatech.edu/~mbailey/publications/www21_websocket.pdf) | ACM WWW 2021 | T1 | empirical 71k WS connections (Tranco 1M) |
| A6 | *Performance evaluation of WebSocket protocol for full-duplex web streams* — [IEEE](https://ieeexplore.ieee.org/document/6859715) | IEEE MIPRO 2014 | T1 | latency, network traffic WS vs TCP |
| A7 | *Introduction to a WebSocket benchmarking infrastructure* — [IEEE](https://ieeexplore.ieee.org/document/7513661/) | IEEE 2016 | T1 | phương pháp benchmark server-side WS |

**Bài học:** A1/A2/A4 là **measurement baseline transport** — chuẩn 2 metric latency + throughput. Dùng làm B0 thay cho mọi con số từ blog.

## 2. Cụm B — Distributed tracing / observability overhead (measurement baseline tracing)

| ID | Nguồn | Venue/Year | Tier | Đo gì (baseline) |
|---|---|---|---|---|
| B1 | *Investigating Performance Overhead of Distributed Tracing in Microservices and Serverless Systems* — [ACM](https://dl.acm.org/doi/10.1145/3680256.3721316) | ACM/SPEC ICPE 2025 | T1 | **overhead: throughput giảm 19–80%, latency tăng tới 175%**; serialize trace là nguyên nhân lớn nhất |
| B2 | *TraceWeaver: Distributed Request Tracing for Microservices Without Application Modification* — [ACM](https://dl.acm.org/doi/10.1145/3651890.3672254) | ACM SIGCOMM 2024 | T1 | **tracing không sửa code app** — neo trực tiếp claim zero-touch của bạn |
| B3 | *Tracing and Metrics Design Patterns for Monitoring Cloud-native Applications* — [arXiv](https://arxiv.org/html/2510.02991v1) | arXiv 2025 | P | design pattern trace + metrics |
| B4 | *The Kieker Observability Framework Version 2* — [arXiv](https://arxiv.org/pdf/2503.09189) | arXiv 2025 | P | framework observability học thuật, low-overhead |
| B5 | *ServiceAnomaly: anomaly detection in microservices using distributed traces + profiling metrics* — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0164121223003126) | J. Syst. Softw. 2023 | T1 | dùng trace+metric để phát hiện bất thường |
| B6 | *Monitoring tools for DevOps and microservices: A systematic grey literature review* — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0164121223003011) | J. Syst. Softw. 2023 | T1 | **SLR mẫu** — tham chiếu phương pháp PRISMA/review |

**Bài học:** B1 là **measurement baseline overhead** bạn đang thiếu (con số 19–80% / 175% rất đáng trích). B2 (zero-touch, no app modification) là **công trình gần nhất** để so với lib của bạn — đưa vào Related Work + bảng so sánh. B6 là SLR học thuật → tham chiếu để biện minh phương pháp review.

## 3. Cụm C — LLM serving / token metrics (measurement baseline token-level)

| ID | Nguồn | Venue/Year | Tier | Đo gì (baseline) |
|---|---|---|---|---|
| C1 | *On Evaluating Performance of LLM Inference Serving Systems* — [arXiv](https://arxiv.org/pdf/2507.09019) | arXiv 2025 | P | định nghĩa TTFT, ITL, TPS + cạm bẫy đo |
| C2 | *Meta-Metrics and Best Practices for System-Level Inference Benchmarking* — [arXiv](https://arxiv.org/pdf/2508.10251) | arXiv 2025 | P | best practice đo inference |
| C3 | *Comparative Analysis of LLM Inference Serving: vLLM vs HuggingFace TGI* — [arXiv](https://arxiv.org/html/2511.17593v1) | arXiv 2025 | P | **TTFT/throughput thực**: TGI thấp hơn 1.3–2× TTFT ở tải thấp; vLLM throughput cao 2–24× |
| C4 | *FlashInfer: Efficient Attention Engine for LLM Inference Serving* — [arXiv](https://arxiv.org/pdf/2501.01005) | arXiv 2025 | P | **ITL giảm 29–69%** vs Triton |
| C5 | *LLM-Inference-Bench* — [arXiv](https://arxiv.org/pdf/2411.00136) | arXiv 2024 | P | benchmark inference trên nhiều accelerator |
| C6 | *Bench360: Benchmarking Local LLM Inference* — [arXiv](https://arxiv.org/pdf/2511.16682) | arXiv 2025 | P | benchmark local inference đa chiều |
| C7 | *Stream2LLM: Overlap Context Streaming and Prefill for Reduced TTFT* — [arXiv](https://arxiv.org/abs/2604.16395) | arXiv 2026 | P | **RAG-relevant**: stream context để giảm TTFT |

**Bài học:** C1/C2 cho **định nghĩa chuẩn** TTFT/ITL/TPS (peer-context). C3/C4 cho **số thực** (TTFT ~45–160ms, ITL giảm 29–69%) → chứng minh được "model chi phối latency" bằng số học thuật, **không cần blog**. C7 nối thẳng tới RAG.

---

## 4. Những claim CŨ mất chỗ dựa khi bỏ blog (phải xử lý)

| Claim cũ (từ blog) | Hậu quả | Cách thay |
|---|---|---|
| "OpenAI & Anthropic dùng SSE" | mất nguồn academic | bỏ, hoặc để như nhận định ngành có ghi rõ là không peer-reviewed |
| "Latency SSE vs WS chênh ~5–7ms" | con số blog → bỏ | thay bằng lập luận: TTFT model ~45–160ms (C3) >> overhead transport (A1–A4) → model là bottleneck |
| Pattern two-tier "OneUptime/Alibaba" | mất nguồn | thay bằng B2 (TraceWeaver, no-app-modification) + B1 (overhead → vì sao cần giảm span) |

→ Tin tốt: **mọi luận điểm cốt lõi vẫn đứng được bằng nguồn academic**, chỉ đổi chỗ dựa. Cái mất chỉ là vài con số cụ thể của blog.

## 5. Việc tiếp theo cho paper

- Thay citation blog trong `main.tex` bằng A/B/C ở trên.
- Thêm B1 (overhead baseline) + B2 (zero-touch baseline) vào Related Work và bảng so sánh.
- Cập nhật PRISMA: corpus academic-only ~20 nguồn (7 transport + 6 tracing + 7 LLM). Ít hơn nhưng **sạch tier**.
- Giữ honesty: arXiv (P) đánh dấu là preprint, không xếp ngang journal đã review.
