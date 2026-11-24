import { useId } from 'react'

export default function LampeArchitecte({ className, allumee = true }) {
  const idCone = useId()
  const fondu = `transition-opacity duration-700 ${allumee ? 'opacity-100' : 'opacity-0'}`
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden>
      <defs>
        <linearGradient id={idCone} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Faisceau vers le plateau du bureau */}
      <path d="M150 92 L182 98 L200 220 L96 220 Z" fill={`url(#${idCone})`} className={fondu} />

      {/* Socle */}
      <ellipse cx="40" cy="212" rx="32" ry="7" className="fill-nuit-600" />
      <rect x="28" y="202" width="24" height="10" rx="3" className="fill-nuit-700" />

      {/* Bras articulé + ressort */}
      <path
        d="M40 206 L72 120 L140 76"
        className="fill-none stroke-nuit-600"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M47 200 L77 126" className="stroke-slate-500" strokeWidth="1.5" />
      {[
        [40, 206],
        [72, 120],
        [140, 76],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="6" className="fill-nuit-700 stroke-nuit-600" strokeWidth="2" />
      ))}

      {/* Tête de lampe + ampoule */}
      <path d="M128 66 L170 78 L160 104 L120 86 Z" className="fill-nuit-700" />
      <path d="M170 78 L160 104" className="stroke-nuit-600" strokeWidth="3" />
      <ellipse cx="165" cy="91" rx="4" ry="12" transform="rotate(20 165 91)" className={`fill-amber-200/90 ${fondu}`} />
    </svg>
  )
}
