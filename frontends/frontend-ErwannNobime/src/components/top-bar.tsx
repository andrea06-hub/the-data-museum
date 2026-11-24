"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/graphe", label: "Graphe" },
  { href: "/projets", label: "Projets" },
  { href: "/parcours", label: "Parcours" },
];

export function TopBar() {
  const pathname = usePathname();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-[max(12px,env(safe-area-inset-top,0px))] z-20 px-4">
        <div className="glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl px-4">
          <Link
            href="/"
            className="relative z-10 flex items-center gap-2.5 font-display font-semibold tracking-tight"
          >
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
            Erwann Nobime
          </Link>

          <nav className="relative z-10 hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "rounded-md px-2.5 py-1.5 font-mono text-[0.76rem] transition",
                    active
                      ? "text-accent"
                      : "text-fg-muted hover:bg-fg/5 hover:text-fg",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="relative z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--glass-edge)] bg-fg/5 px-2.5 py-1.5 font-mono text-[0.72rem] text-fg-muted transition hover:border-accent hover:text-fg"
            >
              Chercher
              <kbd className="rounded border border-border bg-fg/5 px-1.5 py-px text-[0.68rem] text-fg-muted">
                ⌘K
              </kbd>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
