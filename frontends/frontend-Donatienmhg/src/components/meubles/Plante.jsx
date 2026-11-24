const FEUILLES = [
  { angle: -50, longueur: 62, teinte: 'fill-emerald-800' },
  { angle: -26, longueur: 86, teinte: 'fill-emerald-700' },
  { angle: -10, longueur: 74, teinte: 'fill-emerald-600' },
  { angle: 0, longueur: 100, teinte: 'fill-emerald-800' },
  { angle: 12, longueur: 78, teinte: 'fill-emerald-600' },
  { angle: 26, longueur: 84, teinte: 'fill-emerald-700' },
  { angle: 50, longueur: 60, teinte: 'fill-emerald-800' },
]

export default function Plante({ className }) {
  return (
    <svg viewBox="0 0 140 290" className={className} aria-hidden>
      <ellipse cx="70" cy="284" rx="40" ry="5" className="fill-black/40" />

      {FEUILLES.map(({ angle, longueur, teinte }) => (
        <g key={angle} transform={`rotate(${angle} 70 210)`}>
          <ellipse cx="70" cy={210 - longueur} rx={longueur * 0.22} ry={longueur} className={teinte} />
          <line
            x1="70"
            y1="210"
            x2="70"
            y2={220 - 2 * longueur}
            className="stroke-emerald-950/60"
            strokeWidth="1.5"
          />
        </g>
      ))}

      {/* Pot */}
      <path d="M38 214 L102 214 L94 282 L46 282 Z" className="fill-nuit-600" />
      <rect x="34" y="204" width="72" height="12" rx="4" className="fill-nuit-700" />
      <rect x="40" y="236" width="60" height="4" className="fill-accent/40" />
    </svg>
  )
}
