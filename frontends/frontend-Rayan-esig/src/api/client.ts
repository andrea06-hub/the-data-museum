import type {
  CandidatOut,
  CompetencesCommunesOut,
  GraphOut,
  PreuvesOut,
  ProjetsPage,
  ProjetsRecentsOut,
  SimilairesOut,
  StatsOut,
  TransversalesOut,
} from '../types/api'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000/api'

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    let message = `Erreur HTTP ${res.status}`
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) message = body.detail
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  // R1
  getCandidat: (slug: string) => request<CandidatOut>(`/candidats/${encodeURIComponent(slug)}`),

  // R2
  getProjetsCandidat: (slug: string, competence?: string) => {
    const query = competence ? `?competence=${encodeURIComponent(competence)}&size=50` : '?size=50'
    return request<ProjetsPage>(`/candidats/${encodeURIComponent(slug)}/projets${query}`)
  },

  // R3
  getStatsCandidat: (slug: string) => request<StatsOut>(`/candidats/${encodeURIComponent(slug)}/stats`),

  // R4
  getProjetsSimilaires: (projetSlug: string, limit = 5) =>
    request<SimilairesOut>(`/graph/projets/${encodeURIComponent(projetSlug)}/similaires?limit=${limit}`),

  // R5
  getGrapheCompetences: (slug: string) =>
    request<GraphOut>(`/graph/competences/${encodeURIComponent(slug)}`),

  // R6
  getCompetencesCommunes: (candidats: string[]) =>
    request<CompetencesCommunesOut>(
      `/graph/competences/communes?candidats=${candidats.map(encodeURIComponent).join(',')}`,
    ),

  // R7
  getCompetencesTransversales: (slug: string, minProjets = 2) =>
    request<TransversalesOut>(
      `/graph/candidats/${encodeURIComponent(slug)}/competences-transversales?min_projets=${minProjets}`,
    ),

  // R8
  getProjetsRecents: (limit = 12) => request<ProjetsRecentsOut>(`/projets/recents?limit=${limit}`),

  // R9
  getPreuvesCompetence: (skillSlug: string) =>
    request<PreuvesOut>(`/competences/${encodeURIComponent(skillSlug)}/preuves`),
}