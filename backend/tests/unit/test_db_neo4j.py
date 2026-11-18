"""Tests unitaires — Connexion Neo4j.

Vérifie que le driver et les sessions sont créés correctement à partir de la
configuration, sans ouvrir de vraie connexion (tout est mocké).

Commande (depuis backend/) :
    uv run pytest tests/unit/test_db_neo4j.py -v

Fichier testé :
    backend/src/portfolio_api/db/neo4j.py
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def reset_neo4j_singleton():
    """Réinitialise le singleton avant et après chaque test."""
    import portfolio_api.db.neo4j as neo4j_module

    old_driver = neo4j_module._driver
    neo4j_module._driver = None
    yield
    neo4j_module._driver = old_driver


class TestGetNeo4jDriver:
    """neo4j.get_neo4j_driver() — création du driver."""

    def test_creates_driver_with_uri_and_auth(self):
        """Doit créer le driver avec neo4j_uri et (user, password)."""
        from portfolio_api.db import neo4j

        mock_settings = MagicMock()
        mock_settings.neo4j_uri = "bolt://localhost:7688"
        mock_settings.neo4j_user = "neo4j"
        mock_settings.neo4j_password = "password"
        mock_driver = MagicMock()

        with (
            patch("portfolio_api.db.neo4j.get_settings", return_value=mock_settings),
            patch(
                "portfolio_api.db.neo4j.AsyncGraphDatabase.driver",
                return_value=mock_driver,
            ) as driver_mock,
        ):
            driver = neo4j.get_neo4j_driver()

        assert driver is mock_driver
        driver_mock.assert_called_once_with(
            "bolt://localhost:7688",
            auth=("neo4j", "password"),
        )

    def test_returns_same_driver_on_second_call(self):
        """Doit réutiliser le même driver (singleton)."""
        from portfolio_api.db import neo4j

        mock_settings = MagicMock()
        mock_settings.neo4j_uri = "bolt://localhost:7688"
        mock_settings.neo4j_user = "neo4j"
        mock_settings.neo4j_password = "password"
        mock_driver = MagicMock()

        with (
            patch("portfolio_api.db.neo4j.get_settings", return_value=mock_settings),
            patch(
                "portfolio_api.db.neo4j.AsyncGraphDatabase.driver",
                return_value=mock_driver,
            ) as driver_mock,
        ):
            first = neo4j.get_neo4j_driver()
            second = neo4j.get_neo4j_driver()

        assert first is second
        driver_mock.assert_called_once()  # un seul driver créé


class TestGetNeo4jSession:
    """neo4j.get_neo4j_session() — ouverture d'une session sur le driver singleton."""

    def test_opens_session_on_singleton_driver(self):
        """Doit déléguer à driver.session() sans créer un nouveau driver."""
        from portfolio_api.db import neo4j

        mock_session = MagicMock()
        mock_driver = MagicMock()
        mock_driver.session = MagicMock(return_value=mock_session)
        neo4j._driver = mock_driver

        session = neo4j.get_neo4j_session()

        assert session is mock_session
        mock_driver.session.assert_called_once_with()


class TestCloseNeo4j:
    """neo4j.close_neo4j() — fermeture du driver."""

    async def test_closes_driver_and_resets_singleton(self):
        """Doit fermer le driver et remettre le singleton à None."""
        import portfolio_api.db.neo4j as neo4j

        mock_driver = MagicMock()
        mock_driver.close = AsyncMock()
        neo4j._driver = mock_driver

        await neo4j.close_neo4j()

        mock_driver.close.assert_awaited_once()
        assert neo4j._driver is None

    async def test_does_nothing_when_no_driver(self):
        """Ne doit pas échouer si aucun driver n'a été créé."""
        import portfolio_api.db.neo4j as neo4j

        await neo4j.close_neo4j()

        assert neo4j._driver is None
