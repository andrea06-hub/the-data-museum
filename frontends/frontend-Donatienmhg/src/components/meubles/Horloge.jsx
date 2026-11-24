// 🕐 Horloge murale : affiche l'heure réelle, l'aiguille des secondes tourne en direct.

import { useEffect, useState } from 'react'

export default function Horloge({ className }) {
  const [maintenant, setMaintenant] = useState(() => new Date())

  useEffect(() => {
    const minuteur = setInterval(() => setMaintenant(new Date()), 1000)
    return () => clearInterval(minuteur)
  }, [])

  const secondes = maintenant.getSeconds()
  const minutes = maintenant.getMinutes() + secondes / 60
  const heures = (maintenant.getHours() % 12) + minutes / 60
  const libelle = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`Horloge : il est ${libelle}`}>
      <circle cx="50" cy="50" r="46" className="fill-nuit-900 stroke-nuit-600" strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="10"
          x2="50"
          y2={i % 3 === 0 ? 18 : 14}
          transform={`rotate(${i * 30} 50 50)`}
          className="stroke-slate-500"
          strokeWidth={i % 3 === 0 ? 3 : 1.5}
        />
      ))}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="28"
        transform={`rotate(${heures * 30} 50 50)`}
        className="stroke-slate-200"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="18"
        transform={`rotate(${minutes * 6} 50 50)`}
        className="stroke-slate-300"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="56"
        x2="50"
        y2="14"
        transform={`rotate(${secondes * 6} 50 50)`}
        className="stroke-accent-clair"
        strokeWidth="1"
      />
      <circle cx="50" cy="50" r="3" className="fill-accent" />
    </svg>
  )
}
