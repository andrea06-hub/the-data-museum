// ✉️ La lettre sortie de la boîte aux lettres : on écrit un message, il part avec la messagerie du visiteur.
// (Pas de serveur d'envoi : le lien « mailto: » ouvre le logiciel de messagerie, déjà rempli.)

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaCopy, FaPaperPlane, FaXmark } from 'react-icons/fa6'

export default function Lettre({ email, prenom, onFermer }) {
  const [nom, setNom] = useState('')
  const [message, setMessage] = useState('')
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    const echap = (e) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [onFermer])

  useEffect(() => {
    if (!copie) return
    const minuteur = setTimeout(() => setCopie(false), 2000)
    return () => clearTimeout(minuteur)
  }, [copie])

  const sujet = `Message depuis ton portfolio${nom ? ` : ${nom}` : ''}`
  const lien = `mailto:${email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(message)}`

  function copier() {
    navigator.clipboard?.writeText(email).then(() => setCopie(true))
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onFermer}
    >
      <motion.article
        role="dialog"
        aria-modal="true"
        aria-label={`Écrire à ${prenom}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 80, rotate: -4, opacity: 0 }}
        animate={{ y: 0, rotate: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        className="relative w-full max-w-lg rounded-lg bg-[#efe9dc] p-6 text-nuit-950 shadow-2xl shadow-black/60 sm:p-8"
      >
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer la lettre"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-nuit-950"
        >
          <FaXmark />
        </button>

        <p className="text-xs tracking-[0.2em] text-violet-800 uppercase">Boîte aux lettres</p>
        <h2 className="mt-1 font-titre text-2xl font-bold">Écrire à {prenom}</h2>

        {email ? (
          <>
            <div className="mt-5 space-y-3">
              <label className="block text-sm">
                <span className="text-slate-600">Votre nom</span>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  autoFocus
                  className="mt-1 w-full border-b-2 border-slate-400 bg-transparent py-1 focus:border-violet-700 focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Votre message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="mt-1 w-full resize-none bg-[repeating-linear-gradient(transparent_0_27px,rgba(100,116,139,0.35)_27px_28px)] leading-7 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={lien}
                className="flex items-center gap-2 rounded-full bg-violet-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
              >
                <FaPaperPlane aria-hidden /> Envoyer avec ma messagerie
              </a>
              <button
                type="button"
                onClick={copier}
                className="flex items-center gap-2 rounded-full border border-slate-400 px-4 py-2.5 text-sm transition hover:border-violet-700"
              >
                <FaCopy aria-hidden /> {copie ? 'Adresse copiée !' : email}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Aucune adresse e-mail n'est renseignée pour l'instant.</p>
        )}
      </motion.article>
    </motion.div>
  )
}
