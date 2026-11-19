"""Tests unitaires — logique de transformation du seed (seed.py).

On teste les fonctions pures de conversion data/ → documents §3, sans toucher
aux bases. L'exécution complète du seed s'intègre dans les tests manuels /
E2E (lot E2 — test machine neuve).
"""

from __future__ import annotations

from portfolio_api.scripts.seed import (
    _construire_resolveur_noms,
    _nom_competence,
    _transformer_candidat,
    _transformer_projet,
)


class TestResolveurNomsCompetences:
    def test_cascade_alias_declaration_titlecase(self):
        candidats = [
            {
                "competences": [
                    {"skill_slug": "python", "nom": "Python (Pandas, NumPy)"},
                    {"skill_slug": "ml", "nom": "Machine Learning"},
                ]
            }
        ]
        declarations = _construire_resolveur_noms(candidats)

        # alias défini → prime sur la déclaration
        assert _nom_competence("mongodb", declarations) == "MongoDB"
        # déclaré par un candidat → utilisé
        assert _nom_competence("python", declarations) == "Python (Pandas, NumPy)"
        # ni alias ni déclaration → titlecase du slug
        assert _nom_competence("cosmos-db", declarations) == "Cosmos Db"

    def test_conflit_de_nom_garde_le_plus_court(self):
        candidats = [
            {"competences": [{"skill_slug": "python", "nom": "Python (Pandas, NumPy)"}]},
            {"competences": [{"skill_slug": "python", "nom": "Python"}]},
        ]
        declarations = _construire_resolveur_noms(candidats)
        assert declarations["python"] == "Python"


class TestTransformerCandidat:
    def test_liens_vers_contacts_et_id_slug(self):
        doc = {
            "candidat_slug": "alice-martin",
            "prenom": "Alice",
            "nom": "Martin",
            "titre": "Étudiante ingénieure",
            "bio": "...",
            "liens": {
                "email": "a@b.com",
                "github": "https://github.com/alice",
                "linkedin": "https://linkedin.com/in/alice",
                "telephone": "+33 1 23 45 67 89",  # ignoré
            },
            "experiences": [{"entreprise": "X"}],
            "formations": [{"ecole": "Y"}],
            "langues": [{"langue": "Français", "niveau": "Natif"}],
        }

        resultat = _transformer_candidat(doc)

        assert resultat["_id"] == "alice-martin"
        assert resultat["candidat_slug"] == "alice-martin"
        assert resultat["contacts"] == {
            "email": "a@b.com",
            "github": "https://github.com/alice",
            "linkedin": "https://linkedin.com/in/alice",
        }
        assert "telephone" not in resultat["contacts"]
        assert resultat["experiences"] == [{"entreprise": "X"}]
        assert resultat["formations"] == [{"ecole": "Y"}]
        assert resultat["langues"][0]["langue"] == "Français"

    def test_liens_absents_donnent_contacts_a_none(self):
        doc = {"candidat_slug": "bob", "prenom": "Bob", "nom": "Durand"}
        resultat = _transformer_candidat(doc)
        assert resultat["contacts"] == {"email": None, "github": None, "linkedin": None}


class TestTransformerProjet:
    def test_candidat_slugs_vers_auteurs(self):
        projet = {
            "projet_slug": "p1",
            "titre": "Projet 1",
            "candidat_slugs": ["alice-martin", "bob-durand"],
            "competences": ["python"],
        }
        resultat = _transformer_projet(projet, {"python": "Python"})

        assert resultat["_id"] == "p1"
        assert resultat["auteurs"] == ["alice-martin", "bob-durand"]

    def test_competences_strings_enrichies_avec_noms(self):
        projet = {
            "projet_slug": "p1",
            "candidat_slugs": [],
            "competences": ["python", "mongodb", "cosmos-db"],
        }
        declarations = {"python": "Python (Pandas)"}
        resultat = _transformer_projet(projet, declarations)

        assert resultat["competences"] == [
            {"skill_slug": "python", "nom": "Python (Pandas)"},  # déclaré
            {"skill_slug": "mongodb", "nom": "MongoDB"},  # alias
            {"skill_slug": "cosmos-db", "nom": "Cosmos Db"},  # titlecase
        ]

    def test_competences_deja_structurees_conservees(self):
        projet = {
            "projet_slug": "p1",
            "candidat_slugs": [],
            "competences": [{"skill_slug": "python", "nom": "Python custom"}],
        }
        resultat = _transformer_projet(projet, {})
        assert resultat["competences"] == [
            {"skill_slug": "python", "nom": "Python custom"}
        ]

    def test_dates_null_preservees(self):
        projet = {
            "projet_slug": "p1",
            "candidat_slugs": [],
            "competences": [],
            "date_debut": None,
            "date_fin": None,
        }
        resultat = _transformer_projet(projet, {})
        assert resultat["date_debut"] is None
        assert resultat["date_fin"] is None
