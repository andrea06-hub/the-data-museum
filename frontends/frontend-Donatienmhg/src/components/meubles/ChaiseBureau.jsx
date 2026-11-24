const ROUES = [
  [18, 214],
  [142, 214],
  [48, 220],
  [112, 220],
]

export default function ChaiseBureau({ className }) {
  return (
    <svg viewBox="0 0 160 230" className={className} aria-hidden>
      <ellipse cx="80" cy="225" rx="70" ry="5" className="fill-black/40" />

      {/* Piètement en étoile + roulettes */}
      <path
        d={ROUES.map(([x, y]) => `M80 190 L${x} ${y}`).join(' ')}
        className="stroke-nuit-600"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {ROUES.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y + 3} r="5" className="fill-nuit-950" />
      ))}
      <rect x="74" y="120" width="12" height="72" rx="3" className="fill-nuit-600" />

      {/* Dossier */}
      <rect x="28" y="0" width="104" height="96" rx="24" className="fill-nuit-700" />
      <rect
        x="40"
        y="12"
        width="80"
        height="72"
        rx="18"
        className="fill-none stroke-accent/40"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Accoudoirs + assise */}
      <rect x="10" y="78" width="14" height="40" rx="6" className="fill-nuit-600" />
      <rect x="136" y="78" width="14" height="40" rx="6" className="fill-nuit-600" />
      <rect x="16" y="96" width="128" height="30" rx="14" className="fill-nuit-600" />
      <rect x="22" y="97" width="116" height="5" rx="2.5" className="fill-white/5" />
    </svg>
  )
}
