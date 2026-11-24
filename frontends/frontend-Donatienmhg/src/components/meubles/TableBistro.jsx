// Petite table de bistrot ronde (plateau vu de trois quarts).

export default function TableBistro({ className }) {
  return (
    <svg viewBox="0 0 160 150" className={className} aria-hidden>
      <ellipse cx="80" cy="146" rx="44" ry="4" className="fill-black/50" />
      <ellipse cx="80" cy="142" rx="30" ry="5" className="fill-nuit-700" />
      <rect x="76" y="30" width="8" height="112" rx="2" className="fill-nuit-700" />
      <path d="M80 110 Q60 120 52 140 M80 110 Q100 120 108 140" className="fill-none stroke-nuit-700" strokeWidth="4" />
      <ellipse cx="80" cy="30" rx="76" ry="16" className="fill-nuit-600" />
      <ellipse cx="80" cy="27" rx="72" ry="12" className="fill-nuit-700" />
      <ellipse cx="80" cy="27" rx="72" ry="12" className="fill-none stroke-white/10" strokeWidth="1.5" />
    </svg>
  )
}
