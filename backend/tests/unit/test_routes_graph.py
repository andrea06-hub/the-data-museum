"""Tests unitaires — Routes graphe (routes 4, 5, 6, 7 et 9).

Le service graph_service est remplacé par des mocks : on teste uniquement
le HTTP (codes 200/400/404/422, message d'erreur, paramètres transmis au service).

Commande (depuis backend/) :
    uv run pytest tests/unit/test_routes_graph.py -v

Fichier testé :
    backend/src/portfolio_api/api/routes_graph.py
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from portfolio_api.main import app
from portfolio_api.services import graph_service

SLUG = "alice-martin"


SIMILAIRES_OK = {
    "projet_slug": "smartcity-explorer",
    "similaires": [
        {
            "projet_slug": "portfolio-nosql",
            "titre": "Portfolio polyglotte",
            "date_debut": "2026-11-02",
            "auteurs": [SLUG],
            "score": 2,
            "competences_communes": ["mongodb", "python"],
        }
    ],
}

GRAPH_OK = {
    "candidat_slug": SLUG,
    "nodes": [{"id": f"candidat:{SLUG}", "type": "candidat", "label": "Alice Martin"}],
    "links": [],
}

COMMUNES_OK = {
    "candidats": [SLUG, "bob-durand"],
    "competences_communes": [{"skill_slug": "python", "nom": "Python"}],
}

TRANSVERSALES_OK = {
    "candidat_slug": SLUG,
    "min_projets": 2,
    "competences": [],
}

PREUVES_OK = {
    "skill_slug": "python",
    "nom": "Python",
    "candidats": [],
}


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def service():
    """Remplace les 5 fonctions du service graph par des mocks."""
    with (
        patch.object(
            graph_service,
            "get_projets_similaires",
            AsyncMock(return_value=SIMILAIRES_OK),
        ) as r4,
        patch.object(
            graph_service,
            "get_graphe_competences",
            AsyncMock(return_value=GRAPH_OK),
        ) as r5,
        patch.object(
            graph_service,
            "get_competences_communes",
            AsyncMock(return_value=COMMUNES_OK),
        ) as r6,
        patch.object(
            graph_service,
            "get_competences_transversales",
            AsyncMock(return_value=TRANSVERSALES_OK),
        ) as r7,
        patch.object(
            graph_service,
            "get_preuves_competence",
            AsyncMock(return_value=PREUVES_OK),
        ) as r9,
    ):
        yield {
            "get_projets_similaires": r4,
            "get_graphe_competences": r5,
            "get_competences_communes": r6,
            "get_competences_transversales": r7,
            "get_preuves_competence": r9,
        }


# ---------------------------------------------------------------------------
# R4 — GET /api/graph/projets/{slug}/similaires
# ---------------------------------------------------------------------------
class TestRouteR4Similaires:
    def test_200_renvoie_les_similaires(self, client, service):
        r = client.get("/api/graph/projets/smartcity-explorer/similaires")

        assert r.status_code == 200
        assert r.json()["projet_slug"] == "smartcity-explorer"
        service["get_projets_similaires"].assert_awaited_once_with(
            "smartcity-explorer", limit=5
        )

    def test_404_si_service_renvoie_none(self, client, service):
        service["get_projets_similaires"].return_value = None

        r = client.get("/api/graph/projets/xyz/similaires")

        assert r.status_code == 404
        assert r.json() == {"detail": "Projet 'xyz' introuvable"}

    def test_transmet_limit(self, client, service):
        client.get("/api/graph/projets/smartcity-explorer/similaires?limit=3")
        service["get_projets_similaires"].assert_awaited_once_with(
            "smartcity-explorer", limit=3
        )

    @pytest.mark.parametrize("requete", ["limit=0", "limit=21", "limit=abc"])
    def test_422_limit_invalide(self, client, service, requete):
        r = client.get(f"/api/graph/projets/smartcity-explorer/similaires?{requete}")
        assert r.status_code == 422
        service["get_projets_similaires"].assert_not_awaited()


# ---------------------------------------------------------------------------
# R5 — GET /api/graph/competences/{slug}
# ---------------------------------------------------------------------------
class TestRouteR5Graphe:
    def test_200_renvoie_le_graphe(self, client, service):
        r = client.get(f"/api/graph/competences/{SLUG}")

        assert r.status_code == 200
        assert r.json()["candidat_slug"] == SLUG
        service["get_graphe_competences"].assert_awaited_once_with(SLUG)

    def test_404_si_candidat_inconnu(self, client, service):
        service["get_graphe_competences"].return_value = None

        r = client.get("/api/graph/competences/xyz")

        assert r.status_code == 404
        assert r.json() == {"detail": "Candidat 'xyz' introuvable"}


# ---------------------------------------------------------------------------
# R6 — GET /api/graph/competences/communes
# ---------------------------------------------------------------------------
class TestRouteR6Communes:
    def test_200_dedoublonne_et_transmet_la_liste(self, client, service):
        # `alice-martin` dupliqué dans la query → service reçoit la liste dédupliquée
        r = client.get(
            f"/api/graph/competences/communes?candidats={SLUG},bob-durand,{SLUG}"
        )

        assert r.status_code == 200
        service["get_competences_communes"].assert_awaited_once_with(
            [SLUG, "bob-durand"]
        )

    def test_400_moins_de_2_candidats_distincts(self, client, service):
        r = client.get(f"/api/graph/competences/communes?candidats={SLUG}")

        assert r.status_code == 400
        assert r.json() == {"detail": "Au moins 2 candidats sont requis"}
        service["get_competences_communes"].assert_not_awaited()

    def test_400_doublons_ne_comptent_pas_comme_2_distincts(self, client, service):
        # Même slug 3 fois → 1 seul distinct → doit lever 400
        r = client.get(
            f"/api/graph/competences/communes?candidats={SLUG},{SLUG},{SLUG}"
        )
        assert r.status_code == 400
        service["get_competences_communes"].assert_not_awaited()

    def test_404_si_un_slug_est_inconnu(self, client, service):
        service["get_competences_communes"].return_value = None

        r = client.get(f"/api/graph/competences/communes?candidats={SLUG},fantome")

        assert r.status_code == 404
        assert r.json() == {"detail": "Au moins un des candidats est introuvable"}

    def test_422_parametre_candidats_manquant(self, client, service):
        r = client.get("/api/graph/competences/communes")
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# R7 — GET /api/graph/candidats/{slug}/competences-transversales
# ---------------------------------------------------------------------------
class TestRouteR7Transversales:
    def test_200_min_projets_par_defaut(self, client, service):
        r = client.get(f"/api/graph/candidats/{SLUG}/competences-transversales")

        assert r.status_code == 200
        service["get_competences_transversales"].assert_awaited_once_with(
            SLUG, min_projets=2
        )

    def test_transmet_min_projets(self, client, service):
        client.get(
            f"/api/graph/candidats/{SLUG}/competences-transversales?min_projets=3"
        )
        service["get_competences_transversales"].assert_awaited_once_with(
            SLUG, min_projets=3
        )

    def test_404_si_candidat_inconnu(self, client, service):
        service["get_competences_transversales"].return_value = None

        r = client.get("/api/graph/candidats/xyz/competences-transversales")

        assert r.status_code == 404
        assert r.json() == {"detail": "Candidat 'xyz' introuvable"}

    def test_422_min_projets_invalide(self, client, service):
        r = client.get(
            f"/api/graph/candidats/{SLUG}/competences-transversales?min_projets=0"
        )
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# R9 — GET /api/competences/{slug}/preuves
# ---------------------------------------------------------------------------
class TestRouteR9Preuves:
    def test_200_renvoie_les_preuves(self, client, service):
        r = client.get("/api/competences/python/preuves")

        assert r.status_code == 200
        assert r.json()["skill_slug"] == "python"
        service["get_preuves_competence"].assert_awaited_once_with("python")

    def test_404_si_competence_inconnue(self, client, service):
        service["get_preuves_competence"].return_value = None

        r = client.get("/api/competences/fantome/preuves")

        assert r.status_code == 404
        assert r.json() == {"detail": "Compétence 'fantome' introuvable"}
