"""
Bước 3/4 trong ingestion pipeline: tạo vector embedding cho text.

Vai trò: wrap Google Gemini Embedding API, cung cấp 2 hàm public:
  embed_documents() — dùng lúc ingest (task_type=RETRIEVAL_DOCUMENT)
  embed_query()     — dùng lúc search/chat (task_type=RETRIEVAL_QUERY)

Flow trong ingest:
  chunk_service  →  [ChunkData]  →  embed_documents(texts)  →  [vector, ...]  →  vector_repository

Flow trong chat:
  chat_routes  →  embed_query(question)  →  [vector]  →  vector_repository.search()

Tại sao tách task_type: Gemini phân biệt document vs query để tối ưu
similarity — document embedding tối ưu cho nội dung dài, query embedding
tối ưu cho câu hỏi ngắn. Dùng nhầm sẽ giảm chất lượng retrieval.

Batch size 100: giới hạn của Gemini Embedding API per request.
"""
from google import genai
from google.genai import types

from app.config import settings

_client: genai.Client | None = None
_BATCH_SIZE = 100


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.google_api_key)
    return _client


def embed_documents(texts: list[str]) -> list[list[float]]:
    return _embed(texts, "RETRIEVAL_DOCUMENT")


def embed_query(text: str) -> list[float]:
    return _embed([text], "RETRIEVAL_QUERY")[0]


def _embed(texts: list[str], task_type: str) -> list[list[float]]:
    client = _get_client()
    results: list[list[float]] = []
    for i in range(0, len(texts), _BATCH_SIZE):
        batch = texts[i : i + _BATCH_SIZE]
        response = client.models.embed_content(
            model=settings.embedding_model,
            contents=batch,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=settings.embedding_dim,
            ),
        )
        results.extend(e.values for e in response.embeddings)
    return results
