"""Connexion Neo4j (singleton AsyncDriver)."""

from __future__ import annotations

from neo4j import AsyncDriver, AsyncGraphDatabase, AsyncSession

from portfolio_api.core.config import get_settings

_driver: AsyncDriver | None = None


def get_neo4j_driver() -> AsyncDriver:
    """Retourne le driver Neo4j asynchrone (créé une seule fois)."""
    global _driver
    if _driver is None:
        settings = get_settings()
        _driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
    return _driver


def get_neo4j_session() -> AsyncSession:
    """Ouvre une session Neo4j sur le driver singleton.

    Utiliser dans un ``async with`` :

        async with get_neo4j_session() as session:
            result = await session.run(cypher, params)
    """
    return get_neo4j_driver().session()


async def close_neo4j() -> None:
    """Ferme le driver (appelé à l'arrêt de l'API)."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None
