import { Link } from 'react-router-dom'

/** En-tête commun des pièces : nom de la pièce, rubrique, retour au plan. */
export default function EnTetePiece({ piece, titre, description }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs tracking-[0.3em] text-accent-clair uppercase">{piece}</p>
        <h1 className="font-titre text-3xl font-bold text-white sm:text-4xl">{titre}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      <Link to="/plan" className="text-sm text-slate-400 transition hover:text-accent-clair">
        ← Retour au plan
      </Link>
    </header>
  )
}
