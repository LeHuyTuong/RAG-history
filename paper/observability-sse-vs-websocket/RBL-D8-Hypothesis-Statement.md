# D8 — Hypothesis Statement

**Đề tài:** Protocol-Aware Observability for AI Chat Streaming (SSE vs. WebSocket)
**Ánh xạ IEEE:** III. Research Methodology
**Tham chiếu biến:** xem D7 — Variable Definition Sheet

Ba giả thuyết gốc (H1/H2/H3, `main.tex` §Hypotheses) được viết lại thành 3 cặp
H0/Ha chuẩn kiểm định thống kê. Cả 3 đều đã được kiểm định thực nghiệm bằng
Mann–Whitney U hai phía, α = 0.05, trên dữ liệu per-run thật (`main.tex`
Table `tab:sigtest`) — không phải giả thuyết còn bỏ ngỏ.

---

## Cặp giả thuyết 1 — Overhead có chấp nhận được không? (từ H1)

**H0₁:** Không có sự khác biệt có ý nghĩa thống kê giữa điều kiện có tracing
(`lib`) và không có tracing (`baseline`) trên TTFT/ITL/Throughput, ở tốc độ
sinh token thực tế (Δ=20ms, Δ=50ms, mạng khỏe).

**Ha₁:** Điều kiện `lib` có overhead lớn hơn có ý nghĩa thống kê so với
`baseline` ở tốc độ sinh token thực tế.

- **Kiểm định:** Mann–Whitney U hai phía trên toàn bộ giá trị per-run, α=0.05
- **Ngưỡng thực tiễn:** overhead ≤10% được coi là "chấp nhận được" dù có ý
  nghĩa thống kê (do cỡ mẫu lớn n=80 đủ sức phát hiện cả khác biệt <1%)
- **Kết quả:** Phần lớn không bác bỏ H0₁ ở mạng khỏe (vd Δ=20ms: SSE ITL
  overhead −0.1%, p=0.505; Δ=50ms: SSE ITL +0.1%, p=0.328); một số bác bỏ H0₁
  nhưng độ lớn <2% (vd WS ITL Δ=50ms healthy: −6.1%, p<0.001) → có ý nghĩa
  thống kê nhưng dưới ngưỡng thực tiễn → **H1 được ủng hộ** theo tiêu chí độ
  lớn, không chỉ theo p-value đơn thuần

## Cặp giả thuyết 2 — Thiết kế span có ảnh hưởng dưới tải cao không? (từ H2)

**H0₂:** Không có sự khác biệt có ý nghĩa thống kê về overhead ITL giữa thiết
kế per-message-span (WebSocket) và per-stream-span-with-events (SSE) dưới
điều kiện tải cực đại (Δ=0ms, N=1000 token/run).

**Ha₂:** Thiết kế per-message-span (WebSocket) có overhead ITL lớn hơn có ý
nghĩa thống kê so với per-stream-span-with-events (SSE) dưới tải cực đại.

- **Kiểm định:** Mann–Whitney U hai phía trên overhead ITL của từng transport, α=0.05
- **Ngưỡng thực tiễn:** overhead >10% coi là khác biệt có ý nghĩa thực tiễn
- **Kết quả:** Bác bỏ H0₂ rõ ràng — SSE overhead +23.7% (p<0.001), WebSocket
  overhead +45.7% (p<0.001), cả hai đều có ý nghĩa thống kê **và** vượt xa
  ngưỡng thực tiễn 10% → **H2 được ủng hộ mạnh**, đây là kết quả có effect
  size lớn nhất trong 3 giả thuyết

## Cặp giả thuyết 3 — SSE và WebSocket có tương đương ở baseline không? (từ H3)

**H0₃:** Không có sự khác biệt có ý nghĩa thống kê giữa SSE và WebSocket
(baseline, không tracing) trên ITL/Throughput, ở tốc độ sinh token thực tế
và mạng khỏe.

**Ha₃:** SSE và WebSocket khác biệt có ý nghĩa thống kê trên ITL/Throughput ở
điều kiện trên.

- **Kiểm định:** Mann–Whitney U hai phía so sánh 2 nhóm độc lập (SSE vs WS),
  α=0.05, trên ITL và Throughput
- **Kết quả:**
  - Mạng khỏe, tốc độ thực tế (Δ=20/50ms): **không bác bỏ H0₃** (Δ=20ms:
    ITL p=0.154, Throughput p=0.344; Δ=50ms: ITL p=0.904, Throughput
    p=0.605) → SSE và WebSocket thực sự tương đương ở baseline
  - Ollama cross-check (model thật): **không bác bỏ H0₃** ở cả 2 điều kiện
    mạng (ITL p=0.086–0.648) → tái khẳng định với LLM thật
  - Mạng yếu và kịch bản stress (Δ=0ms): **bác bỏ H0₃** (p<0.001) nhưng
    khác biệt tuyệt đối nhỏ, bị chi phối bởi độ trễ mạng đã inject hoặc bởi
    chế độ đo tải cực đại — không đảo ngược kết luận ở điều kiện thực tế
  - Groq cross-check (stack hoàn toàn khác): bác bỏ H0₃ với p nhỏ (0.021,
    0.002) nhưng độ lớn ITL chênh lệch <20% tuyệt đối theo ms, cùng chiều
    kết luận tổng thể
  → **H3 được ủng hộ có điều kiện**: đúng ở tốc độ decode thực tế/mạng khỏe
  (phạm vi mà giả thuyết thực sự nhắm tới), không đúng vô điều kiện ở mọi
  chế độ đo — điều này được nêu rõ trong `main.tex` §Experimental Validation,
  không phải điểm yếu bị giấu

---

## Testability — vì sao 3 cặp giả thuyết trên kiểm định được (falsifiable)

Cả 3 đều thỏa 2 điều kiện bắt buộc của 1 giả thuyết khoa học hợp lệ:

1. **Đo được bằng con số cụ thể**: mọi biến phụ thuộc đều có công thức tường
   minh (xem D7), không phụ thuộc đánh giá định tính chủ quan.
2. **Có điều kiện bác bỏ rõ ràng, xác định trước khi đo**: mỗi Ha nêu đúng
   1 chiều so sánh (lib>baseline; WS>SSE dưới stress; SSE≠WS) và 1 kiểm định
   thống kê cụ thể (Mann–Whitney U, α=0.05) — không phải "nhìn số rồi diễn
   giải" sau khi đã biết kết quả.
