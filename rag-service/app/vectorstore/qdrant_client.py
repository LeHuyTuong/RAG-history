"""
Hạ tầng kết nối Qdrant Cloud: singleton client và khởi tạo collection.

Vai trò: quản lý connection và schema của Qdrant — chỉ lo "infrastructure",
không xử lý dữ liệu. Toàn bộ thao tác dữ liệu nằm ở vector_repository.py.

2 việc file này làm:
  1. get_client()        — trả về singleton QdrantClient (tránh mở nhiều connection)
  2. ensure_collection() — tạo collection + payload index nếu chưa có (idempotent)

Tại sao cần payload index: Qdrant Cloud yêu cầu tạo index trước cho các
field dùng làm filter (sourceId, tagIds), không có index thì filter chậm
vì phải scan toàn bộ collection.
"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PayloadSchemaType, VectorParams

from app.config import settings

_client: QdrantClient | None = None

# Các field payload cần filter lúc search — phải tạo payload index thì Qdrant
# Cloud mới cho filter hiệu quả. tagIds là list[int] nhưng index INTEGER vẫn
# áp dụng được (Qdrant tự hiểu match trên từng phần tử).
_INDEXED_FIELDS: dict[str, PayloadSchemaType] = {
    "sourceId": PayloadSchemaType.INTEGER,
    "tagIds": PayloadSchemaType.INTEGER,
}


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
    return _client


def ensure_collection(collection: str) -> None:
    """
    Tạo collection nếu chưa có. Idempotent — gọi mỗi lần ingest đều an toàn.
    Vector size lấy từ settings.embedding_dim: đổi embedding model thì phải
    tạo lại collection (xem ghi chú trong config.py).
    """
    client = get_client()
    if client.collection_exists(collection):
        return
    client.create_collection(
        collection_name=collection,
        vectors_config=VectorParams(size=settings.embedding_dim, distance=Distance.COSINE),
    )
    for field, schema in _INDEXED_FIELDS.items():
        client.create_payload_index(
            collection_name=collection,
            field_name=field,
            field_schema=schema,
        )
