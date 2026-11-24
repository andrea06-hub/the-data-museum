// Fauteuil de lecture en velours violet, avec un plaid et un livre posé.

export default function Fauteuil({ className }) {
  return (
    <svg viewBox="0 0 220 200" className={className} aria-hidden>
      <ellipse cx="110" cy="194" rx="100" ry="6" className="fill-black/50" />
      <rect x="36" y="170" width="8" height="22" rx="2" className="fill-nuit-950" />
      <rect x="176" y="170" width="8" height="22" rx="2" className="fill-nuit-950" />

      {/* Dossier capitonné */}
      <rect x="40" y="0" width="140" height="132" rx="44" className="fill-violet-950" />
      <rect x="54" y="12" width="112" height="108" rx="34" className="fill-violet-900" />
      {[
        [82, 44],
        [110, 40],
        [138, 44],
        [96, 76],
        [124, 76],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" className="fill-violet-950" />
      ))}

      {/* Oreilles / accoudoirs */}
      <rect x="14" y="62" width="46" height="104" rx="20" className="fill-violet-950" />
      <rect x="160" y="62" width="46" height="104" rx="20" className="fill-violet-950" />
      <rect x="20" y="65" width="34" height="5" rx="2.5" className="fill-white/5" />
      <rect x="166" y="65" width="34" height="5" rx="2.5" className="fill-white/5" />

      {/* Assise */}
      <rect x="48" y="118" width="124" height="44" rx="14" className="fill-violet-800" />
      <rect x="54" y="119" width="112" height="5" rx="2.5" className="fill-white/10" />
      <rect x="22" y="150" width="176" height="24" rx="10" className="fill-violet-950" />

      {/* Plaid sur l'accoudoir + livre posé */}
      <path d="M160 70 Q190 66 206 80 L206 132 Q186 124 166 128 Z" className="fill-amber-700/80" />
      <path d="M170 84 L200 90 M170 100 L200 106" className="stroke-amber-900/60" strokeWidth="2" />
      <rect x="70" y="108" width="40" height="10" rx="2" transform="rotate(-6 90 113)" className="fill-slate-200" />
      <rect x="70" y="108" width="40" height="3" rx="1.5" transform="rotate(-6 90 113)" className="fill-rose-800" />
    </svg>
  )
}
