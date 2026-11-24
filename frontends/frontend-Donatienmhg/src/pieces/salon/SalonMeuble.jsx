// Le salon meublé (grand écran) : parallaxe, interrupteur, télé, chien, cadres.
// Les positions sont en % pour suivre la taille de la scène.

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ScenePiece from '../../components/ScenePiece'
import Couche from '../../components/Couche'
import { useParallaxe } from '../../utils/useParallaxe'
import Canape from '../../components/meubles/Canape'
import Chien from '../../components/meubles/Chien'
import Lampadaire from '../../components/meubles/Lampadaire'
import MeubleTV from '../../components/meubles/MeubleTV'
import Plante from '../../components/meubles/Plante'
import TableBasse from '../../components/meubles/TableBasse'
import { Cadre } from './Cadre'
import { INCLINAISONS } from './inclinaisons'
import Television from './Television'

export default function SalonMeuble({ candidat, cadres, enCours, onOuvrir }) {
  const { souris, gestionnaires } = useParallaxe()
  const [allumee, setAllumee] = useState(true)

  const conseils = [
    'Wouf ! Bienvenue dans le salon. Ici, presque tout est cliquable.',
    `Les cadres racontent le parcours de ${candidat.prenom} : cliquez dessus pour les voir de près.`,
    'La télé a 3 chaînes. Cliquez dessus pour zapper !',
    allumee ? 'Trop de lumière ? Cliquez sur la lampe.' : 'Il fait noir… Rallumez la lampe !',
    'Bougez la souris : la pièce bouge avec vous.',
  ]

  return (
    <ScenePiece className="h-[clamp(600px,78vh,740px)]" {...gestionnaires}>
      {/* Plan du fond : lumière de la lampe sur le mur */}
      <Couche souris={souris} profondeur={4}>
        <div
          aria-hidden
          className={`absolute top-[8%] -left-[8%] size-[34rem] rounded-full bg-amber-200/15 blur-3xl transition-opacity duration-700 ${allumee ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          aria-hidden
          className={`absolute top-[30%] left-[2%] size-28 rounded-full bg-amber-200/30 blur-2xl transition-opacity duration-700 ${allumee ? 'opacity-100' : 'opacity-0'}`}
        />
      </Couche>

      {/* Meubles contre le mur : lampe (interrupteur), plante */}
      <Couche souris={souris} profondeur={10}>
        <button
          type="button"
          onClick={() => setAllumee((a) => !a)}
          aria-pressed={allumee}
          aria-label={allumee ? 'Éteindre la lampe' : 'Allumer la lampe'}
          title={allumee ? 'Éteindre la lampe' : 'Allumer la lampe'}
          className="pointer-events-auto absolute bottom-[25%] left-[2%] w-[7%] cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-accent-clair"
        >
          <Lampadaire allumee={allumee} className="w-full" />
        </button>
        <motion.div
          className="pointer-events-auto absolute bottom-[25%] left-[61%] w-[7%]"
          style={{ originX: 0.5, originY: 1 }}
          whileHover={{ rotate: [0, -4, 3, -2, 1, 0], transition: { duration: 1.4 } }}
        >
          <Plante className="w-full" />
        </motion.div>
      </Couche>

      {/* Canapé */}
      <Couche souris={souris} profondeur={16}>
        <Canape className="absolute bottom-[26%] left-[19%] w-[40%]" />
      </Couche>

      {/* Premier plan : tapis + table basse */}
      <Couche souris={souris} profondeur={26}>
        <div
          aria-hidden
          className="absolute bottom-[4%] left-[16%] h-[13%] w-[46%] rounded-[50%] border-2 border-accent/20 bg-nuit-700/60 shadow-[inset_0_0_0_10px] shadow-nuit-800"
        />
        <TableBasse className="absolute bottom-[9%] left-[28%] w-[22%]" />
      </Couche>

      {/* Pénombre quand la lampe est éteinte (les clics passent au travers) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-black/65 transition-opacity duration-700 ${allumee ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Au-dessus de la pénombre : le chien (il guide même dans le noir), les cadres, la télé */}
      <Couche souris={souris} profondeur={26}>
        <Chien messages={conseils} sombre={!allumee} className="absolute bottom-[5%] left-[52%] w-[12%]" />
      </Couche>

      <Couche souris={souris} profondeur={6}>
        <section aria-label="Cadres du parcours" className="absolute top-[5%] left-[6%] w-[66%]">
          <div aria-hidden className="h-1 rounded-full bg-nuit-600 shadow-[0_2px_6px] shadow-black/60" />
          <motion.ul layout className="flex justify-center gap-[2%]">
            <AnimatePresence mode="popLayout">
              {cadres.map((cadre, i) => (
                <Cadre
                  key={cadre.id}
                  cadre={cadre}
                  inclinaison={INCLINAISONS[i % INCLINAISONS.length]}
                  onOuvrir={onOuvrir}
                  compact
                  className="w-[24%]"
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </section>
      </Couche>

      <Couche souris={souris} profondeur={10}>
        {/* Télé posée sur son pied, lui-même sur le meuble TV */}
        <div className="absolute right-[3%] bottom-[25%] flex w-[24%] flex-col items-center">
          <Television candidat={candidat} enCours={enCours} className="w-[94%]" />
          <div aria-hidden className="h-3 w-[14%] bg-nuit-600" />
          <div aria-hidden className="h-1.5 w-[40%] rounded-t-full bg-nuit-600" />
          <MeubleTV className={`w-full transition duration-700 ${allumee ? '' : 'brightness-50'}`} />
        </div>
      </Couche>
    </ScenePiece>
  )
}
