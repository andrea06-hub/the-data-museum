// 🛋️ Parcours (le salon) — route 1. Les cadres du parcours sont accrochés au-dessus du canapé.

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { getCandidat } from '../api/client'
import { useApi } from '../api/useApi'
import EnTetePiece from '../components/EnTetePiece'
import { estEnCours } from '../utils/dates'
import { useEcranLarge } from '../utils/useEcranLarge'
import { Cadre, CadreAgrandi } from './salon/Cadre'
import { INCLINAISONS } from './salon/inclinaisons'
import SalonMeuble from './salon/SalonMeuble'

const FILTRES = [
  { id: 'tout', label: 'Tout' },
  { id: 'experience', label: 'Expériences' },
  { id: 'formation', label: 'Formations' },
]

/** Fusionne expériences et formations en une seule liste triée (plus récent d'abord). */
function versCadres(candidat) {
  return [
    ...candidat.experiences.map((e, i) => ({
      id: `experience-${i}`,
      genre: 'experience',
      titre: e.poste,
      lieu: e.entreprise,
      precision: e.type,
      debut: e.debut,
      fin: e.fin,
      description: e.description,
    })),
    ...candidat.formations.map((f, i) => ({
      id: `formation-${i}`,
      genre: 'formation',
      titre: f.diplome,
      lieu: f.ecole,
      debut: f.debut,
      fin: f.fin,
    })),
  ].sort((a, b) => b.debut.localeCompare(a.debut))
}

export default function Salon() {
  const { data: candidat, erreur, chargement } = useApi(getCandidat)
  const [filtre, setFiltre] = useState('tout')
  const [ouvert, setOuvert] = useState(null)
  const ecranLarge = useEcranLarge()

  if (chargement) return <Message>On allume la lumière du salon…</Message>
  if (erreur) return <Message>Impossible de charger le parcours ({erreur.message}).</Message>

  const tous = versCadres(candidat)
  const cadres = tous.filter((c) => filtre === 'tout' || c.genre === filtre)
  const enCours = tous.filter((c) => estEnCours(c.fin))

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <EnTetePiece
          piece="Le salon"
          titre="Parcours"
          description={`${candidat.experiences.length} expériences et ${candidat.formations.length} formations, accrochées au mur. Cliquez sur un cadre pour vous en approcher.`}
        />
        <Filtres filtre={filtre} onChange={setFiltre} />

        {ecranLarge ? (
          <SalonMeuble candidat={candidat} cadres={cadres} enCours={enCours} onOuvrir={setOuvert} />
        ) : (
          <ul className="flex flex-col items-center gap-2">
            <AnimatePresence mode="popLayout">
              {cadres.map((cadre, i) => (
                <Cadre
                  key={cadre.id}
                  cadre={cadre}
                  inclinaison={INCLINAISONS[i % INCLINAISONS.length]}
                  onOuvrir={setOuvert}
                  className="w-full max-w-xs"
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <AnimatePresence>
        {ouvert && <CadreAgrandi cadre={ouvert} onFermer={() => setOuvert(null)} />}
      </AnimatePresence>
    </main>
  )
}

/** Onglets de filtre du parcours. */
function Filtres({ filtre, onChange }) {
  return (
    <div role="tablist" aria-label="Filtrer le parcours" className="flex flex-wrap gap-2">
      {FILTRES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={filtre === id}
          onClick={() => onChange(id)}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            filtre === id
              ? 'border-accent bg-accent text-white shadow-lg shadow-accent/30'
              : 'border-nuit-600 text-slate-400 hover:border-accent-clair hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Message({ children }) {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center text-slate-400">{children}</main>
  )
}
