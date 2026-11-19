"""Repository MongoDB — candidats et leurs projets (routes 1, 2, 3 et 8 de API_ROUTES.md).

Règle : ce module ne parle qu'à MongoDB et renvoie des dict (ou None).
Les documents suivent le format de ARCHITECTURE.md §3 (conversion faite par le seed).
"""

from __future__ import annotations

from portfolio_api.db.mongo import get_mongo_db


async def get_candidat(slug: str) -> dict | None:
    """Route 1 : renvoie le profil d'un candidat, ou None s'il n'existe pas."""
    db = get_mongo_db()
    return await db.candidats.find_one({"_id": slug}, {"_id": 0})


async def get_projets_candidat(
    slug: str, competence: str | None = None, page: int = 1, size: int = 20
) -> tuple[list[dict], int]:
    """Route 2 : projets d'un candidat (filtre compétence optionnel), triés par date_debut décroissante.

    Renvoie (projets de la page demandée, nombre total de projets correspondant au filtre).
    """
    db = get_mongo_db()

    filtre: dict = {"auteurs": slug}
    if competence:
        filtre["competences.skill_slug"] = competence

    curseur = (
        db.projets.find(filtre, {"_id": 0})
        .sort([("date_debut", -1), ("projet_slug", 1)])
        .skip((page - 1) * size)
        .limit(size)
    )
    items = await curseur.to_list()
    total = await db.projets.count_documents(filtre)
    return items, total


async def get_stats_candidat(slug: str) -> tuple[list[dict], int]:
    """Route 3 : statistiques par compétence sur les projets d'un candidat (pipeline ARCHITECTURE §3.4).

    Renvoie (stats par compétence triées par nb_projets décroissant puis skill_slug, nombre de projets).
    """
    db = get_mongo_db()
    pipeline = [
        # 1. Projets du candidat (index { auteurs: 1, date_debut: -1 })
        {"$match": {"auteurs": slug}},
        # 2. Ordre alphabétique des projets -> listes "projets" stables
        {"$sort": {"projet_slug": 1}},
        # 3. Un document par couple (projet, compétence)
        {"$unwind": "$competences"},
        # 4. Regroupement par compétence
        {"$group": {
            "_id": "$competences.skill_slug",
            "nom": {"$first": "$competences.nom"},
            "nb_projets": {"$sum": 1},
            "projets": {"$push": "$projet_slug"},
            "premiere_utilisation": {"$min": "$date_debut"},
            "derniere_utilisation": {"$max": "$date_debut"},
        }},
        # 5. Compétences les plus utilisées d'abord
        {"$sort": {"nb_projets": -1, "_id": 1}},
        # 6. Mise en forme de la sortie
        {"$project": {
            "_id": 0,
            "skill_slug": "$_id",
            "nom": 1,
            "nb_projets": 1,
            "projets": 1,
            "premiere_utilisation": 1,
            "derniere_utilisation": 1,
        }},
    ]
    curseur = await db.projets.aggregate(pipeline)
    competences = await curseur.to_list()
    nb_projets = await db.projets.count_documents({"auteurs": slug})
    return competences, nb_projets


async def get_projets_recents(limit: int = 5) -> list[dict]:
    """Route 8 : derniers projets de l'équipe, tous candidats confondus (index { date_debut: -1 })."""
    db = get_mongo_db()
    curseur = (
        db.projets.find({}, {"_id": 0})
        .sort([("date_debut", -1), ("projet_slug", 1)])
        .limit(limit)
    )
    return await curseur.to_list()
