"""Modèles Pydantic — doivent refléter EXACTEMENT les payloads de API_ROUTES.md."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"


#  Route 1 : GET /api/candidats/{slug} 

class Contacts(BaseModel):
    email: str | None = None
    github: str | None = None
    linkedin: str | None = None


class Langue(BaseModel):
    langue: str
    niveau: str


class ExperienceOut(BaseModel):
    type: str | None = None          # "stage", "alternance", ...
    entreprise: str
    poste: str
    debut: str                       # "YYYY-MM-DD"
    fin: str | None = None           # null = poste en cours
    description: str | None = None


class FormationOut(BaseModel):
    ecole: str
    diplome: str
    debut: str
    fin: str | None = None


class CandidatOut(BaseModel):
    candidat_slug: str
    nom: str
    prenom: str
    titre: str
    bio: str | None = None
    contacts: Contacts = Contacts()
    langues: list[Langue] = []
    experiences: list[ExperienceOut] = []
    formations: list[FormationOut] = []


#  Route 2 : GET /api/candidats/{slug}/projets 

class CompetenceRef(BaseModel):
    skill_slug: str
    nom: str


class LiensProjet(BaseModel):
    github: str | None = None
    demo: str | None = None


class ProjetOut(BaseModel):
    projet_slug: str
    titre: str
    description: str | None = None
    type: str | None = None           # "academique", "personnel", ...
    date_debut: str | None = None
    date_fin: str | None = None       # null = projet en cours
    auteurs: list[str] = []           # candidat_slug
    competences: list[CompetenceRef] = []
    liens: LiensProjet = LiensProjet()
    resultats: str | None = None


class ProjetsPage(BaseModel):
    items: list[ProjetOut]
    total: int
    page: int
    size: int


#  Route 3 : GET /api/candidats/{slug}/stats 

class CompetenceStat(BaseModel):
    skill_slug: str
    nom: str
    nb_projets: int
    projets: list[str] = []                    # projet_slug
    premiere_utilisation: str | None = None    # date_debut la plus ancienne
    derniere_utilisation: str | None = None    # date_debut la plus récente


class StatsOut(BaseModel):
    candidat_slug: str
    nb_projets: int
    nb_competences: int
    competences: list[CompetenceStat] = []


#  Route 8 : GET /api/projets/recents 

class ProjetsRecentsOut(BaseModel):
    items: list[ProjetOut]


#  Route 4 : GET /api/graph/projets/{slug}/similaires 

class ProjetSimilaire(BaseModel):
    projet_slug: str
    titre: str
    date_debut: str | None = None
    auteurs: list[str] = []
    score: int                                  # nb de compétences communes
    competences_communes: list[str] = []        # skill_slug


class SimilairesOut(BaseModel):
    projet_slug: str
    similaires: list[ProjetSimilaire] = []


#  Route 5 : GET /api/graph/competences/{slug} 

class GraphNode(BaseModel):
    id: str                                     # "candidat:...", "projet:...", "competence:..."
    type: Literal["candidat", "projet", "competence"]
    label: str
    nb_projets: int | None = None               # uniquement pour les compétences


class GraphLink(BaseModel):
    source: str
    target: str
    type: Literal["A_REALISE", "UTILISE"]


class GraphOut(BaseModel):
    candidat_slug: str
    nodes: list[GraphNode]
    links: list[GraphLink] = []


#  Route 6 : GET /api/graph/competences/communes 

class CompetencesCommunesOut(BaseModel):
    candidats: list[str]
    competences_communes: list[CompetenceRef] = []


#  Route 7 : GET /api/graph/candidats/{slug}/competences-transversales 

class CompetenceTransversale(BaseModel):
    skill_slug: str
    nom: str
    nb_projets: int
    projets: list[str] = []


class TransversalesOut(BaseModel):
    candidat_slug: str
    min_projets: int
    competences: list[CompetenceTransversale] = []


#  Route 9 : GET /api/competences/{slug}/preuves 

class ProjetResume(BaseModel):
    projet_slug: str
    titre: str


class CandidatPreuve(BaseModel):
    candidat_slug: str
    prenom: str
    nom: str
    titre: str | None = None
    nb_projets: int
    projets: list[ProjetResume] = []


class PreuvesOut(BaseModel):
    skill_slug: str
    nom: str
    candidats: list[CandidatPreuve] = []
