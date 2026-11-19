"""Tests unitaires — Modèles Pydantic (contrat API_ROUTES.md).

Chaque exemple JSON de API_ROUTES.md est validé par le modèle de sa route,
puis re-sérialisé : le résultat doit être IDENTIQUE à l'exemple.
Si un modèle ou API_ROUTES.md change sans l'autre, ces tests échouent.

Commande (depuis backend/) :
    uv run pytest tests/unit/test_models.py -v

Fichier testé :
    backend/src/portfolio_api/models/__init__.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from portfolio_api import models

API_ROUTES = Path(__file__).resolve().parents[3] / "API_ROUTES.md"

# Modèle de réponse de chaque route, dans l'ordre des exemples de API_ROUTES.md
MODELES_PAR_ROUTE = [
    ("route 1 - profil", models.CandidatOut),
    ("route 2 - projets", models.ProjetsPage),
    ("route 3 - stats", models.StatsOut),
    ("route 4 - similaires", models.SimilairesOut),
    ("route 5 - graphe", models.GraphOut),
    ("route 6 - competences communes", models.CompetencesCommunesOut),
    ("route 7 - transversales", models.TransversalesOut),
    ("route 8 - projets recents", models.ProjetsRecentsOut),
    ("route 9 - preuves", models.PreuvesOut),
]


def exemples_json() -> list[dict]:
    """Extrait les blocs ```json de API_ROUTES.md, dans l'ordre du fichier."""
    texte = API_ROUTES.read_text(encoding="utf-8")
    return [json.loads(bloc) for bloc in re.findall(r"```json\n(.*?)```", texte, re.S)]


def test_un_exemple_par_route():
    """API_ROUTES.md doit contenir exactement un exemple JSON par route."""
    assert len(exemples_json()) == len(MODELES_PAR_ROUTE)


@pytest.mark.parametrize(
    ("modele", "exemple"),
    [(modele, exemple) for (_, modele), exemple in zip(MODELES_PAR_ROUTE, exemples_json())],
    ids=[nom for nom, _ in MODELES_PAR_ROUTE],
)
def test_modele_conforme_au_contrat(modele, exemple):
    """Le modèle accepte l'exemple du contrat et le restitue à l'identique."""
    objet = modele.model_validate(exemple)

    # Route 5 : seuls les nœuds "competence" ont nb_projets -> on omet les null
    sortie = objet.model_dump(exclude_none=(modele is models.GraphOut))

    assert sortie == exemple


class TestCasVides:
    """Cas « vides » prévus par API_ROUTES.md (200 avec listes vides)."""

    def test_candidat_sans_projet_stats(self):
        stats = models.StatsOut(candidat_slug="x", nb_projets=0, nb_competences=0)
        assert stats.competences == []

    def test_projet_sans_similaire(self):
        assert models.SimilairesOut(projet_slug="x").similaires == []

    def test_graphe_candidat_sans_projet(self):
        graphe = models.GraphOut(
            candidat_slug="x",
            nodes=[{"id": "candidat:x", "type": "candidat", "label": "X"}],
        )
        assert graphe.links == []


def test_type_de_noeud_invalide_refuse():
    """Literal : un type de nœud hors contrat doit être refusé."""
    with pytest.raises(ValueError):
        models.GraphNode(id="skill:python", type="skill", label="Python")
