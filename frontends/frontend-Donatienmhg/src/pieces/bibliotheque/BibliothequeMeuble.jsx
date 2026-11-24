// La bibliothèque meublée (grand écran) : étagère de livres, carte murale, fauteuil, globe, lampadaire, chien.
// Les positions sont en % pour suivre la taille de la scène.

import { useState } from 'react'
import { motion } from 'framer-motion'
import Couche from '../../components/Couche'
import ScenePiece from '../../components/ScenePiece'
import Chien from '../../components/meubles/Chien'
import Fauteuil from '../../components/meubles/Fauteuil'
import GueridonGlobe from '../../components/meubles/GueridonGlobe'
import Lampadaire from '../../components/meubles/Lampadaire'
import { useParallaxe } from '../../utils/useParallaxe'
import CarteMurale from './CarteMurale'
import Etagere from './Etagere'

export default function BibliothequeMeuble({ prenom, competences, etatDe, onOuvrirLivre, carte }) {
  const { souris, gestionnaires } = useParallaxe()
  const [allumee, setAllumee] = useState(true)

  const conseils = [
    `Wouf ! Bienvenue dans la bibliothèque de ${prenom}.`,
    'Chaque livre de l’étagère est une compétence. Ouvrez-en un !',
    'La carte au mur est vivante : survolez, déplacez les points, zoomez avec la molette.',
    'Cherchez un livre avec la barre de recherche, juste au-dessus.',
    'Le globe tourne si vous le survolez.',
    allumee ? 'Le lampadaire s’éteint aussi.' : 'Il fait sombre… Rallumez le lampadaire !',
  ]

  return (
    <ScenePiece className="h-[clamp(600px,78vh,740px)]" {...gestionnaires}>
      {/* Étagère contre le mur */}
      <Couche souris={souris} profondeur={8}>
        <Etagere
          competences={competences}
          etatDe={etatDe}
          onOuvrir={onOuvrirLivre}
          className="absolute top-[5%] bottom-[25%] left-[3%] w-[44%]"
        />
      </Couche>

      {/* Coin lecture, au premier plan : tapis, lampadaire (interrupteur) qui éclaire le fauteuil, guéridon + globe */}
      <Couche souris={souris} profondeur={22}>
        <div
          aria-hidden
          className="absolute bottom-[3%] left-[52%] h-[12%] w-[36%] rounded-[50%] border-2 border-amber-700/20 bg-nuit-700/60 shadow-[inset_0_0_0_10px] shadow-nuit-800"
        />
        {/* Lumière du lampadaire : halo autour de l'abat-jour + flaque de lumière sur le fauteuil */}
        <div
          aria-hidden
          className={`absolute bottom-[30%] left-[45%] aspect-square w-[18%] rounded-full bg-amber-200/15 blur-3xl transition-opacity duration-700 ${allumee ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          aria-hidden
          className={`absolute bottom-[10%] left-[52%] h-[28%] w-[16%] rounded-full bg-amber-200/15 blur-2xl transition-opacity duration-700 ${allumee ? 'opacity-100' : 'opacity-0'}`}
        />
        <button
          type="button"
          onClick={() => setAllumee((a) => !a)}
          aria-pressed={allumee}
          aria-label={allumee ? 'Éteindre le lampadaire' : 'Allumer le lampadaire'}
          title={allumee ? 'Éteindre le lampadaire' : 'Allumer le lampadaire'}
          className="pointer-events-auto absolute bottom-[9%] left-[50%] w-[6.5%] cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-accent-clair"
        >
          <Lampadaire allumee={allumee} className="w-full" />
        </button>
        <motion.div
          className="pointer-events-auto absolute bottom-[9%] left-[56%] w-[17%]"
          whileHover={{ scaleY: [1, 0.97, 1.01, 1], transition: { duration: 0.5 } }}
          style={{ originY: 1 }}
          title="Un fauteuil bien moelleux"
        >
          <Fauteuil className="w-full" />
        </motion.div>
        <GueridonGlobe className="absolute bottom-[12%] left-[75%] w-[8%]" />
      </Couche>

      {/* Pénombre quand la lampe est éteinte (les clics passent au travers) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-black/55 transition-opacity duration-700 ${allumee ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Au-dessus de la pénombre : la carte (elle s'éclaire toute seule) et le chien */}
      <Couche souris={souris} profondeur={4}>
        <CarteMurale {...carte} onCompetence={onOuvrirLivre} className="absolute top-[6%] right-[3%] h-[52%] w-[43%]" />
      </Couche>

      <Couche souris={souris} profondeur={26}>
        <Chien messages={conseils} sombre={!allumee} className="absolute bottom-[4%] left-[30%] w-[12%]" />
      </Couche>
    </ScenePiece>
  )
}
