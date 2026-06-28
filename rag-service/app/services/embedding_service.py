"""
Bước 3/4 trong ingestion pipeline: tạo vector embedding cho text.

Vai trò: wrap Google Gemini Embedding API, cung cấp 2 hàm public:
  embed_documents() — dùng lúc ingest (task_type=RETRIEVAL_DOCUMENT)
  embed_query()     — dùng lúc search/chat (task_type=RETRIEVAL_QUERY)

Key rotation: khi một key hết quota ngày (RPD 429) tự động chuyển sang
key tiếp theo trong pool (LLM_API_KEY, LLM_API_KEY_2 ... LLM_API_KEY_5).

Batch size 100: giới hạn của Gemini Embedding API per request.
"""
import time

from google import genai
from google.genai import types

from app.config import settings

_BATCH_SIZE = 100

# Pool của clients — khởi tạo lazy khi lần đầu dùng
_clients: list[genai.Client] | None = None
_key_index = 0


def _build_clients() -> list[genai.Client]:
    keys = [
        settings.google_api_key,
        settings.google_api_key_2,
        settings.google_api_key_3,
        settings.google_api_key_4,
        settings.google_api_key_5,
    ]
    return [genai.Client(api_key=k) for k in keys if k]


def _get_clients() -> list[genai.Client]:
    global _clients
    if _clients is None:
        _clients = _build_clients()
    return _clients


def _is_daily_quota_error(exc: Exception) -> bool:
    msg = str(exc)
    return "RESOURCE_EXHAUSTED" in msg and (
        "PerDay" in msg or "free_tier_requests" in msg
    )


def _parse_retry_delay(exc: Exception) -> float:
    import re
    m = re.search(r"retry in (\d+(?:\.\d+)?)s", str(exc))
    return float(m.group(1)) + 2 if m else 30.0


def embed_documents(texts: list[str]) -> list[list[float]]:
    return _embed(texts, "RETRIEVAL_DOCUMENT")


def embed_query(text: str) -> list[float]:
    return _embed([text], "RETRIEVAL_QUERY")[0]


def _embed(texts: list[str], task_type: str) -> list[list[float]]:
    global _key_index
    clients = _get_clients()
    results: list[list[float]] = []

    for i in range(0, len(texts), _BATCH_SIZE):
        batch = texts[i: i + _BATCH_SIZE]
        while True:
            if _key_index >= len(clients):
                raise RuntimeError("Tất cả API key đã hết quota ngày. Chờ reset lúc 00:00 UTC (07:00 VN).")
            client = clients[_key_index]
            try:
                response = client.models.embed_content(
                    model=settings.embedding_model,
                    contents=batch,
                    config=types.EmbedContentConfig(
                        task_type=task_type,
                        output_dimensionality=settings.embedding_dim,
                    ),
                )
                results.extend(e.values for e in response.embeddings)
                break
            except Exception as exc:  # noqa: BLE001
                if _is_daily_quota_error(exc):
                    _key_index += 1
                    if _key_index < len(clients):
                        continue
                    raise RuntimeError(
                        "Tất cả API key đã hết quota ngày. Chờ reset lúc 00:00 UTC (07:00 VN)."
                    ) from exc
                # RPM / TPM limit — chờ rồi retry với cùng key
                wait = _parse_retry_delay(exc)
                time.sleep(wait)

    return results
