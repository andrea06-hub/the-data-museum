export interface Contacts {
  email?: string | null
  github?: string | null
  linkedin?: string | null
}

export interface Langue {
  langue: string
  niveau: string
}

export interface ExperienceOut {
  type?: string | null
  entreprise: string
  poste: string
  debut: string
  fin?: string | null
  description?: string | null
}

export interface FormationOut {
  ecole: string
  diplome: string
  debut: string
  fin?: string | null
}

export interface CandidatOut {
  candidat_slug: string
  nom: string
  prenom: string
  titre: string
  bio?: string | null
  contacts: Contacts
  langues: Langue[]
  experiences: ExperienceOut[]
  formations: FormationOut[]
}

export interface CompetenceRef {
  skill_slug: string
  nom: string
}

export interface LiensProjet {
  github?: string | null
  demo?: string | null
}

export interface ProjetOut {
  projet_slug: string
  titre: string
  description?: string | null
  type?: string | null
  date_debut?: string | null
  date_fin?: string | null
  auteurs: string[]
  competences: CompetenceRef[]
  liens: LiensProjet
  resultats?: string | null
}

export interface ProjetsPage {
  items: ProjetOut[]
  total: number
  page: number
  size: number
}

export interface ProjetsRecentsOut {
  items: ProjetOut[]
}

export interface CompetenceStat {
  skill_slug: string
  nom: string
  nb_projets: number
  projets: string[]
  premiere_utilisation?: string | null
  derniere_utilisation?: string | null
}

export interface StatsOut {
  candidat_slug: string
  nb_projets: number
  nb_competences: number
  competences: CompetenceStat[]
}

export interface ProjetSimilaire {
  projet_slug: string
  titre: string
  date_debut?: string | null
  auteurs: string[]
  score: number
  competences_communes: string[]
}

export interface SimilairesOut {
  projet_slug: string
  similaires: ProjetSimilaire[]
}

export interface GraphNode {
  id: string
  type: 'candidat' | 'projet' | 'competence'
  label: string
  nb_projets?: number
}

export interface GraphLink {
  source: string
  target: string
  type: 'A_REALISE' | 'UTILISE'
}

export interface GraphOut {
  candidat_slug: string
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface CompetencesCommunesOut {
  candidats: string[]
  competences_communes: CompetenceRef[]
}

export interface CompetenceTransversale {
  skill_slug: string
  nom: string
  nb_projets: number
  projets: string[]
}

export interface TransversalesOut {
  candidat_slug: string
  min_projets: number
  competences: CompetenceTransversale[]
}

export interface ProjetResume {
  projet_slug: string
  titre: string
}

export interface CandidatPreuve {
  candidat_slug: string
  prenom: string
  nom: string
  titre?: string | null
  nb_projets: number
  projets: ProjetResume[]
}

export interface PreuvesOut {
  skill_slug: string
  nom: string
  candidats: CandidatPreuve[]
}