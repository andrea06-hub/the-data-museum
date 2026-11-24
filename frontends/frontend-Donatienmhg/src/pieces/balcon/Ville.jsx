// 🏙️ La ville d'en face. Les fenêtres violettes qui pulsent = les derniers projets de l'équipe (route 8).

import { motion } from 'framer-motion'

const H = 320 // hauteur du dessin (unités SVG), le sol est en bas

// Immeubles du premier plan (x, largeur, hauteur)
const BATIMENTS = [
  { x: 0, w: 70, h: 170 },
  { x: 70, w: 110, h: 230 },
  { x: 180, w: 80, h: 150 },
  { x: 260, w: 130, h: 260 },
  { x: 390, w: 90, h: 190 },
  { x: 480, w: 120, h: 290 },
  { x: 600, w: 70, h: 160 },
  { x: 670, w: 110, h: 240 },
  { x: 780, w: 90, h: 180 },
  { x: 870, w: 130, h: 250 },
]
// Immeubles lointains, plus pâles
const FOND = [
  { x: -20, w: 140, h: 210 },
  { x: 150, w: 120, h: 270 },
  { x: 330, w: 150, h: 240 },
  { x: 560, w: 130, h: 300 },
  { x: 760, w: 160, h: 230 },
]
// Immeubles qui accueillent une fenêtre « projet » (dans l'ordre des projets)
const EMPLACEMENTS = [1, 3, 5, 7, 9, 4]
const COLONNE_PROJET = 1
const RANGEE_PROJET = 2

const fenetreX = (b, colonne) => b.x + 10 + colonne * 18
const fenetreY = (b, rangee) => H - b.h + 16 + rangee * 22

export default function Ville({ projets, onFenetre, className = '' }) {
  const fenetresProjets = new Map(
    projets.slice(0, EMPLACEMENTS.length).map((projet, i) => [EMPLACEMENTS[i], projet]),
  )

  return (
    <svg viewBox={`0 0 1000 ${H}`} preserveAspectRatio="xMidYMax slice" className={className}>
      {FOND.map((b) => (
        <rect key={`fond-${b.x}`} x={b.x} y={H - b.h} width={b.w} height={b.h} className="fill-[#1d1733]/70" />
      ))}

      {BATIMENTS.map((b, i) => {
        const projet = fenetresProjets.get(i)
        const colonnes = Math.floor((b.w - 16) / 18)
        const rangees = Math.floor((b.h - 34) / 22)
        return (
          <g key={b.x}>
            <rect x={b.x} y={H - b.h} width={b.w} height={b.h} className={i % 2 ? 'fill-[#151124]' : 'fill-[#110e1d]'} />
            <rect x={b.x} y={H - b.h} width={b.w} height="3" className="fill-white/5" />

            {/* Fenêtres ordinaires : certaines allumées */}
            {Array.from({ length: colonnes * rangees }, (_, k) => {
              const c = k % colonnes
              const r = Math.floor(k / colonnes)
              if (projet && c === COLONNE_PROJET && r === RANGEE_PROJET) return null
              const allumee = (i * 7 + c * 13 + r * 31) % 9 === 0
              return (
                <rect
                  key={k}
                  x={fenetreX(b, c)}
                  y={fenetreY(b, r)}
                  width="8"
                  height="12"
                  className={allumee ? 'fill-amber-200/75' : 'fill-[#2a2540]/80'}
                />
              )
            })}

            {/* Fenêtre « projet » : cliquable */}
            {projet && (
              <FenetreProjet
                projet={projet}
                x={fenetreX(b, COLONNE_PROJET)}
                y={fenetreY(b, RANGEE_PROJET)}
                onClick={() => onFenetre(projet)}
              />
            )}
          </g>
        )
      })}

      {/* Antenne avec feu clignotant sur la plus haute tour */}
      <line x1="540" y1={H - 290} x2="540" y2={H - 320} className="stroke-slate-500" strokeWidth="2" />
      <motion.circle
        cx="540"
        cy={H - 318}
        r="3"
        className="fill-red-500"
        animate={{ opacity: [1, 0.15, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
    </svg>
  )
}

function FenetreProjet({ projet, x, y, onClick }) {
  function clavier(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Projet de l'équipe : ${projet.titre}`}
      onClick={onClick}
      onKeyDown={clavier}
      className="group pointer-events-auto cursor-pointer outline-none"
    >
      <title>{projet.titre}</title>
      <motion.circle
        cx={x + 4}
        cy={y + 6}
        r="14"
        className="fill-accent/40"
        animate={{ opacity: [0.35, 0.9, 0.35], scale: [1, 1.25, 1] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <rect x={x} y={y} width="8" height="12" className="fill-accent-clair transition-colors group-hover:fill-white group-focus:fill-white" />
      {/* Zone de clic plus large que la fenêtre */}
      <rect x={x - 10} y={y - 10} width="28" height="32" className="fill-transparent" />
    </g>
  )
}
