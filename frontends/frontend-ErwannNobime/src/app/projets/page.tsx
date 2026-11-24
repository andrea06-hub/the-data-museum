import { ApiError, getProjetsCandidat, getStatsCandidat } from "@/lib/api";
import type { ProjetOut, StatsOut } from "@/lib/types";

const SLUG = process.env.NEXT_PUBLIC_CANDIDAT_SLUG ?? "erwann-nobime";

export const metadata = { title: "Projets — Erwann Nobime" };
export const dynamic = "force-dynamic";

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ competence?: string }>;
}) {
  const { competence } = await searchParams;
  let projets: ProjetOut[] = [];
  let stats: StatsOut | null = null;
  let error: string | null = null;

  try {
    const [page, s] = await Promise.all([
      getProjetsCandidat(SLUG, { competence, size: 50 }),
      getStatsCandidat(SLUG),
    ]);
    projets = page.items;
    stats = s;
  } catch (e) {
    error = e instanceof ApiError ? e.message : "API injoignable";
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Portfolio
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Projets</h1>
          {stats && (
            <p className="text-fg-muted">
              {stats.nb_projets} projets · {stats.nb_competences} compétences
              distinctes
            </p>
          )}
        </div>
      </header>

      {error && (
        <div className="mb-8 rounded-lg border border-border/60 bg-surface/40 p-5 text-sm text-fg-muted">
          {error}
        </div>
      )}

      {stats && stats.competences.length > 0 && (
        <nav
          aria-label="Filtre par compétence"
          className="mb-10 flex flex-wrap gap-2"
        >
          <FilterChip
            href="/projets"
            label="Toutes"
            active={!competence}
            count={stats.nb_projets}
          />
          {stats.competences.slice(0, 15).map((c) => (
            <FilterChip
              key={c.skill_slug}
              href={`/projets?competence=${c.skill_slug}`}
              label={c.nom}
              count={c.nb_projets}
              active={competence === c.skill_slug}
            />
          ))}
        </nav>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {projets.map((p) => (
          <li
            key={p.projet_slug}
            className="group rounded-lg border border-border/60 bg-surface/40 p-5 transition hover:border-accent/40"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold leading-tight text-fg">
                {p.titre}
              </h3>
              {p.date_debut && (
                <span className="shrink-0 font-mono text-[0.7rem] text-fg-muted">
                  {p.date_debut}
                </span>
              )}
            </div>
            {p.description && (
              <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-fg-muted">
                {p.description}
              </p>
            )}
            <ul className="flex flex-wrap gap-1.5">
              {p.competences.slice(0, 6).map((c) => (
                <li
                  key={c.skill_slug}
                  className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[0.7rem] text-fg-muted"
                >
                  {c.skill_slug}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {projets.length === 0 && !error && (
        <p className="text-sm text-fg-muted">Aucun projet pour ce filtre.</p>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
        active
          ? "border-accent/60 bg-accent-soft text-fg"
          : "border-border/60 text-fg-muted hover:border-accent/30 hover:text-fg",
      ].join(" ")}
    >
      {label}
      <span className="font-mono text-[0.65rem] opacity-70">{count}</span>
    </a>
  );
}
