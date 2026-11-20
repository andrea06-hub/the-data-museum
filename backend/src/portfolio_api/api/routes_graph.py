"""Routes graphe & compétences — routes 4, 5, 6, 7 et 9 de API_ROUTES.md.

Règle : la route gère uniquement le HTTP (paramètres, codes 400/404/422, validation) ;
l'orchestration Neo4j + MongoDB est dans services/graph_service.py qui renvoie
``dict | None`` (``None`` = ressource introuvable → 404 ici).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from portfolio_api.models import (
    CompetencesCommunesOut,
    GraphOut,
    PreuvesOut,
    SimilairesOut,
    TransversalesOut,
)
from portfolio_api.services import graph_service

router = APIRouter()


@router.get(
    "/graph/projets/{slug}/similaires",
    response_model=SimilairesOut,
    tags=["graphe"],
)
async def get_projets_similaires(
    slug: str,
    limit: int = Query(5, ge=1, le=20, description="Nombre max de projets similaires"),
) -> SimilairesOut:
    """Route 4 : projets similaires par compétences partagées (Neo4j + MongoDB)."""
    data = await graph_service.get_projets_similaires(slug, limit=limit)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Projet '{slug}' introuvable")
    return data


# IMPORTANT : déclarer /graph/competences/communes (R6) AVANT /graph/competences/{slug} (R5)
@router.get(
    "/graph/competences/communes",
    response_model=CompetencesCommunesOut,
    tags=["graphe"],
)
async def get_competences_communes(
    candidats: str = Query(
        ...,
        description="Slugs candidats séparés par des virgules (2 minimum), ex. alice-martin,bob-durand",
    ),
) -> CompetencesCommunesOut:
    """Route 6 : compétences communes entre plusieurs candidats (Neo4j)."""
    slugs = list(
        dict.fromkeys(s.strip() for s in candidats.split(",") if s.strip())
    )
    if len(slugs) < 2:
        raise HTTPException(status_code=400, detail="Au moins 2 candidats sont requis")

    data = await graph_service.get_competences_communes(slugs)
    if data is None:
        raise HTTPException(
            status_code=404, detail="Au moins un des candidats est introuvable"
        )
    return data


@router.get(
    "/graph/competences/{slug}",
    response_model=GraphOut,
    response_model_exclude_none=True,
    tags=["graphe"],
)
async def get_graphe_competences(slug: str) -> GraphOut:
    """Route 5 : graphe nodes + links prêt à afficher pour un candidat (Neo4j)."""
    data = await graph_service.get_graphe_competences(slug)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Candidat '{slug}' introuvable")
    return data


@router.get(
    "/graph/candidats/{slug}/competences-transversales",
    response_model=TransversalesOut,
    tags=["graphe"],
)
async def get_competences_transversales(
    slug: str,
    min_projets: int = Query(
        2, ge=1, description="Nombre minimum de projets utilisant la compétence"
    ),
) -> TransversalesOut:
    """Route 7 : compétences d'un candidat utilisées dans plusieurs projets (Neo4j)."""
    data = await graph_service.get_competences_transversales(slug, min_projets=min_projets)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Candidat '{slug}' introuvable")
    return data


@router.get(
    "/competences/{slug}/preuves",
    response_model=PreuvesOut,
    tags=["compétences"],
)
async def get_preuves_competence(slug: str) -> PreuvesOut:
    """Route 9 : candidats et projets prouvant une compétence (Neo4j + MongoDB)."""
    data = await graph_service.get_preuves_competence(slug)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Compétence '{slug}' introuvable")
    return data
