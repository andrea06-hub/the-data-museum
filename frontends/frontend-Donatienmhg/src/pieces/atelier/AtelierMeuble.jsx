// L'atelier meublé (grand écran) : tableau en liège, panneau à outils, bureau, écran, lampe, chaise, horloge, chien.
// Les positions sont en % pour suivre la taille de la scène.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaHammer, FaPaintbrush, FaRulerCombined, FaScrewdriver, FaToolbox, FaWrench } from 'react-icons/fa6'
import Couche from '../../components/Couche'
import ScenePiece from '../../components/ScenePiece'
import Bureau from '../../components/meubles/Bureau'
import ChaiseBureau from '../../components/meubles/ChaiseBureau'
import Chien from '../../components/meubles/Chien'
import Horloge from '../../components/meubles/Horloge'
import LampeArchitecte from '../../components/meubles/LampeArchitecte'
import Plante from '../../components/meubles/Plante'
import { useParallaxe } from '../../utils/useParallaxe'
import { EcranBureau } from './Ecran'
import Fiche from './Fiche'

const OUTILS = [FaHammer, FaWrench, FaScrewdriver, FaRulerCombined, FaPaintbrush, FaToolbox]

// Position du bureau, partagée par le plan « meubles » et le plan « écran » pour qu'ils restent alignés
const ZONE_BUREAU = 'absolute bottom-[22%] left-[46%] w-[51%] aspect-[480/200]'

export default function AtelierMeuble({ prenom, projets, stats, visibles, outil, onOutil, choisi, onChoisir, onOuvrirEcran }) {
  const { souris, gestionnaires } = useParallaxe()
  const [allumee, setAllumee] = useState(true)

  const conseils = [
    `Wouf ! Bienvenue dans l'atelier de ${prenom}.`,
    'Cliquez sur une fiche du tableau en liège pour l’afficher à l’écran.',
    'Les outils au mur sont des compétences : cliquez-en un pour trier les fiches.',
    'L’écran en veille affiche un petit tableau de bord. La touche BI de la maison !',
    allumee ? 'La lampe du bureau s’éteint aussi, essayez.' : 'On n’y voit rien ! Rallumez la lampe du bureau.',
  ]

  return (
    <ScenePiece className="h-[clamp(600px,78vh,740px)]" {...gestionnaires}>
      {/* Mur : horloge */}
      <Couche souris={souris} profondeur={4}>
        <Horloge className="absolute top-[4%] left-[47%] w-[5.5%] drop-shadow-lg" />
      </Couche>

      {/* Mur : tableau en liège + panneau à outils */}
      <Couche souris={souris} profondeur={6}>
        <TableauLiege projets={projets} visibles={visibles} choisi={choisi} onChoisir={onChoisir} />
        <PanneauOutils competences={stats?.competences ?? []} outil={outil} onOutil={onOutil} />
      </Couche>

      {/* Plante + bureau (avec la lampe d'architecte) */}
      <Couche souris={souris} profondeur={12}>
        <Plante className="absolute bottom-[25%] left-[1%] w-[5%]" />
        <div className={ZONE_BUREAU}>
          <div
            aria-hidden
            className={`absolute -top-[45%] left-[5%] h-[90%] w-[60%] rounded-full bg-amber-200/15 blur-2xl transition-opacity duration-700 ${allumee ? 'opacity-100' : 'opacity-0'}`}
          />
          <Bureau className="absolute inset-0 w-full" />
          <button
            type="button"
            onClick={() => setAllumee((a) => !a)}
            aria-pressed={allumee}
            aria-label={allumee ? 'Éteindre la lampe du bureau' : 'Allumer la lampe du bureau'}
            title={allumee ? 'Éteindre la lampe' : 'Allumer la lampe'}
            className="pointer-events-auto absolute bottom-[calc(100%-4px)] left-0 w-[22%] cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-accent-clair"
          >
            <LampeArchitecte allumee={allumee} className="w-full" />
          </button>
          {/* Clavier + tasse */}
          <span aria-hidden className="absolute bottom-[calc(100%-2px)] left-[33%] h-2 w-[26%] rounded-t bg-nuit-700" />
          <span aria-hidden className="absolute bottom-[calc(100%-2px)] left-[70%] h-5 w-[3.5%] rounded-sm bg-slate-300" />
        </div>
      </Couche>

      {/* Chaise au premier plan : plus proche que le bureau, donc plus grande (son dossier recouvre le plateau).
          Au survol, elle pivote un peu à gauche puis à droite, comme une vraie chaise de bureau. */}
      <Couche souris={souris} profondeur={20}>
        <motion.div
          className="pointer-events-auto absolute bottom-[2%] left-[58%] w-[23%]"
          style={{ transformPerspective: 900 }}
          whileHover={{ rotateY: [0, 32, -24, 12, 0], transition: { duration: 1.4, ease: 'easeInOut' } }}
          title="Une chaise qui pivote"
        >
          <ChaiseBureau className="w-full" />
        </motion.div>
      </Couche>

      {/* Pénombre quand la lampe est éteinte (les clics passent au travers) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-black/55 transition-opacity duration-700 ${allumee ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Au-dessus de la pénombre : l'écran (il éclaire) et le chien */}
      <Couche souris={souris} profondeur={12}>
        <div className={ZONE_BUREAU}>
          <EcranBureau
            projet={choisi}
            stats={stats}
            onOuvrir={onOuvrirEcran}
            className="absolute bottom-[calc(100%-4px)] left-[24%] w-[44%]"
          />
        </div>
      </Couche>

      <Couche souris={souris} profondeur={26}>
        <Chien messages={conseils} sombre={!allumee} className="absolute bottom-[5%] left-[22%] w-[12%]" />
      </Couche>
    </ScenePiece>
  )
}

/** Tableau en liège avec les fiches projets punaisées. */
function TableauLiege({ projets, visibles, choisi, onChoisir }) {
  return (
    <section
      aria-label="Tableau en liège des projets"
      className="absolute top-[6%] left-[3%] h-[44%] w-[41%] rounded-md border-[10px] border-amber-950 bg-[#6b4f33] bg-[radial-gradient(circle,rgba(0,0,0,0.18)_1px,transparent_1.5px)] bg-[length:9px_9px] shadow-2xl shadow-black/60"
    >
      <div className="flex h-full flex-wrap content-center items-start justify-center gap-4 overflow-hidden p-5">
        {projets.map((projet, rang) => (
          <Fiche
            key={projet.projet_slug}
            projet={projet}
            rang={rang}
            active={choisi?.projet_slug === projet.projet_slug}
            attenuee={visibles !== null && !visibles.has(projet.projet_slug)}
            onChoisir={onChoisir}
            className="w-[30%]"
          />
        ))}
      </div>
    </section>
  )
}

/** Panneau perforé : un outil = une compétence. Cliquer filtre les fiches (route 2 ?competence=). */
function PanneauOutils({ competences, outil, onOutil }) {
  if (competences.length === 0) return null
  return (
    <section
      aria-label="Panneau à outils : filtrer les projets par compétence"
      className="absolute top-[5%] right-[2%] w-[16%] rounded-md border-4 border-nuit-600 bg-[#241e33] bg-[radial-gradient(circle,#0b0a12_1.5px,transparent_2px)] bg-[length:14px_14px] p-2.5 shadow-2xl shadow-black/60"
    >
      <p className="mb-2 rounded bg-nuit-950/80 py-1 text-center text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
        Compétences
      </p>
      <ul className="grid grid-cols-2 gap-1.5">
        {competences.map((c, i) => {
          const Icone = OUTILS[i % OUTILS.length]
          const actif = outil === c.skill_slug
          return (
            <li key={c.skill_slug}>
              <motion.button
                type="button"
                onClick={() => onOutil(c.skill_slug)}
                aria-pressed={actif}
                title={`${c.nom} : ${c.nb_projets} projet${c.nb_projets > 1 ? 's' : ''}`}
                whileHover={{ rotate: [0, -6, 5, -3, 0], transition: { duration: 0.6 } }}
                style={{ originY: 0 }}
                className={`pointer-events-auto flex w-full cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-left text-[9px] leading-tight transition ${
                  actif
                    ? 'bg-accent text-white shadow-[0_0_14px] shadow-accent/60'
                    : 'bg-nuit-800/90 text-slate-300 hover:bg-nuit-700'
                }`}
              >
                <Icone className="shrink-0" aria-hidden />
                <span className="truncate">{c.nom}</span>
              </motion.button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
