/**
 * Client API — un fetcher typé par route du contrat API_ROUTES.md.
 *
 * Variables d'env :
 * - NEXT_PUBLIC_API_URL : base URL du backend (défaut http://localhost:8000)
 */

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
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Erreur typée pour que l'appelant distingue 404 vs crash. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    // Revalidation serveur toutes les 60s en SSR, override si besoin.
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      // réponse non-JSON, on garde statusText
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

// ---------- Candidats ----------

export function getCandidat(slug: string) {
  return api<CandidatOut>(`/api/candidats/${slug}`);
}

export function getProjetsCandidat(
  slug: string,
  opts?: { competence?: string; page?: number; size?: number },
) {
  const q = new URLSearchParams();
  if (opts?.competence) q.set("competence", opts.competence);
  if (opts?.page) q.set("page", String(opts.page));
  if (opts?.size) q.set("size", String(opts.size));
  const qs = q.toString();
  return api<ProjetsPage>(
    `/api/candidats/${slug}/projets${qs ? `?${qs}` : ""}`,
  );
}

export function getStatsCandidat(slug: string) {
  return api<StatsOut>(`/api/candidats/${slug}/stats`);
}

// ---------- Projets ----------

export function getProjetsRecents(limit = 5) {
  return api<ProjetsRecentsOut>(`/api/projets/recents?limit=${limit}`);
}

// ---------- Graphe ----------

export function getProjetsSimilaires(projetSlug: string, limit = 5) {
  return api<SimilairesOut>(
    `/api/graph/projets/${projetSlug}/similaires?limit=${limit}`,
  );
}

export function getGrapheCandidat(slug: string) {
  return api<GraphOut>(`/api/graph/competences/${slug}`);
}

export function getCompetencesCommunes(candidatSlugs: string[]) {
  const q = candidatSlugs.join(",");
  return api<CompetencesCommunesOut>(
    `/api/graph/competences/communes?candidats=${encodeURIComponent(q)}`,
  );
}

export function getCompetencesTransversales(slug: string, minProjets = 2) {
  return api<TransversalesOut>(
    `/api/graph/candidats/${slug}/competences-transversales?min_projets=${minProjets}`,
  );
}

// ---------- Compétences ----------

export function getPreuvesCompetence(skillSlug: string) {
  return api<PreuvesOut>(`/api/competences/${skillSlug}/preuves`);
}
