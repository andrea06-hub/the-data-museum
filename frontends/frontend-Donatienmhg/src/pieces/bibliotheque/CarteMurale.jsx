// La carte encadrée au mur : le graphe de compétences + légende + compétences transversales (route 7).

import GrapheCompetences from './GrapheCompetences'

export default function CarteMurale({ graphe, source, transversales, surbrillance, onCompetence, className = '' }) {
  return (
    <section
      aria-label="Carte des compétences"
      className={`pointer-events-auto flex flex-col rounded-md border-[8px] border-amber-900/80 bg-nuit-950 shadow-2xl shadow-black/60 ring-1 ring-amber-700/40 ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-nuit-700 px-3 py-1.5">
        <span className="font-titre text-xs font-bold tracking-[0.2em] text-amber-200/80 uppercase">
          Carte des compétences
        </span>
        <span className="text-[9px] text-slate-500">
          {source === 'neo4j' ? 'source : Neo4j' : 'reconstruite depuis MongoDB (Neo4j indisponible)'}
        </span>
      </header>

      <div className="relative min-h-0 flex-1 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:16px_16px]">
        {graphe ? (
          <GrapheCompetences graphe={graphe} surbrillance={surbrillance} onCompetence={onCompetence} />
        ) : (
          <p className="grid h-full place-items-center text-xs text-slate-500">La carte se dessine…</p>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-nuit-700 px-3 py-1.5 text-[9px] text-slate-400">
        <Pastille couleur="bg-[#e9d5ff]">Moi</Pastille>
        <Pastille couleur="bg-amber-400">Projets</Pastille>
        <Pastille couleur="bg-accent">Compétences</Pastille>
        <span className="ml-auto">
          Transversales :{' '}
          {transversales.length > 0
            ? transversales.map((c) => `${c.nom} (${c.nb_projets})`).join(', ')
            : 'aucune compétence dans 2 projets ou plus pour l’instant'}
        </span>
      </footer>
    </section>
  )
}

function Pastille({ couleur, children }) {
  return (
    <span className="flex items-center gap-1">
      <span aria-hidden className={`size-2 rounded-full ${couleur}`} />
      {children}
    </span>
  )
}
