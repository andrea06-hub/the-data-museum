import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import { GraphCanvas } from "@/components/graph-canvas";
import { GithubIcon, LinkedinIcon } from "@/components/brand-icons";
import { FeaturedProjects } from "@/components/featured-projects";
import { Counter } from "@/components/counter";
import {
  ApiError,
  getCandidat,
  getGrapheCandidat,
  getProjetsRecents,
  getStatsCandidat,
} from "@/lib/api";
import type {
  CandidatOut,
  GraphOut,
  ProjetsRecentsOut,
  StatsOut,
} from "@/lib/types";

const SLUG = process.env.NEXT_PUBLIC_CANDIDAT_SLUG ?? "erwann-nobime";

export const dynamic = "force-dynamic";

async function safeGet<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[home] API ${err.status} : ${err.message}`);
    } else {
      console.warn(`[home] API injoignable`, err);
    }
    return null;
  }
}

function anneesExperience(exp: CandidatOut["experiences"]): number {
  const debuts = exp.map((e) => e.debut).filter(Boolean).sort();
  if (!debuts.length) return 0;
  const [y] = debuts[0].split("-").map(Number);
  return Math.max(0, new Date().getFullYear() - y);
}

export default async function HomePage() {
  const [candidat, graph, stats, recents] = await Promise.all([
    safeGet<CandidatOut>(() => getCandidat(SLUG)),
    safeGet<GraphOut>(() => getGrapheCandidat(SLUG)),
    safeGet<StatsOut>(() => getStatsCandidat(SLUG)),
    safeGet<ProjetsRecentsOut>(() => getProjetsRecents(6)),
  ]);

  const annees = candidat ? anneesExperience(candidat.experiences) : 0;
  const nbExp = candidat?.experiences.length ?? 0;

  const projetsCandidat = (recents?.items ?? []).filter((p) =>
    p.auteurs.includes(SLUG),
  );
  const featured = (projetsCandidat.length >= 3
    ? projetsCandidat
    : (recents?.items ?? [])
  ).slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-11 px-5 pb-12 pt-14 lg:grid-cols-[1.02fr_1fr] lg:pb-16 lg:pt-16">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
            {candidat?.titre ?? "Alternant Data Analyst · Covéa — ESIGELEC"}
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.1rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-balance">
            {candidat ? candidat.prenom : "Erwann"}
            <br />
            {candidat ? candidat.nom : "Nobime"}
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-5 max-w-[46ch] text-[1.06rem] leading-relaxed text-fg-muted">
            {candidat?.bio ??
              "Les données racontent une histoire. Mon rôle : leur donner une voix claire et impactante pour guider la décision stratégique."}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/graphe"
              className="group inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-mono text-[0.8rem] font-medium text-accent-ink transition hover:-translate-y-0.5"
            >
              Explorer le graphe
              <ArrowRight className="h-[15px] w-[15px] transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/projets"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 font-mono text-[0.8rem] font-medium text-fg transition hover:border-accent"
            >
              Voir les projets
            </Link>
          </div>

          {candidat && (
            <div className="mt-6 flex flex-wrap gap-5">
              {candidat.contacts.github && (
                <a
                  href={candidat.contacts.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[0.82rem] text-fg-muted transition hover:text-fg"
                >
                  <GithubIcon className="h-[15px] w-[15px]" />
                  GitHub
                </a>
              )}
              {candidat.contacts.linkedin && (
                <a
                  href={candidat.contacts.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[0.82rem] text-fg-muted transition hover:text-fg"
                >
                  <LinkedinIcon className="h-[15px] w-[15px]" />
                  LinkedIn
                </a>
              )}
              {candidat.contacts.email && (
                <a
                  href={`mailto:${candidat.contacts.email}`}
                  className="inline-flex items-center gap-1.5 text-[0.82rem] text-fg-muted transition hover:text-fg"
                >
                  <Mail className="h-[15px] w-[15px]" />
                  Contact
                </a>
              )}
            </div>
          )}
        </div>

        {/* Console panel */}
        <div className="relative overflow-hidden rounded-2xl border border-border shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] [background:radial-gradient(120%_90%_at_70%_10%,var(--glow),transparent_60%),linear-gradient(180deg,var(--surface),var(--bg))]">
          <div className="flex items-center justify-between border-b border-border-soft px-3.5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-faint">
            <span className="flex gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-border" />
              <i className="h-2.5 w-2.5 rounded-full bg-border" />
              <i className="h-2.5 w-2.5 rounded-full bg-border" />
            </span>
            <span>graph://{SLUG}</span>
            <span className="inline-flex items-center gap-1.5 text-accent">
              <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              live
            </span>
          </div>
          <div className="relative h-[360px] lg:h-[420px]">
            <GraphCanvas graph={graph} />
            {graph && (
              <>
                <div className="absolute right-3 top-3 font-mono text-[0.66rem] text-faint">
                  {graph.nodes.length} nœuds · {graph.links.length} liens
                </div>
                <div className="absolute bottom-3 left-3 flex gap-3.5 rounded-lg border border-border-soft bg-bg/70 px-2.5 py-1.5 font-mono text-[0.66rem] text-fg-muted backdrop-blur">
                  <LegendDot color="var(--color-accent)" label="candidat" />
                  <LegendDot color="var(--color-violet)" label="projet" />
                  <LegendDot color="var(--color-fg)" label="compétence" />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* INSTRUMENTS */}
      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <Instrument
            label="Projets livrés"
            value={stats?.nb_projets ?? 0}
            sub="académiques · pro · perso"
            meter={86}
            href="/projets"
          />
          <Instrument
            label="Compétences"
            value={stats?.nb_competences ?? 0}
            sub="data · dev · cloud · bi"
            meter={72}
            href="/graphe"
          />
          <Instrument
            label="Ans d'expérience"
            value={annees}
            suffix="+"
            sub="depuis les premiers stages"
            meter={48}
            href="/parcours"
          />
          <Instrument
            label="En entreprise"
            value={nbExp}
            sub="stages + alternance"
            meter={64}
            href="/parcours"
          />
        </div>
      </section>

      {/* PROJETS */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
                Sélection
              </p>
              <h2 className="mt-2 font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.02em]">
                Projets récents
              </h2>
            </div>
            <Link
              href="/projets"
              className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[0.76rem] text-fg-muted transition hover:text-accent"
            >
              Tous les projets
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <FeaturedProjects projets={featured} />
        </section>
      )}

      {/* CTA */}
      {graph && (
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="rounded-3xl border border-border p-[clamp(28px,5vw,56px)] [background:radial-gradient(130%_120%_at_85%_0%,var(--glow),transparent_55%),var(--surface)]">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
              Prochaine étape
            </p>
            <h2 className="mt-3.5 max-w-[20ch] font-display text-[clamp(1.7rem,3.5vw,2.4rem)] font-semibold leading-tight tracking-[-0.02em] text-balance">
              Explore le graphe de mes compétences —{" "}
              <span className="text-fg-muted">
                chaque nœud raconte une partie de l&apos;histoire.
              </span>
            </h2>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/graphe"
                className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-[0.8rem] font-medium text-accent-ink transition hover:-translate-y-0.5"
              >
                Ouvrir le graphe
                <ArrowRight className="h-[15px] w-[15px] transition group-hover:translate-x-0.5" />
              </Link>
              {candidat?.contacts.email && (
                <a
                  href={`mailto:${candidat.contacts.email}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 font-mono text-[0.8rem] font-medium text-fg transition hover:border-accent"
                >
                  Me contacter
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {!graph && (
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-fg-muted">
            API backend injoignable. Lance{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em]">
              just up && just seed && just dev
            </code>{" "}
            à la racine du repo pour remplir le portfolio.
          </div>
        </section>
      )}
    </>
  );
}

function Instrument({
  label,
  value,
  suffix,
  sub,
  meter,
  href,
}: {
  label: string;
  value: number;
  suffix?: string;
  sub: string;
  meter: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-surface p-[18px] transition hover:-translate-y-0.5 hover:border-accent/55"
    >
      <ArrowUpRight className="absolute right-3.5 top-3.5 h-3.5 w-3.5 text-faint opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent group-hover:opacity-100" />
      <div className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-fg-muted">
        {label}
      </div>
      <div className="mt-3 font-display text-[2.5rem] font-semibold leading-none tracking-[-0.02em] tabular-nums">
        <Counter value={value} />
        {suffix && <span className="text-base text-accent">{suffix}</span>}
      </div>
      <div className="mt-2 font-mono text-[0.64rem] text-faint">{sub}</div>
      <div className="mt-3.5 h-[3px] overflow-hidden rounded-sm bg-surface-2">
        <i
          className="block h-full rounded-sm transition-all duration-500 group-hover:brightness-125"
          style={{
            width: `${meter}%`,
            background:
              "linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 40%, transparent))",
          }}
        />
      </div>
    </Link>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-[7px] w-[7px] rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
