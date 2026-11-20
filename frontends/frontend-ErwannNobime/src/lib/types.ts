/**
 * Types TypeScript alignés sur les 9 routes de API_ROUTES.md.
 * Toute modification doit respecter le contrat d'équipe.
 */

export type Contacts = {
  email: string | null;
  github: string | null;
  linkedin: string | null;
};

export type Langue = {
  langue: string;
  niveau: string;
};

export type Experience = {
  type: string | null;
  entreprise: string;
  poste: string;
  debut: string;
  fin: string | null;
  description: string | null;
};

export type Formation = {
  ecole: string;
  diplome: string;
  debut: string;
  fin: string | null;
};

export type CandidatOut = {
  candidat_slug: string;
  nom: string;
  prenom: string;
  titre: string;
  bio: string | null;
  contacts: Contacts;
  langues: Langue[];
  experiences: Experience[];
  formations: Formation[];
};

export type CompetenceRef = {
  skill_slug: string;
  nom: string;
};

export type LiensProjet = {
  github: string | null;
  demo: string | null;
};

export type ProjetOut = {
  projet_slug: string;
  titre: string;
  description: string | null;
  type: string | null;
  date_debut: string | null;
  date_fin: string | null;
  auteurs: string[];
  competences: CompetenceRef[];
  liens: LiensProjet;
  resultats: string | null;
};

export type ProjetsPage = {
  items: ProjetOut[];
  total: number;
  page: number;
  size: number;
};

export type CompetenceStat = {
  skill_slug: string;
  nom: string;
  nb_projets: number;
  projets: string[];
  premiere_utilisation: string | null;
  derniere_utilisation: string | null;
};

export type StatsOut = {
  candidat_slug: string;
  nb_projets: number;
  nb_competences: number;
  competences: CompetenceStat[];
};

export type ProjetSimilaire = {
  projet_slug: string;
  titre: string;
  date_debut: string | null;
  auteurs: string[];
  score: number;
  competences_communes: string[];
};

export type SimilairesOut = {
  projet_slug: string;
  similaires: ProjetSimilaire[];
};

export type GraphNode = {
  id: string;
  type: "candidat" | "projet" | "competence";
  label: string;
  nb_projets?: number;
};

export type GraphLink = {
  source: string;
  target: string;
  type: "A_REALISE" | "UTILISE";
};

export type GraphOut = {
  candidat_slug: string;
  nodes: GraphNode[];
  links: GraphLink[];
};

export type CompetencesCommunesOut = {
  candidats: string[];
  competences_communes: CompetenceRef[];
};

export type CompetenceTransversale = {
  skill_slug: string;
  nom: string;
  nb_projets: number;
  projets: string[];
};

export type TransversalesOut = {
  candidat_slug: string;
  min_projets: number;
  competences: CompetenceTransversale[];
};

export type ProjetsRecentsOut = {
  items: ProjetOut[];
};

export type ProjetResume = {
  projet_slug: string;
  titre: string;
};

export type CandidatPreuve = {
  candidat_slug: string;
  prenom: string;
  nom: string;
  titre: string | null;
  nb_projets: number;
  projets: ProjetResume[];
};

export type PreuvesOut = {
  skill_slug: string;
  nom: string;
  candidats: CandidatPreuve[];
};
