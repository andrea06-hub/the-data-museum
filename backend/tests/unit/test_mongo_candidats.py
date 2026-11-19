"""Tests unitaires — Repository MongoDB des candidats (routes 1, 2, 3 et 8).

Vérifie les requêtes envoyées à MongoDB (filtres, tri, pagination, pipeline)
sans ouvrir de vraie connexion : get_mongo_db() est remplacé par une fausse base.

Commande (depuis backend/) :
    uv run pytest tests/unit/test_mongo_candidats.py -v

Fichier testé :
    backend/src/portfolio_api/repositories/mongo_candidats.py
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from portfolio_api.repositories import mongo_candidats

PROJET = {"projet_slug": "smartcity-explorer", "titre": "SmartCity Explorer"}


def faux_curseur(resultat: list[dict]) -> MagicMock:
    """Curseur find() : sort/skip/limit renvoient le curseur, to_list() le résultat."""
    curseur = MagicMock()
    curseur.sort.return_value = curseur
    curseur.skip.return_value = curseur
    curseur.limit.return_value = curseur
    curseur.to_list = AsyncMock(return_value=resultat)
    return curseur


@pytest.fixture
def db():
    """Fausse base MongoDB injectée à la place de get_mongo_db()."""
    fausse_db = MagicMock()
    fausse_db.candidats.find_one = AsyncMock()
    fausse_db.projets.find = MagicMock(return_value=faux_curseur([PROJET]))
    fausse_db.projets.count_documents = AsyncMock(return_value=1)
    fausse_db.projets.aggregate = AsyncMock()
    with patch.object(mongo_candidats, "get_mongo_db", return_value=fausse_db):
        yield fausse_db


class TestGetCandidat:
    """Route 1 — get_candidat()."""

    async def test_renvoie_le_profil_sans_id(self, db):
        db.candidats.find_one.return_value = {"candidat_slug": "donatien-tovihouande"}

        candidat = await mongo_candidats.get_candidat("donatien-tovihouande")

        assert candidat == {"candidat_slug": "donatien-tovihouande"}
        db.candidats.find_one.assert_awaited_once_with(
            {"_id": "donatien-tovihouande"}, {"_id": 0}
        )

    async def test_candidat_inconnu_renvoie_none(self, db):
        db.candidats.find_one.return_value = None

        assert await mongo_candidats.get_candidat("inconnu") is None


class TestGetProjetsCandidat:
    """Route 2 — get_projets_candidat()."""

    async def test_filtre_par_auteur_et_renvoie_items_et_total(self, db):
        items, total = await mongo_candidats.get_projets_candidat("donatien-tovihouande")

        assert (items, total) == ([PROJET], 1)
        db.projets.find.assert_called_once_with({"auteurs": "donatien-tovihouande"}, {"_id": 0})
        db.projets.count_documents.assert_awaited_once_with({"auteurs": "donatien-tovihouande"})

    async def test_filtre_par_competence(self, db):
        await mongo_candidats.get_projets_candidat("donatien-tovihouande", competence="mongodb")

        filtre = {"auteurs": "donatien-tovihouande", "competences.skill_slug": "mongodb"}
        db.projets.find.assert_called_once_with(filtre, {"_id": 0})
        db.projets.count_documents.assert_awaited_once_with(filtre)  # total cohérent avec le filtre

    async def test_tri_par_date_decroissante(self, db):
        await mongo_candidats.get_projets_candidat("donatien-tovihouande")

        db.projets.find.return_value.sort.assert_called_once_with(
            [("date_debut", -1), ("projet_slug", 1)]
        )

    async def test_pagination_skip_et_limit(self, db):
        await mongo_candidats.get_projets_candidat("donatien-tovihouande", page=3, size=10)

        curseur = db.projets.find.return_value
        curseur.skip.assert_called_once_with(20)  # (3 - 1) * 10
        curseur.limit.assert_called_once_with(10)

    async def test_candidat_sans_projet(self, db):
        db.projets.find.return_value = faux_curseur([])
        db.projets.count_documents.return_value = 0

        assert await mongo_candidats.get_projets_candidat("x") == ([], 0)


class TestGetStatsCandidat:
    """Route 3 — get_stats_candidat() (pipeline ARCHITECTURE §3.4)."""

    async def test_renvoie_stats_et_nb_projets(self, db):
        stats = [{"skill_slug": "python", "nom": "Python", "nb_projets": 1}]
        db.projets.aggregate.return_value = faux_curseur(stats)

        competences, nb_projets = await mongo_candidats.get_stats_candidat("donatien-tovihouande")

        assert (competences, nb_projets) == (stats, 1)
        db.projets.count_documents.assert_awaited_once_with({"auteurs": "donatien-tovihouande"})

    async def test_pipeline_filtre_le_candidat_puis_trie(self, db):
        db.projets.aggregate.return_value = faux_curseur([])

        await mongo_candidats.get_stats_candidat("donatien-tovihouande")

        pipeline = db.projets.aggregate.call_args.args[0]
        etapes = [next(iter(etape)) for etape in pipeline]
        assert etapes == ["$match", "$sort", "$unwind", "$group", "$sort", "$project"]
        assert pipeline[0] == {"$match": {"auteurs": "donatien-tovihouande"}}
        assert pipeline[4] == {"$sort": {"nb_projets": -1, "_id": 1}}  # tri du contrat

    async def test_candidat_sans_projet(self, db):
        db.projets.aggregate.return_value = faux_curseur([])
        db.projets.count_documents.return_value = 0

        assert await mongo_candidats.get_stats_candidat("x") == ([], 0)


class TestGetProjetsRecents:
    """Route 8 — get_projets_recents()."""

    async def test_tous_les_projets_tries_limite_5_par_defaut(self, db):
        projets = await mongo_candidats.get_projets_recents()

        assert projets == [PROJET]
        db.projets.find.assert_called_once_with({}, {"_id": 0})
        curseur = db.projets.find.return_value
        curseur.sort.assert_called_once_with([("date_debut", -1), ("projet_slug", 1)])
        curseur.limit.assert_called_once_with(5)

    async def test_limite_personnalisee(self, db):
        await mongo_candidats.get_projets_recents(limit=2)

        db.projets.find.return_value.limit.assert_called_once_with(2)
