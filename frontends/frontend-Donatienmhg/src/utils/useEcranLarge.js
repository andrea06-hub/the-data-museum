import { useSyncExternalStore } from 'react'

const REQUETE = '(min-width: 1024px)'

function abonner(rappel) {
  const media = window.matchMedia(REQUETE)
  media.addEventListener('change', rappel)
  return () => media.removeEventListener('change', rappel)
}

/** Vrai sur ordinateur (≥ 1024 px) : on affiche la pièce meublée. */
export function useEcranLarge() {
  return useSyncExternalStore(abonner, () => window.matchMedia(REQUETE).matches)
}
