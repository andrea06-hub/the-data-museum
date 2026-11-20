"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { getGrapheCandidat, getProjetsCandidat } from "@/lib/api";

const SLUG = process.env.NEXT_PUBLIC_CANDIDAT_SLUG ?? "erwann-nobime";

type Entry = {
  label: string;
  type: string;
  color: string;
  href: string;
};

const PAGES: Entry[] = [
  { label: "Accueil", type: "page", color: "var(--color-accent)", href: "/" },
  { label: "Graphe de compétences", type: "page", color: "var(--color-accent)", href: "/graphe" },
  { label: "Tous les projets", type: "page", color: "var(--color-accent)", href: "/projets" },
  { label: "Parcours", type: "page", color: "var(--color-accent)", href: "/parcours" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [dynamic, setDynamic] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Charge projets + compétences à la première ouverture
  const load = useCallback(async () => {
    if (loaded) return;
    setLoaded(true);
    try {
      const [projets, graph] = await Promise.all([
        getProjetsCandidat(SLUG, { size: 50 }),
        getGrapheCandidat(SLUG),
      ]);
      const projEntries: Entry[] = projets.items.map((p) => ({
        label: p.titre,
        type: "projet",
        color: "var(--color-violet)",
        href: `/projets?competence=`,
      }));
      const compEntries: Entry[] = graph.nodes
        .filter((n) => n.type === "competence")
        .map((n) => ({
          label: n.label,
          type: "compétence",
          color: "var(--color-fg)",
          href: `/projets?competence=${n.id.replace("competence:", "")}`,
        }));
      setDynamic([...projEntries, ...compEntries]);
    } catch {
      setDynamic([]);
    }
  }, [loaded]);

  useEffect(() => {
    if (open) {
      load();
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.toLowerCase().trim();
  const match = (e: Entry) => e.label.toLowerCase().includes(q);

  const groups: { g: string; items: Entry[] }[] = [
    { g: "Pages", items: PAGES.filter(match) },
    { g: "Projets", items: dynamic.filter((e) => e.type === "projet" && match(e)) },
    { g: "Compétences", items: dynamic.filter((e) => e.type === "compétence" && match(e)) },
  ].filter((grp) => grp.items.length > 0);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 pt-[13vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Recherche"
        className="w-[min(560px,92vw)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_40px_100px_-30px_rgba(0,0,0,0.85)]"
      >
        <div className="flex items-center gap-3 border-b border-border-soft px-4 py-3.5">
          <Search className="h-[17px] w-[17px] shrink-0 text-fg-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un projet, une compétence, une page…"
            autoComplete="off"
            className="flex-1 bg-transparent text-base text-fg outline-none placeholder:text-faint"
          />
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.64rem] text-faint">
            ESC
          </span>
        </div>
        <div className="max-h-[340px] overflow-y-auto p-2">
          {groups.length === 0 ? (
            <div className="px-6 py-7 text-center font-mono text-sm text-faint">
              Aucun résultat{q ? ` pour « ${query} »` : ""}
            </div>
          ) : (
            groups.map((grp) => (
              <div key={grp.g}>
                <div className="px-2.5 pb-1.5 pt-2.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">
                  {grp.g}
                </div>
                {grp.items.map((it, i) => (
                  <button
                    key={`${grp.g}-${i}`}
                    type="button"
                    onClick={() => go(it.href)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-surface-2"
                  >
                    <span
                      className="h-[7px] w-[7px] shrink-0 rounded-full"
                      style={{ background: it.color }}
                    />
                    <span className="flex-1 truncate text-sm text-fg">
                      {it.label}
                    </span>
                    <span className="font-mono text-[0.62rem] text-faint">
                      {it.type}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
