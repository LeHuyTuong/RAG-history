"""
Genealogy service — Cypher traversal for royal family trees.

Vai trò: cung cấp 3 chức năng chính cho API genealogy:
  1. get_tree(dynasty) → cây gia phả lồng nhau
  2. count_generations(dynasty) → số đời từ thuỷ tổ
  3. find_gaps(dynasty) → phát hiện thất lạc (vua mồ côi, đứt kế vị)
"""
from __future__ import annotations

from typing import Any

from app.config import settings
from app.graph.graph_client import get_driver


class GenealogyService:
    """Dùng driver singleton từ graph_client, chỉ đọc :RoyalPerson label."""

    def __init__(self) -> None:
        self._driver = get_driver()
        self._db = settings.neo4j_database

    def check_dynasty_exists(self, dynasty: str) -> bool:
        with self._driver.session(database=self._db) as session:
            row = session.run(
                "MATCH (p:RoyalPerson {dynasty: $d}) RETURN count(p) AS c",
                d=dynasty,
            ).single()
            return bool(row and row["c"] > 0)

    def get_tree(self, dynasty: str) -> dict[str, Any] | None:
        with self._driver.session(database=self._db) as session:
            # Get all persons
            rows = list(session.run(
                "MATCH (p:RoyalPerson {dynasty: $d}) "
                "RETURN p.name AS name, p.reignOrder AS reignOrder, "
                "p.templeName AS templeName, p.birthYear AS birthYear, "
                "p.deathYear AS deathYear, p.reignStart AS reignStart, "
                "p.reignEnd AS reignEnd, p.sourceUrl AS sourceUrl "
                "ORDER BY p.reignOrder",
                d=dynasty,
            ))

            if not rows:
                return None

            persons: dict[str, dict[str, Any]] = {}
            for row in rows:
                persons[row["name"]] = {
                    "name": row["name"],
                    "reignOrder": row["reignOrder"],
                    "templeName": row["templeName"],
                    "birthYear": row["birthYear"],
                    "deathYear": row["deathYear"],
                    "reignStart": row["reignStart"],
                    "reignEnd": row["reignEnd"],
                    "sourceUrl": row["sourceUrl"],
                    "children": [],
                }

            # Get CHA_CON relationships
            rels = list(session.run(
                "MATCH (p:RoyalPerson {dynasty: $d})-[:CHA_CON]->(c:RoyalPerson {dynasty: $d}) "
                "RETURN p.name AS parent, c.name AS child",
                d=dynasty,
            ))

            children_set: set[str] = set()
            for rel in rels:
                parent_name = rel["parent"]
                child_name = rel["child"]
                if parent_name in persons and child_name in persons:
                    persons[parent_name]["children"].append(persons[child_name])
                    children_set.add(child_name)

            # Roots = nodes with no incoming CHA_CON
            roots = [p for name, p in persons.items() if name not in children_set]
            if len(roots) == 1:
                return roots[0]

            return {"dynasty": dynasty, "roots": roots}

    def count_generations(self, dynasty: str) -> dict[str, Any] | None:
        with self._driver.session(database=self._db) as session:
            rows = list(session.run(
                "MATCH path = (root:RoyalPerson {dynasty: $d})-[:CHA_CON*0..20]->(p:RoyalPerson) "
                "WHERE NOT EXISTS { MATCH (root)<-[:CHA_CON]-(:RoyalPerson {dynasty: $d}) } "
                "WITH p, length(path) AS generation "
                "RETURN p.name AS name, generation "
                "ORDER BY generation, p.reignOrder",
                d=dynasty,
            ))

            if not rows:
                return None

            per_person = [
                {"name": row["name"], "generation": row["generation"]}
                for row in rows
            ]
            max_gen = max(r["generation"] for r in rows) if rows else 0

            return {
                "dynasty": dynasty,
                "generations": max_gen + 1,
                "perPerson": per_person,
            }

    def find_gaps(self, dynasty: str) -> list[dict[str, Any]]:
        gaps: list[dict[str, Any]] = []

        with self._driver.session(database=self._db) as session:
            # 1. Orphan kings: reignOrder > 1 but no incoming CHA_CON
            orphan_rows = list(session.run(
                "MATCH (p:RoyalPerson {dynasty: $d}) "
                "WHERE p.reignOrder > 1 "
                "AND NOT (p)<-[:CHA_CON]-() "
                "RETURN p.name AS name, p.reignOrder AS reignOrder "
                "ORDER BY p.reignOrder",
                d=dynasty,
            ))
            for row in orphan_rows:
                gaps.append({
                    "person": row["name"],
                    "reignOrder": row["reignOrder"],
                    "reason": "orphan_king",
                    "note": f"Vua thứ {row['reignOrder']} không rõ cha (không có quan hệ CHA_CON đi vào node này). "
                            f"Có thể do thất lạc sử liệu hoặc cha không phải vua.",
                })

            # 2. Broken succession: consecutive KE_VI with no CHA_CON path
            succ_rows = list(session.run(
                "MATCH (a:RoyalPerson {dynasty: $d})-[:KE_VI]->(b:RoyalPerson {dynasty: $d}) "
                "WHERE NOT (a)-[:CHA_CON*0..20]->(b) "
                "RETURN a.name AS prev, a.reignOrder AS prevOrder, "
                "b.name AS next, b.reignOrder AS nextOrder "
                "ORDER BY a.reignOrder",
                d=dynasty,
            ))
            for row in succ_rows:
                gaps.append({
                    "person": f"{row['prev']} → {row['next']}",
                    "reignOrder": row["prevOrder"],
                    "reason": "broken_succession",
                    "note": f"Vua {row['prev']} (thứ {row['prevOrder']}) và "
                            f"vua {row['next']} (thứ {row['nextOrder']}) không có "
                            f"đường cha-con nối — chuyển ngôi khác dòng hoặc đứt mạch.",
                })

        return gaps
