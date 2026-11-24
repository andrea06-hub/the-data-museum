import { getCandidat, ApiError } from "@/lib/api";
import type { CandidatOut } from "@/lib/types";

const SLUG = process.env.NEXT_PUBLIC_CANDIDAT_SLUG ?? "erwann-nobime";

export const metadata = { title: "Parcours — Erwann Nobime" };
export const dynamic = "force-dynamic";

export default async function ParcoursPage() {
  let candidat: CandidatOut | null = null;
  let error: string | null = null;
  try {
    candidat = await getCandidat(SLUG);
  } catch (e) {
    error = e instanceof ApiError ? e.message : "API injoignable";
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <header className="mb-16 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Timeline
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Parcours</h1>
        <p className="text-fg-muted">
          Expériences et formations, les plus récentes d&apos;abord.
        </p>
      </header>

      {error && <ErrorBlock message={error} />}

      {candidat && (
        <div className="space-y-16">
          <Section title="Expériences">
            <ol className="relative space-y-6 border-l border-border/40 pl-6">
              {candidat.experiences.map((xp, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border border-accent bg-bg" />
                  <div className="text-xs font-mono uppercase tracking-wider text-fg-muted">
                    {xp.debut} — {xp.fin ?? "en cours"}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">
                    {xp.poste}{" "}
                    <span className="text-fg-muted">· {xp.entreprise}</span>
                  </h3>
                  {xp.description && (
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                      {xp.description}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Formations">
            <ol className="relative space-y-6 border-l border-border/40 pl-6">
              {candidat.formations.map((fo, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border border-violet bg-bg" />
                  <div className="text-xs font-mono uppercase tracking-wider text-fg-muted">
                    {fo.debut} — {fo.fin ?? "en cours"}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">
                    {fo.diplome}{" "}
                    <span className="text-fg-muted">· {fo.ecole}</span>
                  </h3>
                </li>
              ))}
            </ol>
          </Section>

          {candidat.langues.length > 0 && (
            <Section title="Langues">
              <ul className="flex flex-wrap gap-2">
                {candidat.langues.map((l) => (
                  <li
                    key={l.langue}
                    className="rounded-md border border-border/60 bg-surface/40 px-3 py-1.5 text-sm"
                  >
                    {l.langue}{" "}
                    <span className="text-fg-muted">— {l.niveau}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-6 text-sm font-mono uppercase tracking-[0.2em] text-fg-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface/40 p-5 text-sm text-fg-muted">
      {message}. Lance le backend (
      <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.85em]">
        just up && just seed && just dev
      </code>
      ) et recharge.
    </div>
  );
}
