// 🌌 Ciel de nuit : dégradé, étoiles qui scintillent, étoile filante, lune.

import { motion } from 'framer-motion'

// Étoiles placées de façon « aléatoire » mais stable (pas de saut à chaque affichage)
const ETOILES = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 37.7) % 100,
  y: (i * 23.3) % 55,
  taille: i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  delai: (i * 0.37) % 3,
}))

export function Ciel({ className = '' }) {
  return (
    <div aria-hidden className={`absolute ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#07061a] via-[#140c2e] to-[#2a1446]" />
      {ETOILES.map(({ x, y, taille, delai }, i) => (
        <span
          key={i}
          className="scintille absolute rounded-full bg-white"
          style={{ left: `${x}%`, top: `${y}%`, width: taille, height: taille, animationDelay: `${delai}s` }}
        />
      ))}
      <span className="etoile-filante absolute top-[10%] right-[12%]" />
    </div>
  )
}

export function Lune({ className = '' }) {
  return (
    <motion.div
      className={`pointer-events-auto aspect-square rounded-full bg-amber-50 shadow-[0_0_60px_10px] shadow-amber-100/30 ${className}`}
      whileHover={{ scale: 1.08, boxShadow: '0 0 90px 24px rgba(254, 243, 199, 0.4)' }}
      title="Bonne nuit !"
    >
      <span aria-hidden className="absolute top-[22%] left-[28%] size-[18%] rounded-full bg-amber-200/50" />
      <span aria-hidden className="absolute top-[52%] left-[55%] size-[24%] rounded-full bg-amber-200/40" />
      <span aria-hidden className="absolute top-[62%] left-[24%] size-[12%] rounded-full bg-amber-200/50" />
    </motion.div>
  )
}
