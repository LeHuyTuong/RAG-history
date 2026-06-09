from __future__ import annotations

import re
import unicodedata
from functools import lru_cache


VIETNAMESE_DIACRITIC_RE = re.compile(
    r"[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ"
    r"ĂÂĐÊÔƠƯÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ]"
)
YEAR_RE = re.compile(r"\b(?:[1-2]\d{3}|[3-9]\d{2})\b")
WORD_RE = re.compile(r"[\wÀ-ỹ]+", re.UNICODE)
BROKEN_CHAR_RE = re.compile(r"[�□■]+|(?:\?){2,}")
ENTITY_RE = re.compile(
    r"\b(?:[A-ZĐ][a-zà-ỹ]+(?:\s+|$)){2,6}", re.UNICODE
)

POLICY_EVENT_TERMS = [
    "Cách mạng",
    "kháng chiến",
    "cải cách",
    "đổi mới",
    "hiệp định",
    "hội nghị",
    "triều đại",
    "phong trào",
    "chiến dịch",
    "độc lập",
    "thuộc địa",
    "nhà Nguyễn",
    "nhà Trần",
    "nhà Lý",
    "Đảng Cộng sản",
    "Việt Minh",
    "Mặt trận",
]


def normalize_vietnamese_text(text: object) -> str:
    if text is None:
        return ""
    normalized = unicodedata.normalize("NFC", str(text))
    normalized = normalized.replace("\x00", " ")
    normalized = re.sub(r"[ \t\r\f\v]+", " ", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def has_vietnamese_diacritics(text: object) -> bool:
    return bool(VIETNAMESE_DIACRITIC_RE.search(str(text or "")))


def broken_character_ratio(text: object) -> float:
    text = str(text or "")
    if not text:
        return 0.0
    broken = sum(len(match.group(0)) for match in BROKEN_CHAR_RE.finditer(text))
    return broken / max(len(text), 1)


def word_count(text: object) -> int:
    return len(WORD_RE.findall(str(text or "")))


def detect_years(text: object) -> list[str]:
    years = [year for year in YEAR_RE.findall(str(text or "")) if 300 <= int(year) <= 2099]
    return sorted(dict.fromkeys(years), key=int)


def detect_entity_candidates(text: object, max_entities: int = 20) -> list[str]:
    normalized = normalize_vietnamese_text(text)
    found: list[str] = []
    for match in ENTITY_RE.finditer(normalized):
        candidate = re.sub(r"\s+", " ", match.group(0)).strip(" .,;:-")
        if len(candidate.split()) >= 2 and len(candidate) >= 5:
            found.append(candidate)
    lowered = normalized.lower()
    for term in POLICY_EVENT_TERMS:
        if term.lower() in lowered:
            found.append(term)
    return list(dict.fromkeys(found))[:max_entities]


@lru_cache(maxsize=1)
def _tokenizer_backend():
    try:
        from underthesea import word_tokenize

        return "underthesea", word_tokenize
    except Exception:
        pass
    try:
        from pyvi import ViTokenizer

        return "pyvi", ViTokenizer.tokenize
    except Exception:
        pass
    return "whitespace", None


def tokenize_vietnamese(text: object) -> list[str]:
    normalized = normalize_vietnamese_text(text).lower()
    backend, tokenizer = _tokenizer_backend()
    if backend == "underthesea" and tokenizer is not None:
        normalized = tokenizer(normalized, format="text")
    elif backend == "pyvi" and tokenizer is not None:
        normalized = tokenizer(normalized)
    return WORD_RE.findall(normalized)


def tokenizer_name() -> str:
    return _tokenizer_backend()[0]


def text_preview(text: object, max_chars: int = 240) -> str:
    cleaned = re.sub(r"\s+", " ", normalize_vietnamese_text(text))
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 3].rstrip() + "..."
