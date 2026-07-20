"""
Tests cho genealogy_service.py — mock Neo4j driver/session.

Vì conftest.py không set NEO4J_*, các test này mock toàn bộ driver
để không phụ thuộc vào môi trường thật.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.services.genealogy_service import GenealogyService

DYNASTY = "ly"
DYNASTY_NAME = "Nhà Lý"

MOCK_KINGS = [
    {"name": "Lý Thái Tổ", "reignOrder": 1, "templeName": None,
     "birthYear": 974, "deathYear": 1028, "reignStart": 1009, "reignEnd": 1028,
     "sourceUrl": "https://vi.wikipedia.org/wiki/L%C3%BD_Th%C3%A1i_T%E1%BB%95"},
    {"name": "Lý Thái Tông", "reignOrder": 2, "templeName": None,
     "birthYear": 1000, "deathYear": 1054, "reignStart": 1028, "reignEnd": 1054,
     "sourceUrl": "https://vi.wikipedia.org/wiki/L%C3%BD_Th%C3%A1i_T%C3%B4ng"},
    {"name": "Lý Thánh Tông", "reignOrder": 3, "templeName": None,
     "birthYear": 1023, "deathYear": 1072, "reignStart": 1054, "reignEnd": 1072,
     "sourceUrl": "https://vi.wikipedia.org/wiki/L%C3%BD_Th%C3%A1nh_T%C3%B4ng"},
]

MOCK_CHA_CON = [
    {"parent": "Lý Thái Tổ", "child": "Lý Thái Tông"},
    {"parent": "Lý Thái Tông", "child": "Lý Thánh Tông"},
]

MOCK_KE_VI = [
    {"prev": "Lý Thái Tổ", "next": "Lý Thái Tông"},
    {"prev": "Lý Thái Tông", "next": "Lý Thánh Tông"},
]


def _make_mock_session():
    """Create a MagicMock session with configurable run()."""
    session = MagicMock()

    # We'll override session.run per-test
    return session


def _make_mock_driver(session):
    driver = MagicMock()
    driver.session.return_value.__enter__.return_value = session
    return driver


def _mock_run_return(rows: list[dict]) -> MagicMock:
    """Return a MagicMock for session.run that iterates over given dict rows."""
    mock_result = MagicMock()
    mock_result.__iter__.return_value = iter(rows)
    mock_result.single.return_value = rows[0] if rows else None
    return mock_result


class TestGenealogyService:
    @patch("app.services.genealogy_service.get_driver")
    def test_check_dynasty_exists_true(self, mock_get_driver):
        session = MagicMock()
        mock_get_driver.return_value = _make_mock_driver(session)

        result = MagicMock()
        result.single.return_value = {"c": 3}
        session.run.return_value = result

        svc = GenealogyService()
        assert svc.check_dynasty_exists(DYNASTY) is True
        session.run.assert_called_once()

    @patch("app.services.genealogy_service.get_driver")
    def test_check_dynasty_exists_false(self, mock_get_driver):
        session = MagicMock()
        mock_get_driver.return_value = _make_mock_driver(session)

        result = MagicMock()
        result.single.return_value = {"c": 0}
        session.run.return_value = result

        svc = GenealogyService()
        assert svc.check_dynasty_exists(DYNASTY) is False

    @patch("app.services.genealogy_service.get_driver")
    def test_count_generations(self, mock_get_driver):
        session = MagicMock()
        mock_get_driver.return_value = _make_mock_driver(session)

        # Mock the variable-length path query
        gen_rows = [
            {"name": "Lý Thái Tổ", "generation": 0},
            {"name": "Lý Thái Tông", "generation": 1},
            {"name": "Lý Thánh Tông", "generation": 2},
        ]
        session.run.return_value = _mock_run_return(gen_rows)

        svc = GenealogyService()
        result = svc.count_generations(DYNASTY)

        assert result is not None
        assert result["dynasty"] == DYNASTY
        assert result["generations"] == 3  # max(0,1,2) + 1 = 3
        assert result["perPerson"] == [
            {"name": "Lý Thái Tổ", "generation": 0},
            {"name": "Lý Thái Tông", "generation": 1},
            {"name": "Lý Thánh Tông", "generation": 2},
        ]

    @patch("app.services.genealogy_service.get_driver")
    def test_count_generations_empty(self, mock_get_driver):
        session = MagicMock()
        mock_get_driver.return_value = _make_mock_driver(session)
        session.run.return_value = _mock_run_return([])

        svc = GenealogyService()
        result = svc.count_generations(DYNASTY)
        assert result is None

    @patch("app.services.genealogy_service.get_driver")
    def test_get_tree(self, mock_get_driver):
        session = MagicMock()
        mock_get_driver.return_value = _make_mock_driver(session)

        # Two calls: first returns persons, second returns CHA_CON
        person_rows = [
            {"name": "Lý Thái Tổ", "reignOrder": 1, "templeName": None,
             "birthYear": 974, "deathYear": 1028, "reignStart": 1009, "reignEnd": 1028,
             "sourceUrl": "https://vi.wikipedia.org/wiki/L%C3%BD_Th%C3%A1i_T%E1%BB%95"},
            {"name": "Lý Thái Tông", "reignOrder": 2, "templeName": None,
             "birthYear": 1000, "deathYear": 1054, "reignStart": 1028, "reignEnd": 1054,
             "sourceUrl": "https://vi.wikipedia.org/wiki/L%C3%BD_Th%C3%A1i_T%C3%B4ng"},
            {"name": "Lý Thánh Tông", "reignOrder": 3, "templeName": None,
             "birthYear": 1023, "deathYear": 1072, "reignStart": 1054, "reignEnd": 1072,
             "sourceUrl": "https://vi.wikipedia.org/wiki/L%C3%BD_Th%C3%A1nh_T%C3%B4ng"},
        ]
        rel_rows = [
            {"parent": "Lý Thái Tổ", "child": "Lý Thái Tông"},
            {"parent": "Lý Thái Tông", "child": "Lý Thánh Tông"},
        ]

        # session.run returns MockResult with __iter__
        def mock_run_side_effect(query, **kwargs):
            if "CHA_CON" in query:
                result = MagicMock()
                result.__iter__.return_value = iter(rel_rows)
                return result
            else:
                result = MagicMock()
                result.__iter__.return_value = iter(person_rows)
                return result
            return result

        mock_result1 = MagicMock()
        mock_result1.__iter__.return_value = iter(person_rows)
        mock_result2 = MagicMock()
        mock_result2.__iter__.return_value = iter(rel_rows)

        session.run.side_effect = [mock_result1, mock_result2]

        svc = GenealogyService()
        result = svc.get_tree(DYNASTY)

        assert result is not None
        assert result["name"] == "Lý Thái Tổ"
        assert result["reignOrder"] == 1
        assert len(result["children"]) == 1
        assert result["children"][0]["name"] == "Lý Thái Tông"
        assert len(result["children"][0]["children"]) == 1
        assert result["children"][0]["children"][0]["name"] == "Lý Thánh Tông"

    @patch("app.services.genealogy_service.get_driver")
    def test_get_tree_empty(self, mock_get_driver):
        session = MagicMock()
        mock_get_driver.return_value = _make_mock_driver(session)

        mock_result = MagicMock()
        mock_result.__iter__.return_value = iter([])
        session.run.return_value = mock_result

        svc = GenealogyService()
        result = svc.get_tree(DYNASTY)
        assert result is None

    @patch("app.services.genealogy_service.get_driver")
    def test_find_gaps_orphan_king(self, mock_get_driver):
        session = MagicMock()
        mock_get_driver.return_value = _make_mock_driver(session)

        orphan_rows = [
            {"name": "Lý Chiêu Hoàng", "reignOrder": 9},
        ]
        mock_orphan = MagicMock()
        mock_orphan.__iter__.return_value = iter(orphan_rows)

        mock_empty = MagicMock()
        mock_empty.__iter__.return_value = iter([])

        session.run.side_effect = [mock_orphan, mock_empty]

        svc = GenealogyService()
        gaps = svc.find_gaps(DYNASTY)

        assert len(gaps) == 1
        assert gaps[0]["reason"] == "orphan_king"
        assert gaps[0]["person"] == "Lý Chiêu Hoàng"
        assert gaps[0]["reignOrder"] == 9

    @patch("app.services.genealogy_service.get_driver")
    def test_find_gaps_broken_succession(self, mock_get_driver):
        session = MagicMock()
        mock_get_driver.return_value = _make_mock_driver(session)

        mock_empty = MagicMock()
        mock_empty.__iter__.return_value = iter([])

        succ_rows = [
            {"prev": "Lý Huệ Tông", "prevOrder": 8,
             "next": "Lý Chiêu Hoàng", "nextOrder": 9},
        ]
        mock_succ = MagicMock()
        mock_succ.__iter__.return_value = iter(succ_rows)

        session.run.side_effect = [mock_empty, mock_succ]

        svc = GenealogyService()
        gaps = svc.find_gaps(DYNASTY)

        assert len(gaps) == 1
        assert gaps[0]["reason"] == "broken_succession"
        assert gaps[0]["person"] == "Lý Huệ Tông → Lý Chiêu Hoàng"
        assert gaps[0]["reignOrder"] == 8
