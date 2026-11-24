// Le balcon (grand écran) : ciel, lune, ville, guirlande, garde-corps, boîte aux lettres, table et cartes,
// longue-vue, plantes, chien. Les positions sont en % pour suivre la taille de la scène.

import { useState } from 'react'
import { motion } from 'framer-motion'
import Couche from '../../components/Couche'
import BoiteAuxLettres from '../../components/meubles/BoiteAuxLettres'
import Chien from '../../components/meubles/Chien'
import LongueVue from '../../components/meubles/LongueVue'
import Plante from '../../components/meubles/Plante'
import TableBistro from '../../components/meubles/TableBistro'
import { useParallaxe } from '../../utils/useParallaxe'
import CartesVisite from './CartesVisite'
import { Ciel, Lune } from './Ciel'
import Guirlande from './Guirlande'
import Ville from './Ville'

export default function BalconScene({ candidat, projets, onFenetre, onLettre }) {
  const { souris, gestionnaires } = useParallaxe()
  const [guirlande, setGuirlande] = useState(true)
  const [boiteSurvolee, setBoiteSurvolee] = useState(false)
  const [visee, setVisee] = useState(0) // prochain projet visé par la longue-vue

  function regarder() {
    if (projets.length === 0) return
    onFenetre(projets[visee % projets.length])
    setVisee((v) => v + 1)
  }

  const conseils = [
    'Wouf ! Bienvenue sur le balcon. Belle vue, non ?',
    'Les fenêtres violettes en face : les derniers projets de l’équipe. Cliquez dessus !',
    `La boîte aux lettres sert à écrire à ${candidat.prenom}.`,
    'Les cartes sur la table mènent à LinkedIn, GitHub et à l’e-mail.',
    'La longue-vue passe d’un projet à l’autre.',
    'La guirlande s’allume et s’éteint d’un clic.',
  ]

  return (
    <div
      {...gestionnaires}
      className="relative h-[clamp(600px,78vh,740px)] overflow-hidden rounded-2xl border border-nuit-700 shadow-2xl shadow-black/60"
    >
      {/* Loin : ciel, lune, ville */}
      <Couche souris={souris} profondeur={3}>
        <Ciel className="-inset-[4%]" />
      </Couche>
      <Couche souris={souris} profondeur={5}>
        <Lune className="absolute top-[9%] right-[14%] w-[7%]" />
      </Couche>
      <Couche souris={souris} profondeur={9}>
        <Ville projets={projets} onFenetre={onFenetre} className="absolute -inset-x-[3%] bottom-[20%] h-[54%] w-[106%]" />
      </Couche>

      {/* Le balcon : guirlande, garde-corps, plancher */}
      <Couche souris={souris} profondeur={14}>
        <Guirlande
          allumee={guirlande}
          onBasculer={() => setGuirlande((g) => !g)}
          className="absolute -inset-x-[2%] top-0 h-[16%]"
        />
        <div aria-hidden className="absolute -inset-x-[2%] bottom-[18%] h-[22%]">
          <div className="absolute inset-0 bg-sky-200/[0.03]" />
          <div className="absolute inset-x-0 top-2.5 bottom-2 bg-[repeating-linear-gradient(90deg,#3a3456_0_6px,transparent_6px_46px)]" />
          <div className="absolute inset-x-0 top-0 h-2.5 rounded-full bg-nuit-600 shadow-[0_3px_8px] shadow-black/60" />
          <div className="absolute inset-x-0 bottom-0 h-2 bg-nuit-600" />
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[20%] overflow-hidden [perspective:420px]">
          <div className="absolute -inset-x-1/2 top-0 h-[300%] origin-top [transform:rotateX(62deg)] bg-[repeating-linear-gradient(90deg,#2a1f18_0_80px,#1a130e_80px_83px)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30" />
        </div>
        {/* Reflet de la guirlande sur le plancher */}
        <div
          aria-hidden
          className={`absolute inset-x-[10%] bottom-[6%] h-[10%] rounded-full bg-amber-200/10 blur-2xl transition-opacity duration-700 ${guirlande ? 'opacity-100' : 'opacity-0'}`}
        />
      </Couche>

      {/* Objets posés sur le balcon */}
      <Couche souris={souris} profondeur={20}>
        <button
          type="button"
          onClick={onLettre}
          onMouseEnter={() => setBoiteSurvolee(true)}
          onMouseLeave={() => setBoiteSurvolee(false)}
          onFocus={() => setBoiteSurvolee(true)}
          onBlur={() => setBoiteSurvolee(false)}
          aria-label={`Boîte aux lettres : écrire à ${candidat.prenom}`}
          title="Écrire une lettre"
          className="pointer-events-auto absolute bottom-[6%] left-[5%] w-[8%] cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-accent-clair"
        >
          <BoiteAuxLettres active={boiteSurvolee} className="w-full" />
        </button>

        <motion.div
          className="pointer-events-auto absolute bottom-[8%] left-[15%] w-[5%]"
          style={{ originX: 0.5, originY: 1 }}
          whileHover={{ rotate: [0, -4, 3, -2, 1, 0], transition: { duration: 1.4 } }}
        >
          <Plante className="w-full" />
        </motion.div>

        {/* Table de bistrot avec les cartes de visite posées dessus */}
        <div className="absolute bottom-[5%] left-[36%] aspect-[160/150] w-[16%]">
          <TableBistro className="absolute inset-0 w-full" />
          <CartesVisite contacts={candidat.contacts} className="absolute inset-x-[10%] bottom-[80%]" />
        </div>

        <motion.button
          type="button"
          onClick={regarder}
          aria-label="Regarder à la longue-vue le projet suivant"
          title="Regarder à la longue-vue"
          whileHover={{ rotate: -4 }}
          style={{ originX: 0.5, originY: 1 }}
          className="pointer-events-auto absolute bottom-[6%] left-[70%] w-[10%] cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-accent-clair"
        >
          <LongueVue className="w-full" />
        </motion.button>

        <motion.div
          className="pointer-events-auto absolute right-[3%] bottom-[8%] w-[7%]"
          style={{ originX: 0.5, originY: 1 }}
          whileHover={{ rotate: [0, 4, -3, 2, -1, 0], transition: { duration: 1.4 } }}
        >
          <Plante className="w-full" />
        </motion.div>
      </Couche>

      <Couche souris={souris} profondeur={26}>
        <Chien messages={conseils} className="absolute bottom-[3%] left-[54%] w-[12%]" />
      </Couche>
    </div>
  )
}
