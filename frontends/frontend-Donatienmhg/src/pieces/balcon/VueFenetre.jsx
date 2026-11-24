// 🔭 Ce qu'on voit à la longue-vue dans une fenêtre d'en face : un projet récent de l'équipe (route 8),
// et les compétences que j'ai en commun avec son auteur (route 6, Neo4j).

import { useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaXmark } from 'react-icons/fa6'
import { CANDIDAT_SLUG, getCompetencesCommunes } from '../../api/client'
import { useApi } from '../../api/useApi'
import { formatPeriode } from '../../utils/dates'
import { nomDepuisSlug } from '../../utils/texte'

export default function VueFenetre({ projet, onFermer }) {
  const estAMoi = projet.auteurs.includes(CANDIDAT_SLUG)
  const voisin = projet.auteurs.find((a) => a !== CANDIDAT_SLUG)

  const appel = useCallback(
    () => (voisin ? getCompetencesCommunes([CANDIDAT_SLUG, voisin]) : Promise.resolve(null)),
    [voisin],
  )
  const communes = useApi(appel)

  useEffect(() => {
    const echap = (e) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [onFermer])

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onFermer}
    >
      <motion.article
        role="dialog"
        aria-modal="true"
        aria-label={projet.titre}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 170, damping: 20 }}
        className="relative w-full max-w-xl rounded-[2rem] bg-nuit-950 p-2 shadow-[0_0_0_10px] shadow-amber-700/70 ring-4 ring-nuit-950"
      >
        <div className="relative max-h-[78vh] overflow-y-auto rounded-[1.6rem] bg-[radial-gradient(circle_at_center,var(--color-nuit-800),var(--color-nuit-950)_85%)] p-6 sm:p-8">
          <button
            type="button"
            onClick={onFermer}
            autoFocus
            aria-label="Ranger la longue-vue"
            className="absolute top-5 right-5 grid size-9 place-items-center rounded-full border border-nuit-600 text-slate-400 transition hover:border-accent hover:text-white"
          >
            <FaXmark />
          </button>

          <p className="text-xs tracking-[0.2em] text-accent-clair uppercase">Vu à la longue-vue</p>
          <h2 className="mt-1 pr-10 font-titre text-2xl font-bold text-white">{projet.titre}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {projet.date_debut && `${formatPeriode(projet.date_debut, projet.date_fin)} · `}
            par{' '}
            {projet.auteurs
              .map((a) => (a === CANDIDAT_SLUG ? 'moi' : nomDepuisSlug(a)))
              .join(', ')}
          </p>

          {projet.description && <p className="mt-4 line-clamp-6 leading-relaxed text-slate-300">{projet.description}</p>}

          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Compétences du projet">
            {projet.competences.map((c) => (
              <li key={c.skill_slug} className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent-clair">
                {c.nom}
              </li>
            ))}
          </ul>

          {voisin && (
            <section className="mt-5 border-t border-nuit-700 pt-4">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                Ce que j'ai en commun avec {nomDepuisSlug(voisin)}
              </h3>
              {communes.chargement && <p className="mt-2 text-sm text-slate-500">On compare…</p>}
              {communes.erreur && (
                <p className="mt-2 text-sm text-slate-500">
                  Comparaison momentanément indisponible (graphe Neo4j injoignable).
                </p>
              )}
              {communes.data && (
                <p className="mt-2 text-sm text-slate-300">
                  {communes.data.competences_communes.length > 0
                    ? communes.data.competences_communes.map((c) => c.nom).join(', ')
                    : 'Aucune compétence en commun pour l’instant.'}
                </p>
              )}
            </section>
          )}

          {estAMoi && (
            <Link
              to="/atelier"
              className="mt-5 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-clair hover:text-nuit-950"
            >
              C'est un de mes projets : le voir dans l'atelier →
            </Link>
          )}
        </div>
      </motion.article>
    </motion.div>
  )
}
