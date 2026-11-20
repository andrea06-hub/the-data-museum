"""Tests unitaires — Routes candidats (routes 1, 2, 3 et 8).

Le service candidats_service est remplacé par des mocks : on teste uniquement
le HTTP (codes 200/404/422, message d'erreur, paramètres transmis au service).

Commande (depuis backend/) :
    uv run pytest tests/unit/test_routes_candidats.py -v

Fichier testé :
    backend/src/portfolio_api/api/routes_candidats.py
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from portfolio_api.main import app
from portfolio_api.models import CandidatOut, ProjetsPage, ProjetsRecentsOut, StatsOut
from portfolio_api.services import candidats_service

SLUG = "donatien-tovihouande"

PROFIL = CandidatOut(candidat_slug=SLUG, nom="Tovihouande", prenom="Donatien", titre="Étudiant")
PAGE = ProjetsPage(items=[], total=0, page=1, size=20)
STATS = StatsOut(candidat_slug=SLUG, nb_projets=0, nb_competences=0)
RECENTS = ProjetsRecentsOut(items=[])


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def service():
    """Remplace les 4 fonctions du service candidats par des mocks."""
    with (
        patch.object(candidats_service, "get_profil", AsyncMock(return_value=PROFIL)) as get_profil,
        patch.object(candidats_service, "get_projets", AsyncMock(return_value=PAGE)) as get_projets,
        patch.object(candidats_service, "get_stats", AsyncMock(return_value=STATS)) as get_stats,
        patch.object(candidats_service, "get_projets_recents",
                     AsyncMock(return_value=RECENTS)) as get_projets_recents,
    ):
        yield {
            "get_profil": get_profil,
            "get_projets": get_projets,
            "get_stats": get_stats,
            "get_projets_recents": get_projets_recents,
        }


class TestRouteProfil:
    """Route 1 — GET /api/candidats/{slug}."""

    def test_200_renvoie_le_profil(self, client, service):
        r = client.get(f"/api/candidats/{SLUG}")

        assert r.status_code == 200
        assert r.json()["candidat_slug"] == SLUG
        service["get_profil"].assert_awaited_once_with(SLUG)

    def test_404_candidat_inconnu(self, client, service):
        service["get_profil"].return_value = None

        r = client.get("/api/candidats/xyz")

        assert r.status_code == 404
        assert r.json() == {"detail": "Candidat 'xyz' introuvable"}


class TestRouteProjets:
    """Route 2 — GET /api/candidats/{slug}/projets."""

    def test_200_parametres_par_defaut(self, client, service):
        r = client.get(f"/api/candidats/{SLUG}/projets")

        assert r.status_code == 200
        assert r.json() == {"items": [], "total": 0, "page": 1, "size": 20}
        service["get_projets"].assert_awaited_once_with(SLUG, None, 1, 20)

    def test_transmet_competence_page_et_size(self, client, service):
        client.get(f"/api/candidats/{SLUG}/projets?competence=sql&page=2&size=10")

        service["get_projets"].assert_awaited_once_with(SLUG, "sql", 2, 10)

    def test_404_candidat_inconnu(self, client, service):
        service["get_projets"].return_value = None

        r = client.get("/api/candidats/xyz/projets")

        assert r.status_code == 404
        assert r.json() == {"detail": "Candidat 'xyz' introuvable"}

    @pytest.mark.parametrize("requete", ["page=0", "size=0", "size=101", "size=abc"])
    def test_422_parametre_invalide(self, client, service, requete):
        r = client.get(f"/api/candidats/{SLUG}/projets?{requete}")

        assert r.status_code == 422
        service["get_projets"].assert_not_awaited()


class TestRouteStats:
    """Route 3 — GET /api/candidats/{slug}/stats."""

    def test_200_renvoie_les_stats(self, client, service):
        r = client.get(f"/api/candidats/{SLUG}/stats")

        assert r.status_code == 200
        assert r.json() == {
            "candidat_slug": SLUG, "nb_projets": 0, "nb_competences": 0, "competences": []
        }
        service["get_stats"].assert_awaited_once_with(SLUG)

    def test_404_candidat_inconnu(self, client, service):
        service["get_stats"].return_value = None

        r = client.get("/api/candidats/xyz/stats")

        assert r.status_code == 404
        assert r.json() == {"detail": "Candidat 'xyz' introuvable"}


class TestRouteProjetsRecents:
    """Route 8 — GET /api/projets/recents."""

    def test_200_limite_5_par_defaut(self, client, service):
        r = client.get("/api/projets/recents")

        assert r.status_code == 200
        assert r.json() == {"items": []}
        service["get_projets_recents"].assert_awaited_once_with(5)

    def test_transmet_limit(self, client, service):
        client.get("/api/projets/recents?limit=2")

        service["get_projets_recents"].assert_awaited_once_with(2)

    @pytest.mark.parametrize("limit", ["0", "51", "abc"])
    def test_422_limit_invalide(self, client, service, limit):
        r = client.get(f"/api/projets/recents?limit={limit}")

        assert r.status_code == 422
        service["get_projets_recents"].assert_not_awaited()
