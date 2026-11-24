// 🗺️ La carte des compétences : graphe interactif (route 5 / secours MongoDB).
// Survol = met en valeur les voisins ; glisser = déplacer un nœud ; molette = zoom ; clic sur une compétence = ouvrir son livre.

import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

const COULEURS = { candidat: '#e9d5ff', projet: '#fbbf24', competence: '#8b3dff' }

function rayon(noeud) {
  if (noeud.type === 'candidat') return 9
  if (noeud.type === 'projet') return 6
  return 3 + (noeud.nb_projets ?? 1) * 1.5
}

const idDe = (extremite) => (typeof extremite === 'object' ? extremite.id : extremite)

/** `surbrillance` : ensemble d'id de nœuds à mettre en avant (recherche), ou null. */
export default function GrapheCompetences({ graphe, surbrillance = null, onCompetence }) {
  const conteneur = useRef(null)
  const graphique = useRef(null)
  const dejaCadre = useRef(false)
  const [taille, setTaille] = useState({ largeur: 0, hauteur: 0 })
  const [survol, setSurvol] = useState(null)

  // Le graphe prend toute la place de son cadre, même si la fenêtre change de taille
  useEffect(() => {
    const observateur = new ResizeObserver(([entree]) =>
      setTaille({ largeur: entree.contentRect.width, hauteur: entree.contentRect.height }),
    )
    observateur.observe(conteneur.current)
    return () => observateur.disconnect()
  }, [])

  // Copie : la bibliothèque de graphe modifie les objets (positions x, y…)
  const donnees = useMemo(
    () => ({ nodes: graphe.nodes.map((n) => ({ ...n })), links: graphe.links.map((l) => ({ ...l })) }),
    [graphe],
  )

  const voisins = useMemo(() => {
    const carte = new Map()
    for (const { source, target } of graphe.links) {
      if (!carte.has(source)) carte.set(source, new Set())
      if (!carte.has(target)) carte.set(target, new Set())
      carte.get(source).add(target)
      carte.get(target).add(source)
    }
    return carte
  }, [graphe])

  function estActif(id) {
    if (survol) return id === survol || voisins.get(survol)?.has(id)
    if (surbrillance) return surbrillance.has(id)
    return true
  }

  function dessinerNoeud(noeud, ctx, echelle) {
    const r = rayon(noeud)
    const actif = estActif(noeud.id)
    const enAvant = actif && (survol === noeud.id || surbrillance?.has(noeud.id))

    ctx.globalAlpha = actif ? 1 : 0.15
    if (enAvant) {
      ctx.beginPath()
      ctx.arc(noeud.x, noeud.y, r + 4, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(139, 61, 255, 0.35)'
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(noeud.x, noeud.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = COULEURS[noeud.type]
    ctx.fill()

    const police = (noeud.type === 'competence' ? 8 : 10) / echelle
    ctx.font = `${noeud.type === 'candidat' ? '600 ' : ''}${Math.max(police, 1.5)}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = noeud.type === 'competence' ? '#cbd5e1' : '#f1f5f9'
    ctx.fillText(noeud.label, noeud.x, noeud.y + r + 2)
    ctx.globalAlpha = 1
  }

  function zoneCliquable(noeud, couleur, ctx) {
    ctx.fillStyle = couleur
    ctx.beginPath()
    ctx.arc(noeud.x, noeud.y, rayon(noeud) + 3, 0, 2 * Math.PI)
    ctx.fill()
  }

  const lienActif = (lien) => estActif(idDe(lien.source)) && estActif(idDe(lien.target))

  return (
    <div ref={conteneur} className="absolute inset-0">
      {taille.largeur > 0 && (
        <ForceGraph2D
          ref={graphique}
          width={taille.largeur}
          height={taille.hauteur}
          graphData={donnees}
          backgroundColor="rgba(0,0,0,0)"
          nodeCanvasObject={dessinerNoeud}
          nodePointerAreaPaint={zoneCliquable}
          nodeLabel={() => ''}
          linkColor={(lien) => (lienActif(lien) ? 'rgba(185, 140, 255, 0.55)' : 'rgba(148, 163, 184, 0.08)')}
          linkWidth={(lien) => (lienActif(lien) ? 1.4 : 0.6)}
          onNodeHover={(noeud) => setSurvol(noeud?.id ?? null)}
          onNodeClick={(noeud) => {
            if (noeud.type === 'competence') onCompetence?.(noeud.id.slice('competence:'.length))
          }}
          cooldownTicks={120}
          autoPauseRedraw={false}
          onEngineStop={() => {
            if (!dejaCadre.current) {
              graphique.current?.zoomToFit(400, 30)
              dejaCadre.current = true
            }
          }}
        />
      )}
    </div>
  )
}
