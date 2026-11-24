// Cadres du parcours : version accrochée au mur et version agrandie.

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaBriefcase, FaGraduationCap, FaXmark } from 'react-icons/fa6'
import { estEnCours, formatDuree, formatPeriode } from '../../utils/dates'

/** Un cadre accroché : clou, ficelles, encadrement, passe-partout. `compact` = version scène. */
export function Cadre({ cadre, inclinaison, onOuvrir, compact = false, className = '' }) {
  const Icone = cadre.genre === 'experience' ? FaBriefcase : FaGraduationCap
  const enCours = estEnCours(cadre.fin)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`pointer-events-auto relative ${compact ? 'pt-10' : 'pt-12'} ${className}`}
    >
      {/* Clou + ficelles */}
      <span
        aria-hidden
        className="absolute top-0 left-1/2 size-3 -translate-x-1/2 rounded-full bg-slate-400 shadow"
      />
      <svg
        aria-hidden
        className={`absolute top-1.5 left-0 w-full ${compact ? 'h-10' : 'h-12'}`}
        viewBox="0 0 100 48"
        preserveAspectRatio="none"
      >
        <path
          d="M50 0 L14 48 M50 0 L86 48"
          className="fill-none stroke-slate-500"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <motion.button
        type="button"
        layoutId={cadre.id}
        onClick={() => onOuvrir(cadre)}
        style={{ rotate: inclinaison, transformOrigin: 'top center' }}
        // Au survol, le cadre oscille comme un pendule avant de se stabiliser
        whileHover={{
          rotate: [inclinaison, 3.5, -2.5, 1.5, -0.6, 0],
          scale: 1.04,
          transition: { duration: 1.3, ease: 'easeOut' },
        }}
        className={`block w-full cursor-pointer rounded-sm border-nuit-600 bg-nuit-700 text-left shadow-2xl shadow-black/60 transition-shadow hover:shadow-accent/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-clair ${
          compact ? 'border-[7px] p-1.5' : 'border-[10px] p-2'
        }`}
      >
        <span
          className={`flex flex-col bg-nuit-900 shadow-[inset_0_0_20px] shadow-black/50 ${
            compact ? 'min-h-36 gap-1.5 p-3' : 'min-h-44 gap-2 p-4'
          }`}
        >
          <span className="flex items-center justify-between">
            <Icone className="text-accent-clair" aria-hidden />
            {enCours && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-accent-clair uppercase shadow-[0_0_12px] shadow-accent/40">
                En cours
              </span>
            )}
          </span>
          <span
            className={`line-clamp-4 font-titre leading-snug font-bold text-white ${
              compact ? 'text-[13px]' : 'text-base'
            }`}
          >
            {cadre.titre}
          </span>
          <span className={compact ? 'text-xs text-slate-300' : 'text-sm text-slate-300'}>{cadre.lieu}</span>
          <span className={`mt-auto text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {formatPeriode(cadre.debut, cadre.fin)}
            {!compact && ` · ${formatDuree(cadre.debut, cadre.fin)}`}
          </span>
        </span>
      </motion.button>
    </motion.li>
  )
}

/** Le cadre vu de près : tout le détail, fermeture par ✕, clic à côté ou Échap. */
export function CadreAgrandi({ cadre, onFermer }) {
  const Icone = cadre.genre === 'experience' ? FaBriefcase : FaGraduationCap

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
        layoutId={cadre.id}
        role="dialog"
        aria-modal="true"
        aria-label={cadre.titre}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-sm border-[14px] border-nuit-600 bg-nuit-700 p-3 shadow-2xl shadow-accent/20"
      >
        <div className="flex flex-col gap-3 bg-nuit-900 p-6 sm:p-8">
          <button
            type="button"
            onClick={onFermer}
            autoFocus
            aria-label="Fermer"
            className="absolute top-6 right-6 grid size-9 place-items-center rounded-full border border-nuit-600 text-slate-400 transition hover:border-accent hover:text-white"
          >
            <FaXmark />
          </button>
          <p className="flex items-center gap-2 text-xs tracking-[0.2em] text-accent-clair uppercase">
            <Icone aria-hidden />
            {cadre.genre === 'experience' ? 'Expérience' : 'Formation'}
            {cadre.precision && ` · ${cadre.precision}`}
          </p>
          <h2 className="pr-10 font-titre text-2xl font-bold text-white">{cadre.titre}</h2>
          <p className="text-slate-300">{cadre.lieu}</p>
          <p className="text-sm text-slate-500">
            {formatPeriode(cadre.debut, cadre.fin)} · {formatDuree(cadre.debut, cadre.fin)}
          </p>
          {cadre.description && <p className="mt-2 leading-relaxed text-slate-300">{cadre.description}</p>}
        </div>
      </motion.article>
    </motion.div>
  )
}
