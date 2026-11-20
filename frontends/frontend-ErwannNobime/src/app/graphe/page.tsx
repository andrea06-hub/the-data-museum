import {
  ApiError,
  getCompetencesTransversales,
  getGrapheCandidat,
} from "@/lib/api";
import { GrapheInteractive } from "@/components/graphe-interactive";
import type { GraphOut, TransversalesOut } from "@/lib/types";

const SLUG = process.env.NEXT_PUBLIC_CANDIDAT_SLUG ?? "erwann-nobime";

export const metadata = { title: "Graphe — Erwann Nobime" };
export const dynamic = "force-dynamic";

export default async function GraphePage() {
  let graph: GraphOut | null = null;
  let transversales: TransversalesOut | null = null;
  let error: string | null = null;

  try {
    [graph, transversales] = await Promise.all([
      getGrapheCandidat(SLUG),
      getCompetencesTransversales(SLUG, 2),
    ]);
  } catch (e) {
    error = e instanceof ApiError ? e.message : "API injoignable";
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-10 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Neo4j · compétences × projets
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Graphe de compétences
        </h1>
        <p className="max-w-2xl text-fg-muted">
          Chaque nœud est cliquable pour zoomer et découvrir ses connexions. Les
          compétences transversales (utilisées sur ≥ 2 projets) s&apos;affichent
          à droite par défaut.
        </p>
      </header>

      {error && (
        <div className="mb-8 rounded-lg border border-border/60 bg-surface/40 p-5 text-sm text-fg-muted">
          {error}. Lance le backend (
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.85em]">
            just up && just seed && just dev
          </code>
          ) et recharge.
        </div>
      )}

      <GrapheInteractive graph={graph} transversales={transversales} />
    </div>
  );
}
