"use client";

import { useEffect, useRef } from "react";
import type { GraphOut } from "@/lib/types";

type Sim = {
  id: string;
  type: "candidat" | "projet" | "competence";
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

/**
 * Graphe décoratif "vivant" (simulation force-directed en canvas).
 * Lit les couleurs depuis les tokens CSS → s'adapte au thème.
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

    const nodes: Sim[] = graph.nodes.map((n, i) => {
      const a = (i / Math.max(1, graph.nodes.length)) * Math.PI * 2;
      return {
        id: n.id,
        type: n.type,
        label: n.label,
        x: 0.5 + Math.cos(a) * 0.3 + (Math.random() - 0.5) * 0.1,
        y: 0.5 + Math.sin(a) * 0.3 + (Math.random() - 0.5) * 0.1,
        vx: 0,
        vy: 0,
        r: n.type === "candidat" ? 9 : n.type === "projet" ? 5.5 : 4,
      };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const candidat = nodes.find((n) => n.type === "candidat");
    if (candidat) {
      candidat.x = 0.5;
      candidat.y = 0.5;
    }
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

    const step = () => {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy + 0.0005;
          const f = 0.00028 / d2;
          const d = Math.sqrt(d2);
          const ux = dx / d;
          const uy = dy / d;
          a.vx += ux * f;
          a.vy += uy * f;
          b.vx -= ux * f;
          b.vy -= uy * f;
        }
      }
      for (const e of edges) {
        const dx = e.t.x - e.s.x;
        const dy = e.t.y - e.s.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.0001;
        const target =
          e.s.type === "candidat" || e.t.type === "candidat" ? 0.17 : 0.12;
        const f = (d - target) * 0.012;
        const ux = dx / d;
        const uy = dy / d;
        e.s.vx += ux * f;
        e.s.vy += uy * f;
        e.t.vx -= ux * f;
        e.t.vy -= uy * f;
      }
      for (const n of nodes) {
        n.vx += (0.5 - n.x) * 0.0016;
        n.vy += (0.5 - n.y) * 0.0016;
        n.vx *= 0.86;
        n.vy *= 0.86;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(0.06, Math.min(0.94, n.x));
        n.y = Math.max(0.08, Math.min(0.92, n.y));
      }
      if (candidat) {
        candidat.x += (0.5 - candidat.x) * 0.1;
        candidat.y += (0.5 - candidat.y) * 0.1;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const accent = cssVar("--accent");
      const violet = cssVar("--violet");
      const fg = cssVar("--fg");
      const pad = 26;
      const px = (n: Sim) => pad + n.x * (W - pad * 2);
      const py = (n: Sim) => pad + n.y * (H - pad * 2);

      ctx.lineWidth = 0.7;
      ctx.strokeStyle = "rgba(130,140,160,0.22)";
      for (const e of edges) {
        ctx.beginPath();
        ctx.moveTo(px(e.s), py(e.s));
        ctx.lineTo(px(e.t), py(e.t));
        ctx.stroke();
      }
      for (const n of nodes) {
        const x = px(n);
        const y = py(n);
        const col =
          n.type === "candidat" ? accent : n.type === "projet" ? violet : fg;
        if (n.type === "candidat") {
          ctx.beginPath();
          ctx.arc(x, y, n.r + 7, 0, 7);
          ctx.fillStyle = "rgba(34,211,238,0.14)";
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, n.r, 0, 7);
        ctx.fillStyle = col;
        ctx.globalAlpha = n.type === "competence" ? 0.82 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (n.type === "candidat") {
          ctx.font = "600 12px var(--font-space), sans-serif";
          ctx.fillStyle = fg;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(n.label, x, y + n.r + 6);
        }
      }
    };

    let raf = 0;
    let ticks = 0;
    const loop = () => {
      step();
      draw();
      ticks++;
      if (reduce) {
        if (ticks < 120) raf = requestAnimationFrame(loop);
      } else {
        raf = requestAnimationFrame(loop);
      }
    };
    loop();

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
