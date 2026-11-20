"""Tests unitaires — Service graph (routes R4, R5, R6, R7, R9).

Les fonctions des repositories ``mongo_candidats``, ``mongo_projets`` et
``neo4j_graph`` sont remplacées par des mocks : on teste la logique
d'orchestration (404 via ``None``, hydratation, construction nodes/links,
règles de gouvernance §5).
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from portfolio_api.services import graph_service


# ---------------------------------------------------------------------------
# R4 — get_projets_similaires
# ---------------------------------------------------------------------------
class TestGetProjetsSimilaires:
    @pytest.mark.asyncio
    async def test_projet_source_inconnu_renvoie_none(self):
        with patch.object(
            graph_service, "get_projet_by_slug", AsyncMock(return_value=None)
        ):
            assert await graph_service.get_projets_similaires("xyz") is None

    @pytest.mark.asyncio
    async def test_projet_existe_sans_similaire(self):
        with (
            patch.object(
                graph_service,
                "get_projet_by_slug",
                AsyncMock(return_value={"projet_slug": "p1", "titre": "P1"}),
            ),
            patch.object(
                graph_service.neo4j_graph,
                "get_similar_projects",
                AsyncMock(return_value=[]),
            ),
        ):
            resultat = await graph_service.get_projets_similaires("p1")
        assert resultat == {"projet_slug": "p1", "similaires": []}

    @pytest.mark.asyncio
    async def test_hydratation_mongo_et_ignore_slugs_fantomes(self):
        """Les slugs Neo4j sans fiche Mongo sont filtrés (gouvernance §5)."""
        raw_similaires = [
            {"projet_slug": "p2", "score": 2, "competences_communes": ["python", "mongodb"]},
            {"projet_slug": "fantome", "score": 1, "competences_communes": ["python"]},
        ]
        projets_mongo = [
            {
                "projet_slug": "p2",
                "titre": "Projet 2",
                "date_debut": "2026-01-15",
                "auteurs": ["alice-martin"],
            },
        ]
        with (
            patch.object(
                graph_service,
                "get_projet_by_slug",
                AsyncMock(return_value={"projet_slug": "p1", "titre": "P1"}),
            ),
            patch.object(
                graph_service.neo4j_graph,
                "get_similar_projects",
                AsyncMock(return_value=raw_similaires),
            ),
            patch.object(
                graph_service,
                "get_projets_by_slugs",
                AsyncMock(return_value=projets_mongo),
            ),
        ):
            resultat = await graph_service.get_projets_similaires("p1")

        assert resultat == {
            "projet_slug": "p1",
            "similaires": [
                {
                    "projet_slug": "p2",
                    "titre": "Projet 2",
                    "date_debut": "2026-01-15",
                    "auteurs": ["alice-martin"],
                    "score": 2,
                    "competences_communes": ["python", "mongodb"],
                }
            ],
        }


# ---------------------------------------------------------------------------
# R5 — get_graphe_competences
# ---------------------------------------------------------------------------
class TestGetGrapheCompetences:
    @pytest.mark.asyncio
    async def test_candidat_inconnu_renvoie_none(self):
        with patch.object(
            graph_service, "get_candidat", AsyncMock(return_value=None)
        ):
            assert await graph_service.get_graphe_competences("xyz") is None

    @pytest.mark.asyncio
    async def test_candidat_sans_projet_renvoie_son_noeud_seul(self):
        candidat = {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin"}
        with (
            patch.object(
                graph_service, "get_candidat", AsyncMock(return_value=candidat)
            ),
            patch.object(
                graph_service.neo4j_graph,
                "get_candidate_graph_rows",
                AsyncMock(return_value={"candidat": candidat, "rows": []}),
            ),
        ):
            resultat = await graph_service.get_graphe_competences("alice-martin")

        assert resultat == {
            "candidat_slug": "alice-martin",
            "nodes": [
                {"id": "candidat:alice-martin", "type": "candidat", "label": "Alice Martin"}
            ],
            "links": [],
        }

    @pytest.mark.asyncio
    async def test_construit_nodes_et_links_avec_nb_projets(self):
        candidat = {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin"}
        rows = [
            {"projet_slug": "p1", "projet_titre": "Projet 1", "skill_slug": "python", "skill_nom": "Python"},
            {"projet_slug": "p1", "projet_titre": "Projet 1", "skill_slug": "mongodb", "skill_nom": "MongoDB"},
            {"projet_slug": "p2", "projet_titre": "Projet 2", "skill_slug": "python", "skill_nom": "Python"},
        ]
        with (
            patch.object(
                graph_service, "get_candidat", AsyncMock(return_value=candidat)
            ),
            patch.object(
                graph_service.neo4j_graph,
                "get_candidate_graph_rows",
                AsyncMock(return_value={"candidat": candidat, "rows": rows}),
            ),
        ):
            resultat = await graph_service.get_graphe_competences("alice-martin")

        # Python est utilisé dans 2 projets, MongoDB dans 1 → Python en 1er
        competences = [n for n in resultat["nodes"] if n["type"] == "competence"]
        assert [c["label"] for c in competences] == ["Python", "MongoDB"]
        assert competences[0]["nb_projets"] == 2
        assert competences[1]["nb_projets"] == 1

        # 2 liens A_REALISE + 3 liens UTILISE
        a_realise = [l for l in resultat["links"] if l["type"] == "A_REALISE"]
        utilise = [l for l in resultat["links"] if l["type"] == "UTILISE"]
        assert len(a_realise) == 2
        assert len(utilise) == 3


# ---------------------------------------------------------------------------
# R6 — get_competences_communes
# ---------------------------------------------------------------------------
class TestGetCompetencesCommunes:
    @pytest.mark.asyncio
    async def test_slug_inconnu_renvoie_none(self):
        async def fake_get(slug):
            return {"candidat_slug": slug} if slug == "alice-martin" else None

        with patch.object(graph_service, "get_candidat", AsyncMock(side_effect=fake_get)):
            resultat = await graph_service.get_competences_communes(
                ["alice-martin", "fantome"]
            )
        assert resultat is None

    @pytest.mark.asyncio
    async def test_renvoie_les_competences_communes(self):
        async def fake_get(slug):
            return {"candidat_slug": slug}

        with (
            patch.object(graph_service, "get_candidat", AsyncMock(side_effect=fake_get)),
            patch.object(
                graph_service.neo4j_graph,
                "get_common_skills",
                AsyncMock(return_value=[{"skill_slug": "python", "nom": "Python"}]),
            ),
        ):
            resultat = await graph_service.get_competences_communes(
                ["alice-martin", "bob-durand"]
            )

        assert resultat == {
            "candidats": ["alice-martin", "bob-durand"],
            "competences_communes": [{"skill_slug": "python", "nom": "Python"}],
        }


# ---------------------------------------------------------------------------
# R7 — get_competences_transversales
# ---------------------------------------------------------------------------
class TestGetCompetencesTransversales:
    @pytest.mark.asyncio
    async def test_candidat_inconnu_renvoie_none(self):
        with patch.object(graph_service, "get_candidat", AsyncMock(return_value=None)):
            assert await graph_service.get_competences_transversales("xyz") is None

    @pytest.mark.asyncio
    async def test_renvoie_les_transversales(self):
        competences = [
            {"skill_slug": "python", "nom": "Python", "nb_projets": 3, "projets": ["a", "b", "c"]},
        ]
        with (
            patch.object(
                graph_service, "get_candidat", AsyncMock(return_value={"candidat_slug": "alice-martin"})
            ),
            patch.object(
                graph_service.neo4j_graph,
                "get_transversal_skills",
                AsyncMock(return_value=competences),
            ),
        ):
            resultat = await graph_service.get_competences_transversales("alice-martin", 2)

        assert resultat == {
            "candidat_slug": "alice-martin",
            "min_projets": 2,
            "competences": competences,
        }

    @pytest.mark.asyncio
    async def test_neo4j_none_devient_liste_vide(self):
        """Si Neo4j renvoie None (candidat sans projet), on retourne liste vide."""
        with (
            patch.object(
                graph_service, "get_candidat", AsyncMock(return_value={"candidat_slug": "alice-martin"})
            ),
            patch.object(
                graph_service.neo4j_graph,
                "get_transversal_skills",
                AsyncMock(return_value=None),
            ),
        ):
            resultat = await graph_service.get_competences_transversales("alice-martin")
        assert resultat["competences"] == []


# ---------------------------------------------------------------------------
# R9 — get_preuves_competence
# ---------------------------------------------------------------------------
class TestGetPreuvesCompetence:
    @pytest.mark.asyncio
    async def test_competence_inconnue_renvoie_none(self):
        with patch.object(
            graph_service.neo4j_graph,
            "get_skill_proofs",
            AsyncMock(return_value=None),
        ):
            assert await graph_service.get_preuves_competence("inconnue") is None

    @pytest.mark.asyncio
    async def test_hydrate_prenom_nom_titre_et_titres_projets(self):
        raw_proofs = {
            "skill_slug": "python",
            "nom": "Python",
            "candidats": [
                {
                    "candidat_slug": "alice-martin",
                    "nb_projets": 2,
                    "projets": [
                        {"projet_slug": "p1", "titre": None},
                        {"projet_slug": "p2", "titre": None},
                    ],
                }
            ],
        }
        projets_mongo = [
            {"projet_slug": "p1", "titre": "Projet 1"},
            {"projet_slug": "p2", "titre": "Projet 2"},
        ]
        alice = {
            "candidat_slug": "alice-martin",
            "prenom": "Alice",
            "nom": "Martin",
            "titre": "Étudiante ingénieure",
        }
        with (
            patch.object(
                graph_service.neo4j_graph,
                "get_skill_proofs",
                AsyncMock(return_value=raw_proofs),
            ),
            patch.object(
                graph_service,
                "get_projets_by_slugs",
                AsyncMock(return_value=projets_mongo),
            ),
            patch.object(graph_service, "get_candidat", AsyncMock(return_value=alice)),
        ):
            resultat = await graph_service.get_preuves_competence("python")

        assert resultat["skill_slug"] == "python"
        assert resultat["nom"] == "Python"
        assert len(resultat["candidats"]) == 1
        cand = resultat["candidats"][0]
        assert cand["prenom"] == "Alice"
        assert cand["nom"] == "Martin"
        assert cand["titre"] == "Étudiante ingénieure"
        assert [p["titre"] for p in cand["projets"]] == ["Projet 1", "Projet 2"]

    @pytest.mark.asyncio
    async def test_candidat_fantome_mongo_ignore(self):
        """Un candidat remonté par Neo4j mais absent de Mongo est filtré (§5)."""
        raw_proofs = {
            "skill_slug": "python",
            "nom": "Python",
            "candidats": [
                {"candidat_slug": "fantome", "nb_projets": 1, "projets": [{"projet_slug": "p1", "titre": None}]},
            ],
        }
        with (
            patch.object(
                graph_service.neo4j_graph,
                "get_skill_proofs",
                AsyncMock(return_value=raw_proofs),
            ),
            patch.object(
                graph_service,
                "get_projets_by_slugs",
                AsyncMock(return_value=[{"projet_slug": "p1", "titre": "Projet 1"}]),
            ),
            patch.object(graph_service, "get_candidat", AsyncMock(return_value=None)),
        ):
            resultat = await graph_service.get_preuves_competence("python")

        assert resultat == {"skill_slug": "python", "nom": "Python", "candidats": []}
