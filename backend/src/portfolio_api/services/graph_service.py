"""Service d'orchestration graphe & hybride Neo4j + MongoDB (Lot C2 — routes R4, R5, R6, R7, R9).

Règles d'architecture (ARCHITECTURE.md §5) :
- MongoDB est la source de vérité du contenu (existence des candidats/projets, titres,
  dates, auteurs, identité) ;
- Neo4j porte la topologie des relations (projets similaires, graphe de compétences,
  compétences communes et transversales) ;
- Tout slug remonté par Neo4j sans fiche correspondante dans MongoDB est ignoré.

Convention : chaque fonction renvoie ``dict`` ou ``None``. ``None`` signale une
ressource introuvable, le router D2 transforme ce ``None`` en ``HTTPException(404)``.
Les validations de paramètres (min 2 candidats pour R6, bornes de ``limit``…) sont
assurées par la couche HTTP via ``Query(...)``.
"""

from __future__ import annotations

from portfolio_api.repositories import neo4j_graph
from portfolio_api.repositories.mongo_candidats import get_candidat
from portfolio_api.repositories.mongo_projets import (
    get_projet_by_slug,
    get_projets_by_slugs,
)


# ---------------------------------------------------------------------------
# R4 : GET /api/graph/projets/{slug}/similaires
# ---------------------------------------------------------------------------
async def get_projets_similaires(projet_slug: str, limit: int = 5) -> dict | None:
    """Orchestre Neo4j (score + compétences communes) et MongoDB (métadonnées projet).

    Renvoie ``None`` si le projet source n'existe pas dans MongoDB.
    Renvoie ``{projet_slug, similaires: []}`` si le projet existe mais n'a aucun similaire.
    """
    projet_source = await get_projet_by_slug(projet_slug)
    if projet_source is None:
        return None

    raw_similaires = await neo4j_graph.get_similar_projects(projet_slug, limit=limit)
    if not raw_similaires:
        return {"projet_slug": projet_slug, "similaires": []}

    sim_slugs = [item["projet_slug"] for item in raw_similaires]
    projets_mongo = await get_projets_by_slugs(sim_slugs)
    docs_par_slug = {doc["projet_slug"]: doc for doc in projets_mongo}

    similaires: list[dict] = []
    for item in raw_similaires:
        slug = item["projet_slug"]
        doc = docs_par_slug.get(slug)
        if doc is None:
            # Gouvernance §5 : on ignore les slugs Neo4j sans fiche MongoDB
            continue
        similaires.append(
            {
                "projet_slug": slug,
                "titre": doc["titre"],
                "date_debut": doc.get("date_debut"),
                "auteurs": doc.get("auteurs", []),
                "score": item["score"],
                "competences_communes": item["competences_communes"],
            }
        )

    return {
        "projet_slug": projet_slug,
        "similaires": similaires,
    }


# ---------------------------------------------------------------------------
# R5 : GET /api/graph/competences/{slug}
# ---------------------------------------------------------------------------
async def get_graphe_competences(candidat_slug: str) -> dict | None:
    """Construit le graphe ``nodes`` + ``links`` prêt à afficher pour un candidat.

    Renvoie ``None`` si le candidat n'existe pas dans MongoDB. Un candidat sans
    projet renvoie uniquement son nœud et ``links: []``.
    """
    candidat_mongo = await get_candidat(candidat_slug)
    if candidat_mongo is None:
        return None

    graph_data = await neo4j_graph.get_candidate_graph_rows(candidat_slug)

    prenom = candidat_mongo.get("prenom", "")
    nom = candidat_mongo.get("nom", "")
    candidat_label = f"{prenom} {nom}".strip() or candidat_slug

    nodes: list[dict] = [
        {
            "id": f"candidat:{candidat_slug}",
            "type": "candidat",
            "label": candidat_label,
        }
    ]

    rows = graph_data["rows"] if graph_data is not None else []
    if not rows:
        return {
            "candidat_slug": candidat_slug,
            "nodes": nodes,
            "links": [],
        }

    projets_vus: dict[str, str] = {}
    competences_vues: dict[str, dict] = {}
    liens_candidat_projet: set[tuple[str, str]] = set()
    liens_projet_competence: set[tuple[str, str]] = set()

    for row in rows:
        p_slug = row["projet_slug"]
        p_titre = row.get("projet_titre") or p_slug
        s_slug = row["skill_slug"]
        s_nom = row.get("skill_nom") or s_slug

        projets_vus[p_slug] = p_titre

        if s_slug not in competences_vues:
            competences_vues[s_slug] = {"nom": s_nom, "projets": set()}
        competences_vues[s_slug]["projets"].add(p_slug)

        liens_candidat_projet.add((candidat_slug, p_slug))
        liens_projet_competence.add((p_slug, s_slug))

    for p_slug in sorted(projets_vus):
        nodes.append(
            {
                "id": f"projet:{p_slug}",
                "type": "projet",
                "label": projets_vus[p_slug],
            }
        )

    competences_triees = sorted(
        competences_vues.items(),
        key=lambda item: (-len(item[1]["projets"]), item[0]),
    )
    for s_slug, info in competences_triees:
        nodes.append(
            {
                "id": f"competence:{s_slug}",
                "type": "competence",
                "label": info["nom"],
                "nb_projets": len(info["projets"]),
            }
        )

    links: list[dict] = [
        {
            "source": f"candidat:{c_slug}",
            "target": f"projet:{p_slug}",
            "type": "A_REALISE",
        }
        for c_slug, p_slug in sorted(liens_candidat_projet)
    ] + [
        {
            "source": f"projet:{p_slug}",
            "target": f"competence:{s_slug}",
            "type": "UTILISE",
        }
        for p_slug, s_slug in sorted(liens_projet_competence)
    ]

    return {
        "candidat_slug": candidat_slug,
        "nodes": nodes,
        "links": links,
    }


# ---------------------------------------------------------------------------
# R6 : GET /api/graph/competences/communes
# ---------------------------------------------------------------------------
async def get_competences_communes(candidat_slugs: list[str]) -> dict | None:
    """Retourne les compétences utilisées par tous les candidats listés.

    Renvoie ``None`` si au moins un des slugs n'existe pas dans MongoDB. La
    validation « au moins 2 candidats distincts » est faite côté router (400),
    ici on travaille avec la liste déjà dédoublonnée.
    """
    for slug in candidat_slugs:
        if await get_candidat(slug) is None:
            return None

    communes = await neo4j_graph.get_common_skills(candidat_slugs)
    return {
        "candidats": candidat_slugs,
        "competences_communes": communes,
    }


# ---------------------------------------------------------------------------
# R7 : GET /api/graph/candidats/{slug}/competences-transversales
# ---------------------------------------------------------------------------
async def get_competences_transversales(
    candidat_slug: str, min_projets: int = 2
) -> dict | None:
    """Retourne les compétences d'un candidat mobilisées sur au moins ``min_projets``.

    Renvoie ``None`` si le candidat n'existe pas dans MongoDB.
    """
    if await get_candidat(candidat_slug) is None:
        return None

    competences = await neo4j_graph.get_transversal_skills(
        candidat_slug, min_projets=min_projets
    )
    return {
        "candidat_slug": candidat_slug,
        "min_projets": min_projets,
        "competences": competences if competences is not None else [],
    }


# ---------------------------------------------------------------------------
# R9 : GET /api/competences/{slug}/preuves
# ---------------------------------------------------------------------------
async def get_preuves_competence(skill_slug: str) -> dict | None:
    """Orchestre Neo4j (candidats + projets liés) et MongoDB (identité + titres).

    Renvoie ``None`` si la compétence n'existe pas dans Neo4j (aucun projet ne
    l'utilise).
    """
    raw_proofs = await neo4j_graph.get_skill_proofs(skill_slug)
    if raw_proofs is None:
        return None

    tous_projet_slugs = list(
        dict.fromkeys(
            proj["projet_slug"]
            for cand in raw_proofs["candidats"]
            for proj in cand["projets"]
        )
    )
    projets_mongo = await get_projets_by_slugs(tous_projet_slugs)
    projets_par_slug = {doc["projet_slug"]: doc for doc in projets_mongo}

    candidats_hydrates: list[dict] = []
    for cand_bloc in raw_proofs["candidats"]:
        c_slug = cand_bloc["candidat_slug"]
        cand_doc = await get_candidat(c_slug)
        if cand_doc is None:
            continue

        projets_hydrates = [
            {
                "projet_slug": proj["projet_slug"],
                "titre": projets_par_slug[proj["projet_slug"]]["titre"],
            }
            for proj in cand_bloc["projets"]
            if proj["projet_slug"] in projets_par_slug
        ]
        if not projets_hydrates:
            continue

        candidats_hydrates.append(
            {
                "candidat_slug": c_slug,
                "prenom": cand_doc["prenom"],
                "nom": cand_doc["nom"],
                "titre": cand_doc.get("titre", ""),
                "nb_projets": len(projets_hydrates),
                "projets": projets_hydrates,
            }
        )

    candidats_hydrates.sort(key=lambda c: (-c["nb_projets"], c["candidat_slug"]))

    return {
        "skill_slug": raw_proofs["skill_slug"],
        "nom": raw_proofs["nom"],
        "candidats": candidats_hydrates,
    }
