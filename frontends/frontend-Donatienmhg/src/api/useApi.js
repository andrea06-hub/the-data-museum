import { useEffect, useState } from 'react'

/**
 * Appelle une fonction de client.js au montage du composant.
 * Renvoie { data, erreur, chargement }.
 * `appel` doit être stable (fonction du module ou useCallback).
 */
export function useApi(appel) {
  const [etat, setEtat] = useState({ data: null, erreur: null, chargement: true })

  useEffect(() => {
    let actif = true
    appel()
      .then((data) => actif && setEtat({ data, erreur: null, chargement: false }))
      .catch((erreur) => actif && setEtat({ data: null, erreur, chargement: false }))
    return () => {
      actif = false
    }
  }, [appel])

  return etat
}
