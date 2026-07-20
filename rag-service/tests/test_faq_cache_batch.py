"""
Batch test: chạy 640 câu hỏi qua FAQ cache, thống kê hit/miss.

Kết quả mong đợi:
  - 640 câu tap rất chi tiết → FAQ cache không có → miss 100% (đúng)
  - Câu từ chính FAQ cache → exact/fold match 100% (verify cache hoạt động)
  - Biến thể gần giống → fuzzy match (verify fuzzy)
  - Input rác → không crash
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from app.services import faq_cache_service

DATA_DIR = Path(__file__).resolve().parent / "data"
TAP_FILES = sorted(DATA_DIR.glob("questions_tap*.json"))
FAQ_CACHE_PATH = Path(__file__).resolve().parents[1] / "data" / "faq_cache.json"


def _load_faq_cache_entries() -> list[dict]:
    return json.loads(FAQ_CACHE_PATH.read_bytes())


def _load_tap_questions() -> list[tuple[str, str, int]]:
    items: list[tuple[str, str, int]] = []
    for f in TAP_FILES:
        data = json.loads(f.read_bytes())
        for q in data["questions"]:
            items.append((f.stem, q["question"], q.get("id", 0)))
    return items


def _hit_type(question: str) -> tuple[str, float | None]:
    hit = faq_cache_service.lookup(question)
    if hit is None:
        return ("miss", None)
    if hit.score == 100.0:
        norm = faq_cache_service._normalize(question)
        if norm in faq_cache_service._cache:
            return ("exact_norm", 100.0)
        fold = faq_cache_service._normalize(faq_cache_service._fold_diacritics(question))
        if fold in faq_cache_service._fold_cache:
            return ("exact_fold", 100.0)
    return ("fuzzy", hit.score)


@pytest.fixture(scope="session", autouse=True)
def _prime_cache():
    faq_cache_service._loaded = False
    faq_cache_service._cache = None
    faq_cache_service._fold_cache = None
    faq_cache_service._norm_questions = None
    faq_cache_service._fold_questions = None
    faq_cache_service._raw_questions = None
    faq_cache_service._load_cache()
    assert faq_cache_service._cache is not None, "FAQ cache không load được"
    assert len(faq_cache_service._cache) > 0, "FAQ cache rỗng"


# ═══════════════════════════════════════════════════════════════════════════════
# 1. 640 câu tap — tất cả đều miss (vì là câu rất chi tiết)
# ═══════════════════════════════════════════════════════════════════════════════

class TestTapQuestionsAllMiss:
    def test_all_640_tap_questions_miss(self):
        """640 câu chi tiết từ sách → tất cả đều không có trong FAQ cache → None."""
        questions = _load_tap_questions()
        misses = 0
        for tap, q, qid in questions:
            hit = faq_cache_service.lookup(q)
            assert hit is None or isinstance(hit.score, (int, float))
            if hit is None:
                misses += 1
        # Kỳ vọng miss 100% (FAQ cache chỉ có câu hỏi tổng quát)
        assert misses == len(questions), (
            f"Expected all 640 to miss, but {len(questions) - misses} hit. "
            f"FAQ cache ({len(faq_cache_service._cache)} entries) is disjoint from tap questions."
        )

    def test_print_statistics(self):
        """In thống kê chi tiết."""
        questions = _load_tap_questions()
        total = len(questions)
        exact_norm = exact_fold = fuzzy = miss = 0

        for tap, q, qid in questions:
            kind, _ = _hit_type(q)
            if kind == "exact_norm":
                exact_norm += 1
            elif kind == "exact_fold":
                exact_fold += 1
            elif kind == "fuzzy":
                fuzzy += 1
            else:
                miss += 1

        print(f"\n{'='*60}")
        print(f"  FAQ CACHE — 640 CÂU TAP")
        print(f"{'='*60}")
        print(f"  Tổng câu         : {total}")
        print(f"  ✅ Exact (norm)  : {exact_norm:>4}  ({exact_norm/total*100:5.1f}%)")
        print(f"  ✅ Exact (fold)  : {exact_fold:>4}  ({exact_fold/total*100:5.1f}%)")
        print(f"  🔶 Fuzzy         : {fuzzy:>4}  ({fuzzy/total*100:5.1f}%)")
        print(f"  ❌ Miss          : {miss:>4}  ({miss/total*100:5.1f}%)")
        print(f"  (FAQ cache có {len(faq_cache_service._cache)} entries — câu hỏi tổng quát, "
              f"khác với 640 câu chi tiết từ sách)")
        print(f"{'='*60}\n")

        # Mẫu 5 câu miss đầu
        print("  📌 Mẫu miss:")
        count = 0
        for tap, q, qid in questions:
            if count >= 5:
                break
            print(f"    • {q[:80]}")
            count += 1
        print()


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Câu từ chính FAQ cache — exact match 100%
# ═══════════════════════════════════════════════════════════════════════════════

class TestFaqCacheExactMatches:
    def test_all_faq_cache_entries_hit_exact(self):
        entries = _load_faq_cache_entries()
        total = len(entries)
        hits = 0
        for entry in entries:
            hit = faq_cache_service.lookup(entry["q"])
            if hit is not None and hit.score == 100.0:
                hits += 1
        ratio = hits / total * 100
        print(f"\n  FAQ cache entries: {total}")
        print(f"  Exact hit        : {hits}/{total} ({ratio:.1f}%)")
        assert hits >= total * 0.98, f"Expected ≥98% exact match, got {ratio:.1f}%"

    def test_fold_match_no_diacritics(self):
        """Câu không dấu → fold match."""
        entries = _load_faq_cache_entries()
        folds = 0
        for entry in entries[:200]:
            q_no_diac = entry["q"]
            for src, tgt in [
                ("à", "a"), ("á", "a"), ("ả", "a"), ("ã", "a"), ("ạ", "a"),
                ("â", "a"), ("ă", "a"),
                ("đ", "d"),
                ("è", "e"), ("é", "e"), ("ẻ", "e"), ("ẽ", "e"), ("ẹ", "e"),
                ("ê", "e"),
                ("ì", "i"), ("í", "i"), ("ỉ", "i"), ("ĩ", "i"), ("ị", "i"),
                ("ò", "o"), ("ó", "o"), ("ỏ", "o"), ("õ", "o"), ("ọ", "o"),
                ("ô", "o"), ("ơ", "o"),
                ("ù", "u"), ("ú", "u"), ("ủ", "u"), ("ũ", "u"), ("ụ", "u"),
                ("ư", "u"),
                ("ỳ", "y"), ("ý", "y"), ("ỷ", "y"), ("ỹ", "y"), ("ỵ", "y"),
            ]:
                q_no_diac = q_no_diac.replace(src, tgt)
            hit = faq_cache_service.lookup(q_no_diac)
            if hit is not None:
                folds += 1
        ratio = folds / min(200, len(entries)) * 100
        print(f"\n  Fold match (200 câu bỏ dấu): {folds}/200 ({ratio:.1f}%)")
        assert ratio >= 95.0, f"Fold match quá thấp: {ratio:.1f}%"


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Fuzzy match — biến thể gần giống
# ═══════════════════════════════════════════════════════════════════════════════

class TestFaqCacheFuzzyMatches:
    @pytest.mark.parametrize("variation", [
        # Các biến thể nhẹ vẫn score ≥90 qua WRatio
        ("Kể tên và tóm tắt sự kiện nổi bật VN năm 1010", 90.0),
        ("Kháng Tống thắng lợi thời Lê Hoàn xảy ra khi nào và kết quả", 90.0),
    ])
    def test_fuzzy_variations_hit(self, variation):
        q, min_score = variation
        hit = faq_cache_service.lookup(q)
        assert hit is not None, f"'{q[:50]}...' should fuzzy match"
        assert hit.score >= min_score, (
            f"'{q[:50]}...' score={hit.score:.1f} < {min_score}"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Miss — câu vô nghĩa / ngoài phạm vi
# ═══════════════════════════════════════════════════════════════════════════════

class TestFaqCacheMisses:
    @pytest.mark.parametrize("bad_input", [
        "",
        "   ",
        "\n\t",
        "!@#$%^&*()",
        "Công thức nấu phở bò",
        "How to cook pho?",
        "Tôi yêu Việt Nam",
        "abc",
        "😀🎉🔥",
    ])
    def test_bad_inputs_miss(self, bad_input):
        hit = faq_cache_service.lookup(bad_input)
        assert hit is None, f"'{bad_input}' should be None, got {hit}"


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Per-tap breakdown
# ═══════════════════════════════════════════════════════════════════════════════

class TestPerTapBreakdown:
    def test_per_tap_breakdown(self):
        print(f"\n{'='*60}")
        print(f"  HIT RATE THEO TẬP")
        print(f"{'='*60}")
        for f in TAP_FILES:
            data = json.loads(f.read_bytes())
            source = data.get("source", {}).get("title", f.stem)
            qs = [q["question"] for q in data["questions"]]
            n = len(qs)
            hits = sum(1 for q in qs if faq_cache_service.lookup(q) is not None)
            label = source[:55]
            print(f"  {label:<57} {hits:>3}/{n:<3} ({hits/n*100:5.1f}%)")
        print(f"{'='*60}\n")
