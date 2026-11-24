"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GraphOut } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-xs text-fg-muted">
      Chargement du graphe…
    </div>
  ),
});

type NodeDatum = {
  id: string;
  label: string;
  type: "candidat" | "projet" | "competence";
  nb_projets?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
};

type LinkDatum = {
  source: string | NodeDatum;
  target: string | NodeDatum;
  type: "A_REALISE" | "UTILISE";
};

const COLORS = {
  candidat: "#22d3ee",
  projet: "#a78bfa",
  competence: "#e6e8ee",
};

const HIGHLIGHT_COLOR = "#22d3ee";

export function GraphHero({
  graph,
  interactive = false,
  selectedId = null,
  onNodeClick,
}: {
  graph: GraphOut | null;
  interactive?: boolean;
  selectedId?: string | null;
  onNodeClick?: (nodeId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    if (!graph) return { nodes: [] as NodeDatum[], links: [] as LinkDatum[] };
    const nodes: NodeDatum[] = graph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      nb_projets: n.nb_projets,
    }));
    const links: LinkDatum[] = graph.links.map((l) => ({
      source: l.source,
      target: l.target,
      type: l.type,
    }));
    return { nodes, links };
  }, [graph]);

  // Voisins directs du nœud sélectionné (pour mettre en valeur les liens)
  const neighborLinks = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const set = new Set<string>();
    for (const link of data.links) {
      const s =
        typeof link.source === "string" ? link.source : link.source.id;
      const t =
        typeof link.target === "string" ? link.target : link.target.id;
      if (s === selectedId || t === selectedId) {
        set.add(`${s}->${t}`);
      }
    }
    return set;
  }, [data.links, selectedId]);

  // Centre + zoome sur le nœud sélectionné
  useEffect(() => {
    if (!interactive || !selectedId || !graphRef.current) return;
    const node = data.nodes.find((n) => n.id === selectedId) as NodeDatum | undefined;
    if (!node || node.x === undefined || node.y === undefined) return;
    graphRef.current.centerAt(node.x, node.y, 600);
    graphRef.current.zoom(2.4, 600);
  }, [selectedId, interactive, data.nodes]);

  const containerClasses = interactive
    ? "absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
    : "absolute inset-0 overflow-hidden [mask-image:radial-gradient(circle_at_center,black_50%,transparent_90%)]";

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      aria-hidden={!interactive}
    >
      {size && graph && (
        <ForceGraph2D
          ref={graphRef}
          graphData={data}
          width={size.w}
          height={size.h}
          backgroundColor="transparent"
          nodeRelSize={4}
          nodeColor={(n) => COLORS[(n as NodeDatum).type]}
          linkColor={(l) => {
            if (!selectedId) return "rgba(140, 147, 165, 0.25)";
            const s = typeof l.source === "string" ? l.source : (l.source as NodeDatum).id;
            const t = typeof l.target === "string" ? l.target : (l.target as NodeDatum).id;
            return neighborLinks.has(`${s}->${t}`)
              ? "rgba(56, 189, 248, 0.6)"
              : "rgba(140, 147, 165, 0.1)";
          }}
          linkWidth={(l) => {
            if (!selectedId) return 0.6;
            const s = typeof l.source === "string" ? l.source : (l.source as NodeDatum).id;
            const t = typeof l.target === "string" ? l.target : (l.target as NodeDatum).id;
            return neighborLinks.has(`${s}->${t}`) ? 1.8 : 0.4;
          }}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTime={6000}
          enableNodeDrag={interactive}
          enableZoomInteraction={interactive}
          enablePanInteraction={interactive}
          onNodeClick={interactive && onNodeClick
            ? (n) => onNodeClick((n as NodeDatum).id)
            : undefined}
          onBackgroundClick={interactive && onNodeClick
            ? () => onNodeClick("")  // désélectionne
            : undefined}
          nodeLabel={
            interactive
              ? (n) => {
                  const node = n as NodeDatum;
                  const suffix =
                    node.type === "competence" && node.nb_projets
                      ? ` · ${node.nb_projets} projet${node.nb_projets > 1 ? "s" : ""}`
                      : "";
                  return `${node.label} (${node.type})${suffix}`;
                }
              : undefined
          }
          nodeCanvasObject={(n, ctx, globalScale) => {
            const node = n as NodeDatum;
            const isSelected = node.id === selectedId;
            const baseR =
              node.type === "candidat"
                ? 8
                : node.type === "projet"
                  ? 5
                  : Math.max(3, Math.min(7, (node.nb_projets ?? 1) + 2));
            const r = isSelected ? baseR + 3 : baseR;

            // Halo autour du nœud sélectionné
            if (isSelected) {
              ctx.beginPath();
              ctx.arc(node.x ?? 0, node.y ?? 0, r + 6, 0, 2 * Math.PI);
              ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
              ctx.fill();
              ctx.beginPath();
              ctx.arc(node.x ?? 0, node.y ?? 0, r + 2, 0, 2 * Math.PI);
              ctx.strokeStyle = HIGHLIGHT_COLOR;
              ctx.lineWidth = 1.5 / globalScale;
              ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
            ctx.fillStyle = COLORS[node.type];
            ctx.globalAlpha =
              selectedId && !isSelected
                ? node.type === "competence"
                  ? 0.4
                  : 0.5
                : node.type === "competence"
                  ? 0.85
                  : 1;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Label sur candidat toujours, et sur nœud sélectionné
            const showLabel =
              (node.type === "candidat" && globalScale >= 0.7) || isSelected;
            if (showLabel) {
              ctx.font = `600 ${12 / globalScale}px var(--font-inter), sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = "#e6e8ee";
              ctx.fillText(
                node.label,
                node.x ?? 0,
                (node.y ?? 0) + r + 4 / globalScale,
              );
            }
          }}
        />
      )}
      {!graph && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-fg-muted">
          Le graphe sera chargé dès que l&apos;API est accessible.
        </div>
      )}
    </div>
  );
}
