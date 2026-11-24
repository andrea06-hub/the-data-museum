// 🖥️ L'écran de l'atelier : en veille, un mini tableau de bord (route 3) ;
// avec un projet, son détail complet + les projets similaires (route 4, Neo4j).

import { useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaArrowUpRightFromSquare, FaGithub, FaUsers, FaXmark } from 'react-icons/fa6'
import { getSimilaires } from '../../api/client'
import { useApi } from '../../api/useApi'
import { formatPeriode } from '../../utils/dates'
import { nomDepuisSlug } from '../../utils/texte'

const LIGNES_BALAYAGE =
  'pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_2px,rgba(255,255,255,0.025)_2px_3px)]'

/** L'écran posé sur le bureau (dans la scène). */
export function EcranBureau({ projet, stats, onOuvrir, className = '' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.button
        type="button"
        layoutId="ecran"
        onClick={onOuvrir}
        disabled={!projet}
        aria-label={projet ? `Agrandir l'écran : ${projet.titre}` : 'Écran en veille : tableau de bord'}
        className="pointer-events-auto w-full rounded-lg bg-nuit-950 p-1.5 text-left shadow-[0_0_60px_-12px] shadow-accent/60 ring-1 ring-nuit-600 transition enabled:cursor-pointer enabled:hover:ring-accent/60 focus-visible:outline-2 focus-visible:outline-accent-clair"
      >
        <span className="relative block aspect-[16/10] overflow-hidden rounded bg-gradient-to-br from-nuit-800 to-nuit-950 p-3">
          <span aria-hidden className={LIGNES_BALAYAGE} />
          {projet ? <ApercuProjet projet={projet} /> : <TableauDeBord stats={stats} />}
        </span>
      </motion.button>
      <span aria-hidden className="h-4 w-[10%] bg-nuit-600" />
      <span aria-hidden className="h-1.5 w-[36%] rounded-t-full bg-nuit-600" />
    </div>
  )
}

/** Tableau de bord en veille : les compétences les plus utilisées (route 3). */
export function TableauDeBord({ stats, grand = false }) {
  if (!stats) return <span className="text-xs text-slate-500">Tableau de bord indisponible.</span>
  // En petit (écran du bureau), 4 barres pour laisser la place à l'indication en bas
  const top = stats.competences.slice(0, grand ? 8 : 4)
  const max = top[0]?.nb_projets || 1
  return (
    <span className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-accent-clair uppercase">
          Tableau de bord
        </span>
        <span className="text-[10px] text-slate-400">
          {stats.nb_projets} projets · {stats.nb_competences} compétences
        </span>
      </span>
      <span className={`mt-2 block ${grand ? 'space-y-2' : 'space-y-1'}`}>
        {top.map((c) => (
          <span key={c.skill_slug} className="flex items-center gap-2 text-[10px]">
            <span className={`shrink-0 truncate text-slate-300 ${grand ? 'w-32' : 'w-20'}`}>{c.nom}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-nuit-700">
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-clair"
                initial={{ width: 0 }}
                animate={{ width: `${(c.nb_projets / max) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </span>
            <span className="w-3 text-right text-slate-400">{c.nb_projets}</span>
          </span>
        ))}
      </span>
      {!grand && (
        <span className="absolute right-3 bottom-1.5 text-[9px] text-slate-500">
          ▸ choisissez une fiche au tableau
        </span>
      )}
    </span>
  )
}

function ApercuProjet({ projet }) {
  return (
    <span className="block">
      <span className="text-[10px] font-semibold tracking-[0.2em] text-accent-clair uppercase">
        Projet ouvert
      </span>
      <span className="mt-1 line-clamp-2 block font-titre text-sm leading-snug font-bold text-white">
        {projet.titre}
      </span>
      <span className="mt-2 flex flex-wrap gap-1">
        {projet.competences.slice(0, 5).map((c) => (
          <span key={c.skill_slug} className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] text-accent-clair">
            {c.nom}
          </span>
        ))}
      </span>
      <span className="absolute right-3 bottom-1.5 text-[9px] text-slate-500">▸ cliquez pour agrandir</span>
    </span>
  )
}

/** L'écran agrandi (« on s'assoit devant ») : détail complet du projet. */
export function EcranAgrandi({ projet, mesProjets, onChoisir, onFermer }) {
  useEffect(() => {
    const echap = (e) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [onFermer])

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onFermer}
    >
      <motion.article
        layoutId="ecran"
        role="dialog"
        aria-modal="true"
        aria-label={projet.titre}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-xl bg-nuit-950 p-2.5 shadow-2xl shadow-accent/30 ring-1 ring-nuit-600"
      >
        <div className="relative max-h-[80vh] overflow-y-auto rounded-lg bg-gradient-to-br from-nuit-800 to-nuit-950 p-6 sm:p-8">
          <span aria-hidden className={LIGNES_BALAYAGE} />
          <button
            type="button"
            onClick={onFermer}
            autoFocus
            aria-label="Fermer l'écran"
            className="absolute top-5 right-5 grid size-9 place-items-center rounded-full border border-nuit-600 text-slate-400 transition hover:border-accent hover:text-white"
          >
            <FaXmark />
          </button>
          <DetailProjet projet={projet} mesProjets={mesProjets} onChoisir={onChoisir} />
        </div>
      </motion.article>
    </motion.div>
  )
}

function DetailProjet({ projet, mesProjets, onChoisir }) {
  const liens = [
    projet.liens?.github && { href: projet.liens.github, label: 'Code sur GitHub', Icone: FaGithub },
    projet.liens?.demo && { href: projet.liens.demo, label: 'Voir la démo', Icone: FaArrowUpRightFromSquare },
  ].filter(Boolean)

  return (
    <div className="relative flex flex-col gap-4">
      <p className="text-xs tracking-[0.2em] text-accent-clair uppercase">
        {projet.type ?? 'Projet'}
        {projet.date_debut && ` · ${formatPeriode(projet.date_debut, projet.date_fin)}`}
      </p>
      <h2 className="pr-10 font-titre text-2xl font-bold text-white sm:text-3xl">{projet.titre}</h2>

      {projet.auteurs.length > 1 && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <FaUsers className="text-accent-clair" aria-hidden />
          Projet d'équipe : {projet.auteurs.map(nomDepuisSlug).join(', ')}
        </p>
      )}

      {projet.description && <p className="leading-relaxed text-slate-300">{projet.description}</p>}

      <ul className="flex flex-wrap gap-2" aria-label="Compétences utilisées">
        {projet.competences.map((c) => (
          <li key={c.skill_slug} className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent-clair">
            {c.nom}
          </li>
        ))}
      </ul>

      {projet.resultats && (
        <p className="rounded-lg border border-nuit-600 bg-nuit-900/60 p-3 text-sm text-slate-300">
          <span className="font-semibold text-white">Résultats : </span>
          {projet.resultats}
        </p>
      )}

      {liens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {liens.map(({ href, label, Icone }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-clair hover:text-nuit-950"
            >
              <Icone aria-hidden /> {label}
            </a>
          ))}
        </div>
      )}

      <Similaires projetSlug={projet.projet_slug} mesProjets={mesProjets} onChoisir={onChoisir} />
    </div>
  )
}

/** Projets similaires (route 4, Neo4j) : les miens sont cliquables pour passer de l'un à l'autre. */
function Similaires({ projetSlug, mesProjets, onChoisir }) {
  const appel = useCallback(() => getSimilaires(projetSlug, 4), [projetSlug])
  const { data, erreur, chargement } = useApi(appel)

  return (
    <section className="mt-2 border-t border-nuit-700 pt-4">
      <h3 className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">Projets similaires</h3>
      {chargement && <p className="mt-2 text-sm text-slate-500">Recherche dans le graphe…</p>}
      {erreur && (
        <p className="mt-2 text-sm text-slate-500">
          Les projets similaires sont momentanément indisponibles (graphe Neo4j injoignable).
        </p>
      )}
      {data && data.similaires.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">Aucun projet ne partage de compétence avec celui-ci.</p>
      )}
      {data && data.similaires.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.similaires.map((s) => {
            const monProjet = mesProjets.find((p) => p.projet_slug === s.projet_slug)
            const contenu = (
              <>
                <span className="block font-medium text-white">{s.titre}</span>
                <span className="block text-xs text-slate-400">
                  {s.score} compétence{s.score > 1 ? 's' : ''} en commun : {s.competences_communes.join(', ')}
                </span>
                {!monProjet && (
                  <span className="block text-xs text-slate-500">par {s.auteurs.map(nomDepuisSlug).join(', ')}</span>
                )}
              </>
            )
            return (
              <li key={s.projet_slug}>
                {monProjet ? (
                  <button
                    type="button"
                    onClick={() => onChoisir(monProjet)}
                    className="w-full cursor-pointer rounded-lg border border-nuit-600 bg-nuit-900/60 p-3 text-left transition hover:border-accent"
                  >
                    {contenu}
                  </button>
                ) : (
                  <div className="rounded-lg border border-nuit-700 bg-nuit-900/40 p-3">{contenu}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
