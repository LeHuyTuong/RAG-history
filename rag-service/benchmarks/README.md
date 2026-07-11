# SSE vs WebSocket streaming benchmark (rag-service thật)

Đo end-to-end SSE vs WebSocket cho AI chat streaming trên rag-service THẬT —
token sinh từ Gemma qua đúng pipeline RAG (retrieval + prompt + LLM), input là
câu hỏi lịch sử đã ingest. Bổ sung cho testbed mock bên dự án observability
(tách sạch overhead transport); bản này cho số "trên app thật" để đối chiếu.

## Hai endpoint dùng chung một nguồn token

`/rag/chat/stream` (SSE) và `/rag/chat/ws` (WebSocket) cùng gọi
`_stream_chat_event_tuples()` trong `app/api/chat_routes.py`, chỉ khác lớp đóng
gói:

| | SSE | WebSocket |
|---|---|---|
| Khung mỗi event | `event: <name>\ndata: <json>\n\n` | frame text `{"event": <name>, "data": <dict>}` |
| Token thật | event `chat.delta` | event `chat.delta` |
| Chạy generator blocking | threadpool (StreamingResponse `def`) | `iterate_in_threadpool` (không chẹn event loop) |

Nhờ dùng chung generator, chênh lệch đo được là của **transport**, không lẫn
khác biệt pipeline RAG.

## Chạy

### Cách khuyến nghị — mock source (KHÔNG tốn quota Gemma)

`STREAM_SOURCE=mock` cho SSE/WS phát token local (nhịp cố định), bỏ qua
retrieval + Gemma. Cả hai transport nhận input giống hệt → tách sạch transport,
không lo hết quota / lỗi 500 / latency Gemma (7-40s) giữa chừng.

```bash
# 1. Bật server ở chế độ mock (terminal riêng)
STREAM_SOURCE=mock STREAM_MOCK_TOKENS=60 STREAM_MOCK_DELAY_MS=20 \
    uvicorn app.main:app --port 8000

# 2. Đo cả 2 transport, mạng bình thường
python benchmarks/stream_bench.py --transport both --runs 30 --warmup 5 \
    --mode real --out benchmarks/results-rag-stream.csv

# stress (nhịp 0): STREAM_MOCK_DELAY_MS=0 STREAM_MOCK_TOKENS=1000 khi bật server
```

### Full-local AI — token thật từ LLM local (Ollama), KHÔNG tốn quota

`STREAM_SOURCE=ollama` cho token THẬT từ model local (`OLLAMA_MODEL`, mặc định
`llama3.2:3b`) — độ dài/nhịp do model quyết định, sát thực tế hơn mock, mà vẫn
local + zero quota. Bỏ qua retrieval cloud (Qdrant/Gemini) để luồng hoàn toàn
local.

```bash
# 1. Ollama phải chạy + đã pull model
ollama serve   # nếu chưa chạy
ollama pull llama3.2:3b

# 2. Bật server ở chế độ ollama
STREAM_SOURCE=ollama OLLAMA_MODEL=llama3.2:3b uvicorn app.main:app --port 8000

# 3. Đo (như trên, dùng stream_bench.py / concurrency_bench.py)
python benchmarks/stream_bench.py --transport both --runs 20 \
    --out benchmarks/results-rag-ollama.csv
```

**mock vs ollama — chọn cái nào:**
- **mock**: nhịp cố định, tách SẠCH transport, LLM không bao giờ là nút thắt →
  tốt nhất cho **concurrency** (đo đúng khả năng chịu tải của serving layer).
- **ollama**: token THẬT (độ dài/nhịp biến thiên), local, zero quota → tốt cho
  **latency 1 stream / concurrency thấp** với dữ liệu thật. Ở concurrency cao,
  model local trên 1 máy tự thành nút thắt (generate song song hạn chế) → che
  khác biệt transport, nên concurrency cao vẫn nên dùng mock.

### Groq — token thật, NHANH, free tier, key RIÊNG (không đụng .env gốc/Docker)

`STREAM_SOURCE=groq` cho token thật qua Groq (chip LPU) — free tier 30 RPM,
nhanh hơn hẳn Ollama-local (đo thật: TTFT ~374ms, ~64 token/s cho câu hỏi lịch
sử tiếng Việt, so với Ollama ~650ms+ chỉ để bắt đầu).

Key đọc từ `benchmarks/.env.groq.local` (đã gitignore, KHÔNG phải `.env` gốc
repo, KHÔNG qua `app.config.Settings`, KHÔNG được Docker Compose forward —
tách biệt hoàn toàn để team dùng Docker không cần biết/quan tâm key này).

```bash
# 1. Tạo file key (1 lần) — copy từ template rồi điền GROQ_API_KEY
cp benchmarks/.env.groq.local.example benchmarks/.env.groq.local
# ... mở file, dán key free từ https://console.groq.com ...

# 2. Bật server
STREAM_SOURCE=groq uvicorn app.main:app --port 8000

# 3. Đo — CHỈ ở concurrency thấp (≤20-30, đúng RPM cap free tier)
python benchmarks/stream_bench.py --transport both --runs 20 \
    --out benchmarks/results-rag-groq.csv
python benchmarks/concurrency_bench.py --transport both \
    --levels 1,5,10,20 --timeout 15 \
    --out benchmarks/results-concurrency-groq.csv
```

**Groq vs Ollama vs mock — khi nào dùng gì:**
- **groq**: token thật, latency THẤP nhất trong 2 nguồn thật → tốt nhất để thấy
  rõ overhead transport (không bị latency LLM chậm nuốt mất chênh lệch SSE/WS).
  Giới hạn 30 RPM (org-level, không phải per-key) → không dùng cho concurrency
  >20-30.
- **ollama**: token thật, local, nhưng tự nghẽn ở compute (~1,3-1,5 req/s dù
  concurrency bao nhiêu, đã đo thực nghiệm) → chỉ hợp concurrency ≤8-10.
- **mock**: không phải token thật, nhưng KHÔNG giới hạn concurrency (raise
  `anyio` thread limiter nếu cần) → dùng cho concurrency cao (100-200).

### Cách end-to-end Gemma thật (tốn quota, chỉ chạy ít run)

```bash
# 1. Bật server (terminal riêng)
uvicorn app.main:app --port 8000

# 2. Đo cả 2 transport, mạng bình thường
python benchmarks/stream_bench.py --transport both --runs 30 --warmup 5 \
    --mode real --out benchmarks/results-rag-stream.csv

# 3. Đo lại với mạng yếu giả lập (client-side)
python benchmarks/stream_bench.py --transport both --runs 30 --warmup 5 \
    --mode real --net-delay 30 --jitter 20 --loss 0.01 \
    --out benchmarks/results-rag-stream-weak.csv

# 4. Bảng kết quả
python benchmarks/stream_metrics.py benchmarks/results-rag-stream.csv
# so healthy vs weak (content loss):
python benchmarks/stream_metrics.py \
    benchmarks/results-rag-stream.csv benchmarks/results-rag-stream-weak.csv
```

Chỉ đo `chat.delta` (nội dung câu trả lời) là token. Metric: TTFT, inter-token
latency (ITL), tokens/s, connection-setup, bytes/token, số token client nhận.

## Concurrency — SSE vs WS lúc "đông" (nhiều kết nối đồng thời)

`stream_bench.py` đo latency 1 stream (tuần tự). `concurrency_bench.py` đo lúc
ĐÔNG: mở N kết nối stream cùng lúc ở mỗi mức, xem hệ thống còn trụ không.

```bash
# Server: mock, chỉnh nhịp/độ dài cho MỖI STREAM DÀI XẤP XỈ 1 câu Gemma thật
# (~12s) → áp lực "số kết nối mở đồng thời" giống production mà không tốn quota
STREAM_SOURCE=mock STREAM_MOCK_TOKENS=60 STREAM_MOCK_DELAY_MS=200 \
    uvicorn app.main:app --port 8000

python benchmarks/concurrency_bench.py --transport both \
    --levels 1,10,50,100,200 --timeout 30 \
    --out benchmarks/results-concurrency.csv
```

Vì sao mock (không phải Gemma thật) cho concurrency, mà VẪN "giống production":
- Ở 100-200 kết nối đồng thời, Gemma thật = 100-200 call cùng lúc → chết quota
  tức thì + đụng rate-limit Gemma → đo GIỚI HẠN CỦA GEMMA, không phải của hệ
  thống mình. Sai mục tiêu.
- Mock vẫn chạy đúng bộ khung serving thật (FastAPI/uvicorn/threadpool/SSE-WS)
  — đúng cái mà câu hỏi "đông thì còn trụ không" muốn đo.
- Áp lực server = (số kết nối mở đồng thời) × (thời gian mỗi kết nối mở). Chỉnh
  `TOKENS × DELAY_MS` cho mock stream dài ≈ Gemma stream (~10-30s) → áp lực khớp
  production. Ví dụ 60 token × 200ms ≈ 12s/stream.

Metric mỗi mức: success rate, TTFT/ITL p50-p95, aggregate throughput, timeout,
lỗi. Kỳ vọng: suy giảm DẦN (TTFT vọt, rồi timeout) chứ không sập đột ngột —
ngưỡng threadpool (~40 thread mặc định) là chỗ hai transport bắt đầu "diễn
riêng".

## Lưu ý trung thực (đọc trước khi trích số vào paper)

1. **SSE và WebSocket đều chạy trên TCP** — tin cậy, đúng thứ tự. Với **độ
   trễ/jitter thuần (không loss)**, KHÔNG bên nào mất token; token chỉ về chậm
   hơn / dồn cục hơn (TTFT tăng, ITL giật). "Mất nội dung" chỉ xảy ra khi có
   drop ở tầng ứng dụng/proxy, không phải mất gói TCP (TCP retransmit).

2. **`--net-delay/--jitter/--loss` là emulation tầng CLIENT** (sleep + random
   drop khi nhận token), KHÔNG phải netem/`tc`/toxiproxy tầng mạng. Cả hai
   transport chịu cùng xử lý nên so sánh **tương đối** vẫn công bằng, nhưng con
   số **tuyệt đối** dưới "mạng yếu" phải ghi rõ là emulation. Muốn chuẩn hơn:
   chạy server + client qua toxiproxy hoặc `tc qdisc netem` và bỏ 3 cờ này.

3. **bytes/token** đo độ dài UTF-8 của phần `data` mỗi event (proxy on-wire),
   không tính framing chunked-transfer-encoding (SSE) hay frame header (WS) của
   transport bên dưới. WS gói cả `{"event":...,"data":...}` nên tự nhiên nặng
   hơn phần `data:` trần của SSE — khác biệt này là thật và có chủ đích so.

4. **Đo phía client** (đúng cái user cảm nhận), không phải phía server.

## Cột CSV

`run_id,transport,mode,token_index,recv_ms,conn_setup_ms,bytes` — khớp harness
testbed mock (Viettel) nên hai bộ dữ liệu phân tích chung được.
