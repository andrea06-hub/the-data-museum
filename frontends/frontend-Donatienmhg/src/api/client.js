// Appels à l'API d'équipe — une fonction par route de API_ROUTES.md

// Adresse de l'API :
// - si VITE_API_URL est définie (fichier .env en local, ou réglage Vercel) → on l'utilise ;
// - sinon, en ligne (version de production) → '' : appels relatifs /api/..., relayés par vercel.json ;
// - sinon, en développement → l'API locale.
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8000')
export const CANDIDAT_SLUG = import.meta.env.VITE_CANDIDAT_SLUG ?? 'donatien-tovihouande'

async function get(chemin) {
  const reponse = await fetch(`${API_URL}${chemin}`)
  if (!reponse.ok) throw new Error(`Erreur ${reponse.status} sur ${chemin}`)
  return reponse.json()
}

// Route 1 : profil et timeline
export const getCandidat = (slug = CANDIDAT_SLUG) =>
  get(`/api/candidats/${encodeURIComponent(slug)}`)

// Route 2 : projets d'un candidat (filtre optionnel par compétence, paginés)
export function getProjets(slug = CANDIDAT_SLUG, { competence, page = 1, size = 20 } = {}) {
  const parametres = new URLSearchParams({ page, size })
  if (competence) parametres.set('competence', competence)
  return get(`/api/candidats/${encodeURIComponent(slug)}/projets?${parametres}`)
}

// Route 3 : statistiques par compétence
export const getStats = (slug = CANDIDAT_SLUG) =>
  get(`/api/candidats/${encodeURIComponent(slug)}/stats`)

// Route 4 : projets similaires (Neo4j)
export const getSimilaires = (projetSlug, limit = 5) =>
  get(`/api/graph/projets/${encodeURIComponent(projetSlug)}/similaires?limit=${limit}`)

// Route 5 : graphe de compétences prêt à afficher (Neo4j)
export const getGraphe = (slug = CANDIDAT_SLUG) =>
  get(`/api/graph/competences/${encodeURIComponent(slug)}`)

// Route 7 : compétences utilisées dans plusieurs projets (Neo4j)
export const getTransversales = (slug = CANDIDAT_SLUG, minProjets = 2) =>
  get(`/api/graph/candidats/${encodeURIComponent(slug)}/competences-transversales?min_projets=${minProjets}`)

// Route 6 : compétences communes entre plusieurs candidats (Neo4j)
export const getCompetencesCommunes = (slugs) =>
  get(`/api/graph/competences/communes?candidats=${slugs.map(encodeURIComponent).join(',')}`)

// Route 8 : derniers projets de toute l'équipe
export const getRecents = (limit = 5) => get(`/api/projets/recents?limit=${limit}`)

// Route 9 : qui prouve une compétence (Neo4j + MongoDB)
export const getPreuves = (skillSlug) => get(`/api/competences/${encodeURIComponent(skillSlug)}/preuves`)
