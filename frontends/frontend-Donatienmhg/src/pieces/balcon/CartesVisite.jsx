// 🪪 Cartes de visite posées sur la table : LinkedIn, GitHub, e-mail (route 1, contacts).

import { motion } from 'framer-motion'
import { listeContacts } from '../../utils/contacts'

const INCLINAISONS = [-8, 3, 10]

export default function CartesVisite({ contacts, className = '' }) {
  return (
    <ul className={`flex items-end justify-center gap-1 ${className}`} aria-label="Cartes de visite">
      {listeContacts(contacts).map(({ href, label, Icone }, i) => (
        <li key={label} className="w-[31%]">
          <motion.a
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noopener noreferrer"
            title={label}
            style={{ rotate: INCLINAISONS[i % INCLINAISONS.length] }}
            whileHover={{ y: -12, rotate: 0, scale: 1.15 }}
            className="pointer-events-auto flex aspect-[3/2] flex-col items-center justify-center gap-0.5 rounded-sm bg-[#efe9dc] text-nuit-950 shadow-md shadow-black/50 focus-visible:outline-2 focus-visible:outline-accent-clair"
          >
            <Icone aria-hidden className="text-[clamp(10px,1.2vw,16px)] text-violet-800" />
            <span className="text-[clamp(6px,0.6vw,9px)] font-semibold">{label}</span>
          </motion.a>
        </li>
      ))}
    </ul>
  )
}
