"""Repository MongoDB — accès unitaires aux projets (routes 4 et hydratation).

Règle : ce module ne parle qu'à MongoDB et renvoie des dict (ou None).
Les documents suivent le format de ARCHITECTURE.md §3 (conversion faite par le seed).

Les lectures par candidat (R2) et le flux "projets récents" (R8) sont dans
``mongo_candidats.py`` : elles font partie du parcours candidat et partagent les mêmes
index. Ce module se limite donc à la lecture par identifiant de projet (R4 et détail).
"""

from __future__ import annotations

from portfolio_api.db.mongo import get_mongo_db


async def get_projet_by_slug(slug: str) -> dict | None:
    """Renvoie un projet par son ``projet_slug``, ou ``None`` s'il n'existe pas."""
    db = get_mongo_db()
    return await db.projets.find_one({"_id": slug}, {"_id": 0})


async def get_projets_by_slugs(slugs: list[str]) -> list[dict]:
    """Renvoie plusieurs projets dans l'ordre des slugs demandés.

    Utilisé par la Route 4 pour hydrater les projets similaires remontés par Neo4j :
    Neo4j donne une liste ordonnée de ``projet_slug``, ce repo renvoie les fiches
    MongoDB dans le même ordre. Les slugs inconnus sont silencieusement ignorés.
    """
    if not slugs:
        return []

    db = get_mongo_db()
    curseur = db.projets.find({"_id": {"$in": slugs}}, {"_id": 0})
    documents = await curseur.to_list()

    projets_par_slug = {doc["projet_slug"]: doc for doc in documents}
    return [projets_par_slug[slug] for slug in slugs if slug in projets_par_slug]
