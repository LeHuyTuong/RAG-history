"""
FAQ answer cache: tra cứu câu hỏi trong bộ FAQ dataset, trả đáp án có sẵn nếu khớp.

Luồng:
  1. Exact (norm): chuẩn hóa câu hỏi → dict lookup O(1) → trả ngay (score 100).
  2. Exact (fold): bỏ dấu câu hỏi → dict lookup O(1) → trả ngay (score 100).
  3. Fuzzy (norm): nếu exact trượt → rapidfuzz.extractOne WRatio trên tập normalized.
  4. Fuzzy (fold): nếu vẫn trượt → rapidfuzz.extractOne WRatio trên tập đã bỏ dấu.
     → Người Việt hay gõ không dấu; fold index đảm bảo "vua Quang Trung" khớp "vua Quang Trung"
       (có dấu trong cache) dù query không dấu.
  5. Trượt hết → None (rơi xuống RAG pipeline bình thường).

Dữ liệu được load lazy từ faq_cache.json (do scripts/build_faq_cache.py sinh ra).
Path được resolve theo thư mục package (không phụ thuộc cwd).
Nuốt mọi lỗi (file thiếu, rapidfuzz lỗi) để không làm sập chat.
"""
from __future__ import annotations

import json
import logging
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_PACKAGE_DIR = Path(__file__).resolve().parent.parent.parent  # rag-service/


@dataclass
class FaqHit:
    answer: str
    matched_question: str
    score: float  # 0–100


# --- module-level lazy-load state ---
_cache: dict[str, str] | None = None      # norm_q → answer
_fold_cache: dict[str, str] | None = None  # fold_q → answer (không dấu)
_norm_questions: list[str] | None = None   # for fuzzy matching
_fold_questions: list[str] | None = None   # for fuzzy matching (không dấu)
_raw_questions: list[str] | None = None    # original questions, aligned with _norm_questions
_loaded: bool = False


def _normalize(q: str) -> str:
    """Chuẩn hóa câu hỏi: lower + gộp whitespace (giống normalize_question trong loader)."""
    return re.sub(r"\s+", " ", q.strip().lower())


def _fold_diacritics(text: str) -> str:
    """Bỏ dấu tiếng Việt: NFKD decompose → loại combining chars → còn lại base ASCII.
    Ví dụ: "Kể tên" → "Ke ten", "đã" → "da"."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def _load_cache() -> bool:
    """Nạp faq_cache.json vào RAM (idempotent). Trả True nếu nạp thành công."""
    global _cache, _fold_cache, _norm_questions, _fold_questions, _raw_questions, _loaded
    if _loaded:
        return _cache is not None

    _loaded = True
    try:
        from app.config import settings
    except Exception:
        logger.warning("Cannot import settings, FAQ cache disabled")
        return False

    if not settings.faq_cache_enabled:
        return False

    path = Path(settings.faq_cache_path)
    if not path.is_absolute():
        path = _PACKAGE_DIR / path

    if not path.is_file():
        logger.warning("FAQ cache file not found: %s", path)
        return False

    try:
        with path.open(encoding="utf-8") as f:
            entries = json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to read FAQ cache file %s: %s", path, exc)
        return False

    _cache = {}
    _fold_cache = {}
    _norm_questions = []
    _fold_questions = []
    _raw_questions = []

    for entry in entries:
        q = entry["q"]
        a = entry["a"]
        norm = _normalize(q)
        fold = _normalize(_fold_diacritics(q))
        if norm not in _cache:
            _cache[norm] = a
            _fold_cache[fold] = a
            _norm_questions.append(norm)
            _fold_questions.append(fold)
            _raw_questions.append(q)

    logger.info("FAQ cache loaded: %d entries from %s", len(_cache), path)
    return True


def lookup(question: str) -> Optional[FaqHit]:
    """Tra cứu câu hỏi trong FAQ cache. Trả FaqHit nếu khớp, None nếu trượt."""
    if not _load_cache():
        return None

    threshold = 90.0
    try:
        from app.config import settings
        threshold = settings.faq_cache_threshold
    except Exception:
        pass

    norm = _normalize(question)
    fold = _normalize(_fold_diacritics(question))

    # 1. Exact match (có dấu)
    answer = _cache.get(norm)
    if answer is not None:
        return FaqHit(answer=answer, matched_question=question, score=100.0)

    # 2. Exact match (không dấu) — người Việt hay gõ không dấu
    answer = _fold_cache.get(fold)
    if answer is not None:
        return FaqHit(answer=answer, matched_question=question, score=100.0)

    # --- rapidfuzz required for fuzzy paths ---
    try:
        from rapidfuzz import process, fuzz
    except ImportError:
        logger.warning("rapidfuzz not installed, fuzzy FAQ lookup disabled")
        return None

    # 3. Fuzzy match (có dấu)
    result = process.extractOne(
        norm, _norm_questions,
        scorer=fuzz.WRatio, score_cutoff=threshold,
    )
    if result is not None:
        matched_norm, score, matched_idx = result
        return FaqHit(
            answer=_cache[matched_norm],
            matched_question=_raw_questions[matched_idx],
            score=score,
        )

    # 4. Fuzzy match (không dấu)
    result = process.extractOne(
        fold, _fold_questions,
        scorer=fuzz.WRatio, score_cutoff=threshold,
    )
    if result is not None:
        matched_fold, score, matched_idx = result
        return FaqHit(
            answer=_cache[_norm_questions[matched_idx]],
            matched_question=_raw_questions[matched_idx],
            score=score,
        )

    return None
