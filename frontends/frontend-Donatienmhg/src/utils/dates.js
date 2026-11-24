// Dates de l'API : "YYYY-MM" ou "YYYY-MM-DD" ; null = en cours

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function decouper(date) {
  const [annee, mois = '01'] = date.split('-')
  return { annee: Number(annee), mois: Number(mois) }
}

function aujourdhui() {
  const d = new Date()
  return { annee: d.getFullYear(), mois: d.getMonth() + 1 }
}

/** Vrai si la période n'est pas terminée (fin vide ou dans le futur). */
export function estEnCours(fin) {
  if (!fin) return true
  const f = decouper(fin)
  const a = aujourdhui()
  return f.annee > a.annee || (f.annee === a.annee && f.mois >= a.mois)
}

/** "2025-09" → "sept. 2025" ; null → "aujourd'hui". */
export function formatMois(date) {
  if (!date) return "aujourd'hui"
  const { annee, mois } = decouper(date)
  return `${MOIS[mois - 1]} ${annee}`
}

/** "sept. 2024 — juin 2027 (prévu)". */
export function formatPeriode(debut, fin) {
  const prevu = fin && estEnCours(fin) ? ' (prévu)' : ''
  return `${formatMois(debut)} — ${formatMois(fin)}${prevu}`
}

/** Durée écoulée, mois de début et de fin inclus : "1 an 3 mois". */
export function formatDuree(debut, fin) {
  const d = decouper(debut)
  const f = fin && !estEnCours(fin) ? decouper(fin) : aujourdhui()
  const total = Math.max(1, (f.annee - d.annee) * 12 + (f.mois - d.mois) + 1)
  const ans = Math.floor(total / 12)
  const mois = total % 12
  return [ans > 0 && `${ans} an${ans > 1 ? 's' : ''}`, mois > 0 && `${mois} mois`]
    .filter(Boolean)
    .join(' ')
}
