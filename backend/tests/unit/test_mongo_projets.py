"""Tests unitaires — repository MongoDB des projets (mongo_projets.py)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestGetProjetBySlug:
    """get_projet_by_slug — lecture unitaire par ``projet_slug``."""

    @pytest.mark.asyncio
    async def test_projet_existant(self):
        """Un projet existant est renvoyé tel quel, sans le champ ``_id``."""
        from portfolio_api.repositories.mongo_projets import get_projet_by_slug

        faux_projet = {
            "projet_slug": "smartcity-explorer",
            "titre": "SmartCity Explorer",
            "description": "Projet de visualisation de données urbaines.",
            "auteurs": ["andrea-vissoh"],
            "competences": [{"skill_slug": "python", "nom": "Python"}],
        }

        fausse_collection = MagicMock()
        fausse_collection.find_one = AsyncMock(return_value=faux_projet)
        fausse_db = MagicMock()
        fausse_db.projets = fausse_collection

        with patch(
            "portfolio_api.repositories.mongo_projets.get_mongo_db",
            return_value=fausse_db,
        ):
            resultat = await get_projet_by_slug("smartcity-explorer")

        assert resultat == faux_projet
        fausse_collection.find_one.assert_awaited_once_with(
            {"_id": "smartcity-explorer"}, {"_id": 0}
        )

    @pytest.mark.asyncio
    async def test_projet_inexistant(self):
        """Un projet absent renvoie ``None``."""
        from portfolio_api.repositories.mongo_projets import get_projet_by_slug

        fausse_collection = MagicMock()
        fausse_collection.find_one = AsyncMock(return_value=None)
        fausse_db = MagicMock()
        fausse_db.projets = fausse_collection

        with patch(
            "portfolio_api.repositories.mongo_projets.get_mongo_db",
            return_value=fausse_db,
        ):
            resultat = await get_projet_by_slug("projet-inexistant")

        assert resultat is None
        fausse_collection.find_one.assert_awaited_once_with(
            {"_id": "projet-inexistant"}, {"_id": 0}
        )


class TestGetProjetsBySlugs:
    """get_projets_by_slugs — lecture en lot, ordre d'entrée préservé."""

    @pytest.mark.asyncio
    async def test_liste_vide_ne_fait_aucune_requete(self):
        """Une liste vide ne doit même pas ouvrir de connexion Mongo."""
        from portfolio_api.repositories.mongo_projets import get_projets_by_slugs

        with patch(
            "portfolio_api.repositories.mongo_projets.get_mongo_db"
        ) as mock_get_db:
            resultat = await get_projets_by_slugs([])

        assert resultat == []
        mock_get_db.assert_not_called()

    @pytest.mark.asyncio
    async def test_respecte_ordre_des_slugs_demandes(self):
        """Le résultat suit l'ordre des slugs passés, pas l'ordre MongoDB."""
        from portfolio_api.repositories.mongo_projets import get_projets_by_slugs

        # MongoDB renvoie dans un ordre arbitraire (ici alphabétique)
        documents_mongo = [
            {"projet_slug": "projet-a", "titre": "Projet A"},
            {"projet_slug": "projet-b", "titre": "Projet B"},
        ]

        faux_cursor = MagicMock()
        faux_cursor.to_list = AsyncMock(return_value=documents_mongo)
        fausse_collection = MagicMock()
        fausse_collection.find = MagicMock(return_value=faux_cursor)
        fausse_db = MagicMock()
        fausse_db.projets = fausse_collection

        with patch(
            "portfolio_api.repositories.mongo_projets.get_mongo_db",
            return_value=fausse_db,
        ):
            resultat = await get_projets_by_slugs(["projet-b", "projet-a"])

        assert [p["projet_slug"] for p in resultat] == ["projet-b", "projet-a"]
        fausse_collection.find.assert_called_once_with(
            {"_id": {"$in": ["projet-b", "projet-a"]}}, {"_id": 0}
        )

    @pytest.mark.asyncio
    async def test_slugs_inconnus_ignores_silencieusement(self):
        """Les slugs qui n'existent pas dans Mongo sont filtrés, pas d'erreur."""
        from portfolio_api.repositories.mongo_projets import get_projets_by_slugs

        documents_mongo = [{"projet_slug": "projet-a", "titre": "Projet A"}]

        faux_cursor = MagicMock()
        faux_cursor.to_list = AsyncMock(return_value=documents_mongo)
        fausse_collection = MagicMock()
        fausse_collection.find = MagicMock(return_value=faux_cursor)
        fausse_db = MagicMock()
        fausse_db.projets = fausse_collection

        with patch(
            "portfolio_api.repositories.mongo_projets.get_mongo_db",
            return_value=fausse_db,
        ):
            resultat = await get_projets_by_slugs(
                ["projet-fantome", "projet-a", "autre-fantome"]
            )

        assert [p["projet_slug"] for p in resultat] == ["projet-a"]
