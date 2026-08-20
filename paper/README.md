# Protocol-Aware Observability for AI Chat Streaming

**Tracing and Metrics for SSE and WebSocket**

Course research project (RBL / SLR + experimental validation), team of 5 — Jun 2026.
Lê Huy Tường — first author; led the study and built the Java/Spring Boot prototype.

📄 **[Read the paper (PDF)](Group3_Protocol%20Aware%20Observability%20for%20AI%20Chat%20Streaming.pdf)** ·
LaTeX source: [`observability-sse-vs-websocket/main.tex`](observability-sse-vs-websocket/main.tex)

---

## Abstract

AI chatbot and RAG systems stream responses token-by-token so users see partial output early.
Developers often default to WebSocket, yet for server-to-client text generation, Server-Sent
Events (SSE) is frequently sufficient and simpler. Observability, however, is harder for both:
REST tracing relies on per-request HTTP headers, but once an SSE or WebSocket connection is
established, individual events or messages no longer carry HTTP headers, so request-level
instrumentation cannot see token-level behaviour.

This paper answers a single research question via a PRISMA-guided systematic literature review
plus experimental validation on a Spring Boot prototype. It derives a **five-layer
protocol-aware observability framework** whose core is a **two-tier instrumentation model**: one
span per connection lifetime, plus lightweight per-token *span events* (rather than one span per
message). The model is validated on a prototype driven by a deterministic mock token generator
and by a real, locally hosted LLM, with two independent cross-checks on unrelated stacks.

## Research question

> **RQ:** What gaps exist in message/token-level tracing for long-lived SSE and WebSocket AI
> streaming connections, and can a single, protocol-independent instrumentation model close them
> without incurring prohibitive tracing overhead relative to an uninstrumented baseline?

The review's central finding is that no prior work offers a unified, backend-independent,
agent-free model that closes this tracing gap across both protocols. The framework is derived
from that gap rather than asserted, then tested through three falsifiable hypotheses.

## Main results (H1–H3)

| | Hypothesis | Verdict | Key evidence |
|---|---|---|---|
| **H1** | Unified instrumentation adds negligible overhead at LLM-realistic token rates | **Supported** | ≤ 7% on time-to-first-token at Δ = 20–50 ms/token, and robust to an added weak-network condition |
| **H2** | A per-stream span with span events costs less than a per-message span as token frequency rises | **Supported** | Under transport-bound stress (Δ = 0 ms): inter-token latency overhead **+21% SSE vs. +47% WebSocket** — a genuine cost difference between the two span designs |
| **H3** | SSE and WebSocket show indistinguishable baseline tracing cost when transport is not the bottleneck | **Supported** | Mann–Whitney U: *p* > 0.05 on ITL and throughput at Δ = 20/50 ms, healthy network; parity reproduced on a second, unrelated stack |

**Additional findings beyond H1–H3:**

- **Bandwidth is where the real asymmetry hides.** Measured on-wire rather than assumed: tracing
  adds essentially nothing to SSE (+0.5% bytes/token) but **more than doubles WebSocket's
  per-token bytes (+136%)**, because trace context travels inside every message envelope. This
  cost is invisible to the latency metrics alone.
- **No content-loss advantage for either protocol** under an application-layer weak network
  (30 ms delay, ±20 ms jitter, 1% per-token loss) — both track the configured loss rate within
  measurement noise. A genuine no-difference result, not an untested assumption.
- **Real-LLM cross-checks.** Llama 3.2 3B via local Ollama (40 runs/config) reproduces the
  overhead and bandwidth conclusions. A second, independent check on an unrelated Python/FastAPI
  RAG service with Llama 3.1 8B via Groq (20 runs/config) corroborates H3 on a different stack,
  language runtime, and model — and reproduces, more strongly, a confound the paper reports
  honestly: a real model's natural output-length variance swamps a 1%-magnitude content-loss
  signal at these sample sizes.
- **L3 gauge validated** under 50-way concurrent load for both protocols.

**Where the model is the wrong choice** (§ Tradeoffs): per-message spans, not span events, are
required when an individual message must anchor a distributed trace of its own. The paper also
surfaces — rather than resolves — the fact that neither protocol gives a client any way to detect
a silently dropped token.

## Reproducibility

Every number in the experimental section is derived from archived per-run CSVs (one row per token,
timestamped client-side), not hand-recorded summaries. The mock-source scenarios (Δ = 0/20/50 ms)
need **no external service, model, or API key** — the deterministic generator and both endpoints
run entirely on localhost, so they reproduce on any machine with a JDK at no cost.

Measurement setup: MacBook (Apple M4, 16 GB), macOS 15.6, OpenJDK 21.0.11; client and server
co-located on localhost; a pure-JDK client (`java.net.http.HttpClient` for SSE,
`java.net.http.WebSocket` for WS) measures TTFT and ITL client-side.

## Running the prototype

The prototype is a **separate, standalone Spring Boot service** — it is not part of this
`rag-history` repository. It exposes an SSE endpoint (`/ai/sse`) and a WebSocket endpoint
(`/ws/ai`), instruments REST (Filter/Interceptor), JDBC (DataSource proxy), SSE (an `SseEmitter`
wrapper) and WebSocket (`HandshakeInterceptor` + `WebSocketHandlerDecorator`), and exposes metrics
as JSON with no external collector required.

That source tree, its pure-JDK measurement client, the Python analysis scripts, and the raw CSV
inputs currently live in a **private** repository (`java-observability-starter-lab`) and are
**available from the authors on request**; they will be released alongside publication, as stated
in the paper's artifact-availability section. This repo therefore ships the paper, not runnable
prototype code.

The SSE chat pipeline *in this repository* is a different, applied system (Vietnamese-history RAG)
— see [`../docs/26-chat-sse-openai-style.md`](../docs/26-chat-sse-openai-style.md) and
[`../docs/27-observability-viettel-starter.md`](../docs/27-observability-viettel-starter.md) for how
the same observability ideas are applied there, and the root [`../README.md`](../README.md) for how
to run it.

## Contents of this folder

| Path | What it is |
|---|---|
| `Group3_Protocol Aware Observability for AI Chat Streaming.pdf` | The submitted paper |
| `observability-sse-vs-websocket/main.tex` | LaTeX source (current version) |
| `observability-sse-vs-websocket/main.pdf` | Earlier compiled build |
| `observability-sse-vs-websocket/RBL-D7-Variable-Definition-Sheet.md` | Variable definition sheet (deliverable D7) |
| `observability-sse-vs-websocket/RBL-D8-Hypothesis-Statement.md` | Hypothesis statement (deliverable D8) |
| `observability-sse-vs-websocket/paper-rag-*.md` | Working drafts and outlines |
| `observability-sse-vs-websocket/stream-overhead*.png` | Result figures |
| `slr-deliverables.md`, `references.bib`, `main.tex` | SLR deliverables and shared bibliography |
| `final-audit-and-architecture-report.md` | Architecture audit of the applied RAG system |
| `bao-cao-tien-do-de-tai.docx` | Course progress report (Vietnamese) |

## Keywords

Server-Sent Events · WebSocket · observability · distributed tracing · OpenTelemetry · LLM
streaming · time to first token · PRISMA
