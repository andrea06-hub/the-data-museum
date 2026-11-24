"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { GraphHero } from "./graph-hero";
import type { GraphOut, TransversalesOut } from "@/lib/types";

const TYPE_LABEL: Record<"candidat" | "projet" | "competence", string> = {
  candidat: "Candidat",
  projet: "Projet",
  competence: "Compétence",
};

const TYPE_COLOR: Record<"candidat" | "projet" | "competence", string> = {
  candidat: "#22d3ee",
  projet: "#a78bfa",
  competence: "#e6e8ee",
};

export function GrapheInteractive({
  graph,
  transversales,
}: {
  graph: GraphOut | null;
  transversales: TransversalesOut | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Index pour accès rapide aux voisins du nœud sélectionné
  const { nodeById, neighborsById } = useMemo(() => {
    const nodeById = new Map<string, GraphOut["nodes"][number]>();
    const neighborsById = new Map<string, Set<string>>();
    if (!graph) return { nodeById, neighborsById };
    for (const n of graph.nodes) nodeById.set(n.id, n);
    for (const l of graph.links) {
      const s = typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
      const t = typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
      if (!neighborsById.has(s)) neighborsById.set(s, new Set());
      if (!neighborsById.has(t)) neighborsById.set(t, new Set());
      neighborsById.get(s)!.add(t);
      neighborsById.get(t)!.add(s);
    }
    return { nodeById, neighborsById };
  }, [graph]);

  const selectedNode = selectedId ? nodeById.get(selectedId) ?? null : null;
  const neighbors = selectedId
    ? Array.from(neighborsById.get(selectedId) ?? [])
        .map((id) => nodeById.get(id))
        .filter(Boolean) as NonNullable<ReturnType<typeof nodeById.get>>[]
    : [];

  const handleNodeClick = (id: string) => {
    setSelectedId(id === "" ? null : id);
  };

  const nbCompetences = graph?.nodes.filter((n) => n.type === "competence").length ?? 0;
  const nbProjets = graph?.nodes.filter((n) => n.type === "projet").length ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Zone graphe — imposante */}
      <div className="relative h-[75vh] min-h-[560px] overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-surface/40 via-bg to-surface/20 shadow-[0_0_80px_-20px_rgba(56,189,248,0.3)]">
        <GraphHero
          graph={graph}
          interactive
          selectedId={selectedId}
          onNodeClick={handleNodeClick}
        />
        {graph && (
          <>
            <div className="pointer-events-none absolute bottom-4 left-4 flex gap-4 rounded-md border border-border/60 bg-bg/70 px-3 py-2 text-xs backdrop-blur">
              <LegendDot color="#22d3ee" label="Candidat" />
              <LegendDot color="#a78bfa" label="Projet" />
              <LegendDot color="#e6e8ee" label="Compétence" />
            </div>
            <div className="pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-1 rounded-md border border-border/60 bg-bg/70 px-3 py-1.5 text-right font-mono text-[0.7rem] text-fg-muted backdrop-blur">
              <span>
                {nbProjets} projets · {nbCompetences} compétences
              </span>
              <span className="text-[0.65rem] text-fg-muted/70">
                clic : focus · molette : zoom · drag : déplacer
              </span>
            </div>
          </>
        )}
      </div>

      {/* Sidebar — dynamique selon la sélection */}
      <aside className="space-y-4">
        {selectedNode ? (
          <NodeDetail
            node={selectedNode}
            neighbors={neighbors}
            onClose={() => setSelectedId(null)}
            onSelectNeighbor={(id) => setSelectedId(id)}
          />
        ) : (
          <TransversalesPanel transversales={transversales} />
        )}
      </aside>
    </div>
  );
}

function NodeDetail({
  node,
  neighbors,
  onClose,
  onSelectNeighbor,
}: {
  node: NonNullable<GraphOut["nodes"][number]>;
  neighbors: NonNullable<GraphOut["nodes"][number]>[];
  onClose: () => void;
  onSelectNeighbor: (id: string) => void;
}) {
  // Regroupe les voisins par type pour la lisibilité
  const grouped: Record<"candidat" | "projet" | "competence", typeof neighbors> = {
    candidat: [],
    projet: [],
    competence: [],
  };
  for (const n of neighbors) grouped[n.type].push(n);

  const typeLabel = TYPE_LABEL[node.type];
  const typeColor = TYPE_COLOR[node.type];

  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-fg-muted">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: typeColor }}
              aria-hidden
            />
            {typeLabel}
          </div>
          <h2 className="text-lg font-semibold leading-tight">{node.label}</h2>
          {node.type === "competence" && node.nb_projets !== undefined && (
            <p className="mt-1 font-mono text-xs text-fg-muted">
              utilisée dans {node.nb_projets} projet{node.nb_projets > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le détail"
          className="rounded-md border border-border/60 p-1 text-fg-muted transition hover:border-accent/50 hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {(Object.keys(grouped) as Array<keyof typeof grouped>).map((type) => {
        const items = grouped[type];
        if (items.length === 0) return null;
        return (
          <div key={type} className="mb-4 last:mb-0">
            <h3 className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-fg-muted">
              {items.length} {TYPE_LABEL[type].toLowerCase()}
              {items.length > 1 ? "s" : ""} connecté
              {items.length > 1 ? "s" : ""}
            </h3>
            <ul className="space-y-1">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onSelectNeighbor(n.id)}
                    className="group flex w-full items-center gap-2 rounded-md border border-border/40 bg-bg/40 px-2.5 py-1.5 text-left text-sm transition hover:border-accent/40"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: TYPE_COLOR[n.type] }}
                      aria-hidden
                    />
                    <span className="truncate">{n.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {neighbors.length === 0 && (
        <p className="text-sm text-fg-muted">Aucun voisin direct.</p>
      )}
    </div>
  );
}

function TransversalesPanel({
  transversales,
}: {
  transversales: TransversalesOut | null;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-5">
      <h2 className="mb-4 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-fg-muted">
        Compétences transversales
      </h2>
      {transversales && transversales.competences.length > 0 ? (
        <ul className="space-y-2">
          {transversales.competences.map((c) => (
            <li
              key={c.skill_slug}
              className="rounded-lg border border-border/40 bg-bg/40 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{c.nom}</span>
                <span className="font-mono text-xs text-fg-muted">
                  {c.nb_projets} projets
                </span>
              </div>
              <p className="mt-1 font-mono text-[0.7rem] text-fg-muted/80">
                {c.projets.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-fg-muted">
          Clic sur un nœud du graphe pour voir ses connexions.
        </p>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-fg">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}
