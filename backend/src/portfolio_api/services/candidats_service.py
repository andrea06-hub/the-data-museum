"""Service candidats — combine le repository Mongo et les modèles (routes 1, 2, 3 et 8 de API_ROUTES.md).

Règle : renvoie des modèles Pydantic, ou None si le candidat n'existe pas
(la route transforme None en 404). Aucune requête MongoDB ici.
"""

from __future__ import annotations

from portfolio_api.models import CandidatOut, ProjetsPage, ProjetsRecentsOut, StatsOut
from portfolio_api.repositories import mongo_candidats


async def get_profil(slug: str) -> CandidatOut | None:
    """Route 1 : profil, avec expériences et formations triées par debut décroissant."""
    candidat = await mongo_candidats.get_candidat(slug)
    if candidat is None:
        return None
    for cle in ("experiences", "formations"):
        candidat[cle] = sorted(
            candidat.get(cle, []), key=lambda e: e.get("debut") or "", reverse=True
        )
    return CandidatOut.model_validate(candidat)


async def get_projets(
    slug: str, competence: str | None = None, page: int = 1, size: int = 20
) -> ProjetsPage | None:
    """Route 2 : page de projets ; None si le candidat n'existe pas (et non liste vide)."""
    if await mongo_candidats.get_candidat(slug) is None:
        return None
    items, total = await mongo_candidats.get_projets_candidat(slug, competence, page, size)
    return ProjetsPage(items=items, total=total, page=page, size=size)


async def get_stats(slug: str) -> StatsOut | None:
    """Route 3 : statistiques par compétence ; None si le candidat n'existe pas."""
    if await mongo_candidats.get_candidat(slug) is None:
        return None
    competences, nb_projets = await mongo_candidats.get_stats_candidat(slug)
    return StatsOut(
        candidat_slug=slug,
        nb_projets=nb_projets,
        nb_competences=len(competences),
        competences=competences,
    )


async def get_projets_recents(limit: int = 5) -> ProjetsRecentsOut:
    """Route 8 : derniers projets de l'équipe (jamais de 404)."""
    return ProjetsRecentsOut(items=await mongo_candidats.get_projets_recents(limit))
