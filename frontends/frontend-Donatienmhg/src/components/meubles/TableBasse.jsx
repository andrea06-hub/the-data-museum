export default function TableBasse({ className }) {
  return (
    <svg viewBox="0 0 260 110" className={className} aria-hidden>
      <ellipse cx="130" cy="104" rx="124" ry="6" className="fill-black/40" />
      <rect x="16" y="44" width="10" height="56" rx="2" className="fill-nuit-700" />
      <rect x="234" y="44" width="10" height="56" rx="2" className="fill-nuit-700" />
      <rect x="16" y="80" width="228" height="6" rx="2" className="fill-nuit-700" />
      <rect x="0" y="34" width="260" height="14" rx="6" className="fill-nuit-600" />
      <rect x="6" y="35" width="248" height="3" rx="1.5" className="fill-white/10" />

      {/* Livres */}
      <rect x="40" y="22" width="70" height="12" rx="2" className="fill-accent/70" />
      <rect x="46" y="12" width="58" height="10" rx="2" className="fill-slate-500" />

      {/* Tasse fumante (la vapeur ondule : classe .vapeur dans index.css) */}
      <rect x="172" y="14" width="20" height="20" rx="3" className="fill-slate-300" />
      <path d="M192 19 a6 6 0 0 1 0 11" className="fill-none stroke-slate-300" strokeWidth="3" />
      <path d="M178 10 q-4 -5 0 -10" className="vapeur fill-none stroke-white/40" strokeWidth="2" />
      <path
        d="M186 10 q-4 -5 0 -10"
        className="vapeur fill-none stroke-white/40"
        strokeWidth="2"
        style={{ animationDelay: '1.2s' }}
      />
    </svg>
  )
}
