"""Tests unitaires du repository MongoDB des projets."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from portfolio_api.models import ProjetOut

from portfolio_api.repositories.mongo_projets import (
    get_projet_by_slug,
    get_projets_by_slugs,
)

from portfolio_api.repositories.mongo_projets import get_projets_by_candidat

from portfolio_api.repositories.mongo_projets import count_projets_by_candidat

from portfolio_api.repositories.mongo_projets import get_projets_recents

@pytest.mark.asyncio
async def test_get_projet_by_slug_existant():
    """Vérifie qu'un projet existant est correctement récupéré."""

    faux_projet = {
        "_id": "smartcity-explorer",
        "projet_slug": "smartcity-explorer",
        "titre": "SmartCity Explorer",
        "description": "Projet de visualisation de données urbaines.",
        "auteurs": ["andrea-vissoh"],
        "competences": [
            {"skill_slug": "python", "nom": "Python"}
        ],
    }

    fausse_collection = MagicMock()
    fausse_collection.find_one = AsyncMock(return_value=faux_projet)

    fausse_db = MagicMock()
    fausse_db.__getitem__.return_value = fausse_collection

    with patch(
        "portfolio_api.repositories.mongo_projets.get_mongo_db",
        return_value=fausse_db,
    ):
        resultat = await get_projet_by_slug("smartcity-explorer")

    assert isinstance(resultat, ProjetOut)
    assert resultat.projet_slug == "smartcity-explorer"
    assert resultat.titre == "SmartCity Explorer"
    assert resultat.competences[0].nom == "Python"

    fausse_collection.find_one.assert_awaited_once_with(
        {"projet_slug": "smartcity-explorer"}
    )
@pytest.mark.asyncio
async def test_get_projet_by_slug_inexistant():
    """Vérifie qu'un projet inexistant renvoie None."""

    fausse_collection = MagicMock()
    fausse_collection.find_one = AsyncMock(return_value=None)

    fausse_db = MagicMock()
    fausse_db.__getitem__.return_value = fausse_collection

    with patch(
        "portfolio_api.repositories.mongo_projets.get_mongo_db",
        return_value=fausse_db,
    ):
        resultat = await get_projet_by_slug("projet-inexistant")

    assert resultat is None

    fausse_collection.find_one.assert_awaited_once_with(
        {"projet_slug": "projet-inexistant"}
    )
@pytest.mark.asyncio
async def test_get_projets_by_slugs_liste_vide():
    """Une liste vide ne doit pas déclencher de requête MongoDB."""

    with patch(
        "portfolio_api.repositories.mongo_projets.get_mongo_db"
    ) as mock_get_db:
        resultat = await get_projets_by_slugs([])

    assert resultat == []
    mock_get_db.assert_not_called()
@pytest.mark.asyncio
async def test_get_projets_by_slugs_respecte_ordre():
    """Vérifie que les projets respectent l'ordre des slugs demandés."""

    faux_documents = [
        {"projet_slug": "projet-a", "titre": "Projet A"},
        {"projet_slug": "projet-b", "titre": "Projet B"},
    ]

    faux_cursor = MagicMock()
    faux_cursor.to_list = AsyncMock(return_value=faux_documents)

    fausse_collection = MagicMock()
    fausse_collection.find.return_value = faux_cursor

    fausse_db = MagicMock()
    fausse_db.__getitem__.return_value = fausse_collection

    with patch(
        "portfolio_api.repositories.mongo_projets.get_mongo_db",
        return_value=fausse_db,
    ):
        resultat = await get_projets_by_slugs(
            ["projet-b", "projet-a"]
        )

    assert [projet.projet_slug for projet in resultat] == [
        "projet-b",
        "projet-a",
    ]

    fausse_collection.find.assert_called_once_with(
        {"projet_slug": {"$in": ["projet-b", "projet-a"]}}
    )
@pytest.mark.asyncio
async def test_get_projets_by_slugs_ignore_introuvables():
    """Ignore les projets absents de MongoDB."""

    faux_documents = [
        {"projet_slug": "projet-a", "titre": "Projet A"},
        {"projet_slug": "projet-c", "titre": "Projet C"},
    ]

    faux_cursor = MagicMock()
    faux_cursor.to_list = AsyncMock(return_value=faux_documents)

    fausse_collection = MagicMock()
    fausse_collection.find.return_value = faux_cursor

    fausse_db = MagicMock()
    fausse_db.__getitem__.return_value = fausse_collection

    with patch(
        "portfolio_api.repositories.mongo_projets.get_mongo_db",
        return_value=fausse_db,
    ):
        resultat = await get_projets_by_slugs(
            ["projet-a", "projet-b", "projet-c"]
        )

    assert [projet.projet_slug for projet in resultat] == [
        "projet-a",
        "projet-c",
    ]
@pytest.mark.asyncio
async def test_get_projets_by_candidat_pagination():
    """Vérifie le filtrage par candidat et la pagination."""

    faux_documents = [
        {"projet_slug": "projet-a", "titre": "Projet A"},
        {"projet_slug": "projet-b", "titre": "Projet B"},
    ]

    faux_cursor = MagicMock()
    faux_cursor.sort.return_value = faux_cursor
    faux_cursor.skip.return_value = faux_cursor
    faux_cursor.limit.return_value = faux_cursor
    faux_cursor.to_list = AsyncMock(return_value=faux_documents)

    fausse_collection = MagicMock()
    fausse_collection.find.return_value = faux_cursor

    fausse_db = MagicMock()
    fausse_db.__getitem__.return_value = fausse_collection

    with patch(
        "portfolio_api.repositories.mongo_projets.get_mongo_db",
        return_value=fausse_db,
    ):
        resultat = await get_projets_by_candidat(
            "andrea-vissoh",
            page=2,
            size=2,
        )

    assert len(resultat) == 2
    assert resultat[0].projet_slug == "projet-a"
    assert resultat[1].projet_slug == "projet-b"

    fausse_collection.find.assert_called_once_with(
        {"auteurs": "andrea-vissoh"}
    )
    faux_cursor.sort.assert_called_once_with("date_debut", -1)
    faux_cursor.skip.assert_called_once_with(2)
    faux_cursor.limit.assert_called_once_with(2)
    faux_cursor.to_list.assert_awaited_once_with(length=2)
@pytest.mark.asyncio
async def test_count_projets_by_candidat():
    """Vérifie le nombre total de projets d'un candidat."""

    fausse_collection = MagicMock()
    fausse_collection.count_documents = AsyncMock(return_value=4)

    fausse_db = MagicMock()
    fausse_db.__getitem__.return_value = fausse_collection

    with patch(
        "portfolio_api.repositories.mongo_projets.get_mongo_db",
        return_value=fausse_db,
    ):
        total = await count_projets_by_candidat("andrea-vissoh")

    assert total == 4

    fausse_collection.count_documents.assert_awaited_once_with(
        {"auteurs": "andrea-vissoh"}
    )
@pytest.mark.asyncio
async def test_get_projets_recents():
    """Vérifie la récupération des projets les plus récents."""

    faux_documents = [
        {
            "projet_slug": "projet-recent",
            "titre": "Projet récent",
            "date_debut": "2026-10-01",
        },
        {
            "projet_slug": "projet-ancien",
            "titre": "Projet ancien",
            "date_debut": "2025-03-01",
        },
    ]

    faux_cursor = MagicMock()
    faux_cursor.sort.return_value = faux_cursor
    faux_cursor.limit.return_value = faux_cursor
    faux_cursor.to_list = AsyncMock(return_value=faux_documents)

    fausse_collection = MagicMock()
    fausse_collection.find.return_value = faux_cursor

    fausse_db = MagicMock()
    fausse_db.__getitem__.return_value = fausse_collection

    with patch(
        "portfolio_api.repositories.mongo_projets.get_mongo_db",
        return_value=fausse_db,
    ):
        resultat = await get_projets_recents(limit=2)

    assert len(resultat) == 2
    assert resultat[0].projet_slug == "projet-recent"
    assert resultat[1].projet_slug == "projet-ancien"

    fausse_collection.find.assert_called_once_with({})
    faux_cursor.sort.assert_called_once_with("date_debut", -1)
    faux_cursor.limit.assert_called_once_with(2)
    faux_cursor.to_list.assert_awaited_once_with(length=2)