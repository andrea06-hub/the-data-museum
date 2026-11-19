"""Repository Neo4j — traversées de graphe (routes 4, 5, 6, 7, 9 de API_ROUTES.md).

Règle : ce module ne parle qu'à Neo4j et renvoie des dict / list[dict].
Les propriétés des nœuds suivent ARCHITECTURE.md §4 :
- (:Candidat {candidat_slug, prenom, nom})
- (:Projet {projet_slug, titre, date_debut})
- (:Competence {skill_slug, nom})

La vérification d'existence (404) et l'hydratation finale (contacts, bio, auteurs…)
sont assurées par la couche service, qui compose ce repo avec MongoDB.
"""

from __future__ import annotations

from portfolio_api.db.neo4j import get_neo4j_session


# ---------------------------------------------------------------------------
# R4 : GET /api/graph/projets/{slug}/similaires
# ---------------------------------------------------------------------------
async def get_similar_projects(projet_slug: str, limit: int = 5) -> list[dict]:
    """Projets partageant au moins une compétence avec ``projet_slug``.

    Retourne une liste triée par score décroissant puis ``projet_slug`` :
    ``[{projet_slug, titre, date_debut, score, competences_communes}, ...]``.

    Liste vide si le projet n'a aucun similaire. L'existence du projet source
    est vérifiée côté service (MongoDB = source de vérité).
    """
    cypher = """
    MATCH (p:Projet {projet_slug: $projet_slug})-[:UTILISE]->(s:Competence)
          <-[:UTILISE]-(autre:Projet)
    WHERE autre <> p
    WITH autre, collect(DISTINCT s.skill_slug) AS competences_communes
    RETURN autre.projet_slug AS projet_slug,
           autre.titre AS titre,
           autre.date_debut AS date_debut,
           competences_communes,
           size(competences_communes) AS score
    ORDER BY score DESC, projet_slug ASC
    LIMIT $limit
    """
    async with get_neo4j_session() as session:
        result = await session.run(cypher, projet_slug=projet_slug, limit=limit)
        return [record.data() async for record in result]


# ---------------------------------------------------------------------------
# R5 : GET /api/graph/competences/{slug}  (candidat_slug)
# ---------------------------------------------------------------------------
async def get_candidate_graph_rows(candidat_slug: str) -> dict | None:
    """Lignes brutes pour construire le graphe (projet, compétence) d'un candidat.

    Retourne :
    - ``None`` si le candidat n'existe pas dans Neo4j
    - ``{candidat: {candidat_slug, prenom, nom}, rows: [...]}`` sinon
      Chaque ligne : ``{projet_slug, projet_titre, skill_slug, skill_nom}``.
      Liste vide si le candidat n'a aucun projet.

    La couche service convertit ces lignes en ``nodes`` + ``links`` (dédoublonnage
    des nœuds projet/compétence et calcul de ``nb_projets`` par compétence).
    """
    cypher = """
    MATCH (c:Candidat {candidat_slug: $candidat_slug})
    OPTIONAL MATCH (c)-[:A_REALISE]->(p:Projet)-[:UTILISE]->(s:Competence)
    RETURN c.candidat_slug AS candidat_slug,
           c.prenom AS prenom,
           c.nom AS nom,
           collect(
               CASE WHEN p IS NOT NULL AND s IS NOT NULL THEN {
                   projet_slug: p.projet_slug,
                   projet_titre: p.titre,
                   skill_slug: s.skill_slug,
                   skill_nom: s.nom
               } END
           ) AS rows
    """
    async with get_neo4j_session() as session:
        result = await session.run(cypher, candidat_slug=candidat_slug)
        record = await result.single()

    if record is None:
        return None

    data = record.data()
    return {
        "candidat": {
            "candidat_slug": data["candidat_slug"],
            "prenom": data["prenom"],
            "nom": data["nom"],
        },
        "rows": [row for row in data["rows"] if row is not None],
    }


# ---------------------------------------------------------------------------
# R6 : GET /api/graph/competences/communes
# ---------------------------------------------------------------------------
async def get_common_skills(candidat_slugs: list[str]) -> list[dict]:
    """Compétences utilisées par **tous** les candidats listés (via leurs projets).

    Retourne ``[{skill_slug, nom}, ...]`` trié par ``nom`` (ordre déterministe).
    Liste vide si aucune compétence n'est commune à tous.

    La validation « au moins 2 candidats » et le 404 « slug inconnu » sont
    gérés par la couche service.
    """
    uniques = list(dict.fromkeys(candidat_slugs))
    cypher = """
    MATCH (c:Candidat)-[:A_REALISE]->(:Projet)-[:UTILISE]->(s:Competence)
    WHERE c.candidat_slug IN $candidats
    WITH s, collect(DISTINCT c.candidat_slug) AS membres
    WHERE size(membres) = $nb_attendu
    RETURN s.skill_slug AS skill_slug, s.nom AS nom
    ORDER BY nom ASC, skill_slug ASC
    """
    async with get_neo4j_session() as session:
        result = await session.run(cypher, candidats=uniques, nb_attendu=len(uniques))
        return [record.data() async for record in result]


# ---------------------------------------------------------------------------
# R7 : GET /api/graph/candidats/{slug}/competences-transversales
# ---------------------------------------------------------------------------
async def get_transversal_skills(
    candidat_slug: str, min_projets: int = 2
) -> list[dict] | None:
    """Compétences du candidat utilisées dans ≥ ``min_projets`` de ses projets.

    Retourne :
    - ``None`` si le candidat n'existe pas
    - ``[{skill_slug, nom, nb_projets, projets}, ...]`` sinon, trié par
      ``nb_projets`` décroissant puis ``nom``. Liste vide si rien ne dépasse le seuil.
    """
    cypher = """
    MATCH (c:Candidat {candidat_slug: $candidat_slug})
    OPTIONAL MATCH (c)-[:A_REALISE]->(p:Projet)-[:UTILISE]->(s:Competence)
    WITH c, s, collect(DISTINCT p.projet_slug) AS projets
    WHERE s IS NULL OR size(projets) >= $min_projets
    WITH c,
         CASE WHEN s IS NULL THEN NULL ELSE {
             skill_slug: s.skill_slug,
             nom: s.nom,
             nb_projets: size(projets),
             projets: projets
         } END AS competence
    RETURN c.candidat_slug AS candidat_slug,
           collect(competence) AS competences
    """
    async with get_neo4j_session() as session:
        result = await session.run(
            cypher, candidat_slug=candidat_slug, min_projets=min_projets
        )
        record = await result.single()

    if record is None:
        return None

    competences = [c for c in record["competences"] if c is not None]
    # Tri Python (plus simple et déterministe que dans Cypher avec des collect).
    for c in competences:
        c["projets"].sort()
    competences.sort(key=lambda c: (-c["nb_projets"], c["nom"] or c["skill_slug"]))
    return competences


# ---------------------------------------------------------------------------
# R9 : GET /api/competences/{slug}/preuves
# ---------------------------------------------------------------------------
async def get_skill_proofs(skill_slug: str) -> dict | None:
    """Candidats et leurs projets qui mobilisent la compétence ``skill_slug``.

    Retourne :
    - ``None`` si la compétence n'existe pas dans Neo4j
    - ``{skill_slug, nom, candidats: [{candidat_slug, nb_projets, projets:[{projet_slug, titre}]}, ...]}``
      sinon. Tri par ``nb_projets`` décroissant puis ``candidat_slug``.

    Les champs ``prenom``, ``nom``, ``titre`` du candidat seront hydratés depuis
    MongoDB côté service (ARCHITECTURE §5 : contenu = source de vérité MongoDB).
    """
    cypher = """
    MATCH (s:Competence {skill_slug: $skill_slug})
    OPTIONAL MATCH (c:Candidat)-[:A_REALISE]->(p:Projet)-[:UTILISE]->(s)
    WITH s, c, collect(DISTINCT {projet_slug: p.projet_slug, titre: p.titre}) AS projets
    WITH s,
         CASE WHEN c IS NULL THEN NULL ELSE {
             candidat_slug: c.candidat_slug,
             nb_projets: size(projets),
             projets: projets
         } END AS candidat_bloc
    RETURN s.skill_slug AS skill_slug,
           s.nom AS nom,
           collect(candidat_bloc) AS candidats
    """
    async with get_neo4j_session() as session:
        result = await session.run(cypher, skill_slug=skill_slug)
        record = await result.single()

    if record is None:
        return None

    data = record.data()
    candidats = [c for c in data["candidats"] if c is not None]
    # Tri des projets de chaque candidat par projet_slug (déterminisme)
    for cand in candidats:
        cand["projets"].sort(key=lambda proj: proj["projet_slug"])
    candidats.sort(key=lambda c: (-c["nb_projets"], c["candidat_slug"]))
    return {
        "skill_slug": data["skill_slug"],
        "nom": data["nom"],
        "candidats": candidats,
    }
