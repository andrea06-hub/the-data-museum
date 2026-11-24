"use client";

import { useEffect, useRef } from "react";
import type { GraphOut } from "@/lib/types";

type Sim = {
  id: string;
  type: "candidat" | "projet" | "competence";
  x: number;
  y: number;
  vx: number;
  vy: number;
  deg: number;
  r: number;
  phase: number;
};

/**
 * Graphe décoratif du hero : la simulation est jouée jusqu'à stabilisation
 * (layout propre et figé), puis on anime seulement une pulsation lumineuse
 * pour garder un effet "vivant" sans tremblement. Couleurs lues depuis les
 * tokens CSS → suit le thème.
 */
export function GraphCanvas({ graph }: { graph: GraphOut | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graph) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    // --- Construction du modèle + degrés ---
    const nodes: Sim[] = graph.nodes.map((n, i) => {
      const a = (i / Math.max(1, graph.nodes.length)) * Math.PI * 2;
      return {
        id: n.id,
        type: n.type,
        x: 0.5 + Math.cos(a) * 0.28 + (Math.random() - 0.5) * 0.04,
        y: 0.5 + Math.sin(a) * 0.28 + (Math.random() - 0.5) * 0.04,
        vx: 0,
        vy: 0,
        deg: 0,
        r: 0,
        phase: Math.random() * Math.PI * 2,
      };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const edges = graph.links
      .map((l) => {
        const s = byId.get(
          typeof l.source === "string" ? l.source : (l.source as { id: string }).id,
        );
        const t = byId.get(
          typeof l.target === "string" ? l.target : (l.target as { id: string }).id,
        );
        return s && t ? { s, t } : null;
      })
      .filter(Boolean) as { s: Sim; t: Sim }[];

    for (const e of edges) {
      e.s.deg++;
      e.t.deg++;
    }
    // Rayon par type + degré (les nœuds les plus connectés sont plus gros)
    for (const n of nodes) {
      const base =
        n.type === "candidat" ? 11 : n.type === "projet" ? 6 : 4;
      n.r = base + Math.sqrt(n.deg) * (n.type === "competence" ? 1.1 : 1.6);
    }
    const candidat = nodes.find((n) => n.type === "candidat");
    if (candidat) {
      candidat.x = 0.5;
      candidat.y = 0.5;
    }

    // --- Simulation jouée jusqu'à stabilisation (hors écran) ---
    const stepPhysics = (alpha: number) => {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.0004) {
            d2 = 0.0004;
            dx = (Math.random() - 0.5) * 0.02;
            dy = (Math.random() - 0.5) * 0.02;
          }
          const f = (0.0006 / d2) * alpha;
          const d = Math.sqrt(d2);
          a.vx += (dx / d) * f;
          a.vy += (dy / d) * f;
          b.vx -= (dx / d) * f;
          b.vy -= (dy / d) * f;
        }
      }
      for (const e of edges) {
        const dx = e.t.x - e.s.x;
        const dy = e.t.y - e.s.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.0001;
        const target =
          e.s.type === "candidat" || e.t.type === "candidat" ? 0.24 : 0.14;
        const f = (d - target) * 0.08 * alpha;
        e.s.vx += (dx / d) * f;
        e.s.vy += (dy / d) * f;
        e.t.vx -= (dx / d) * f;
        e.t.vy -= (dy / d) * f;
      }
      for (const n of nodes) {
        n.vx += (0.5 - n.x) * 0.004 * alpha;
        n.vy += (0.5 - n.y) * 0.004 * alpha;
        n.vx *= 0.8;
        n.vy *= 0.8;
        n.x += n.vx;
        n.y += n.vy;
      }
      if (candidat) {
        candidat.x += (0.5 - candidat.x) * 0.2;
        candidat.y += (0.5 - candidat.y) * 0.2;
      }
    };

    let alpha = 1;
    for (let i = 0; i < 600; i++) {
      stepPhysics(alpha);
      alpha *= 0.99;
    }
    // Marge pour que rien ne touche les bords
    for (const n of nodes) {
      n.x = 0.1 + n.x * 0.8;
      n.y = 0.12 + n.y * 0.76;
    }

    // --- Rendu ---
    let W = 0;
    let H = 0;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      W = parent.clientWidth;
      H = parent.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const cssVar = (name: string) =>
      getComputedStyle(document.body).getPropertyValue(name).trim();

    const pad = 20;
    const px = (n: Sim) => pad + n.x * (W - pad * 2);
    const py = (n: Sim) => pad + n.y * (H - pad * 2);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const accent = cssVar("--accent");
      const violet = cssVar("--violet");
      const fg = cssVar("--fg");

      // Liens : plus visibles près du candidat, courbés très légèrement
      for (const e of edges) {
        const nearCandidat =
          e.s.type === "candidat" || e.t.type === "candidat";
        ctx.strokeStyle = nearCandidat
          ? "rgba(34,211,238,0.28)"
          : "rgba(130,140,160,0.16)";
        ctx.lineWidth = nearCandidat ? 1.1 : 0.7;
        ctx.beginPath();
        ctx.moveTo(px(e.s), py(e.s));
        ctx.lineTo(px(e.t), py(e.t));
        ctx.stroke();
      }

      // Nœuds (compétences derrière, projets, candidat devant)
      const order = { competence: 0, projet: 1, candidat: 2 };
      const sorted = [...nodes].sort((a, b) => order[a.type] - order[b.type]);
      for (const n of sorted) {
        const x = px(n);
        const y = py(n);
        const col =
          n.type === "candidat" ? accent : n.type === "projet" ? violet : fg;

        // Pulsation lumineuse (phase propre par nœud) → "vivant" sans bouger
        const pulse = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.0012 + n.phase);
        const glowR = n.r + 4 + pulse * (n.type === "candidat" ? 10 : 4);
        const glowA =
          (n.type === "candidat" ? 0.22 : n.type === "projet" ? 0.14 : 0.08) *
          (0.6 + 0.4 * pulse);

        const grd = ctx.createRadialGradient(x, y, n.r * 0.5, x, y, glowR);
        grd.addColorStop(0, hexA(col, glowA));
        grd.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, 7);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, n.r, 0, 7);
        ctx.fillStyle = col;
        ctx.globalAlpha = n.type === "competence" ? 0.85 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (n.type === "candidat") {
          ctx.strokeStyle = cssVar("--bg");
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    };

    let raf = 0;
    const loop = (t: number) => {
      draw(t);
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    if (reduce) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [graph]);

  if (!graph) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-fg-muted">
        Le graphe se charge dès que l&apos;API répond.
      </div>
    );
  }

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}

/** Applique une alpha à une couleur hex (#rrggbb) → rgba(). */
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length < 6) return `rgba(255,255,255,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
