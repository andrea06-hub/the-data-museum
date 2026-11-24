/** "erwann-nobime" → "Erwann Nobime" (affichage d'un slug quand on n'a pas le nom). */
export function nomDepuisSlug(slug) {
  return slug
    .split('-')
    .map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1))
    .join(' ')
}

/** Pour comparer sans tenir compte des accents ni des majuscules : "Données" → "donnees". */
export function normaliser(texte) {
  return texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}
