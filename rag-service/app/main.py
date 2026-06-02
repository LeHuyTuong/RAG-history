"""
Entry point của RAG service. Spring Boot là caller duy nhất — frontend không gọi trực tiếp.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat_routes import router as chat_router
from app.api.ingest_routes import router as ingest_router

app = FastAPI(title="RAG History Service", version="1.0.0")

# allow_origins=["*"] ổn vì service này chỉ expose nội bộ (không public ra internet)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/rag")
app.include_router(ingest_router, prefix="/rag")
