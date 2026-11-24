// 🌍 Guéridon avec un globe terrestre : le globe tourne quand on le survole.

import { useId, useState } from 'react'
import { motion } from 'framer-motion'

// Continents stylisés (ils défilent derrière un masque circulaire pour simuler la rotation)
const CONTINENTS = [
  { cx: 34, cy: 40, rx: 10, ry: 14 },
  { cx: 58, cy: 34, rx: 14, ry: 9 },
  { cx: 64, cy: 58, rx: 8, ry: 12 },
  { cx: 92, cy: 46, rx: 12, ry: 8 },
]

export default function GueridonGlobe({ className = '' }) {
  const idMasque = useId()
  const [tourne, setTourne] = useState(false)

  return (
    <div
      className={`pointer-events-auto cursor-grab ${className}`}
      onMouseEnter={() => setTourne(true)}
      onMouseLeave={() => setTourne(false)}
      title="Faites tourner le globe"
    >
      <svg viewBox="0 0 100 160" className="w-full" aria-hidden>
        <defs>
          <clipPath id={idMasque}>
            <circle cx="50" cy="50" r="34" />
          </clipPath>
        </defs>
        <ellipse cx="50" cy="156" rx="30" ry="4" className="fill-black/50" />

        {/* Guéridon */}
        <ellipse cx="50" cy="154" rx="20" ry="4.5" className="fill-nuit-700" />
        <rect x="46" y="116" width="8" height="38" rx="2" className="fill-nuit-700" />
        <ellipse cx="50" cy="116" rx="44" ry="7" className="fill-nuit-600" />
        <ellipse cx="50" cy="114.5" rx="42" ry="5" className="fill-white/5" />

        {/* Pied du globe */}
        <ellipse cx="50" cy="108" rx="16" ry="4" className="fill-amber-700" />
        <rect x="47" y="88" width="6" height="20" className="fill-amber-700" />

        {/* Globe : océan + continents qui défilent */}
        <circle cx="50" cy="50" r="34" className="fill-sky-900" />
        <g clipPath={`url(#${idMasque})`}>
          <motion.g
            animate={tourne ? { x: [0, -72] } : { x: 0 }}
            transition={tourne ? { duration: 3, ease: 'linear', repeat: Infinity } : { duration: 0.6 }}
          >
            {[0, 72].map((decalage) =>
              CONTINENTS.map((c) => (
                <ellipse
                  key={`${decalage}-${c.cx}`}
                  cx={c.cx + decalage}
                  cy={c.cy}
                  rx={c.rx}
                  ry={c.ry}
                  className="fill-emerald-700/80"
                />
              )),
            )}
          </motion.g>
          <ellipse cx="50" cy="50" rx="34" ry="6" className="fill-none stroke-sky-300/30" strokeWidth="1" />
          <ellipse cx="50" cy="50" rx="14" ry="34" className="fill-none stroke-sky-300/20" strokeWidth="1" />
        </g>
        <circle cx="40" cy="38" r="10" className="fill-white/10" />

        {/* Méridien en laiton */}
        <path d="M50 10 A40 40 0 0 1 50 90" className="fill-none stroke-amber-600" strokeWidth="3" />
      </svg>
    </div>
  )
}
