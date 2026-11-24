// 🚪 L'entrée — route 1 (profil). La porte s'ouvre et révèle la présentation.

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa6'
import { getCandidat } from '../api/client'
import { useApi } from '../api/useApi'

const CLE_PORTE = 'porte-ouverte' // la porte reste ouverte si on revient du plan

export default function Entree() {
  const { data: candidat, erreur, chargement } = useApi(getCandidat)
  const [ouverte, setOuverte] = useState(() => sessionStorage.getItem(CLE_PORTE) === '1')
  const sansAnimation = useReducedMotion()

  function ouvrir() {
    sessionStorage.setItem(CLE_PORTE, '1')
    setOuverte(true)
  }

  if (chargement) return <Message>On vient vous ouvrir…</Message>
  if (erreur) {
    return (
      <Message>
        Impossible de joindre l'API ({erreur.message}).
        <br />
        Vérifiez que le backend tourne (<code className="text-accent-clair">just dev</code>).
      </Message>
    )
  }

  const nomComplet = `${candidat.prenom} ${candidat.nom}`
  const duree = sansAnimation ? 0 : 1.2

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <Couloir />

      {/* Chambranle (cadre de la porte) */}
      <div className="relative rounded-t-3xl bg-nuit-700 p-3 pb-0 shadow-[0_0_80px_-20px] shadow-accent/40">
        <div className="relative h-[min(80vh,660px)] w-[min(88vw,420px)] [perspective:1600px]">
          {/* Intérieur : se révèle quand la porte s'ouvre */}
          <motion.section
            aria-hidden={!ouverte}
            className="absolute inset-0 flex flex-col items-center gap-4 overflow-y-auto rounded-t-2xl bg-gradient-to-b from-nuit-800 via-nuit-900 to-nuit-950 px-6 py-8 text-center"
            initial={false}
            animate={{ opacity: ouverte ? 1 : 0 }}
            transition={{ delay: ouverte && !sansAnimation ? 0.5 : 0, duration: sansAnimation ? 0 : 0.6 }}
          >
            <img
              src="/avatar.png"
              alt={`Avatar de ${candidat.prenom}`}
              className="size-28 shrink-0 rounded-full shadow-[0_0_50px] shadow-accent/50 ring-4 ring-accent/60"
            />
            <div>
              <h1 className="font-titre text-3xl font-bold text-white">{nomComplet}</h1>
              <p className="mt-2 text-sm font-medium text-accent-clair">{candidat.titre}</p>
            </div>

            {candidat.bio && (
              <p className="text-[13px] leading-relaxed text-slate-400">{candidat.bio}</p>
            )}

            <ul className="flex flex-wrap justify-center gap-2" aria-label="Langues">
              {candidat.langues.map((l) => (
                <li
                  key={l.langue}
                  className="rounded-full border border-nuit-600 bg-nuit-800/60 px-3 py-1 text-xs"
                >
                  {l.langue} <span className="text-slate-500">·</span> {l.niveau}
                </li>
              ))}
            </ul>

            <Contacts contacts={candidat.contacts} />

            <Link
              to="/plan"
              tabIndex={ouverte ? 0 : -1}
              className="mt-auto rounded-full bg-accent px-6 py-2.5 font-medium text-white shadow-lg shadow-accent/30 transition hover:bg-accent-clair hover:text-nuit-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-clair"
            >
              Visiter le portfolio →
            </Link>
          </motion.section>

          {/* La porte : pivote sur ses gonds (bord gauche) */}
          <motion.button
            type="button"
            onClick={ouvrir}
            aria-label={`Ouvrir la porte de ${nomComplet}`}
            tabIndex={ouverte ? -1 : 0}
            className="group absolute inset-0 rounded-t-2xl border border-nuit-600 bg-gradient-to-br from-nuit-700 via-nuit-800 to-nuit-900 shadow-2xl [backface-visibility:hidden] focus-visible:outline-2 focus-visible:outline-accent-clair"
            style={{ transformOrigin: 'left center', pointerEvents: ouverte ? 'none' : 'auto' }}
            initial={false}
            animate={{ rotateY: ouverte ? -105 : 0 }}
            transition={{ duration: duree, ease: [0.65, 0, 0.35, 1] }}
          >
            <Porte nomComplet={nomComplet} />
          </motion.button>
        </div>
      </div>

      {/* Paillasson */}
      <div className="relative -mt-1 rounded-md border border-nuit-700 bg-nuit-800 px-10 py-2 font-titre text-xs tracking-[0.5em] text-slate-500">
        BIENVENUE
      </div>
    </main>
  )
}

/** Décor du couloir : plafonnier, halo, sol. */
function Couloir() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Halo du plafonnier */}
      <div className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(ellipse_at_top,var(--color-nuit-700),transparent_65%)]" />
      <div className="absolute top-0 left-1/2 h-2 w-24 -translate-x-1/2 rounded-b-full bg-slate-200/80 shadow-[0_0_60px_20px] shadow-slate-200/10" />
      {/* Sol + reflet violet de la lumière sous la porte */}
      <div className="absolute inset-x-0 bottom-0 h-[18%] border-t border-nuit-800 bg-nuit-900" />
      <div className="absolute bottom-[14%] left-1/2 h-10 w-[min(70vw,360px)] -translate-x-1/2 rounded-full bg-accent/40 blur-2xl" />
    </div>
  )
}

/** Face de la porte : judas, plaque, panneaux, poignée. */
function Porte({ nomComplet }) {
  return (
    <span className="flex h-full flex-col items-center px-8 pt-10 pb-8">
      {/* Judas */}
      <span className="size-3 rounded-full bg-nuit-950 ring-2 ring-slate-500/40" />

      {/* Plaque nominative */}
      <span className="mt-8 rounded-md border border-accent/50 bg-nuit-950/70 px-5 py-2 font-titre text-lg tracking-wide text-white shadow-[0_0_25px_-5px] shadow-accent/60">
        {nomComplet}
      </span>

      {/* Panneaux moulurés */}
      <span className="mt-8 grid w-full flex-1 grid-rows-2 gap-6">
        <span className="rounded-lg border border-nuit-600/70 shadow-[inset_0_0_25px] shadow-black/40" />
        <span className="rounded-lg border border-nuit-600/70 shadow-[inset_0_0_25px] shadow-black/40" />
      </span>

      {/* Poignée */}
      <span className="absolute top-1/2 right-5 flex h-16 w-4 items-center justify-center rounded-full bg-nuit-950/60">
        <span className="size-4 rounded-full bg-accent-clair shadow-[0_0_12px] shadow-accent transition group-hover:scale-110" />
      </span>

      <span className="mt-6 animate-pulse text-xs tracking-[0.3em] text-slate-400 uppercase group-hover:text-accent-clair">
        Cliquez pour entrer
      </span>
    </span>
  )
}

/** Liens de contact avec icônes (seulement ceux renseignés). */
function Contacts({ contacts }) {
  const liens = [
    contacts.linkedin && { href: contacts.linkedin, label: 'LinkedIn', Icone: FaLinkedin },
    contacts.github && { href: contacts.github, label: 'GitHub', Icone: FaGithub },
    contacts.email && { href: `mailto:${contacts.email}`, label: 'E-mail', Icone: FaEnvelope },
  ].filter(Boolean)

  if (liens.length === 0) return null

  return (
    <ul className="flex gap-3" aria-label="Contacts">
      {liens.map(({ href, label, Icone }) => (
        <li key={label}>
          <a
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="grid size-10 place-items-center rounded-full border border-nuit-600 bg-nuit-800 text-slate-300 transition hover:-translate-y-0.5 hover:border-accent hover:text-accent-clair"
          >
            <Icone className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  )
}

function Message({ children }) {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center text-slate-400">
      <p>{children}</p>
    </main>
  )
}
