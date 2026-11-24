// 🐕 Le rottweiler de l'avatar : couché, il se réveille au survol et donne des conseils au clic.

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Chien({ messages, className = '', sombre = false }) {
  const [eveille, setEveille] = useState(false)
  const [indice, setIndice] = useState(null) // message affiché (null = aucun)
  const prochain = useRef(0)

  function parler() {
    setIndice(prochain.current)
    prochain.current = (prochain.current + 1) % messages.length
  }

  // Premier conseil à l'arrivée dans la pièce
  useEffect(() => {
    const minuteur = setTimeout(() => {
      setIndice(0)
      prochain.current = 1
    }, 1200)
    return () => clearTimeout(minuteur)
  }, [])

  // La bulle disparaît toute seule
  useEffect(() => {
    if (indice === null) return
    const minuteur = setTimeout(() => setIndice(null), 4500)
    return () => clearTimeout(minuteur)
  }, [indice])

  const reveil = { onMouseEnter: () => setEveille(true), onMouseLeave: () => setEveille(false) }

  return (
    <div className={`pointer-events-auto ${className}`}>
      <AnimatePresence>
        {indice !== null && (
          <motion.p
            key={indice}
            role="status"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            style={{ x: '-50%' }}
            className="absolute bottom-full left-1/2 mb-3 w-60 rounded-2xl bg-white px-4 py-2.5 text-center text-xs leading-snug font-medium text-nuit-950 shadow-xl shadow-black/40"
          >
            {messages[indice]}
            <span
              aria-hidden
              className="absolute top-full left-1/2 size-3 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-white"
            />
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={parler}
        {...reveil}
        onFocus={() => setEveille(true)}
        onBlur={() => setEveille(false)}
        aria-label="Le chien : cliquer pour un conseil"
        title="Wouf ?"
        className="block w-full cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-accent-clair"
      >
        <svg
          viewBox="0 0 200 112"
          className={`w-full transition duration-700 ${sombre ? 'brightness-50' : ''}`}
          aria-hidden
        >
          <ellipse cx="108" cy="106" rx="90" ry="5" className="fill-black/50" />

          {/* Queue : remue quand il est réveillé */}
          <motion.path
            d="M176 74 q14 -6 16 -18"
            className="fill-none stroke-neutral-900"
            strokeWidth="7"
            strokeLinecap="round"
            style={{ originX: 0, originY: 1 }}
            animate={eveille ? { rotate: [0, 22, -8, 22, 0] } : { rotate: 0 }}
            transition={eveille ? { duration: 0.6, repeat: Infinity } : { duration: 0.3 }}
          />

          {/* Corps, cuisse, pattes */}
          <ellipse cx="158" cy="86" rx="24" ry="18" className="fill-neutral-900" />
          <ellipse cx="118" cy="80" rx="60" ry="24" className="fill-neutral-900" />
          <ellipse cx="120" cy="64" rx="40" ry="5" className="fill-white/5" />
          <ellipse cx="146" cy="102" rx="14" ry="6" className="fill-amber-700" />
          <rect x="44" y="86" width="48" height="10" rx="5" className="fill-neutral-800" />
          <ellipse cx="48" cy="91" rx="7" ry="5" className="fill-amber-800" />
          <rect x="36" y="94" width="56" height="11" rx="5.5" className="fill-neutral-900" />
          <ellipse cx="40" cy="99.5" rx="8" ry="5.5" className="fill-amber-700" />
          <ellipse cx="84" cy="86" rx="13" ry="11" className="fill-amber-700" />

          {/* Tête : posée sur les pattes quand il dort, relevée quand il est réveillé */}
          <motion.g
            style={{ originX: 0.76, originY: 0.73 }}
            initial={false}
            animate={{ rotate: eveille ? 0 : -12 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
          >
            <ellipse cx="86" cy="66" rx="18" ry="17" className="fill-neutral-900" />
            {/* Collier à pointes, comme sur l'avatar */}
            <rect x="78" y="56" width="10" height="24" rx="4" transform="rotate(-20 83 68)" className="fill-slate-500" />
            <circle cx="80" cy="60" r="2.2" className="fill-slate-300" />
            <circle cx="82" cy="67" r="2.2" className="fill-slate-300" />
            <circle cx="84" cy="74" r="2.2" className="fill-slate-300" />

            <ellipse cx="64" cy="54" rx="24" ry="19" className="fill-neutral-900" />
            <ellipse cx="43" cy="62" rx="14" ry="10" className="fill-amber-700" />
            <ellipse cx="45" cy="56" rx="12" ry="5" className="fill-neutral-900" />
            <ellipse cx="31" cy="58" rx="5.5" ry="4.5" className="fill-neutral-950" />
            <circle cx="29.5" cy="56.5" r="1.2" className="fill-white/40" />
            <path d="M33 65 q8 4 16 0" className="fill-none stroke-neutral-950" strokeWidth="1.5" />
            <ellipse cx="56" cy="44" rx="4" ry="2.5" className="fill-amber-600" />
            {eveille ? (
              <>
                <circle cx="55" cy="49" r="3.2" className="fill-white" />
                <circle cx="54.5" cy="49.5" r="2" className="fill-neutral-950" />
              </>
            ) : (
              <path d="M51 50 q4 3 8 0" className="fill-none stroke-slate-400" strokeWidth="1.5" />
            )}
            <path d="M66 36 Q80 32 80 50 Q72 47 66 36 Z" className="fill-neutral-800" />
          </motion.g>

          {/* Zzz quand il dort */}
          {!eveille &&
            [0, 1, 2].map((i) => (
              <motion.text
                key={i}
                x={70 + i * 9}
                y={24 - i * 6}
                className="fill-slate-300 text-[11px] font-bold"
                animate={{ opacity: [0, 1, 0], y: [0, -10] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}
              >
                z
              </motion.text>
            ))}
        </svg>
      </button>
    </div>
  )
}
