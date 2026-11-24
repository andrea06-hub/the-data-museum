// 🗺️ Le plan du portfolio — routes 1 et 3 (aperçus). Chaque pièce mène à une page.

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { FaBookOpen, FaCouch, FaDoorOpen, FaScrewdriverWrench, FaSun } from 'react-icons/fa6'
import { getCandidat, getStats } from '../api/client'
import { useApi } from '../api/useApi'

// Dimensions du plan (unités SVG) — tout le dessin s'adapte à la largeur de l'écran
const L = 1000
const H = 640

const PIECES = [
  { id: 'salon', nom: 'Le salon', role: 'Parcours', chemin: '/salon', Icone: FaCouch, x: 40, y: 40, w: 480, h: 320 },
  { id: 'atelier', nom: "L'atelier", role: 'Projets', chemin: '/atelier', Icone: FaScrewdriverWrench, x: 520, y: 40, w: 440, h: 320 },
  { id: 'bibliotheque', nom: 'La bibliothèque', role: 'Compétences', chemin: '/bibliotheque', Icone: FaBookOpen, x: 40, y: 360, w: 380, h: 240 },
  { id: 'entree', nom: "L'entrée", role: 'Accueil', chemin: '/', Icone: FaDoorOpen, x: 420, y: 360, w: 200, h: 240 },
  { id: 'balcon', nom: 'Le balcon', role: 'Contact', chemin: '/balcon', Icone: FaSun, x: 620, y: 360, w: 340, h: 240 },
]

export default function Plan() {
  const { data: candidat } = useApi(getCandidat)
  const { data: stats } = useApi(getStats)
  const [survol, setSurvol] = useState(null)
  const [cible, setCible] = useState(null)
  const sansAnimation = useReducedMotion()
  const navigate = useNavigate()

  const apercus = {
    salon: candidat && `${candidat.experiences.length} expériences · ${candidat.formations.length} formations`,
    atelier: stats && `${stats.nb_projets} projets réalisés`,
    bibliotheque: stats && `${stats.nb_competences} compétences`,
    entree: 'Vous êtes ici',
    balcon: 'LinkedIn · GitHub · E-mail',
  }

  function entrer(piece) {
    if (sansAnimation) navigate(piece.chemin)
    else setCible(piece)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-accent-clair uppercase">Visite guidée</p>
          <h1 className="font-titre text-3xl font-bold text-white">Plan du portfolio</h1>
          <p className="text-sm text-slate-400">Choisissez une pièce pour y entrer.</p>
        </div>
        <Link to="/" className="text-sm text-slate-400 transition hover:text-accent-clair">
          ← Retour à la porte
        </Link>
      </header>

      {/* Le plan : zoom vers la pièce choisie, puis navigation */}
      <motion.div
        className="overflow-hidden rounded-2xl border border-nuit-700 bg-nuit-900/60 p-2 shadow-[0_0_80px_-30px] shadow-accent/50"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={cible ? { opacity: 0, scale: 2.4 } : { opacity: 1, scale: 1 }}
        style={cible ? { originX: (cible.x + cible.w / 2) / L, originY: (cible.y + cible.h / 2) / H } : undefined}
        transition={{ duration: cible ? 0.7 : 0.5, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => cible && navigate(cible.chemin)}
      >
        <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="group" aria-label="Plan du portfolio">
          <Grille />

          {PIECES.map((piece) => (
            <Piece
              key={piece.id}
              piece={piece}
              apercu={apercus[piece.id]}
              active={survol === piece.id}
              onSurvol={setSurvol}
              onEntrer={entrer}
            />
          ))}

          <Murs />
          <VousEtesIci />
        </svg>
      </motion.div>

      {/* Sur téléphone, le plan est petit : liste des pièces en complément */}
      <nav className="grid gap-2 sm:hidden" aria-label="Pièces">
        {PIECES.filter((p) => p.id !== 'entree').map(({ id, nom, role, chemin, Icone }) => (
          <Link
            key={id}
            to={chemin}
            className="flex items-center gap-3 rounded-xl border border-nuit-700 bg-nuit-800 px-4 py-3 transition hover:border-accent"
          >
            <Icone className="text-accent-clair" />
            <span className="font-medium text-white">{role}</span>
            <span className="ml-auto text-xs text-slate-500">{nom}</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}

/** Une pièce cliquable : sol, mobilier, icône, nom et aperçu. */
function Piece({ piece, apercu, active, onSurvol, onEntrer }) {
  const { id, nom, role, Icone, x, y, w, h } = piece
  const cx = x + w / 2
  const cy = y + h / 2

  function clavier(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEntrer(piece)
    }
  }

  return (
    <g
      role="link"
      tabIndex={0}
      aria-label={`${role} — ${nom}`}
      className="cursor-pointer outline-none"
      onClick={() => onEntrer(piece)}
      onKeyDown={clavier}
      onMouseEnter={() => onSurvol(id)}
      onMouseLeave={() => onSurvol(null)}
      onFocus={() => onSurvol(id)}
      onBlur={() => onSurvol(null)}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        className={`transition-colors duration-300 ${active ? 'fill-accent/15' : 'fill-nuit-800/70'}`}
      />
      <Mobilier id={id} piece={piece} />

      {/* react-icons : la taille passe par `size` (width/height sont ignorés) */}
      <Icone
        x={cx - 18}
        y={cy - 64}
        size={36}
        className={`transition-colors ${active ? 'text-accent-clair' : 'text-slate-500'}`}
      />
      <text x={cx} y={cy + 4} textAnchor="middle" className="fill-white font-titre text-[26px] font-bold">
        {role}
      </text>
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        className={`text-[15px] tracking-[0.2em] uppercase ${active ? 'fill-accent-clair' : 'fill-slate-500'}`}
      >
        {nom}
      </text>
      <text
        x={cx}
        y={cy + 56}
        textAnchor="middle"
        className={`text-[15px] transition-opacity ${active ? 'fill-slate-300 opacity-100' : 'opacity-0'}`}
      >
        {apercu ?? '…'}
      </text>
    </g>
  )
}

/** Mobilier stylisé, dessiné en traits fins (décoratif). */
function Mobilier({ id, piece: { x, y, w, h } }) {
  const trait = 'fill-none stroke-nuit-600 stroke-2'
  const meubles = {
    salon: (
      <>
        {/* Cadres au mur = la timeline du parcours */}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={x + 70 + i * 95} y={y + 22} width={60} height={34} rx={3} className={trait} />
        ))}
        <rect x={x + 40} y={y + h - 90} width={180} height={56} rx={12} className={trait} />
        <rect x={x + 40} y={y + h - 90} width={180} height={16} rx={6} className={trait} />
        {/* Tapis devant le canapé, à l'écart de la porte */}
        <ellipse cx={x + 310} cy={y + h - 62} rx={55} ry={30} className={trait} />
      </>
    ),
    atelier: (
      <>
        <rect x={x + 30} y={y + 24} width={200} height={60} rx={6} className={trait} />
        <rect x={x + 90} y={y + 34} width={80} height={10} rx={3} className={trait} />
        {/* Chaise, détachée du bureau */}
        <circle cx={x + 110} cy={y + 128} r={18} className={trait} />
        <rect x={x + w - 150} y={y + h - 100} width={120} height={70} rx={6} className={trait} />
      </>
    ),
    bibliotheque: (
      <>
        {[0, 1, 2].map((i) => (
          <rect key={i} x={x + 24} y={y + 30 + i * 64} width={36} height={52} rx={3} className={trait} />
        ))}
        <rect x={x + w - 110} y={y + 24} width={80} height={24} rx={4} className={trait} />
        <rect x={x + w - 100} y={y + h - 90} width={60} height={60} rx={14} className={trait} />
      </>
    ),
    // Meuble à chaussures dans le coin, hors du débattement de la porte (le paillasson est dehors)
    entree: <rect x={x + 12} y={y + h - 48} width={44} height={34} rx={4} className={trait} />,
    balcon: (
      <>
        <line
          x1={x + w - 10}
          y1={y + 10}
          x2={x + w - 10}
          y2={y + h - 10}
          className="stroke-nuit-600 stroke-2 [stroke-dasharray:4_8]"
        />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={x + w - 50} cy={y + 50 + i * 70} r={16} className={trait} />
        ))}
        <circle cx={x + 80} cy={y + h - 70} r={28} className={trait} />
      </>
    ),
  }
  return (
    <g aria-hidden className="pointer-events-none">
      {meubles[id]}
    </g>
  )
}

/** Murs + portes (arcs d'ouverture), dessinés par-dessus les pièces. */
function Murs() {
  const mur = 'fill-none stroke-nuit-600 stroke-[6]'
  const porte = 'fill-none stroke-accent/50 stroke-2'
  const ouverture = 'fill-nuit-900 stroke-none'
  return (
    <g aria-hidden className="pointer-events-none">
      {PIECES.map(({ id, x, y, w, h }) => (
        <rect key={id} x={x} y={y} width={w} height={h} className={mur} />
      ))}
      <rect x={40} y={40} width={920} height={560} className="fill-none stroke-nuit-600 stroke-[10]" />

      {/* Entrée → salon */}
      <rect x={440} y={354} width={60} height={12} className={ouverture} />
      <path d="M440 360 L440 300 A60 60 0 0 1 500 360" className={porte} />
      {/* Entrée → atelier */}
      <rect x={540} y={354} width={60} height={12} className={ouverture} />
      <path d="M540 360 L540 300 A60 60 0 0 1 600 360" className={porte} />
      {/* Entrée → bibliothèque */}
      <rect x={414} y={440} width={12} height={60} className={ouverture} />
      <path d="M420 440 L360 440 A60 60 0 0 0 420 500" className={porte} />
      {/* Entrée → balcon (baie vitrée coulissante) */}
      <rect x={614} y={430} width={12} height={80} className={ouverture} />
      <line x1={620} y1={430} x2={620} y2={510} className="stroke-accent/50 stroke-2 [stroke-dasharray:6_6]" />
      {/* Porte d'entrée du portfolio */}
      <rect x={490} y={592} width={60} height={16} className={ouverture} />
      <path d="M490 600 L490 540 A60 60 0 0 1 550 600" className={porte} />
    </g>
  )
}

/** Paillasson devant la porte d'entrée, avec le point lumineux « Vous êtes ici ». */
function VousEtesIci() {
  return (
    <g aria-hidden className="pointer-events-none">
      <rect x={480} y={608} width={80} height={24} rx={4} className="fill-nuit-800 stroke-nuit-600 stroke-2" />
      <circle
        cx={520}
        cy={620}
        r={14}
        className="animate-ping fill-accent/40 [transform-box:fill-box] [transform-origin:center]"
      />
      <circle cx={520} cy={620} r={7} className="fill-accent-clair" />
    </g>
  )
}

/** Quadrillage léger façon papier d'architecte. */
function Grille() {
  return (
    <>
      <defs>
        <pattern id="grille" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 L0 0 0 20" className="fill-none stroke-nuit-700/50" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={L} height={H} fill="url(#grille)" />
    </>
  )
}
