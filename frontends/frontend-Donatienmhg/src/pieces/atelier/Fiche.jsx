// 📌 Une fiche projet punaisée sur le tableau en liège.

import { motion } from 'framer-motion'
import { FaUsers } from 'react-icons/fa6'
import { formatPeriode } from '../../utils/dates'

const PUNAISES = ['bg-accent', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400']
const ROTATIONS = [-2, 1.5, -1, 2]

export default function Fiche({ projet, rang, active = false, attenuee = false, onChoisir, className = '' }) {
  return (
    <motion.button
      type="button"
      onClick={() => onChoisir(projet)}
      aria-pressed={active}
      title="Afficher ce projet à l'écran"
      style={{ rotate: ROTATIONS[rang % ROTATIONS.length] }}
      animate={{
        opacity: attenuee ? 0.25 : 1,
        filter: attenuee ? 'grayscale(1)' : 'grayscale(0)',
        y: active ? -6 : 0,
      }}
      whileHover={{ y: -8, rotate: 0, scale: 1.05 }}
      className={`pointer-events-auto relative cursor-pointer rounded-sm bg-[#efe9dc] p-3 pt-4 text-left text-nuit-950 shadow-lg shadow-black/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-clair ${
        active ? 'ring-4 ring-accent' : ''
      } ${className}`}
    >
      {/* Punaise */}
      <span
        aria-hidden
        className={`absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full shadow-md ring-2 ring-black/20 ${
          PUNAISES[rang % PUNAISES.length]
        }`}
      />
      <span className="line-clamp-2 block font-titre text-[13px] leading-snug font-bold">{projet.titre}</span>
      {projet.date_debut && (
        <span className="mt-1 block text-[10px] text-slate-600">
          {formatPeriode(projet.date_debut, projet.date_fin)}
        </span>
      )}
      <span className="mt-2 flex flex-wrap gap-1">
        {projet.competences.slice(0, 3).map((c) => (
          <span key={c.skill_slug} className="rounded bg-nuit-950/10 px-1.5 py-0.5 text-[9px] font-medium">
            {c.nom}
          </span>
        ))}
        {projet.competences.length > 3 && (
          <span className="text-[9px] text-slate-500">+{projet.competences.length - 3}</span>
        )}
      </span>
      {projet.auteurs.length > 1 && (
        <span className="mt-2 flex items-center gap-1 text-[9px] text-slate-600">
          <FaUsers aria-hidden /> Projet d'équipe · {projet.auteurs.length} auteurs
        </span>
      )}
    </motion.button>
  )
}
