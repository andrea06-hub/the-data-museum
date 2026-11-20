"""Routes candidats — routes 1, 2, 3 et 8 de API_ROUTES.md.

Règle : la route gère uniquement le HTTP (paramètres, 404, 422) ;
la logique est dans services/candidats_service.py.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from portfolio_api.models import CandidatOut, ProjetsPage, ProjetsRecentsOut, StatsOut
from portfolio_api.services import candidats_service

router = APIRouter()


def _candidat_introuvable(slug: str) -> HTTPException:
    return HTTPException(status_code=404, detail=f"Candidat '{slug}' introuvable")


@router.get("/candidats/{slug}", response_model=CandidatOut, tags=["candidats"])
async def get_candidat(slug: str) -> CandidatOut:
    """Route 1 : profil et timeline d'un candidat."""
    profil = await candidats_service.get_profil(slug)
    if profil is None:
        raise _candidat_introuvable(slug)
    return profil


@router.get("/candidats/{slug}/projets", response_model=ProjetsPage, tags=["candidats"])
async def get_projets_candidat(
    slug: str,
    competence: str | None = Query(None, description="skill_slug, ex. mongodb"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> ProjetsPage:
    """Route 2 : projets d'un candidat, filtre optionnel par compétence, paginés."""
    projets = await candidats_service.get_projets(slug, competence, page, size)
    if projets is None:
        raise _candidat_introuvable(slug)
    return projets


@router.get("/candidats/{slug}/stats", response_model=StatsOut, tags=["candidats"])
async def get_stats_candidat(slug: str) -> StatsOut:
    """Route 3 : statistiques par compétence (agrégation MongoDB)."""
    stats = await candidats_service.get_stats(slug)
    if stats is None:
        raise _candidat_introuvable(slug)
    return stats


@router.get("/projets/recents", response_model=ProjetsRecentsOut, tags=["projets"])
async def get_projets_recents(limit: int = Query(5, ge=1, le=50)) -> ProjetsRecentsOut:
    """Route 8 : derniers projets de l'équipe."""
    return await candidats_service.get_projets_recents(limit)
