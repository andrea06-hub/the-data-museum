"""Tests unitaires — Connexion MongoDB.

Vérifie que le client et la base sont créés correctement à partir de la
configuration, sans ouvrir de vraie connexion (tout est mocké).

Commande (depuis backend/) :
    uv run pytest tests/unit/test_db_mongo.py -v

Fichier testé :
    backend/src/portfolio_api/db/mongo.py
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def reset_mongo_singleton():
    """Réinitialise le singleton avant et après chaque test."""
    import portfolio_api.db.mongo as mongo_module

    old_client = mongo_module._client
    mongo_module._client = None
    yield
    mongo_module._client = old_client


class TestGetMongoDb:
    """mongo.get_mongo_db() — client et base MongoDB."""

    def test_creates_client_with_url_and_returns_db(self):
        """Doit créer le client avec mongo_url et retourner client[mongo_db]."""
        from portfolio_api.db import mongo

        mock_settings = MagicMock()
        mock_settings.mongo_url = "mongodb://localhost:27018"
        mock_settings.mongo_db = "portfolio"
        mock_client = MagicMock()
        mock_db = MagicMock()
        mock_client.__getitem__ = MagicMock(return_value=mock_db)

        with (
            patch("portfolio_api.db.mongo.get_settings", return_value=mock_settings),
            patch(
                "portfolio_api.db.mongo.AsyncMongoClient",
                return_value=mock_client,
            ) as client_mock,
        ):
            db = mongo.get_mongo_db()

        assert db is mock_db
        client_mock.assert_called_once_with(
            "mongodb://localhost:27018",
            serverSelectionTimeoutMS=5000,
        )
        mock_client.__getitem__.assert_called_with("portfolio")

    def test_returns_same_db_on_second_call(self):
        """Doit réutiliser le même client (singleton)."""
        from portfolio_api.db import mongo

        mock_settings = MagicMock()
        mock_settings.mongo_url = "mongodb://localhost:27018"
        mock_settings.mongo_db = "portfolio"
        mock_db = MagicMock()
        mock_client = MagicMock()
        mock_client.__getitem__ = MagicMock(return_value=mock_db)

        with (
            patch("portfolio_api.db.mongo.get_settings", return_value=mock_settings),
            patch(
                "portfolio_api.db.mongo.AsyncMongoClient",
                return_value=mock_client,
            ) as client_mock,
        ):
            first = mongo.get_mongo_db()
            second = mongo.get_mongo_db()

        assert first is second
        client_mock.assert_called_once()  # un seul client créé


class TestCloseMongo:
    """mongo.close_mongo() — fermeture de la connexion."""

    async def test_closes_client_and_resets_singleton(self):
        """Doit fermer le client et remettre le singleton à None."""
        import portfolio_api.db.mongo as mongo

        mock_client = MagicMock()
        mock_client.close = AsyncMock()
        mongo._client = mock_client

        await mongo.close_mongo()

        mock_client.close.assert_awaited_once()
        assert mongo._client is None

    async def test_does_nothing_when_no_client(self):
        """Ne doit pas échouer si aucun client n'a été créé."""
        import portfolio_api.db.mongo as mongo

        await mongo.close_mongo()

        assert mongo._client is None