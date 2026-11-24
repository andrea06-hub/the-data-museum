// 📺 La télévision du salon : 3 chaînes, on zappe en cliquant (avec un peu de neige entre deux).

import { useEffect, useState } from 'react'

const CHAINES = ['En ce moment', 'En chiffres', 'Langues']

// Niveau de langue → remplissage de la barre (%)
const NIVEAUX = { natif: 100, c2: 95, c1: 85, b2: 70, b1: 55, a2: 35, a1: 20 }

export default function Television({ candidat, enCours, className = '' }) {
  const [chaine, setChaine] = useState(0)
  const [neige, setNeige] = useState(false)

  // Après un court instant de neige, on passe à la chaîne suivante
  useEffect(() => {
    if (!neige) return
    const minuteur = setTimeout(() => {
      setChaine((c) => (c + 1) % CHAINES.length)
      setNeige(false)
    }, 380)
    return () => clearTimeout(minuteur)
  }, [neige])

  return (
    <button
      type="button"
      onClick={() => setNeige(true)}
      aria-label={`Télévision, chaîne « ${CHAINES[chaine]} ». Cliquer pour changer de chaîne`}
      title="Changer de chaîne"
      className={`pointer-events-auto block cursor-pointer rounded-lg bg-nuit-950 p-1.5 text-left shadow-[0_0_70px_-12px] shadow-accent/60 ring-1 ring-nuit-600 transition hover:ring-accent/60 focus-visible:outline-2 focus-visible:outline-accent-clair ${className}`}
    >
      <span className="relative block aspect-video overflow-hidden rounded bg-gradient-to-br from-accent/35 via-nuit-900 to-nuit-950 p-3">
        {/* Lignes de balayage */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_2px,rgba(255,255,255,0.03)_2px_3px)]"
        />

        <span className="flex items-center justify-between text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
            {CHAINES[chaine]}
          </span>
          <span className="text-slate-500">CH {chaine + 1}</span>
        </span>

        <span className="mt-2 block">
          {chaine === 0 && <EnCeMoment enCours={enCours} />}
          {chaine === 1 && <EnChiffres candidat={candidat} />}
          {chaine === 2 && <Langues langues={candidat.langues} />}
        </span>

        <span className="absolute right-3 bottom-1.5 text-[9px] text-slate-500">▸ cliquez pour zapper</span>

        {neige && <span aria-hidden className="neige absolute inset-0 opacity-90" />}
      </span>
    </button>
  )
}

function EnCeMoment({ enCours }) {
  return (
    <span className="block space-y-2">
      {enCours.map((c) => (
        <span key={c.id} className="block leading-tight">
          <span className="line-clamp-1 text-[12px] font-semibold text-white">{c.titre}</span>
          <span className="text-[11px] text-accent-clair">{c.lieu}</span>
        </span>
      ))}
    </span>
  )
}

function EnChiffres({ candidat }) {
  const debuts = [...candidat.experiences, ...candidat.formations].map((e) => Number(e.debut.slice(0, 4)))
  const annees = debuts.length ? new Date().getFullYear() - Math.min(...debuts) : 0
  const chiffres = [
    { valeur: candidat.experiences.length, libelle: 'expériences' },
    { valeur: candidat.formations.length, libelle: 'formations' },
    { valeur: candidat.langues.length, libelle: 'langues' },
    { valeur: annees, libelle: 'ans de parcours' },
  ]
  return (
    <span className="grid grid-cols-2 gap-x-3 gap-y-1">
      {chiffres.map(({ valeur, libelle }) => (
        <span key={libelle} className="leading-none">
          <span className="font-titre text-xl font-bold text-white">{valeur}</span>
          <span className="ml-1 text-[10px] text-accent-clair">{libelle}</span>
        </span>
      ))}
    </span>
  )
}

function Langues({ langues }) {
  return (
    <span className="block space-y-1">
      {langues.map(({ langue, niveau }) => (
        <span key={langue} className="flex items-center gap-2 text-[10px]">
          <span className="w-14 shrink-0 text-slate-300">{langue}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-nuit-700">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-clair"
              style={{ width: `${NIVEAUX[niveau.toLowerCase()] ?? 50}%` }}
            />
          </span>
          <span className="w-8 text-right text-slate-400">{niveau}</span>
        </span>
      ))}
    </span>
  )
}
