"""Tests d'intégrité des données (data/candidats et data/projets).

Objectif : vérifier AVANT le seed que les fichiers JSON de chaque membre sont
cohérents entre eux. Un slug mal écrit ou une compétence oubliée casserait
silencieusement les liens dans MongoDB et dans le graphe Neo4j.

Commande :
    uv run pytest tests/test_data_integrity.py -v
"""

from __future__ import annotations

import re
import re
import warnings
from collections import Counter

import pytest

from portfolio_api.scripts.seed import load_member_files

# Format attendu d'un slug : minuscules, chiffres et tirets (ex. "ayadjenou-gbedan", "power-query")
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

# Format attendu d'une date : année-mois (ex. "2026-09")
DATE_PATTERN = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


# ── Données chargées une seule fois pour tous les tests ─────────────────────


@pytest.fixture(scope="module")
def candidats() -> list[dict]:
    """Tous les candidats de data/candidats (sans _exemple.json)."""
    return load_member_files("candidats")


@pytest.fixture(scope="module")
def projets() -> list[dict]:
    """Tous les projets de data/projets (sans _exemple.json)."""
    return load_member_files("projets")


@pytest.fixture(scope="module")
def competences_declarees(candidats) -> set[str]:
    """Catalogue global : toutes les compétences déclarées par au moins un candidat."""
    return {c["skill_slug"] for cand in candidats for c in cand.get("competences", [])}


@pytest.fixture(scope="module")
def competences_utilisees(candidats, projets) -> set[str]:
    """Toutes les compétences citées dans les expériences et dans les projets."""
    dans_experiences = {
        slug for cand in candidats for exp in cand.get("experiences", []) for slug in exp.get("competences", [])
    }
    dans_projets = {slug for p in projets for slug in p.get("competences", [])}
    return dans_experiences | dans_projets


# ── 1. Présence et champs obligatoires ──────────────────────────────────────


def test_data_is_not_empty(candidats, projets):
    """Le seed doit avoir au moins un candidat et un projet à charger."""
    assert candidats, "Aucun fichier dans data/candidats"
    assert projets, "Aucun fichier dans data/projets"


def test_required_fields(candidats, projets):
    """Chaque candidat et chaque projet possède ses champs indispensables."""
    erreurs = []
    for cand in candidats:
        for champ in ("candidat_slug", "prenom", "nom"):
            if not cand.get(champ):
                erreurs.append(f"candidat {cand.get('candidat_slug', '?')} : champ '{champ}' manquant")
    for p in projets:
        for champ in ("projet_slug", "candidat_slugs", "titre"):
            if not p.get(champ):
                erreurs.append(f"projet {p.get('projet_slug', '?')} : champ '{champ}' manquant")
    assert not erreurs, "\n".join(erreurs)


# ── 2. Unicité des identifiants pivots ──────────────────────────────────────


def test_candidat_slugs_are_unique(candidats):
    """Deux candidats ne peuvent pas avoir le même candidat_slug."""
    doublons = [slug for slug, n in Counter(c["candidat_slug"] for c in candidats).items() if n > 1]
    assert not doublons, f"candidat_slug en double : {doublons}"


def test_projet_slugs_are_unique(projets):
    """Un projet ne doit être déclaré qu'une fois (ex. smartcity-explorer uniquement chez Donatien)."""
    doublons = [slug for slug, n in Counter(p["projet_slug"] for p in projets).items() if n > 1]
    assert not doublons, f"projet_slug en double : {doublons}"


# ── 3. Format des slugs ─────────────────────────────────────────────────────


def test_slugs_format(candidats, projets, competences_declarees, competences_utilisees):
    """Tous les slugs sont en minuscules, avec des tirets (pas d'espace, d'accent ni de majuscule)."""
    tous_les_slugs = (
        {c["candidat_slug"] for c in candidats}
        | {p["projet_slug"] for p in projets}
        | competences_declarees
        | competences_utilisees
    )
    invalides = sorted(s for s in tous_les_slugs if not SLUG_PATTERN.match(s))
    assert not invalides, f"Slugs au mauvais format : {invalides}"


def test_no_near_duplicate_skill_slugs(competences_declarees, competences_utilisees):
    """Détecte les variantes d'une même compétence (ex. 'power-bi' et 'powerbi')."""
    groupes: dict[str, set[str]] = {}
    for slug in competences_declarees | competences_utilisees:
        # On retire tirets et underscores : 'power-bi' et 'powerbi' donnent la même clé
        cle = slug.replace("-", "").replace("_", "")
        groupes.setdefault(cle, set()).add(slug)
    variantes = [sorted(g) for g in groupes.values() if len(g) > 1]
    assert not variantes, f"Variantes d'une même compétence à harmoniser : {variantes}"


# ── 4. Cohérence entre fichiers (liens du graphe) ───────────────────────────


def test_project_authors_exist(candidats, projets):
    """Chaque auteur d'un projet doit exister dans data/candidats, sinon pas de relation AUTHORED."""
    slugs_candidats = {c["candidat_slug"] for c in candidats}
    erreurs = [
        f"{p['projet_slug']} → auteur inconnu '{auteur}'"
        for p in projets
        for auteur in p["candidat_slugs"]
        if auteur not in slugs_candidats
    ]
    assert not erreurs, "\n".join(erreurs)


def test_report_undeclared_skills(competences_declarees, competences_utilisees):
    """Signale (sans bloquer) les compétences citées dans un projet ou une expérience
    mais absentes des listes 'competences' des candidats.

    Convention de l'équipe : un projet peut citer une compétence sans qu'elle soit
    déclarée, le seed crée alors le nœud Skill à partir du projet. Ce n'est donc pas
    une erreur, juste une information : ces compétences n'auront pas de niveau.
    """
    non_declarees = sorted(competences_utilisees - competences_declarees)
    if non_declarees:
        # warnings.warn affiche un avertissement dans le résumé de pytest sans faire échouer le test
        warnings.warn(f"Compétences sans niveau déclaré ({len(non_declarees)}) : {non_declarees}")


# ── 5. Valeurs bien formées ─────────────────────────────────────────────────


def test_skill_levels_between_1_and_5(candidats):
    """Le niveau d'une compétence est un entier de 1 à 5."""
    erreurs = [
        f"{cand['candidat_slug']} : {c['skill_slug']} niveau={c.get('niveau')}"
        for cand in candidats
        for c in cand.get("competences", [])
        if not (isinstance(c.get("niveau"), int) and 1 <= c["niveau"] <= 5)
    ]
    assert not erreurs, "\n".join(erreurs)


def test_dates_format_and_order(candidats):
    """Expériences et formations : dates au format AAAA-MM, et début avant fin."""
    erreurs = []
    for cand in candidats:
        for element in cand.get("experiences", []) + cand.get("formations", []):
            debut, fin = element.get("debut"), element.get("fin")
            nom = element.get("entreprise") or element.get("ecole")
            # La date de fin peut être null (expérience en cours)
            for date in (debut, fin):
                if date is not None and not DATE_PATTERN.match(date):
                    erreurs.append(f"{cand['candidat_slug']} / {nom} : date invalide '{date}'")
            # Comparer deux textes "AAAA-MM" revient à comparer les dates
            if debut and fin and DATE_PATTERN.match(debut) and DATE_PATTERN.match(fin) and debut > fin:
                erreurs.append(f"{cand['candidat_slug']} / {nom} : début {debut} après fin {fin}")
    assert not erreurs, "\n".join(erreurs)