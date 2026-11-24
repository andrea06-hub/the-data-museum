// 📚 Compétences (la bibliothèque) — routes 1, 2, 3 (MongoDB) et 5, 7, 9 (Neo4j).
// Si Neo4j ne répond pas, la carte est reconstruite depuis MongoDB et le reste fonctionne.

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { CANDIDAT_SLUG, getCandidat, getGraphe, getProjets, getStats, getTransversales } from '../api/client'
import { useApi } from '../api/useApi'
import EnTetePiece from '../components/EnTetePiece'
import { construireGraphe } from '../utils/graphe'
import { normaliser } from '../utils/texte'
import { useEcranLarge } from '../utils/useEcranLarge'
import BibliothequeMeuble from './bibliotheque/BibliothequeMeuble'
import CarteMurale from './bibliotheque/CarteMurale'
import LivreOuvert from './bibliotheque/LivreOuvert'

const tousLesProjets = () => getProjets(CANDIDAT_SLUG, { size: 100 })
const transversalesDuCandidat = () => getTransversales(CANDIDAT_SLUG, 2)

export default function Bibliotheque() {
  const candidat = useApi(getCandidat)
  const projets = useApi(tousLesProjets)
  const stats = useApi(getStats)
  const graphe = useApi(getGraphe)
  const transversales = useApi(transversalesDuCandidat)
  const [recherche, setRecherche] = useState('')
  const [livre, setLivre] = useState(null)
  const ecranLarge = useEcranLarge()

  // Graphe de secours (MongoDB), calculé une seule fois : sinon la carte se redessinerait à chaque frappe
  const grapheSecours = useMemo(
    () =>
      candidat.data && projets.data && stats.data
        ? construireGraphe(candidat.data, projets.data.items, stats.data)
        : null,
    [candidat.data, projets.data, stats.data],
  )

  if (candidat.chargement || projets.chargement || stats.chargement) {
    return <Message>On dépoussière les étagères…</Message>
  }
  if (candidat.erreur || projets.erreur || stats.erreur) {
    return <Message>Impossible de charger les compétences.</Message>
  }

  const competences = stats.data.competences
  const titresProjets = new Map(projets.data.items.map((p) => [p.projet_slug, p.titre]))

  // Carte : Neo4j (route 5) si disponible, sinon reconstruite depuis MongoDB
  const grapheAffiche = graphe.data ?? (graphe.erreur ? grapheSecours : null)
  // Transversales : Neo4j (route 7) si disponible, sinon calculées depuis les stats MongoDB (route 3)
  const listeTransversales =
    transversales.data?.competences ?? competences.filter((c) => c.nb_projets >= 2)

  // Recherche : quels livres (et nœuds de la carte) correspondent
  const terme = normaliser(recherche)
  const correspond = (c) => normaliser(c.nom).includes(terme) || c.skill_slug.includes(terme)
  const etatDe = (c) => (!terme ? 'normal' : correspond(c) ? 'trouve' : 'attenue')
  const trouves = terme ? competences.filter(correspond) : []
  const surbrillance = terme ? new Set(trouves.map((c) => `competence:${c.skill_slug}`)) : null

  const ouvrirLivre = (slug) => setLivre(competences.find((c) => c.skill_slug === slug) ?? null)

  const carte = {
    graphe: grapheAffiche,
    source: graphe.data ? 'neo4j' : 'mongo',
    transversales: listeTransversales,
    surbrillance,
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <EnTetePiece
          piece="La bibliothèque"
          titre="Compétences"
          description={`${competences.length} compétences rangées sur l'étagère, une par livre. La carte au mur montre comment elles relient mes projets.`}
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-full max-w-sm">
            <span className="sr-only">Chercher un livre</span>
            <FaMagnifyingGlass aria-hidden className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Chercher un livre (ex. SQL, Python…)"
              className="w-full rounded-full border border-nuit-600 bg-nuit-900 py-2 pr-4 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none"
            />
          </label>
          {terme && (
            <p className="text-sm text-slate-400" role="status">
              {trouves.length === 0
                ? 'Aucun livre ne correspond.'
                : `${trouves.length} livre${trouves.length > 1 ? 's' : ''} trouvé${trouves.length > 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {ecranLarge ? (
          <BibliothequeMeuble
            prenom={candidat.data.prenom}
            competences={competences}
            etatDe={etatDe}
            onOuvrirLivre={ouvrirLivre}
            carte={carte}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {competences.map((c) => (
                <li key={c.skill_slug}>
                  <button
                    type="button"
                    onClick={() => ouvrirLivre(c.skill_slug)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      etatDe(c) === 'trouve'
                        ? 'border-accent bg-accent/20 text-white'
                        : etatDe(c) === 'attenue'
                          ? 'border-nuit-700 text-slate-600'
                          : 'border-nuit-600 bg-nuit-900 text-slate-300 hover:border-accent'
                    }`}
                  >
                    {c.nom}
                    <span className="block text-xs text-slate-500">
                      {c.nb_projets} projet{c.nb_projets > 1 ? 's' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <CarteMurale {...carte} onCompetence={ouvrirLivre} className="h-[420px]" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {livre && <LivreOuvert competence={livre} titresProjets={titresProjets} onFermer={() => setLivre(null)} />}
      </AnimatePresence>
    </main>
  )
}

function Message({ children }) {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center text-slate-400">{children}</main>
  )
}
