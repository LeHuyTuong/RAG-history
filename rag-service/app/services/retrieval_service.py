"""
Bước 1/4 trong chat pipeline: embed câu hỏi và search Qdrant.

Vai trò: cầu nối giữa câu hỏi thô của user và các chunk liên quan trong Qdrant.
Nhận question string, trả về list ScoredPoint để prompt_service build context.

Flow trong /rag/chat:
  chat_routes
    → retrieve(question, top_k, source_ids, tag_ids)
      1. embed_query(question)           — biến câu hỏi thành vector 768 chiều (Gemini)
      2. vector_repository.search(...)   — cosine search topK + filter + threshold
         trên collection chính (settings.qdrant_collection = history_chunks)
      3. NẾU wiki_chunks_local có dữ liệu (xem scripts/import_wiki.py): embed
         câu hỏi LẦN 2 bằng model local (e5-large) và search collection đó,
         rồi gộp 2 danh sách bằng Reciprocal Rank Fusion (RRF).
    → [ScoredPoint, ...]  →  prompt_service

Filter source_ids / tag_ids đi thẳng xuống Qdrant — không cần đọc MySQL.
score_threshold lọc chunk quá xa về ngữ nghĩa trước khi đưa vào prompt — CHỈ
áp dụng cho collection Gemini vì threshold này được calib riêng cho thang
điểm của model đó (xem WIKI_LOCAL_* dưới đây để biết lý do wiki-local không
áp threshold này).

WIKI_LOCAL_*: bài Wikipedia ingest qua scripts/import_wiki.py dùng model
fastembed local (intfloat/multilingual-e5-large, 1024-dim) — KHÔNG tương
thích thang vector với Gemini (768-dim, model khác nhau → không gian vector
khác nhau, dù trùng dim thì cosine similarity giữa 2 model vẫn không so
được). Do đó wiki nằm ở collection RIÊNG (WIKI_LOCAL_COLLECTION), và 2 tên
hằng số dưới đây PHẢI khớp với WIKI_COLLECTION/EMBEDDING_MODEL trong
scripts/import_wiki.py.
"""
from qdrant_client.models import ScoredPoint

from app.config import settings
from app.services.embedding_service import embed_query
from app.vectorstore.vector_repository import search

WIKI_LOCAL_COLLECTION = "wiki_chunks_local"
WIKI_LOCAL_EMBEDDING_MODEL = "intfloat/multilingual-e5-large"

_wiki_local_model = None  # fastembed TextEmbedding, load lazy 1 lần


def _embed_query_wiki_local(question: str) -> list[float] | None:
    """Embed câu hỏi bằng model local để search wiki_chunks_local.
    Trả None nếu fastembed chưa cài — coi như nguồn wiki-local không khả
    dụng, KHÔNG được để lỗi ở đây làm sập toàn bộ /rag/chat.
    Prefix 'query: ' bắt buộc với e5 (đối xứng với 'passage: ' lúc ingest)."""
    global _wiki_local_model
    try:
        if _wiki_local_model is None:
            from fastembed import TextEmbedding
            _wiki_local_model = TextEmbedding(model_name=WIKI_LOCAL_EMBEDDING_MODEL)
        vector = next(iter(_wiki_local_model.embed([f"query: {question}"])))
        return vector.tolist()
    except Exception:
        return None


def _rrf_merge(result_lists: list[list[ScoredPoint]], top_k: int, k: int = 60) -> list[ScoredPoint]:
    """Reciprocal Rank Fusion: gộp nhiều danh sách kết quả từ các model/collection
    KHÔNG cùng thang điểm. Xếp theo hạng (rank) trong từng danh sách riêng —
    sum(1/(k+rank)) — nên không cần chuẩn hóa/so trực tiếp giá trị score giữa
    Gemini và e5-large. Giữ nguyên .score gốc của từng point để hiển thị
    citation đúng thang của model đã tạo ra nó."""
    fused_scores: dict[object, float] = {}
    points_by_id: dict[object, ScoredPoint] = {}
    for results in result_lists:
        for rank, point in enumerate(results, start=1):
            fused_scores[point.id] = fused_scores.get(point.id, 0.0) + 1.0 / (k + rank)
            points_by_id[point.id] = point
    ranked_ids = sorted(fused_scores, key=lambda pid: fused_scores[pid], reverse=True)
    return [points_by_id[pid] for pid in ranked_ids[:top_k]]


def retrieve(
    question: str,
    top_k: int,
    source_ids: list[int] | None = None,
    tag_ids: list[int] | None = None,
) -> list[ScoredPoint]:
    query_vector = embed_query(question)
    primary_hits = search(
        collection=settings.qdrant_collection,
        query_vector=query_vector,
        top_k=top_k,
        score_threshold=settings.score_threshold,
        source_ids=source_ids,
        tag_ids=tag_ids,
    )

    wiki_hits: list[ScoredPoint] = []
    wiki_vector = _embed_query_wiki_local(question)
    if wiki_vector is not None:
        try:
            wiki_hits = search(
                collection=WIKI_LOCAL_COLLECTION,
                query_vector=wiki_vector,
                top_k=top_k,
                score_threshold=None,
                source_ids=source_ids,
                tag_ids=tag_ids,
            )
        except Exception:
            wiki_hits = []  # collection có thể chưa tồn tại (chưa ingest wiki lần nào)

    if not wiki_hits:
        return primary_hits
    return _rrf_merge([primary_hits, wiki_hits], top_k)
