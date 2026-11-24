/**
 * Reconstruit le graphe de compétences (même format que la route 5) à partir des données MongoDB
 * (routes 1, 2 et 3). Sert de secours quand Neo4j ne répond pas : la carte reste affichée.
 */
export function construireGraphe(candidat, projets, stats) {
  const nbParCompetence = new Map((stats?.competences ?? []).map((c) => [c.skill_slug, c.nb_projets]))
  const idCandidat = `candidat:${candidat.candidat_slug}`
  const nodes = [{ id: idCandidat, type: 'candidat', label: `${candidat.prenom} ${candidat.nom}` }]
  const links = []
  const dejaVues = new Set()

  for (const projet of projets) {
    const idProjet = `projet:${projet.projet_slug}`
    nodes.push({ id: idProjet, type: 'projet', label: projet.titre })
    links.push({ source: idCandidat, target: idProjet, type: 'A_REALISE' })

    for (const c of projet.competences) {
      const idCompetence = `competence:${c.skill_slug}`
      if (!dejaVues.has(idCompetence)) {
        dejaVues.add(idCompetence)
        nodes.push({
          id: idCompetence,
          type: 'competence',
          label: c.nom,
          nb_projets: nbParCompetence.get(c.skill_slug) ?? 1,
        })
      }
      links.push({ source: idProjet, target: idCompetence, type: 'UTILISE' })
    }
  }

  return { candidat_slug: candidat.candidat_slug, nodes, links }
}
