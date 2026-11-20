"""Tests unitaires — Service candidats (routes 1, 2, 3 et 8).

Le repository mongo_candidats est remplacé par des mocks : on teste uniquement
la logique du service (tri, 404 via None, assemblage des modèles du contrat).

Commande (depuis backend/) :
    uv run pytest tests/unit/test_candidats_service.py -v

Fichier testé :
    backend/src/portfolio_api/services/candidats_service.py
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from portfolio_api.models import CandidatOut, ProjetsPage, ProjetsRecentsOut, StatsOut
from portfolio_api.services import candidats_service

SLUG = "donatien-tovihouande"

CANDIDAT = {
    "candidat_slug": SLUG,
    "nom": "Tovihouande",
    "prenom": "Donatien",
    "titre": "Étudiant ingénieur",
    "experiences": [
        {"entreprise": "MIG Motors SA (Kia)", "poste": "Stagiaire", "debut": "2023-06"},
        {"entreprise": "DS Consult", "poste": "Alternant", "debut": "2025-09"},
    ],
    "formations": [
        {"ecole": "Père Aupiais", "diplome": "Prépa", "debut": "2022-09"},
        {"ecole": "ESIGELEC", "diplome": "Ingénieur", "debut": "2024-09"},
    ],
}

PROJET = {"projet_slug": "smartcity-explorer", "titre": "SmartCity Explorer"}


@pytest.fixture
def repo():
    """Remplace les 4 fonctions du repository mongo_candidats par des mocks."""
    with (
        patch.object(candidats_service.mongo_candidats, "get_candidat",
                     AsyncMock(return_value=dict(CANDIDAT))) as get_candidat,
        patch.object(candidats_service.mongo_candidats, "get_projets_candidat",
                     AsyncMock(return_value=([PROJET], 1))) as get_projets_candidat,
        patch.object(candidats_service.mongo_candidats, "get_stats_candidat",
                     AsyncMock(return_value=([], 0))) as get_stats_candidat,
        patch.object(candidats_service.mongo_candidats, "get_projets_recents",
                     AsyncMock(return_value=[PROJET])) as get_projets_recents,
    ):
        yield {
            "get_candidat": get_candidat,
            "get_projets_candidat": get_projets_candidat,
            "get_stats_candidat": get_stats_candidat,
            "get_projets_recents": get_projets_recents,
        }


class TestGetProfil:
    """Route 1 — get_profil()."""

    async def test_renvoie_un_candidat_out(self, repo):
        profil = await candidats_service.get_profil(SLUG)

        assert isinstance(profil, CandidatOut)
        assert profil.candidat_slug == SLUG
        repo["get_candidat"].assert_awaited_once_with(SLUG)

    async def test_experiences_et_formations_triees_par_debut_decroissant(self, repo):
        profil = await candidats_service.get_profil(SLUG)

        assert [e.debut for e in profil.experiences] == ["2025-09", "2023-06"]
        assert [f.debut for f in profil.formations] == ["2024-09", "2022-09"]

    async def test_candidat_sans_experience_ni_formation(self, repo):
        repo["get_candidat"].return_value = {
            k: v for k, v in CANDIDAT.items() if k not in ("experiences", "formations")
        }

        profil = await candidats_service.get_profil(SLUG)

        assert profil.experiences == []
        assert profil.formations == []

    async def test_candidat_inconnu_renvoie_none(self, repo):
        repo["get_candidat"].return_value = None

        assert await candidats_service.get_profil("xyz") is None


class TestGetProjets:
    """Route 2 — get_projets()."""

    async def test_assemble_la_page_du_contrat(self, repo):
        page = await candidats_service.get_projets(SLUG, competence="sql", page=2, size=10)

        assert isinstance(page, ProjetsPage)
        assert (page.total, page.page, page.size) == (1, 2, 10)
        assert page.items[0].projet_slug == "smartcity-explorer"
        repo["get_projets_candidat"].assert_awaited_once_with(SLUG, "sql", 2, 10)

    async def test_candidat_sans_projet_renvoie_page_vide(self, repo):
        repo["get_projets_candidat"].return_value = ([], 0)

        page = await candidats_service.get_projets(SLUG)

        assert (page.items, page.total) == ([], 0)

    async def test_candidat_inconnu_renvoie_none_sans_chercher_les_projets(self, repo):
        repo["get_candidat"].return_value = None

        assert await candidats_service.get_projets("xyz") is None
        repo["get_projets_candidat"].assert_not_awaited()


class TestGetStats:
    """Route 3 — get_stats()."""

    async def test_assemble_les_stats_du_contrat(self, repo):
        competences = [
            {"skill_slug": "python", "nom": "Python", "nb_projets": 2},
            {"skill_slug": "sql", "nom": "SQL", "nb_projets": 1},
        ]
        repo["get_stats_candidat"].return_value = (competences, 3)

        stats = await candidats_service.get_stats(SLUG)

        assert isinstance(stats, StatsOut)
        assert (stats.candidat_slug, stats.nb_projets, stats.nb_competences) == (SLUG, 3, 2)
        assert [c.skill_slug for c in stats.competences] == ["python", "sql"]

    async def test_candidat_sans_projet(self, repo):
        stats = await candidats_service.get_stats(SLUG)

        assert (stats.nb_projets, stats.nb_competences, stats.competences) == (0, 0, [])

    async def test_candidat_inconnu_renvoie_none_sans_calculer_les_stats(self, repo):
        repo["get_candidat"].return_value = None

        assert await candidats_service.get_stats("xyz") is None
        repo["get_stats_candidat"].assert_not_awaited()


class TestGetProjetsRecents:
    """Route 8 — get_projets_recents()."""

    async def test_enveloppe_les_projets_dans_items(self, repo):
        recents = await candidats_service.get_projets_recents(limit=3)

        assert isinstance(recents, ProjetsRecentsOut)
        assert [p.projet_slug for p in recents.items] == ["smartcity-explorer"]
        repo["get_projets_recents"].assert_awaited_once_with(3)
