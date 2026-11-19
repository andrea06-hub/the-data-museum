"""Tests unitaires — repository Neo4j (neo4j_graph.py).

Toutes les I/O Neo4j sont mockées via ``get_neo4j_session`` : on vérifie
la Cypher envoyée, les paramètres, et la mise en forme du retour.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def _make_fake_session(records: list[dict] | None = None, single: dict | None = None):
    """Construit une fausse ``AsyncSession`` utilisable dans un ``async with``.

    - ``records`` : itérable de dicts pour ``async for record in result``.
    - ``single``  : dict renvoyé par ``await result.single()``.
    """
    fake_result = MagicMock()
    if single is not None:
        fake_result.single = AsyncMock(return_value=single)
    elif single is None and records is None:
        fake_result.single = AsyncMock(return_value=None)

    if records is not None:
        async def _aiter(self):
            for r in records:
                yield r
        fake_result.__aiter__ = _aiter

    fake_session = MagicMock()
    fake_session.run = AsyncMock(return_value=fake_result)
    fake_session.__aenter__ = AsyncMock(return_value=fake_session)
    fake_session.__aexit__ = AsyncMock(return_value=None)
    return fake_session, fake_result


def _record(data: dict) -> MagicMock:
    """Fake record exposant ``.data()`` et un accès ``record["clef"]``."""
    rec = MagicMock()
    rec.data = MagicMock(return_value=data)
    rec.__getitem__ = lambda self, key: data[key]
    return rec


# ---------------------------------------------------------------------------
# R4 — get_similar_projects
# ---------------------------------------------------------------------------
class TestGetSimilarProjects:
    @pytest.mark.asyncio
    async def test_renvoie_similaires_tries(self):
        from portfolio_api.repositories.neo4j_graph import get_similar_projects

        records = [
            _record({
                "projet_slug": "portfolio-nosql",
                "titre": "Portfolio polyglotte",
                "date_debut": "2026-11-02",
                "competences_communes": ["mongodb", "python"],
                "score": 2,
            }),
            _record({
                "projet_slug": "chatbot-rh",
                "titre": "Chatbot RH",
                "date_debut": "2025-09-10",
                "competences_communes": ["python"],
                "score": 1,
            }),
        ]
        session, _ = _make_fake_session(records=records)

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_similar_projects("smartcity-explorer", limit=5)

        assert [r["projet_slug"] for r in resultat] == ["portfolio-nosql", "chatbot-rh"]
        assert resultat[0]["score"] == 2

        call = session.run.call_args
        cypher = call.args[0]
        assert "projet_slug: $projet_slug" in cypher
        assert call.kwargs == {"projet_slug": "smartcity-explorer", "limit": 5}

    @pytest.mark.asyncio
    async def test_aucun_similaire(self):
        from portfolio_api.repositories.neo4j_graph import get_similar_projects

        session, _ = _make_fake_session(records=[])

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_similar_projects("projet-isole")

        assert resultat == []


# ---------------------------------------------------------------------------
# R5 — get_candidate_graph_rows
# ---------------------------------------------------------------------------
class TestGetCandidateGraphRows:
    @pytest.mark.asyncio
    async def test_candidat_inexistant_renvoie_none(self):
        from portfolio_api.repositories.neo4j_graph import get_candidate_graph_rows

        session, _ = _make_fake_session(single=None)

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_candidate_graph_rows("inconnu")

        assert resultat is None

    @pytest.mark.asyncio
    async def test_candidat_sans_projet(self):
        from portfolio_api.repositories.neo4j_graph import get_candidate_graph_rows

        # OPTIONAL MATCH → collect contient un None, à filtrer
        single = _record({
            "candidat_slug": "alice-martin",
            "prenom": "Alice",
            "nom": "Martin",
            "rows": [None],
        })
        session, _ = _make_fake_session(single=single)

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_candidate_graph_rows("alice-martin")

        assert resultat == {
            "candidat": {
                "candidat_slug": "alice-martin",
                "prenom": "Alice",
                "nom": "Martin",
            },
            "rows": [],
        }

    @pytest.mark.asyncio
    async def test_candidat_avec_projets(self):
        from portfolio_api.repositories.neo4j_graph import get_candidate_graph_rows

        rows_cypher = [
            {
                "projet_slug": "p1",
                "projet_titre": "Projet 1",
                "skill_slug": "python",
                "skill_nom": "Python",
            },
            {
                "projet_slug": "p1",
                "projet_titre": "Projet 1",
                "skill_slug": "mongodb",
                "skill_nom": "MongoDB",
            },
        ]
        single = _record({
            "candidat_slug": "alice-martin",
            "prenom": "Alice",
            "nom": "Martin",
            "rows": rows_cypher,
        })
        session, _ = _make_fake_session(single=single)

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_candidate_graph_rows("alice-martin")

        assert resultat["candidat"]["prenom"] == "Alice"
        assert resultat["rows"] == rows_cypher


# ---------------------------------------------------------------------------
# R6 — get_common_skills
# ---------------------------------------------------------------------------
class TestGetCommonSkills:
    @pytest.mark.asyncio
    async def test_passe_candidats_uniques_et_taille(self):
        from portfolio_api.repositories.neo4j_graph import get_common_skills

        records = [_record({"skill_slug": "python", "nom": "Python"})]
        session, _ = _make_fake_session(records=records)

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_common_skills(["alice-martin", "bob-durand", "alice-martin"])

        assert resultat == [{"skill_slug": "python", "nom": "Python"}]
        # Le doublon doit être dédupliqué, nb_attendu = 2 (pas 3)
        assert session.run.call_args.kwargs == {
            "candidats": ["alice-martin", "bob-durand"],
            "nb_attendu": 2,
        }

    @pytest.mark.asyncio
    async def test_aucune_commune(self):
        from portfolio_api.repositories.neo4j_graph import get_common_skills

        session, _ = _make_fake_session(records=[])

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_common_skills(["a", "b"])

        assert resultat == []


# ---------------------------------------------------------------------------
# R7 — get_transversal_skills
# ---------------------------------------------------------------------------
class TestGetTransversalSkills:
    @pytest.mark.asyncio
    async def test_candidat_inexistant(self):
        from portfolio_api.repositories.neo4j_graph import get_transversal_skills

        session, _ = _make_fake_session(single=None)

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_transversal_skills("inconnu")

        assert resultat is None

    @pytest.mark.asyncio
    async def test_tri_par_nb_projets_puis_nom(self):
        from portfolio_api.repositories.neo4j_graph import get_transversal_skills

        single = _record({
            "candidat_slug": "alice-martin",
            "competences": [
                {"skill_slug": "mongodb", "nom": "MongoDB", "nb_projets": 2, "projets": ["b", "a"]},
                {"skill_slug": "python", "nom": "Python", "nb_projets": 3, "projets": ["c", "a", "b"]},
                None,
            ],
        })
        session, _ = _make_fake_session(single=single)

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_transversal_skills("alice-martin", min_projets=2)

        # Python d'abord (3 projets) puis MongoDB (2 projets), projets triés
        assert [c["skill_slug"] for c in resultat] == ["python", "mongodb"]
        assert resultat[0]["projets"] == ["a", "b", "c"]
        assert resultat[1]["projets"] == ["a", "b"]


# ---------------------------------------------------------------------------
# R9 — get_skill_proofs
# ---------------------------------------------------------------------------
class TestGetSkillProofs:
    @pytest.mark.asyncio
    async def test_competence_inexistante(self):
        from portfolio_api.repositories.neo4j_graph import get_skill_proofs

        session, _ = _make_fake_session(single=None)

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_skill_proofs("inconnue")

        assert resultat is None

    @pytest.mark.asyncio
    async def test_tri_candidats_par_nb_projets_puis_slug(self):
        from portfolio_api.repositories.neo4j_graph import get_skill_proofs

        single = _record({
            "skill_slug": "python",
            "nom": "Python",
            "candidats": [
                {
                    "candidat_slug": "bob-durand",
                    "nb_projets": 2,
                    "projets": [
                        {"projet_slug": "iot", "titre": "IoT"},
                        {"projet_slug": "smartcity", "titre": "SmartCity"},
                    ],
                },
                {
                    "candidat_slug": "alice-martin",
                    "nb_projets": 3,
                    "projets": [
                        {"projet_slug": "chatbot", "titre": "Chatbot"},
                        {"projet_slug": "portfolio", "titre": "Portfolio"},
                        {"projet_slug": "smartcity", "titre": "SmartCity"},
                    ],
                },
                None,
            ],
        })
        session, _ = _make_fake_session(single=single)

        with patch(
            "portfolio_api.repositories.neo4j_graph.get_neo4j_session",
            return_value=session,
        ):
            resultat = await get_skill_proofs("python")

        assert resultat["skill_slug"] == "python"
        assert [c["candidat_slug"] for c in resultat["candidats"]] == [
            "alice-martin",
            "bob-durand",
        ]
        # Projets de chaque candidat triés par projet_slug
        assert [p["projet_slug"] for p in resultat["candidats"][0]["projets"]] == [
            "chatbot",
            "portfolio",
            "smartcity",
        ]
