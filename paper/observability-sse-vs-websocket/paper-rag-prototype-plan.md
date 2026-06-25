# Prototype tối thiểu — Đo SSE vs WebSocket token streaming (lấy số thật cho paper)

> Mục tiêu: cùng **một mock workload** chạy qua **SSE** và **WebSocket** → đo **6 metric core** → ra **bảng so sánh 2 cột**.
> Nguyên tắc: tái dùng tối đa lib đã có. Chỉ thêm 3 mảnh mới: **MockAi**, **SSE wrapper**, **client harness đo**.
> Beginner-friendly: code mẫu là pseudocode/Java rút gọn — chỉnh chữ ký theo code thật của bạn.

---

## 0. Ý tưởng cốt lõi (đọc kỹ trước khi code)

Bình thường so SSE vs WS cho LLM thì **model là bottleneck**, chênh lệch transport bị che mất. Mẹo: dùng **mock phát token có lịch cố định** (ví dụ 50 token, mỗi token cách nhau đúng 20ms). Khi đó:

- Hai transport nhận **cùng một input** → mọi khác biệt đo được = **overhead của chính transport**, không phải model.
- Đây là thiết kế thí nghiệm sạch, viết được vào paper (§Methodology): *"controlled mock generator isolates transport overhead from model latency."*

Và: **đo ở phía client** (giống cách NVIDIA/Anyscale benchmark), vì TTFT/ITL là cái user cảm nhận.

---

## 1. Các mảnh cần build (chỉ 3 mảnh mới)

| Mảnh | Mới hay tái dùng | Việc |
|---|---|---|
| `MockAiTokenSource` | mới (dễ) | phát N token, mỗi token nghỉ `delayMs` |
| `MockAiSseController` | mới (dễ) | endpoint `/ai/sse` dùng `SseEmitter` |
| `MockAiWsHandler` | mới, dựa handler WS đã có | endpoint `/ws/ai` phát token qua message |
| `TracingSseEmitter` | mới (phần KHÓ duy nhất) | bọc `SseEmitter` để ghi span-event mỗi `send()` |
| `Span.events` + `SpanEvent` | **đã có** (W4) | dùng lại để ghi từng token |
| `InMemoryMetricsCollector` | **đã có** | thêm vài counter token-level |
| `StreamMetricsClient` (harness) | mới (vừa) | client gọi cả 2 endpoint, ghi mốc thời gian mỗi token |
| script tính p50/p95/p99 | mới (dễ, Python) | đọc CSV → tính percentile → bảng |

---

## 2. Build order — xếp lớp, mỗi lớp xanh mới lên lớp trên

```
Lớp 1  Mock phát token (chưa đo gì) ──► /ai/sse và /ws/ai chạy, client nhận đủ 50 token
   │
Lớp 2  Client harness ghi timestamp ──► xuất CSV: token_index, recv_time_ms cho mỗi request
   │
Lớp 3  Tính metric từ CSV ───────────► TTFT, ITL, tokens/s, p50/p95/p99 (client-side, không cần sửa lib)
   │
Lớp 4  (tùy) Gắn tracing server-side ─► TracingSseEmitter ghi span-event; so khớp với WS đã có
```

> **Quan trọng:** Lớp 1–3 đã đủ ra **số cho paper**. Lớp 4 (zero-touch SSE wrapper) là phần đẹp để bàn trong paper nhưng **không bắt buộc để có số**. Nếu kẹt thời gian, cắt Lớp 4.

---

## 3. Code mẫu rút gọn

### Lớp 1 — Mock token source (dùng chung)

```java
public class MockAiTokenSource {
    // Phát token có lịch cố định để 2 transport công bằng
    public static void stream(int nTokens, long delayMs, Consumer<String> emit) {
        for (int i = 0; i < nTokens; i++) {
            emit.accept("tok" + i + " ");      // 1 "token" = 1 chunk text
            try { Thread.sleep(delayMs); } catch (InterruptedException e) { break; }
        }
    }
}
```

### Lớp 1 — SSE endpoint (Spring MVC)

```java
@RestController
public class MockAiSseController {
    @GetMapping("/ai/sse")
    public SseEmitter sse(@RequestParam(defaultValue="50") int n,
                          @RequestParam(defaultValue="20") long delay) {
        SseEmitter emitter = new SseEmitter(60_000L);
        Executors.newSingleThreadExecutor().submit(() -> {
            MockAiTokenSource.stream(n, delay, token -> {
                try { emitter.send(token); } catch (IOException e) { emitter.completeWithError(e); }
            });
            emitter.complete();
        });
        return emitter;
    }
}
```

### Lớp 1 — WS endpoint (dựa handler đã có)

```java
// Trong WebSocketHandler: khi client connect, phát token y hệt mock
@Override
public void afterConnectionEstablished(WebSocketSession session) {
    MockAiTokenSource.stream(50, 20, token -> {
        try { session.sendMessage(new TextMessage(token)); } catch (IOException ignored) {}
    });
}
```

### Lớp 2 — Client harness (đo phía client — phần lấy SỐ)

```java
// SSE client: đọc từng dòng, ghi thời điểm nhận
long t0 = System.nanoTime();
HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofLines())
    .body().forEach(line -> {
        if (line.startsWith("data:")) record(idx++, (System.nanoTime()-t0)/1e6); // ms
    });
// WS client (StandardWebSocketClient): trong handleTextMessage → record(idx++, elapsedMs)
// Ghi ra CSV: run_id, transport, token_index, recv_ms
```

### Lớp 3 — Tính metric (Python, ngoài lib)

```python
# đọc csv, group theo (transport, run_id)
ttft   = recv_ms[0]                                  # token đầu
itl    = (recv_ms[-1] - recv_ms[0]) / (len(recv_ms)-1)  # loại token đầu
tps    = len(recv_ms) / (recv_ms[-1] / 1000)         # tokens/s
# gom nhiều run → numpy.percentile([...], [50,95,99]) cho p50/p95/p99
```

---

## 4. Map 6 metric core → đo ở đâu

| Metric | Lấy từ | Ghi chú |
|---|---|---|
| Connection setup time | client: `t_connected − t_request` | WS = handshake; SSE = HTTP connect |
| Latency p50/p95/p99 | client: percentile của ITL hoặc e2e qua nhiều run | dùng numpy/HDR; **đừng sort tay trong lib** |
| **TTFT** | client: `recv_ms[0]` | mock cố định → so transport công bằng |
| **Inter-token latency** | client: `(recv_ms[-1]−recv_ms[0])/(N−1)` | **loại token đầu** — ghi rõ định nghĩa |
| **Output tokens/s** | client: `N / total_seconds` | |
| Active connections | server: `InMemoryMetricsCollector` gauge | đã có cho WS; SSE thêm khi mở/đóng emitter |

---

## 5. Lớp 4 (tùy chọn) — TracingSseEmitter (phần KHÓ, zero-touch)

SSE không có hook toàn cục → bọc emitter:

```java
public class TracingSseEmitter extends SseEmitter {
    private final Span.Builder span;   // 1 stream span, giống session span của WS
    @Override public void send(Object o) throws IOException {
        span.addEvent("token_sent", Map.of("bytes", size(o)));  // dùng SpanEvent đã có
        super.send(o);
    }
    // complete() → build span + metricsCollector.recordSpan(span) + storage.store(span)
}
```

→ Điểm paper: SSE phải **tự bọc emitter** (kém zero-touch hơn WS dùng `HandlerDecorator`). Đây là **finding cho RQ3/RQ4**, không phải thất bại.

---

## 6. Thí nghiệm để ra bảng (Methodology của paper)

1. Warm-up 5 request bỏ đi (tránh JIT/cold start làm méo).
2. Chạy **30 run** mỗi transport, cùng `n=50, delay=20ms`, localhost.
3. Xuất CSV → script tính → bảng:

| Metric | SSE | WebSocket |
|---|---|---|
| Connection setup (ms) | … | … |
| TTFT p50 / p95 (ms) | … | … |
| Inter-token latency (ms/token) | … | … |
| Output throughput (tokens/s) | … | … |

4. Lặp với `delay=0` (stress) và `delay=50ms` (giống LLM thật) → 2–3 kịch bản là đủ.

---

## 7. Cắt scope (ghi rõ vào paper — đừng ôm)

- ❌ Không LLM thật, không GPU, không đo tải nghìn connection.
- ❌ Không binary/multiplex, không reconnect storm.
- ❌ Không cross-machine network (localhost là đủ để so transport overhead).
- ✅ Chỉ: mock cố định + 6 metric + 2–3 kịch bản delay + bảng so sánh.

---

## 8. Đánh giá độ khó (thật)

| Lớp | Khó | Thời gian ước tính (beginner) |
|---|---|---|
| 1 Mock + 2 endpoint | Dễ | 0.5 buổi |
| 2 Client harness | Trung bình (WS client hơi lạ) | 1 buổi |
| 3 Script tính | Dễ | 0.5 buổi |
| 4 TracingSseEmitter | Khó nhất (zero-touch) | 1 buổi — **cắt được nếu kẹt** |

→ Có số cho paper chỉ cần **Lớp 1–3 ≈ 2 buổi**. Lớp 4 làm cho phần "library design" đẹp hơn.
