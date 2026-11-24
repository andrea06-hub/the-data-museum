// 🛠️ Projets (l'atelier) — routes 2, 3 et 4.
// Fiches punaisées au liège, écran du bureau (tableau de bord / détail), panneau à outils = filtre par compétence.

import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CANDIDAT_SLUG, getCandidat, getProjets, getStats } from '../api/client'
import { useApi } from '../api/useApi'
import EnTetePiece from '../components/EnTetePiece'
import { useEcranLarge } from '../utils/useEcranLarge'
import AtelierMeuble from './atelier/AtelierMeuble'
import { EcranAgrandi, TableauDeBord } from './atelier/Ecran'
import Fiche from './atelier/Fiche'

// Tous les projets du candidat (une seule page suffit pour un portfolio)
const tousLesProjets = () => getProjets(CANDIDAT_SLUG, { size: 100 })

export default function Atelier() {
  const candidat = useApi(getCandidat)
  const projets = useApi(tousLesProjets)
  const stats = useApi(getStats)
  const [outil, setOutil] = useState(null) // skill_slug sélectionné au panneau à outils
  const [choisi, setChoisi] = useState(null) // projet affiché à l'écran
  const [ecranOuvert, setEcranOuvert] = useState(false)
  const ecranLarge = useEcranLarge()

  // Route 2 avec ?competence= : quels projets utilisent l'outil choisi
  const appelFiltre = useCallback(
    () => (outil ? getProjets(CANDIDAT_SLUG, { competence: outil, size: 100 }) : Promise.resolve(null)),
    [outil],
  )
  const filtre = useApi(appelFiltre)

  if (projets.chargement || stats.chargement) return <Message>On ouvre la porte de l'atelier…</Message>
  if (projets.erreur) return <Message>Impossible de charger les projets ({projets.erreur.message}).</Message>

  const liste = projets.data.items
  const visibles = outil && filtre.data ? new Set(filtre.data.items.map((p) => p.projet_slug)) : null
  const nomOutil = stats.data?.competences.find((c) => c.skill_slug === outil)?.nom

  function choisir(projet) {
    setChoisi(projet)
    setEcranOuvert(true)
  }

  const basculerOutil = (slug) => setOutil((actuel) => (actuel === slug ? null : slug))

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <EnTetePiece
          piece="L'atelier"
          titre="Projets"
          description={
            outil
              ? `Projets qui utilisent « ${nomOutil} » : ${visibles?.size ?? '…'} sur ${liste.length}. Recliquez sur l'outil pour tout revoir.`
              : `${liste.length} projets punaisés au tableau. Cliquez sur une fiche pour l'afficher à l'écran.`
          }
        />

        {ecranLarge ? (
          <AtelierMeuble
            prenom={candidat.data?.prenom ?? ''}
            projets={liste}
            stats={stats.data}
            visibles={visibles}
            outil={outil}
            onOutil={basculerOutil}
            choisi={choisi}
            onChoisir={choisir}
            onOuvrirEcran={() => setEcranOuvert(true)}
          />
        ) : (
          <VersionMobile
            projets={liste}
            stats={stats.data}
            visibles={visibles}
            outil={outil}
            onOutil={basculerOutil}
            choisi={choisi}
            onChoisir={choisir}
          />
        )}
      </div>

      <AnimatePresence>
        {ecranOuvert && choisi && (
          <EcranAgrandi
            projet={choisi}
            mesProjets={liste}
            onChoisir={setChoisi}
            onFermer={() => setEcranOuvert(false)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

/** Petit écran : tableau de bord, filtres par compétence, fiches en grille. */
function VersionMobile({ projets, stats, visibles, outil, onOutil, choisi, onChoisir }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative rounded-xl border border-nuit-700 bg-nuit-900 p-4">
        <TableauDeBord stats={stats} grand />
      </div>
      {stats && (
        <ul className="flex flex-wrap gap-2" aria-label="Filtrer par compétence">
          {stats.competences.map((c) => (
            <li key={c.skill_slug}>
              <button
                type="button"
                onClick={() => onOutil(c.skill_slug)}
                aria-pressed={outil === c.skill_slug}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  outil === c.skill_slug
                    ? 'border-accent bg-accent text-white'
                    : 'border-nuit-600 text-slate-400 hover:border-accent-clair'
                }`}
              >
                {c.nom}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-6 pt-2 sm:grid-cols-2">
        {projets.map((projet, rang) => (
          <Fiche
            key={projet.projet_slug}
            projet={projet}
            rang={rang}
            active={choisi?.projet_slug === projet.projet_slug}
            attenuee={visibles !== null && !visibles.has(projet.projet_slug)}
            onChoisir={onChoisir}
          />
        ))}
      </div>
    </div>
  )
}

function Message({ children }) {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center text-slate-400">{children}</main>
  )
}
