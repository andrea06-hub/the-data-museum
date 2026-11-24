// 📚 L'étagère : un vrai livre par compétence (cliquable), entre des livres décoratifs et quelques objets.

import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { FaTrophy } from 'react-icons/fa6'

const COULEURS_LIVRES = [
  'bg-rose-900',
  'bg-emerald-900',
  'bg-sky-900',
  'bg-amber-800',
  'bg-violet-900',
  'bg-teal-900',
  'bg-indigo-900',
  'bg-red-950',
  'bg-lime-900',
  'bg-fuchsia-900',
  'bg-cyan-900',
  'bg-orange-900',
]
const COULEURS_DECO = ['bg-stone-700', 'bg-slate-700', 'bg-zinc-700', 'bg-neutral-700', 'bg-nuit-600']
const ETAGERES = 4

// Hauteurs et largeurs « aléatoires » mais stables d'un affichage à l'autre
const hauteurLivre = (rang) => 72 + ((rang * 37) % 22)
const hauteurDeco = (rang) => 58 + ((rang * 23) % 26)
const largeurDeco = (rang) => 10 + ((rang * 7) % 9)

/**
 * `etatDe(competence)` renvoie 'trouve' (correspond à la recherche), 'attenue' (ne correspond pas) ou 'normal'.
 */
export default function Etagere({ competences, etatDe, onOuvrir, className = '' }) {
  const rayons = Array.from({ length: ETAGERES }, () => [])
  competences.forEach((competence, rang) => rayons[rang % ETAGERES].push({ competence, rang }))

  return (
    <section
      aria-label="Étagère : une compétence par livre"
      className={`flex flex-col rounded-t-lg border-x-[12px] border-t-[12px] border-[#2b1d14] bg-[#1d140e] shadow-2xl shadow-black/60 ${className}`}
    >
      {rayons.map((livres, r) => (
        <div
          key={r}
          className="relative flex flex-1 items-end gap-[3px] border-b-[10px] border-[#3a281b] px-3 shadow-[inset_0_14px_18px_-10px_rgba(0,0,0,0.75)]"
        >
          {livres.map(({ competence, rang }, k) => (
            <Fragment key={competence.skill_slug}>
              <Livre competence={competence} rang={rang} etat={etatDe(competence)} onOuvrir={onOuvrir} />
              <LivreDeco rang={r * 5 + k} />
              {k % 2 === 0 && <LivreDeco rang={r * 5 + k + 11} />}
            </Fragment>
          ))}
          <Decoration rang={r} />
        </div>
      ))}
    </section>
  )
}

function Livre({ competence, rang, etat, onOuvrir }) {
  return (
    <motion.button
      type="button"
      onClick={() => onOuvrir(competence.skill_slug)}
      title={`${competence.nom} : ${competence.nb_projets} projet${competence.nb_projets > 1 ? 's' : ''}`}
      aria-label={`Ouvrir le livre « ${competence.nom} »`}
      style={{ height: `${hauteurLivre(rang)}%` }}
      animate={{ opacity: etat === 'attenue' ? 0.3 : 1, y: etat === 'trouve' ? -10 : 0 }}
      whileHover={{ y: -16 }}
      className={`pointer-events-auto relative flex w-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-t-sm ${
        COULEURS_LIVRES[rang % COULEURS_LIVRES.length]
      } focus-visible:outline-2 focus-visible:outline-accent-clair ${
        etat === 'trouve'
          ? 'shadow-[0_0_18px] shadow-accent ring-2 ring-accent-clair'
          : 'shadow-[inset_-3px_0_6px_rgba(0,0,0,0.45),inset_2px_0_3px_rgba(255,255,255,0.08)]'
      }`}
    >
      <span aria-hidden className="absolute inset-x-1 top-2 h-[2px] bg-amber-200/40" />
      <span aria-hidden className="absolute inset-x-1 bottom-2 h-[2px] bg-amber-200/40" />
      <span className="max-h-[78%] rotate-180 truncate text-[10px] font-semibold tracking-wide text-amber-50/90 [writing-mode:vertical-rl]">
        {competence.nom}
      </span>
    </motion.button>
  )
}

function LivreDeco({ rang }) {
  return (
    <span
      aria-hidden
      className={`shrink-0 rounded-t-sm opacity-60 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.5)] ${
        COULEURS_DECO[rang % COULEURS_DECO.length]
      }`}
      style={{ height: `${hauteurDeco(rang)}%`, width: `${largeurDeco(rang)}px` }}
    />
  )
}

/** Un objet différent au bout de chaque rayon. */
function Decoration({ rang }) {
  if (rang === 0) {
    return (
      <span aria-hidden className="ml-auto flex h-[55%] w-10 flex-col items-center justify-end">
        <span className="flex items-end gap-0.5">
          <span className="h-6 w-2.5 -rotate-12 rounded-full bg-emerald-700" />
          <span className="h-8 w-2.5 rounded-full bg-emerald-600" />
          <span className="h-6 w-2.5 rotate-12 rounded-full bg-emerald-700" />
        </span>
        <span className="h-5 w-8 rounded-b-md bg-nuit-600" />
      </span>
    )
  }
  if (rang === 1) {
    return (
      <span
        aria-hidden
        className="mb-1 ml-auto h-[50%] w-12 -rotate-3 border-4 border-amber-900 bg-gradient-to-br from-accent/60 to-nuit-900 shadow-md"
      />
    )
  }
  if (rang === 2) {
    return (
      <span aria-hidden className="ml-auto flex items-end gap-2 pb-0.5">
        <FaTrophy className="text-3xl text-amber-400/80 drop-shadow" />
        <span className="h-10 w-3 rounded-sm bg-slate-500" />
      </span>
    )
  }
  return (
    <span aria-hidden className="ml-auto flex flex-col items-end gap-0.5 pb-0.5">
      <span className="h-2.5 w-14 rounded-sm bg-rose-900" />
      <span className="h-2.5 w-12 rounded-sm bg-sky-900" />
      <span className="h-2.5 w-16 rounded-sm bg-amber-800" />
    </span>
  )
}
