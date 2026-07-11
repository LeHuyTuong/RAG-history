# D7 — Variable Definition Sheet

**Đề tài:** Protocol-Aware Observability for AI Chat Streaming (SSE vs. WebSocket)
**Ánh xạ IEEE:** III. Research Methodology

## 1. Biến độc lập (Independent Variables)

| Biến | Giá trị / mức | Định nghĩa vận hành (operational definition) |
|---|---|---|
| **Transport** | SSE, WebSocket | Giao thức truyền token: SSE qua `text/event-stream` trên 1 HTTP response dài; WebSocket qua frame sau handshake nâng cấp (RFC 6455) |
| **Instrumentation mode** | baseline, lib | `baseline` = thư viện tracing tắt hoàn toàn; `lib` = thư viện bật, mỗi stream có 1 span kết nối (SSE) hoặc 1 span/message (WebSocket) + span event/token |
| **Token-rate scenario** | Δ=0ms, Δ=20ms, Δ=50ms | Độ trễ cố định giữa 2 token liên tiếp do mock generator phát ra; Δ=0 mô phỏng tải cực đại (transport-bound stress), Δ=20/50 mô phỏng tốc độ decode LLM thực tế |
| **Token source** | mock (deterministic), Ollama (Llama 3.2 3B, local), Groq (Llama 3.1 8B, cloud) | Nguồn sinh token: mock có số lượng + nhịp cố định (tách sạch overhead transport khỏi biến thiên model); Ollama/Groq là LLM thật, độ dài/nhịp do model tự quyết định |
| **Network condition** | healthy, weak | `healthy` = không giả lập suy giảm; `weak` = thêm 30ms delay + ±20ms jitter + 1% xác suất rớt token/lần gửi, áp dụng đồng nhất cho cả 2 transport ở tầng ứng dụng (client-side decorator, không phải `tc netem` tầng mạng thật) |

## 2. Biến phụ thuộc (Dependent Variables)

| Biến | Đơn vị | Công thức (operational definition) |
|---|---|---|
| **TTFT** (Time To First Token) | ms | $t_1 - t_{\text{req}}$ — thời điểm nhận token đầu tiên trừ thời điểm gửi request, đo phía client |
| **ITL** (Inter-Token Latency) | ms/token | $\dfrac{t_N - t_1}{N-1}$ — khoảng cách trung bình giữa các token, không tính token đầu (đã tính riêng ở TTFT) |
| **Throughput** | tokens/s | $\dfrac{N}{(t_N - t_{\text{req}})/1000}$ |
| **Connection setup** | ms | $t_{\text{conn}} - t_{\text{req}}$ — thời gian thiết lập kết nối (handshake WS / mở response SSE) |
| **Bytes/token (on-wire)** | bytes | Độ dài thực tế truyền trên dây cho mỗi token: SSE = payload + 7 byte framing (`data:`/`\n\n`); WebSocket = toàn bộ JSON envelope (có thể chứa thêm `traceparent` ở mode `lib`) |
| **Content lost** | % | $(N_{\text{healthy}} - N_{\text{weak}}) / N_{\text{healthy}} \times 100$ — % token client nhận được ít hơn dưới điều kiện mạng yếu so với mạng khỏe, cùng cấu hình |
| **Tracing overhead** | % | $(\text{metric}_{\text{lib}} - \text{metric}_{\text{baseline}}) / \text{metric}_{\text{baseline}} \times 100$, áp dụng cho TTFT/ITL/Throughput/Bytes-per-token |

## 3. Biến kiểm soát (Control Variables)

- **Máy đo**: 1 máy vật lý duy nhất, client và server cùng localhost (loại trừ biến thiên mạng thật ngoài ý muốn)
- **Client đo**: cùng 1 client JDK thuần (`java.net.http.HttpClient`/`java.net.http.WebSocket`), không đổi giữa các run
- **Câu hỏi/nội dung sinh token**: cố định theo scenario (mock: nội dung + số lượng token cố định; Ollama/Groq: cùng bộ câu hỏi lịch sử Việt Nam cố định, xoay vòng)
- **Warm-up**: loại bỏ 5-8 run đầu (mock) / 3-5 run đầu (Ollama/Groq) trước khi ghi nhận, tránh nhiễu JIT/cold-start
- **Phiên bản instrumentation**: cùng 1 commit/version code cho toàn bộ scenario trong 1 bảng so sánh
- **Vị trí đo (vantage point)**: luôn đo phía client, không đo phía server, nhất quán với thông lệ benchmark LLM-serving

## 4. Cỡ mẫu (Sample Size) theo scenario

| Scenario | Số run (sau warm-up) | Lý do |
|---|---|---|
| Mock (Δ=0/20/50, healthy+weak) | 80 run/cấu hình | Đủ lớn cho percentile p95/p99 ổn định, model deterministic không lo nhiễu nhiệt |
| Ollama (healthy+weak) | 40 run/cấu hình | Giảm còn 40 vì suy luận thật trên 1 máy có rủi ro thermal-throttling nếu chạy quá lâu |
| Groq (healthy+weak) | 20 run/cấu hình | Giới hạn bởi free-tier rate limit của provider (30 RPM tổ chức) |