// 📖 Le livre ouvert d'une compétence : à gauche mes projets (route 3), à droite qui d'autre la prouve (route 9).

import { useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaXmark } from 'react-icons/fa6'
import { CANDIDAT_SLUG, getPreuves } from '../../api/client'
import { useApi } from '../../api/useApi'
import { formatMois } from '../../utils/dates'

export default function LivreOuvert({ competence, titresProjets, onFermer }) {
  const appel = useCallback(() => getPreuves(competence.skill_slug), [competence.skill_slug])
  const preuves = useApi(appel)

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
        role="dialog"
        aria-modal="true"
        aria-label={`Livre : ${competence.nom}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ scaleX: 0.15, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        exit={{ scaleX: 0.15, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
        className="relative w-full max-w-3xl rounded-xl bg-violet-950 p-2.5 shadow-2xl shadow-black/60"
      >
        <button
          type="button"
          onClick={onFermer}
          autoFocus
          aria-label="Refermer le livre"
          className="absolute -top-3 -right-3 z-10 grid size-9 place-items-center rounded-full bg-nuit-800 text-slate-300 shadow-lg ring-1 ring-nuit-600 transition hover:text-white"
        >
          <FaXmark />
        </button>

        <div className="relative grid max-h-[80vh] overflow-y-auto rounded-lg bg-[#efe9dc] text-nuit-950 sm:grid-cols-2">
          {/* Pliure centrale */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-10 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/15 to-transparent sm:block"
          />

          {/* Page de gauche : la compétence dans mes projets */}
          <section className="p-6 sm:p-8">
            <p className="text-xs tracking-[0.2em] text-violet-800 uppercase">Compétence</p>
            <h2 className="mt-1 font-titre text-3xl font-bold">{competence.nom}</h2>
            <p className="mt-3 text-sm text-slate-700">
              Utilisée dans <strong>{competence.nb_projets}</strong> projet{competence.nb_projets > 1 ? 's' : ''}
              {competence.premiere_utilisation &&
                ` : depuis ${formatMois(competence.premiere_utilisation)}${
                  competence.derniere_utilisation !== competence.premiere_utilisation
                    ? `, la dernière fois en ${formatMois(competence.derniere_utilisation)}`
                    : ''
                }`}
              .
            </p>
            <h3 className="mt-6 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">Dans mes projets</h3>
            <ul className="mt-2 space-y-1.5">
              {competence.projets.map((slug) => (
                <li key={slug} className="flex gap-2 text-sm">
                  <span aria-hidden className="text-violet-700">❧</span>
                  {titresProjets.get(slug) ?? slug}
                </li>
              ))}
            </ul>
          </section>

          {/* Page de droite : qui prouve cette compétence (route 9) */}
          <section className="border-t border-black/10 p-6 sm:border-t-0 sm:p-8">
            <h3 className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
              Qui d'autre la prouve ?
            </h3>
            {preuves.chargement && <p className="mt-3 text-sm text-slate-600">On consulte le registre…</p>}
            {preuves.erreur && (
              <p className="mt-3 text-sm text-slate-600">
                Le registre de l'équipe est momentanément indisponible (graphe Neo4j injoignable).
              </p>
            )}
            {preuves.data && (
              <ul className="mt-3 space-y-4">
                {preuves.data.candidats.map((c) => (
                  <li key={c.candidat_slug}>
                    <p className="font-semibold">
                      {c.prenom} {c.nom}
                      {c.candidat_slug === CANDIDAT_SLUG && (
                        <span className="ml-2 rounded-full bg-violet-800 px-2 py-0.5 text-[10px] text-white">moi</span>
                      )}
                    </p>
                    {c.titre && <p className="text-xs text-slate-600">{c.titre}</p>}
                    <p className="mt-1 text-xs text-slate-700">
                      {c.nb_projets} projet{c.nb_projets > 1 ? 's' : ''} : {c.projets.map((p) => p.titre).join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </motion.article>
    </motion.div>
  )
}
