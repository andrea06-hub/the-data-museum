// ✨ Guirlande lumineuse tendue sous l'avancée du balcon : un clic l'allume ou l'éteint.

const NOMBRE = 22
// Le fil est une courbe (Bézier quadratique) : on place les ampoules le long de cette courbe
const AMPOULES = Array.from({ length: NOMBRE }, (_, k) => {
  const t = (k + 0.5) / NOMBRE
  const x = 2 * (1 - t) * t * 500 + t * t * 1000
  const y = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 100 + t * t * 20
  return { gauche: x / 10, haut: (y / 120) * 100 }
})
const TEINTES = [
  'bg-amber-200 shadow-amber-200',
  'bg-accent-clair shadow-accent-clair',
  'bg-rose-300 shadow-rose-300',
  'bg-sky-200 shadow-sky-200',
]

export default function Guirlande({ allumee, onBasculer, className = '' }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden className="absolute inset-0 h-full w-full">
        <path
          d="M0 20 Q500 100 1000 20"
          className="fill-none stroke-nuit-600"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {AMPOULES.map(({ gauche, haut }, k) => (
        <span
          key={k}
          aria-hidden
          className="absolute flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${gauche}%`, top: `${haut}%` }}
        >
          <span className="h-1.5 w-1 bg-nuit-600" />
          <span
            className={`size-2.5 rounded-full transition duration-500 ${
              allumee ? `scintille shadow-[0_0_12px] ${TEINTES[k % TEINTES.length]}` : 'bg-nuit-600'
            }`}
            style={allumee ? { animationDelay: `${(k * 0.29) % 3}s` } : undefined}
          />
        </span>
      ))}
      <button
        type="button"
        onClick={onBasculer}
        aria-pressed={allumee}
        aria-label={allumee ? 'Éteindre la guirlande' : 'Allumer la guirlande'}
        title={allumee ? 'Éteindre la guirlande' : 'Allumer la guirlande'}
        className="pointer-events-auto absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent-clair"
      />
    </div>
  )
}
