export default function Canape({ className }) {
  return (
    <svg viewBox="0 0 400 180" className={className} aria-hidden>
      <ellipse cx="200" cy="172" rx="196" ry="7" className="fill-black/50" />
      <rect x="36" y="146" width="10" height="24" rx="2" className="fill-nuit-950" />
      <rect x="354" y="146" width="10" height="24" rx="2" className="fill-nuit-950" />

      {/* Dossier + coussins */}
      <rect x="24" y="10" width="352" height="100" rx="24" className="fill-nuit-700" />
      {[44, 152, 260].map((x) => (
        <g key={x}>
          <rect x={x} y="22" width="96" height="74" rx="18" className="fill-nuit-600" />
          <rect x={x + 8} y="24" width="80" height="5" rx="2.5" className="fill-white/5" />
        </g>
      ))}

      {/* Assise */}
      <rect x="24" y="96" width="352" height="54" rx="14" className="fill-nuit-600" />
      <rect x="30" y="97" width="340" height="5" rx="2.5" className="fill-white/5" />
      <path d="M140 102 V146 M260 102 V146" className="stroke-nuit-700" strokeWidth="2" />

      {/* Coussins déco */}
      <rect
        x="66"
        y="60"
        width="56"
        height="46"
        rx="14"
        transform="rotate(-12 94 83)"
        className="fill-accent/80"
      />
      <rect
        x="284"
        y="62"
        width="52"
        height="42"
        rx="14"
        transform="rotate(10 310 83)"
        className="fill-slate-500/70"
      />

      {/* Accoudoirs */}
      <rect x="2" y="58" width="50" height="96" rx="20" className="fill-nuit-700" />
      <rect x="348" y="58" width="50" height="96" rx="20" className="fill-nuit-700" />
      <rect x="10" y="61" width="34" height="5" rx="2.5" className="fill-white/5" />
      <rect x="356" y="61" width="34" height="5" rx="2.5" className="fill-white/5" />
    </svg>
  )
}
