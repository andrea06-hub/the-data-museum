// 🔭 Longue-vue sur trépied, tournée vers la ville.

export default function LongueVue({ className }) {
  return (
    <svg viewBox="0 0 140 220" className={className} aria-hidden>
      <ellipse cx="70" cy="216" rx="56" ry="4" className="fill-black/50" />

      {/* Trépied */}
      <path
        d="M70 118 L22 214 M70 118 L118 214 M70 118 L72 216"
        className="stroke-nuit-600"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="70" cy="116" r="7" className="fill-nuit-700 stroke-nuit-600" strokeWidth="2" />

      {/* Tube, oculaire et objectif */}
      <g transform="rotate(-24 70 100)">
        <rect x="22" y="90" width="100" height="22" rx="7" className="fill-nuit-600" />
        <rect x="26" y="92" width="92" height="4" rx="2" className="fill-white/10" />
        <rect x="8" y="94" width="18" height="14" rx="4" className="fill-nuit-700" />
        <rect x="118" y="86" width="14" height="30" rx="4" className="fill-amber-600" />
        <ellipse cx="132" cy="101" rx="3" ry="13" className="fill-sky-300/60" />
      </g>
    </svg>
  )
}
