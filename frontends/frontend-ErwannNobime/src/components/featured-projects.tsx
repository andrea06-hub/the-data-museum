import { ArrowUpRight } from "lucide-react";
import type { ProjetOut } from "@/lib/types";

/** Durée approximative en mois entre deux dates YYYY-MM(-DD). */
function dureeMois(debut: string | null, fin: string | null): number {
  if (!debut || debut.length < 7) return 0;
  const [ay, am] = debut.slice(0, 7).split("-").map(Number);
  if (!fin || fin.length < 7) {
    const now = new Date();
    return Math.max(1, (now.getFullYear() - ay) * 12 + (now.getMonth() + 1 - am));
  }
  const [by, bm] = fin.slice(0, 7).split("-").map(Number);
  return Math.max(1, (by - ay) * 12 + (bm - am) + 1);
}

export function FeaturedProjects({ projets }: { projets: ProjetOut[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projets.map((p) => {
        const mois = dureeMois(p.date_debut, p.date_fin);
        return (
          <article
            key={p.projet_slug}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-1 hover:border-accent/55"
          >
            <div className="font-mono text-[0.64rem] uppercase tracking-[0.1em] text-faint">
              {p.date_debut ?? "—"}
              {p.type ? ` · ${p.type}` : ""}
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold leading-tight tracking-tight">
              {p.titre}
            </h3>
            {p.description && (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fg-muted">
                {p.description}
              </p>
            )}

            <div className="mt-4 flex gap-6 border-t border-border-soft pt-4">
              <div>
                <div className="font-mono text-[1.32rem] font-semibold tabular-nums text-fg">
                  {p.competences.length}
                </div>
                <div className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-faint">
                  compétences
                </div>
              </div>
              {mois > 0 && (
                <div>
                  <div className="font-mono text-[1.32rem] font-semibold tabular-nums text-fg">
                    {mois}
                    <span className="text-sm text-accent"> mois</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-faint">
                    durée
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.competences.slice(0, 4).map((c) => (
                <span
                  key={c.skill_slug}
                  className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[0.64rem] text-fg-muted"
                >
                  {c.skill_slug}
                </span>
              ))}
              {p.competences.length > 4 && (
                <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[0.64rem] text-fg-muted">
                  +{p.competences.length - 4}
                </span>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <ArrowUpRight className="h-4 w-4 text-faint transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            </div>
          </article>
        );
      })}
    </div>
  );
}
