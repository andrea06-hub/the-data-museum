// 🪟 Contact (le balcon) — routes 1 (contacts), 8 (derniers projets de l'équipe) et 6 (compétences communes).

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaPaperPlane } from 'react-icons/fa6'
import { getCandidat, getRecents } from '../api/client'
import { useApi } from '../api/useApi'
import EnTetePiece from '../components/EnTetePiece'
import { formatPeriode } from '../utils/dates'
import { nomDepuisSlug } from '../utils/texte'
import { useEcranLarge } from '../utils/useEcranLarge'
import BalconScene from './balcon/BalconScene'
import { listeContacts } from '../utils/contacts'
import Lettre from './balcon/Lettre'
import VueFenetre from './balcon/VueFenetre'

const derniersProjets = () => getRecents(6)

export default function Balcon() {
  const candidat = useApi(getCandidat)
  const recents = useApi(derniersProjets)
  const [lettreOuverte, setLettreOuverte] = useState(false)
  const [fenetre, setFenetre] = useState(null) // projet regardé à la longue-vue
  const ecranLarge = useEcranLarge()

  if (candidat.chargement || recents.chargement) return <Message>On ouvre la baie vitrée…</Message>
  if (candidat.erreur) return <Message>Impossible de charger les contacts ({candidat.erreur.message}).</Message>

  const projets = recents.data?.items ?? []
  const prenom = candidat.data.prenom

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <EnTetePiece
          piece="Le balcon"
          titre="Contact"
          description={`Écrivez à ${prenom} grâce à la boîte aux lettres, ou prenez une carte de visite. En face, les fenêtres violettes sont les derniers projets de l'équipe.`}
        />

        {ecranLarge ? (
          <BalconScene
            candidat={candidat.data}
            projets={projets}
            onFenetre={setFenetre}
            onLettre={() => setLettreOuverte(true)}
          />
        ) : (
          <VersionMobile
            contacts={candidat.data.contacts}
            projets={projets}
            onFenetre={setFenetre}
            onLettre={() => setLettreOuverte(true)}
          />
        )}
      </div>

      <AnimatePresence>
        {lettreOuverte && (
          <Lettre email={candidat.data.contacts.email} prenom={prenom} onFermer={() => setLettreOuverte(false)} />
        )}
        {fenetre && <VueFenetre key={fenetre.projet_slug} projet={fenetre} onFermer={() => setFenetre(null)} />}
      </AnimatePresence>
    </main>
  )
}

/** Petit écran : contacts, bouton « écrire », derniers projets de l'équipe. */
function VersionMobile({ contacts, projets, onFenetre, onLettre }) {
  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-3 gap-3">
        {listeContacts(contacts).map(({ href, label, Icone }) => (
          <li key={label}>
            <a
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 rounded-xl border border-nuit-600 bg-nuit-900 py-4 text-sm text-slate-300 transition hover:border-accent"
            >
              <Icone className="text-xl text-accent-clair" aria-hidden />
              {label}
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onLettre}
        className="flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-medium text-white"
      >
        <FaPaperPlane aria-hidden /> Écrire une lettre
      </button>
      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
          Derniers projets de l'équipe
        </h2>
        <ul className="space-y-2">
          {projets.map((p) => (
            <li key={p.projet_slug}>
              <button
                type="button"
                onClick={() => onFenetre(p)}
                className="w-full rounded-lg border border-nuit-700 bg-nuit-900 p-3 text-left transition hover:border-accent"
              >
                <span className="block font-medium text-white">{p.titre}</span>
                <span className="block text-xs text-slate-500">
                  {p.date_debut && `${formatPeriode(p.date_debut, p.date_fin)} · `}
                  {p.auteurs.map(nomDepuisSlug).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Message({ children }) {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center text-slate-400">{children}</main>
  )
}
