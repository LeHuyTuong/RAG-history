"""
Graph build tích hợp vào ingest pipeline — chạy background thread sau Qdrant upsert.

Vai trò: nhận danh sách chunk đã ingest, gọi Gemma trích entity/relation,
ghi vào Neo4j. Không block ingest response — caller chỉ cần gọi trigger_graph_build_async().

Key rotation: khi 1 key hết quota ngày (RESOURCE_EXHAUSTED PerDay) thì chuyển
sang key tiếp theo trong pool (google_api_key … google_api_key_5).
Neo4j không khả dụng → skip hoàn toàn, không raise.
"""
from __future__ import annotations

import logging
import threading
import time

logger = logging.getLogger(__name__)

_MIN_CHARS = 200       # chunk quá ngắn không đủ ngữ cảnh để trích
_SLEEP_BETWEEN = 1.5   # giây chờ giữa các LLM call (rate limit)
_MAX_RETRIES = 5


def _is_daily_quota_exhausted(exc: Exception) -> bool:
    msg = str(exc)
    return "RESOURCE_EXHAUSTED" in msg and (
        "PerDay" in msg or "per-day" in msg or "free_tier_requests" in msg
    )


def _retry_delay(exc: Exception) -> float:
    import re
    m = re.search(r"retry in (\d+(?:\.\d+)?)s", str(exc))
    return float(m.group(1)) + 3 if m else 30.0


def _get_api_keys() -> list[str]:
    from app.config import settings
    keys = [settings.google_api_key]
    for attr in ("google_api_key_2", "google_api_key_3", "google_api_key_4", "google_api_key_5"):
        k = getattr(settings, attr, None)
        if k:
            keys.append(k)
    return keys


def build_graph_for_source(
    source_id: int,
    chunk_data: list[tuple[str, int | None, str]],  # (point_id, page, text)
) -> None:
    """
    Trích entity/relation từ từng chunk rồi ghi Neo4j.
    Thiết kế để chạy trong daemon thread — exception không propagate ra ngoài.
    """
    from app.graph.graph_client import ensure_schema, write_graph, graph_available
    from app.services.graph_extract_service import build_extract_fn

    if not graph_available():
        logger.info("graph_ingest: Neo4j không khả dụng, bỏ qua")
        return

    try:
        ensure_schema()
    except Exception as exc:
        logger.warning("graph_ingest: ensure_schema thất bại: %s", exc)
        return

    api_keys = _get_api_keys()
    if not api_keys:
        logger.warning("graph_ingest: không có API key, bỏ qua")
        return

    key_idx = 0
    extract_fns = [build_extract_fn(k) for k in api_keys]
    total = sum(1 for _, _, text in chunk_data if len(text) >= _MIN_CHARS)
    done = 0

    for point_id, page, text in chunk_data:
        if len(text) < _MIN_CHARS:
            continue

        result: dict | None = None

        # Thử extract với retry mềm (429/RPM) và rotate key khi hết RPD
        for attempt in range(1, _MAX_RETRIES + 1):
            if key_idx >= len(extract_fns):
                logger.warning("graph_ingest: tất cả key hết quota, dừng source %d", source_id)
                return

            try:
                result = extract_fns[key_idx](text)
                break
            except Exception as exc:
                if _is_daily_quota_exhausted(exc):
                    logger.info("graph_ingest: key %d hết RPD → sang key %d", key_idx + 1, key_idx + 2)
                    key_idx += 1
                    continue  # retry ngay với key mới
                if attempt == _MAX_RETRIES:
                    logger.warning("graph_ingest: chunk %s thất bại sau %d lần: %s",
                                   point_id, _MAX_RETRIES, exc)
                    break
                wait = _retry_delay(exc)
                logger.debug("graph_ingest: lần %d thất bại, chờ %.0fs", attempt, wait)
                time.sleep(wait)

        if result and not result.get("_empty") and not result.get("_parse_error"):
            write_graph(point_id, source_id, page, result["entities"], result["relations"])
        else:
            write_graph(point_id, source_id, page, [], [])

        done += 1
        logger.debug("graph_ingest: [%d/%d] source=%d trang=%s", done, total, source_id, page)
        time.sleep(_SLEEP_BETWEEN)

    logger.info("graph_ingest: hoàn tất source %d — %d/%d chunk", source_id, done, total)


def trigger_graph_build_async(
    source_id: int,
    chunk_data: list[tuple[str, int | None, str]],
) -> None:
    """Fire-and-forget: spawn daemon thread build graph. Ingest response không bị block."""
    thread = threading.Thread(
        target=build_graph_for_source,
        args=(source_id, chunk_data),
        daemon=True,
        name=f"graph-build-{source_id}",
    )
    thread.start()
    logger.info("graph_ingest: background thread started cho source %d (%d chunks)",
                source_id, len(chunk_data))