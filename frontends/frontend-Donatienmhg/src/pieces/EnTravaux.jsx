// 🚧 Page provisoire des pièces pas encore construites.

import { Link } from 'react-router-dom'

export default function EnTravaux({ titre }) {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center">
      <div className="space-y-4">
        <p className="text-xs tracking-[0.3em] text-accent-clair uppercase">Travaux en cours</p>
        <h1 className="font-titre text-3xl font-bold text-white">{titre}</h1>
        <Link to="/plan" className="inline-block text-sm text-slate-400 hover:text-accent-clair">
          ← Retour au plan
        </Link>
      </div>
    </main>
  )
}
