"""
Entry point của RAG service (FastAPI).

Vai trò: khởi động app, gắn CORS middleware, đăng ký 2 router chính.
Caller duy nhất là Spring Boot — frontend không gọi trực tiếp service này.

Flow tổng quát:
  Spring Boot  →  /rag/ingest  →  ingest_routes  →  ingest_service (extract→chunk→embed→upsert)
  Spring Boot  →  /rag/chat    →  chat_routes    →  retrieval_service + llm_service
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat_routes import router as chat_router
from app.api.genealogy_routes import router as genealogy_router
from app.api.ingest_routes import router as ingest_router
from app.api.log_routes import router as log_router
from app.api.retrieve_routes import router as retrieve_router
from app.api.suggest_routes import router as suggest_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Preload FAQ cache lúc startup để request đầu không chịu latency nạp JSON."""
    try:
        from app.services.faq_cache_service import _load_cache
        _load_cache()
    except Exception:
        pass
    yield
    from app.services import query_log_service
    query_log_service.close()


app = FastAPI(title="RAG History Service", version="1.0.0", lifespan=lifespan)

# allow_origins=["*"] ổn vì service này chỉ expose nội bộ (không public ra internet)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/rag")
app.include_router(genealogy_router, prefix="/rag")
app.include_router(ingest_router, prefix="/rag")
app.include_router(log_router, prefix="/rag")
app.include_router(retrieve_router, prefix="/rag")
app.include_router(suggest_router, prefix="/rag")
