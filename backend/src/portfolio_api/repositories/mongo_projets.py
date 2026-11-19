"""Repository MongoDB pour les projets du portfolio."""

from __future__ import annotations

from portfolio_api.db.mongo import get_mongo_db

from portfolio_api.models import ProjetOut

async def get_projet_by_slug(slug: str) -> ProjetOut | None:
    """Récupère un projet MongoDB à partir de son slug."""
    db = get_mongo_db()

    document = await db["projets"].find_one(
        {"projet_slug": slug}
    )

    if document is None:
        return None

    document.pop("_id", None)
    return ProjetOut.model_validate(document)

async def get_projets_by_slugs(slugs: list[str]) -> list[ProjetOut]:
    """Récupère plusieurs projets MongoDB dans l'ordre des slugs demandés."""

    if not slugs:
        return []

    db = get_mongo_db()

    cursor = db["projets"].find(
        {"projet_slug": {"$in": slugs}}
    )

    documents = await cursor.to_list(length=None)

    projets_par_slug = {
        document["projet_slug"]: ProjetOut.model_validate(document)
        for document in documents
    }

    return [
        projets_par_slug[slug]
        for slug in slugs
        if slug in projets_par_slug
    ]
async def get_projets_by_candidat(
    candidat_slug: str,
    page: int = 1,
    size: int = 10,
) -> list[ProjetOut]:
    """Récupère les projets d'un candidat avec pagination."""

    db = get_mongo_db()

    cursor = (
        db["projets"]
        .find({"auteurs": candidat_slug})
        .sort("date_debut", -1)
        .skip((page - 1) * size)
        .limit(size)
    )

    documents = await cursor.to_list(length=size)

    return [
        ProjetOut.model_validate(document)
        for document in documents
    ]
async def count_projets_by_candidat(candidat_slug: str) -> int:
    """Compte le nombre total de projets associés à un candidat."""

    db = get_mongo_db()

    total = await db["projets"].count_documents(
        {"auteurs": candidat_slug}
    )

    return total
async def get_projets_recents(
    limit: int = 10,
) -> list[ProjetOut]:
    """Récupère les projets les plus récents."""

    db = get_mongo_db()

    cursor = (
        db["projets"]
        .find({})
        .sort("date_debut", -1)
        .limit(limit)
    )

    documents = await cursor.to_list(length=limit)

    return [
        ProjetOut.model_validate(document)
        for document in documents
    ]