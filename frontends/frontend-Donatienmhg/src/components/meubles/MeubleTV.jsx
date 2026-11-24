export default function MeubleTV({ className }) {
  return (
    <svg viewBox="0 0 300 92" className={className} aria-hidden>
      <ellipse cx="150" cy="88" rx="146" ry="5" className="fill-black/40" />
      <rect x="18" y="66" width="8" height="18" className="fill-nuit-950" />
      <rect x="274" y="66" width="8" height="18" className="fill-nuit-950" />
      <rect x="0" y="0" width="300" height="68" rx="6" className="fill-nuit-700" />
      <rect x="4" y="1" width="292" height="3" rx="1.5" className="fill-white/10" />
      <rect x="12" y="12" width="132" height="44" rx="3" className="fill-none stroke-nuit-600" strokeWidth="2" />
      <rect x="156" y="12" width="132" height="44" rx="3" className="fill-none stroke-nuit-600" strokeWidth="2" />
      <circle cx="134" cy="34" r="3" className="fill-slate-400" />
      <circle cx="166" cy="34" r="3" className="fill-slate-400" />
    </svg>
  )
}
