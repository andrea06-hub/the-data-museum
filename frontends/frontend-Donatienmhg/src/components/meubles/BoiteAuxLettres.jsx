// 📮 Boîte aux lettres violette : le drapeau se lève et une lettre dépasse quand on la survole.

import { motion } from 'framer-motion'

export default function BoiteAuxLettres({ className, active = false }) {
  return (
    <svg viewBox="0 0 120 200" className={className} aria-hidden>
      <ellipse cx="60" cy="196" rx="30" ry="4" className="fill-black/50" />
      <rect x="54" y="92" width="12" height="104" rx="2" className="fill-nuit-600" />

      {/* Lettre qui dépasse de la fente */}
      <motion.g initial={false} animate={{ y: active ? -14 : 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}>
        <rect x="38" y="44" width="44" height="26" rx="2" className="fill-[#efe9dc]" />
        <path d="M38 44 L60 58 L82 44" className="fill-none stroke-slate-400" strokeWidth="1.5" />
      </motion.g>

      {/* Corps de la boîte */}
      <path d="M14 46 Q14 14 60 14 Q106 14 106 46 L106 98 L14 98 Z" className="fill-accent/90" />
      <path d="M20 46 Q20 20 60 20 Q100 20 100 46" className="fill-none stroke-white/15" strokeWidth="3" />
      <rect x="30" y="52" width="60" height="7" rx="3.5" className="fill-nuit-950" />
      <rect x="40" y="70" width="40" height="14" rx="2" className="fill-nuit-950/60" />
      <text x="60" y="81" textAnchor="middle" className="fill-accent-clair text-[9px] font-bold tracking-widest">
        COURRIER
      </text>

      {/* Drapeau : levé = « vous avez du courrier » */}
      <motion.g
        style={{ originX: 0, originY: 1 }}
        initial={false}
        animate={{ rotate: active ? 0 : 80 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      >
        <rect x="106" y="34" width="5" height="44" rx="2" className="fill-slate-400" />
        <rect x="106" y="34" width="14" height="12" rx="2" className="fill-rose-500" />
      </motion.g>
    </svg>
  )
}
