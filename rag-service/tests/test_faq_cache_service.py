"""
Tests for faq_cache_service: exact/fold/fuzzy/miss, cache disabled, boundary.

Strategy:
  - Reset module-level cache state before each test.
  - Load controlled test data (small set) instead of real faq_cache.json.
  - Verify each lookup path: exact → fold → fuzzy → None.
  - Also verify _normalize / _fold_diacritics helpers.
"""
from __future__ import annotations

from typing import Iterator

import pytest

from app.services import faq_cache_service

# ── test data ──────────────────────────────────────────────────────────────────

TEST_ENTRIES = [
    {"q": "Nhà Trần thành lập năm nào?",           "a": "Năm 1225."},
    {"q": "Chiến thắng Bạch Đằng năm 938 do ai?",   "a": "Ngô Quyền."},
    {"q": "Vua Quang Trung đại phá quân Thanh năm?", "a": "Năm 1789."},
    {"q": "Lê Lợi lên ngôi ở đâu?",                 "a": "Lam Sơn, Thanh Hóa."},
    {"q": "Hồ Chí Minh sinh ngày tháng năm nào?",   "a": "Ngày 19/05/1890."},
]

# Các biến thể dùng trong test exact/fold
EXACT_QUESTION    = "Nhà Trần thành lập năm nào?"
FOLD_QUESTION     = "nha tran thanh lap nam nao?"
EXTRA_SPACE_Q     = "  Nhà Trần  thành lập   năm nào?  "
FUZZY_QUESTION    = "Nha Tran thanh lap nam nao?"         # không dấu → fold match
MISS_QUESTION     = "Trời hôm nay đẹp quá?"
FUZZY_MISS_QUESTION = "Nhà TrẦn thànn lập năm mô?"       # 1 sai → fuzzy match


# ── helpers ────────────────────────────────────────────────────────────────────

def _reset_cache() -> None:
    """Reset module-level cache state."""
    faq_cache_service._cache = None
    faq_cache_service._fold_cache = None
    faq_cache_service._norm_questions = None
    faq_cache_service._fold_questions = None
    faq_cache_service._raw_questions = None
    faq_cache_service._loaded = False


def _seed_cache(entries: list[dict] | None = None) -> None:
    """Load TEST_ENTRIES into module-level cache (bypasses _load_cache / file I/O)."""
    _reset_cache()
    faq_cache_service._cache = {}
    faq_cache_service._fold_cache = {}
    faq_cache_service._norm_questions = []
    faq_cache_service._fold_questions = []
    faq_cache_service._raw_questions = []

    for entry in entries or TEST_ENTRIES:
        q = entry["q"]
        a = entry["a"]
        norm = faq_cache_service._normalize(q)
        fold = faq_cache_service._normalize(faq_cache_service._fold_diacritics(q))
        if norm not in faq_cache_service._cache:
            faq_cache_service._cache[norm] = a
            faq_cache_service._fold_cache[fold] = a
            faq_cache_service._norm_questions.append(norm)
            faq_cache_service._fold_questions.append(fold)
            faq_cache_service._raw_questions.append(q)

    faq_cache_service._loaded = True


# ── fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def _reset_cache_before_each() -> Iterator[None]:
    _seed_cache()
    yield
    _reset_cache()


# ═══════════════════════════════════════════════════════════════════════════════
# _normalize / _fold_diacritics
# ═══════════════════════════════════════════════════════════════════════════════

class TestHelpers:
    def test_normalize_strips_and_lowercases(self):
        assert faq_cache_service._normalize("  NHÀ TRẦN  ") == "nhà trần"

    def test_normalize_collapses_whitespace(self):
        assert faq_cache_service._normalize("Nhà   Trần  thành  lập") == "nhà trần thành lập"

    def test_normalize_handles_empty(self):
        assert faq_cache_service._normalize("") == ""
        assert faq_cache_service._normalize("   ") == ""

    def test_fold_diacritics_removes_vietnamese_marks(self):
        assert faq_cache_service._fold_diacritics("Nhà Trần") == "Nha Tran"
        assert faq_cache_service._fold_diacritics("đã") == "đa"
        assert faq_cache_service._fold_diacritics("Việt Nam") == "Viet Nam"

    def test_fold_diacritics_keeps_ascii_unchanged(self):
        assert faq_cache_service._fold_diacritics("Hello World") == "Hello World"
        assert faq_cache_service._fold_diacritics("abc123") == "abc123"


# ═══════════════════════════════════════════════════════════════════════════════
# _load_cache
# ═══════════════════════════════════════════════════════════════════════════════

class TestLoadCache:
    def test_load_cache_false_when_disabled(self, monkeypatch):
        _reset_cache()
        monkeypatch.setattr("app.config.settings.faq_cache_enabled", False)
        assert faq_cache_service._load_cache() is False

    def test_load_cache_false_when_file_missing(self, monkeypatch):
        _reset_cache()
        monkeypatch.setattr("app.config.settings.faq_cache_path", "/nonexistent/faq_cache.json")
        assert faq_cache_service._load_cache() is False

    def test_load_cache_false_on_json_error(self, monkeypatch, tmp_path):
        _reset_cache()
        bad_file = tmp_path / "bad.json"
        bad_file.write_text("not json", encoding="utf-8")
        monkeypatch.setattr("app.config.settings.faq_cache_path", str(bad_file))
        assert faq_cache_service._load_cache() is False

    def test_load_cache_succeeds(self, monkeypatch, tmp_path):
        _reset_cache()
        good_file = tmp_path / "good.json"
        good_file.write_text('[{"q": "Test?", "a": "OK."}]', encoding="utf-8")
        monkeypatch.setattr("app.config.settings.faq_cache_path", str(good_file))
        assert faq_cache_service._load_cache() is True
        assert faq_cache_service._cache is not None
        assert len(faq_cache_service._cache) == 1


# ═══════════════════════════════════════════════════════════════════════════════
# lookup — exact match
# ═══════════════════════════════════════════════════════════════════════════════

class TestLookupExact:
    def test_exact_norm_returns_hit(self):
        hit = faq_cache_service.lookup(EXACT_QUESTION)
        assert hit is not None
        assert hit.answer == "Năm 1225."
        assert hit.score == 100.0

    def test_exact_norm_case_insensitive(self):
        hit = faq_cache_service.lookup("NHÀ TRẦN THÀNH LẬP NĂM NÀO?")
        assert hit is not None
        assert hit.score == 100.0

    def test_exact_norm_extra_whitespace(self):
        hit = faq_cache_service.lookup(EXTRA_SPACE_Q)
        assert hit is not None
        assert hit.score == 100.0

    def test_exact_fold_no_diacritics(self):
        """Người Việt gõ không dấu → vẫn match fold cache."""
        hit = faq_cache_service.lookup(FOLD_QUESTION)
        assert hit is not None
        assert hit.answer == "Năm 1225."
        assert hit.score == 100.0

    def test_exact_fold_mixed_diacritics(self):
        """Một phần có dấu, một phần không → vẫn fold match."""
        hit = faq_cache_service.lookup("Nha Trần thành lập năm nào?")
        assert hit is not None
        assert hit.score == 100.0


# ═══════════════════════════════════════════════════════════════════════════════
# lookup — fuzzy match
# ═══════════════════════════════════════════════════════════════════════════════

class TestLookupFuzzy:
    def test_fuzzy_norm_1_char_off(self):
        """'thànn lập' thay vì 'thành lập' → fuzzy norm match."""
        hit = faq_cache_service.lookup("Nha Trần thànn lập năm nào?")
        assert hit is not None
        assert 90.0 <= hit.score <= 99.0

    def test_fuzzy_fold_no_diacritics_with_typo(self):
        """1 từ sai (tìm~kiếm) + không dấu → fuzzy fold match."""
        hit = faq_cache_service.lookup("nha tran thanh lap nam mo?")
        assert hit is not None
        assert 90.0 <= hit.score <= 99.0

    def test_fuzzy_norm_threshold_boundary_above(self):
        """Score ≥ threshold → trả hit."""
        hit = faq_cache_service.lookup("Vua Quang Trung đại phá quân Thanh năm nào?")
        assert hit is not None, "Thêm 'nào?' vẫn fuzzy khớp được"
        assert hit.score >= 90.0

    def test_fuzzy_fold_pure_ascii_query(self):
        """Hoàn toàn không dấu nhưng đúng chính tả → fold exact."""
        hit = faq_cache_service.lookup("le loi len ngoi o dau?")
        assert hit is not None
        assert hit.answer == "Lam Sơn, Thanh Hóa."


# ═══════════════════════════════════════════════════════════════════════════════
# lookup — miss
# ═══════════════════════════════════════════════════════════════════════════════

class TestLookupMiss:
    def test_miss_garbage_question(self):
        """Câu vô nghĩa → None."""
        hit = faq_cache_service.lookup(MISS_QUESTION)
        assert hit is None

    def test_miss_completely_unrelated(self):
        hit = faq_cache_service.lookup("Công thức nấu phở bò Hà Nội?")
        assert hit is None

    def test_miss_english_question(self):
        hit = faq_cache_service.lookup("What is the capital of Vietnam?")
        assert hit is None


# ═══════════════════════════════════════════════════════════════════════════════
# lookup — cache disabled / unavailable
# ═══════════════════════════════════════════════════════════════════════════════

class TestLookupDisabled:
    def test_lookup_returns_none_when_cache_disabled(self, monkeypatch):
        _reset_cache()
        monkeypatch.setattr("app.config.settings.faq_cache_enabled", False)
        hit = faq_cache_service.lookup(EXACT_QUESTION)
        assert hit is None

    def test_lookup_returns_none_when_cache_not_loaded(self):
        _reset_cache()
        hit = faq_cache_service.lookup(EXACT_QUESTION)
        assert hit is None


# ═══════════════════════════════════════════════════════════════════════════════
# lookup — edge cases
# ═══════════════════════════════════════════════════════════════════════════════

class TestLookupEdgeCases:
    def test_empty_question(self):
        hit = faq_cache_service.lookup("")
        assert hit is None

    def test_whitespace_only_question(self):
        hit = faq_cache_service.lookup("   ")
        assert hit is None

    def test_lookup_with_special_chars(self):
        """Câu có ký tự đặc biệt như dấu ngoặc kép, dấu gạch ngang."""
        entries = [
            {"q": "Chiến dịch 'Điện Biên Phủ trên không' (1972)?", "a": "1972."},
        ]
        _seed_cache(entries)
        hit = faq_cache_service.lookup("chiến dịch 'Điện Biên Phủ trên không' (1972)?")
        assert hit is not None
        assert hit.score == 100.0


# ═══════════════════════════════════════════════════════════════════════════════
# lookup — fuzzy with lowered threshold
# ═══════════════════════════════════════════════════════════════════════════════

class TestLookupThreshold:
    def test_fuzzy_below_threshold_returns_none(self, monkeypatch):
        _reset_cache()
        monkeypatch.setattr("app.config.settings.faq_cache_threshold", 99.0)
        _seed_cache()
        # "Nha Tràn thành lập năm nào mà?" không exact fold, fuzzy score~95 < 99 → None
        hit = faq_cache_service.lookup("Nha Tràn thành lập năm nào mà?")
        assert hit is None

    def test_fuzzy_above_custom_threshold(self, monkeypatch):
        _reset_cache()
        monkeypatch.setattr("app.config.settings.faq_cache_threshold", 80.0)
        _seed_cache()
        # Câu sai nhiều hơn nhưng vẫn trên 80
        hit = faq_cache_service.lookup("nha tran thanh lap nam nao ma?")
        assert hit is not None
        assert hit.score >= 80.0

    def test_fuzzy_below_custom_threshold(self, monkeypatch):
        _reset_cache()
        monkeypatch.setattr("app.config.settings.faq_cache_threshold", 95.0)
        _seed_cache()
        hit = faq_cache_service.lookup("nha tran thanh lap nam nao ma?")
        assert hit is None


# ═══════════════════════════════════════════════════════════════════════════════
# lookup — multiple entries, dedup verification
# ═══════════════════════════════════════════════════════════════════════════════

class TestLookupDedup:
    def test_duplicate_normalized_question_uses_first(self):
        """Nếu 2 entry có cùng norm_q, entry đầu tiên được giữ."""
        entries = [
            {"q": "Nhà Trần thành lập năm nào?", "a": "Năm 1225."},
            {"q": "  nhà trần  thành lập năm nào?  ", "a": "Bản sao."},
        ]
        _seed_cache(entries)
        assert len(faq_cache_service._cache) == 1
        hit = faq_cache_service.lookup("Nhà Trần thành lập năm nào?")
        assert hit is not None
        assert hit.answer == "Năm 1225."


# ═══════════════════════════════════════════════════════════════════════════════
# lookup — hit does NOT trigger suggest_questions (cache hit returns early)
# ═══════════════════════════════════════════════════════════════════════════════

class TestCacheHitBypassesPipeline:
    def test_faq_hit_does_not_call_suggest_questions(self, monkeypatch):
        """Cache hit return ngay, không chạy RAG hay suggest_questions."""
        import app.api.chat_routes as routes
        from app.schemas.chat import RagChatRequest

        called = {"retrieve": False, "generate": False, "suggest": False}

        def fake_lookup(q):
            return faq_cache_service.FaqHit(answer="Năm 1225.", matched_question=q, score=100.0)

        monkeypatch.setattr(faq_cache_service, "lookup", fake_lookup)
        monkeypatch.setattr("app.services.retrieval_service.retrieve",
                           lambda **kw: called.update({"retrieve": True}) or [])
        monkeypatch.setattr("app.services.llm_service.generate",
                           lambda *a, **kw: called.update({"generate": True}) or "")
        monkeypatch.setattr("app.services.llm_service.suggest_questions",
                           lambda *a, **kw: called.update({"suggest": True}) or [])

        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)

        resp = client.post("/rag/chat", json={"question": "Nhà Trần thành lập năm nào?"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["usedVector"] is False
        assert body["usedGraph"] is False
        assert "FAQ" in str(body["citations"])
        assert called["retrieve"] is False
        assert called["generate"] is False
        assert called["suggest"] is False
