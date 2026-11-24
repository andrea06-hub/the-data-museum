export default function Bureau({ className }) {
  return (
    <svg viewBox="0 0 480 200" className={className} aria-hidden>
      <ellipse cx="240" cy="194" rx="236" ry="6" className="fill-black/40" />

      {/* Pied gauche */}
      <rect x="22" y="14" width="14" height="176" rx="3" className="fill-nuit-700" />

      {/* Caisson à tiroirs */}
      <rect x="320" y="14" width="140" height="176" rx="4" className="fill-nuit-700" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x="330"
            y={26 + i * 54}
            width="120"
            height="44"
            rx="3"
            className="fill-none stroke-nuit-600"
            strokeWidth="2"
          />
          <rect x="372" y={44 + i * 54} width="36" height="6" rx="3" className="fill-slate-500" />
        </g>
      ))}

      {/* Plateau */}
      <rect x="0" y="0" width="480" height="18" rx="4" className="fill-nuit-600" />
      <rect x="6" y="1" width="468" height="4" rx="2" className="fill-white/10" />
    </svg>
  )
}
