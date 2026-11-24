import { useId } from 'react'

export default function Lampadaire({ className, allumee = true }) {
  const idCone = useId()
  const fondu = `transition-opacity duration-700 ${allumee ? 'opacity-100' : 'opacity-0'}`
  return (
    <svg viewBox="0 0 120 430" className={className} aria-hidden>
      <defs>
        <linearGradient id={idCone} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Cône de lumière */}
      <path d="M34 88 L86 88 L118 330 L2 330 Z" fill={`url(#${idCone})`} className={fondu} />

      {/* Pied */}
      <ellipse cx="60" cy="420" rx="34" ry="7" className="fill-nuit-600" />
      <ellipse cx="60" cy="416" rx="30" ry="5" className="fill-nuit-700" />
      <rect x="57" y="86" width="6" height="332" rx="3" className="fill-nuit-600" />

      {/* Abat-jour + ampoule */}
      <path d="M26 88 L94 88 L80 14 L40 14 Z" className="fill-nuit-700" />
      <path d="M40 14 L80 14" className="stroke-white/10" strokeWidth="2" />
      <ellipse cx="60" cy="88" rx="34" ry="6" className="fill-nuit-600" />
      <ellipse cx="60" cy="88" rx="34" ry="6" className={`fill-amber-200/80 ${fondu}`} />
    </svg>
  )
}
