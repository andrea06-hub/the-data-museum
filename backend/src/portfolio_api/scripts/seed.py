"""Peuple MongoDB et Neo4j avec les vraies données de l'équipe (dossier data/).

Caractéristiques (critères Jalon 2) :
- Une seule commande : ``just seed`` (ou ``python -m portfolio_api.scripts.seed``).
- Idempotent : relancer le seed produit le même état, pas de doublons.
- Reproductible machine neuve après ``just up`` (bases vides).

Conversion data → ARCHITECTURE §3 (MongoDB) et §4 (Neo4j) :
- candidats : ``_id = candidat_slug``, ``liens.{email,github,linkedin} → contacts``.
- projets : ``_id = projet_slug``, ``candidat_slugs → auteurs``,
  ``competences: [slug]`` → ``[{skill_slug, nom}]`` (nom résolu dans l'ordre :
  table d'alias → nom déclaré par un candidat → titlecase du slug).
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from portfolio_api.db.mongo import close_mongo, get_mongo_db
from portfolio_api.db.neo4j import close_neo4j, get_neo4j_session

DATA_DIR = Path(__file__).resolve().parents[4] / "data"

# Alias pour les slugs techniques dont le casing "humain" ne suit pas le titlecase.
# Les slugs non déclarés par un candidat et absents d'ici tombent sur titlecase.
ALIAS_NOMS_COMPETENCES: dict[str, str] = {
    "mongodb": "MongoDB",
    "neo4j": "Neo4j",
    "fastapi": "FastAPI",
    "nodejs": "Node.js",
    "nextjs": "Next.js",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "sqlite": "SQLite",
    "powerbi": "Power BI",
    "power-apps": "Power Apps",
    "power-automate": "Power Automate",
    "power-query": "Power Query",
    "html": "HTML",
    "css": "CSS",
    "sql": "SQL",
    "nosql": "NoSQL",
    "php": "PHP",
    "sas": "SAS",
    "api": "API",
    "api-rest": "API REST",
    "ci-cd": "CI/CD",
    "etl": "ETL",
    "kpi": "KPI",
    "bi": "Business Intelligence",
    "ia-generative": "IA générative",
    "llm": "LLM",
    "nlp": "NLP",
    "ml": "Machine Learning",
    "mllib": "MLlib",
    "pyspark": "PySpark",
    "spark-sql": "Spark SQL",
    "oracle-sql": "Oracle SQL",
    "shap": "SHAP",
    "smote": "SMOTE",
    "uml": "UML",
    "poo": "POO",
    "aws": "AWS",
    "iis": "IIS",
    "xgboost": "XGBoost",
}


# ---------------------------------------------------------------------------
# Chargement des fichiers data/
# ---------------------------------------------------------------------------
def load_member_files(kind: str) -> list[dict]:
    """Charge ``data/<kind>/*.json`` (hors fichiers commençant par ``_``)."""
    docs: list[dict] = []
    for path in sorted((DATA_DIR / kind).glob("*.json")):
        if path.name.startswith("_"):
            continue
        contenu = json.loads(path.read_text(encoding="utf-8"))
        docs.extend(contenu if isinstance(contenu, list) else [contenu])
    return docs


# ---------------------------------------------------------------------------
# Résolution du nom d'une compétence à partir de son slug
# ---------------------------------------------------------------------------
def _construire_resolveur_noms(candidats: list[dict]) -> dict[str, str]:
    """Construit un dict ``slug -> nom`` depuis les compétences déclarées par les candidats.

    En cas de conflit entre deux candidats (deux ``nom`` pour un même slug), on garde
    le plus court (généralement le nom le plus "propre", ex. "Python" vs
    "Python (Pandas, NumPy, …)").
    """
    noms: dict[str, str] = {}
    for candidat in candidats:
        for comp in candidat.get("competences", []):
            slug = comp.get("skill_slug")
            nom = comp.get("nom")
            if not slug or not nom:
                continue
            if slug not in noms or len(nom) < len(noms[slug]):
                noms[slug] = nom
    return noms


def _nom_competence(slug: str, declarations: dict[str, str]) -> str:
    """Résout le nom d'affichage d'une compétence via la cascade alias → déclaré → titlecase."""
    if slug in ALIAS_NOMS_COMPETENCES:
        return ALIAS_NOMS_COMPETENCES[slug]
    if slug in declarations:
        return declarations[slug]
    return slug.replace("-", " ").title()


# ---------------------------------------------------------------------------
# Conversion data/ → documents MongoDB (ARCHITECTURE §3)
# ---------------------------------------------------------------------------
def _transformer_candidat(doc: dict) -> dict:
    """Convertit une fiche candidat au format MongoDB (§3.1)."""
    slug = doc["candidat_slug"]
    liens = doc.get("liens", {}) or {}
    contacts = {
        "email": liens.get("email"),
        "github": liens.get("github"),
        "linkedin": liens.get("linkedin"),
    }
    return {
        "_id": slug,
        "candidat_slug": slug,
        "prenom": doc.get("prenom", ""),
        "nom": doc.get("nom", ""),
        "titre": doc.get("titre", ""),
        "bio": doc.get("bio"),
        "contacts": contacts,
        "langues": doc.get("langues", []),
        "experiences": doc.get("experiences", []),
        "formations": doc.get("formations", []),
    }


def _transformer_projet(doc: dict, resolveur_noms: dict[str, str]) -> dict:
    """Convertit un projet au format MongoDB (§3.2)."""
    slug = doc["projet_slug"]
    competences_brutes: list[Any] = doc.get("competences", [])
    competences: list[dict[str, str]] = []
    for item in competences_brutes:
        # Souplesse : accepte "python" OU {"skill_slug": "python", "nom": "Python"}
        if isinstance(item, str):
            skill_slug = item
            nom = _nom_competence(skill_slug, resolveur_noms)
        else:
            skill_slug = item["skill_slug"]
            nom = item.get("nom") or _nom_competence(skill_slug, resolveur_noms)
        competences.append({"skill_slug": skill_slug, "nom": nom})

    return {
        "_id": slug,
        "projet_slug": slug,
        "titre": doc.get("titre", ""),
        "description": doc.get("description"),
        "type": doc.get("type"),
        "date_debut": doc.get("date_debut"),
        "date_fin": doc.get("date_fin"),
        "auteurs": doc.get("candidat_slugs", []),
        "competences": competences,
        "liens": doc.get("liens", {}),
        "resultats": doc.get("resultats"),
    }


# ---------------------------------------------------------------------------
# Seed MongoDB
# ---------------------------------------------------------------------------
async def seed_mongo(candidats: list[dict], projets: list[dict]) -> None:
    """Vide puis réinsère candidats + projets, crée les 3 index de §3.3."""
    db = get_mongo_db()

    # Idempotence : on repart d'un état propre.
    await db.candidats.delete_many({})
    await db.projets.delete_many({})

    if candidats:
        await db.candidats.insert_many(candidats)
    if projets:
        await db.projets.insert_many(projets)

    # Index définis par ARCHITECTURE §3.3 (ceux d'_id sont automatiques).
    await db.projets.create_index([("auteurs", 1), ("date_debut", -1)])
    await db.projets.create_index([("competences.skill_slug", 1)])
    await db.projets.create_index([("date_debut", -1)])


# ---------------------------------------------------------------------------
# Seed Neo4j
# ---------------------------------------------------------------------------
_CONTRAINTES = [
    """CREATE CONSTRAINT candidat_slug_unique IF NOT EXISTS
       FOR (c:Candidat) REQUIRE c.candidat_slug IS UNIQUE""",
    """CREATE CONSTRAINT projet_slug_unique IF NOT EXISTS
       FOR (p:Projet) REQUIRE p.projet_slug IS UNIQUE""",
    """CREATE CONSTRAINT skill_slug_unique IF NOT EXISTS
       FOR (s:Competence) REQUIRE s.skill_slug IS UNIQUE""",
]


async def seed_neo4j(candidats: list[dict], projets: list[dict]) -> None:
    """Reconstruit le graphe depuis zéro à partir des documents MongoDB.

    Stratégie : wipe complet puis MERGE. MERGE seul serait idempotent côté
    création, mais ne nettoie pas d'éventuels auteurs/compétences supprimés
    entre deux runs. Le wipe garantit que Neo4j reflète exactement l'état des
    fichiers data/ courants.
    """
    async with get_neo4j_session() as session:
        # Contraintes (idempotent grâce à IF NOT EXISTS)
        for cypher in _CONTRAINTES:
            await session.run(cypher)

        # Repartir d'un graphe vide
        await session.run("MATCH (n) DETACH DELETE n")

        # Noeuds Candidat
        for candidat in candidats:
            await session.run(
                """
                MERGE (c:Candidat {candidat_slug: $slug})
                SET c.prenom = $prenom, c.nom = $nom
                """,
                slug=candidat["candidat_slug"],
                prenom=candidat.get("prenom", ""),
                nom=candidat.get("nom", ""),
            )

        # Noeuds Projet + arêtes A_REALISE + arêtes UTILISE (par projet, atomique)
        for projet in projets:
            await session.run(
                """
                MERGE (p:Projet {projet_slug: $slug})
                SET p.titre = $titre, p.date_debut = $date_debut
                """,
                slug=projet["projet_slug"],
                titre=projet.get("titre", ""),
                date_debut=projet.get("date_debut"),
            )

            for auteur_slug in projet.get("auteurs", []):
                await session.run(
                    """
                    MATCH (c:Candidat {candidat_slug: $cand})
                    MATCH (p:Projet {projet_slug: $proj})
                    MERGE (c)-[:A_REALISE]->(p)
                    """,
                    cand=auteur_slug,
                    proj=projet["projet_slug"],
                )

            for comp in projet.get("competences", []):
                await session.run(
                    """
                    MERGE (s:Competence {skill_slug: $slug})
                    SET s.nom = $nom
                    """,
                    slug=comp["skill_slug"],
                    nom=comp["nom"],
                )
                await session.run(
                    """
                    MATCH (p:Projet {projet_slug: $proj})
                    MATCH (s:Competence {skill_slug: $slug})
                    MERGE (p)-[:UTILISE]->(s)
                    """,
                    proj=projet["projet_slug"],
                    slug=comp["skill_slug"],
                )


# ---------------------------------------------------------------------------
# Point d'entrée
# ---------------------------------------------------------------------------
async def main() -> None:
    bruts_candidats = load_member_files("candidats")
    bruts_projets = load_member_files("projets")
    print(
        f"[seed] {len(bruts_candidats)} candidat(s), {len(bruts_projets)} projet(s) "
        f"trouvés dans {DATA_DIR}"
    )

    resolveur = _construire_resolveur_noms(bruts_candidats)
    candidats_mongo = [_transformer_candidat(c) for c in bruts_candidats]
    projets_mongo = [_transformer_projet(p, resolveur) for p in bruts_projets]

    try:
        await seed_mongo(candidats_mongo, projets_mongo)
        print(f"[seed] MongoDB OK ({len(candidats_mongo)} candidats, {len(projets_mongo)} projets, 3 index)")

        await seed_neo4j(candidats_mongo, projets_mongo)
        nb_comp = len({c["skill_slug"] for p in projets_mongo for c in p["competences"]})
        print(f"[seed] Neo4j OK (nœuds : {len(candidats_mongo)} candidats + {len(projets_mongo)} projets + {nb_comp} compétences)")
    finally:
        await close_mongo()
        await close_neo4j()

    print("[seed] OK")


if __name__ == "__main__":
    asyncio.run(main())
