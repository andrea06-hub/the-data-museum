import { useEffect, useState, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const SLUG = 'andrea-vissoh'

async function fetchData(path) {
  const response = await fetch(`${API_URL}${path}`)

  if (!response.ok) {
    throw new Error(`Erreur API : ${response.status}`)
  }

  return response.json()
}

function Connections() {
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [transversal, setTransversal] = useState([])
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const graphRef = useRef(null)

  useEffect(() => {
    async function loadConnections() {
      try {
        const [statsData, projectsData, graphData] =
          await Promise.all([
            fetchData(`/api/candidats/${SLUG}/stats`),
            fetchData(`/api/candidats/${SLUG}/projets`),
            fetchData(
              `/api/graph/candidats/${SLUG}/competences-transversales`
            )
          ])

        setStats(statsData)
        setProjects(projectsData.items ?? [])
        setTransversal(graphData.competences ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadConnections()
  }, [])

  function scrollGraph(side) {
    const graph = graphRef.current

    if (!graph) return

    graph.scrollTo({
      left: side === 'skills'
        ? 0
        : graph.scrollWidth - graph.clientWidth,
      behavior: window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches ? 'auto' : 'smooth'
    })
  }

  if (loading) {
    return <p>Mapping the connections...</p>
  }

  if (error) {
    return <p>Impossible de charger le réseau : {error}</p>
  }

  const skills = stats.competences ?? []

  const activeSkill = skills.find(
    (skill) => skill.skill_slug === selectedSkill
  )

  const transversalSlugs = new Set(
    transversal.map((skill) => skill.skill_slug)
  )

  const graphHeight = Math.max(400, skills.length * 46 + 90)

  const skillY = (index) => 70 + index * 46

  const projectY = (index) =>
    90 + index * (
      (graphHeight - 180) / Math.max(projects.length - 1, 1)
    )

  function toggleSkill(slug) {
    setSelectedSkill((current) =>
      current === slug ? null : slug
    )
  }

  return (
    <div className="connections-gallery">

      <p className="museum-label">EXHIBITION 03</p>

      <p className="connections-intro">
        Knowledge is not isolated. It grows through connections.
      </p>

      <div className="connections-stats">

        <div>
          <strong>{stats.nb_competences}</strong>
          <span>SKILLS</span>
        </div>

        <div>
          <strong>{stats.nb_projets}</strong>
          <span>PROJECTS</span>
        </div>

        <div>
          <strong>{transversal.length}</strong>
          <span>TRANSVERSAL SKILLS</span>
        </div>

      </div>

      <div className="connections-graph">

        <p className="connections-instruction">
          Select a skill to reveal its connections.
        </p>

        {/* NAVIGATION MOBILE */}

        <div className="connections-mobile-navigation">

          <button
            type="button"
            onClick={() => scrollGraph('skills')}
          >
            ← SKILLS
          </button>

          <button
            type="button"
            onClick={() => scrollGraph('projects')}
          >
            PROJECTS →
          </button>

        </div>

        {activeSkill && (
          <p className="connections-mobile-selection">
            {activeSkill.nom} — {activeSkill.nb_projets}{' '}
            {activeSkill.nb_projets === 1
              ? 'connected project'
              : 'connected projects'}
          </p>
        )}

        <div
          className="connections-scroll"
          ref={graphRef}
          tabIndex={0}
          role="region"
          aria-label="Skills and projects graph"
        >

          <svg
            viewBox={`0 0 1000 ${graphHeight}`}
            className="connections-svg"
            aria-label="Interactive skills and projects graph"
          >

            <text x="150" y="25" className="graph-heading">
              SKILLS
            </text>

            <text x="820" y="25" className="graph-heading">
              PROJECTS
            </text>

            {/* RELATIONSHIPS */}

            {skills.map((skill, skillIndex) =>
              (skill.projets ?? []).map((slug) => {
                const projectIndex = projects.findIndex(
                  (project) => project.projet_slug === slug
                )

                if (projectIndex === -1) return null

                const highlighted =
                  selectedSkill === skill.skill_slug

                return (
                  <path
                    key={`${skill.skill_slug}-${slug}`}
                    d={`
                      M 280 ${skillY(skillIndex)}
                      C 470 ${skillY(skillIndex)},
                        480 ${projectY(projectIndex)},
                        650 ${projectY(projectIndex)}
                    `}
                    className={
                      `graph-edge
                      ${highlighted ? 'highlighted' : ''}
                      ${selectedSkill && !highlighted
                        ? 'dimmed' : ''}`
                    }
                  />
                )
              })
            )}

            {/* SKILL NODES */}

            {skills.map((skill, index) => (
              <g
                key={skill.skill_slug}
                role="button"
                tabIndex={0}
                aria-label={skill.nom}
                aria-pressed={
                  selectedSkill === skill.skill_slug
                }
                className={
                  `graph-skill
                  ${transversalSlugs.has(skill.skill_slug)
                    ? 'transversal' : ''}
                  ${selectedSkill === skill.skill_slug
                    ? 'selected' : ''}
                  ${selectedSkill &&
                    selectedSkill !== skill.skill_slug
                    ? 'dimmed' : ''}`
                }
                onClick={() => toggleSkill(skill.skill_slug)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault()
                    toggleSkill(skill.skill_slug)
                  }
                }}
              >

                <rect
                  x="20"
                  y={skillY(index) - 17}
                  width="260"
                  height="34"
                  rx="4"
                />

                <text x="150" y={skillY(index) + 5}>
                  {skill.nom}
                </text>

              </g>
            ))}

            {/* PROJECT NODES */}

            {projects.map((project, index) => {
              const connected = activeSkill?.projets?.includes(
                project.projet_slug
              )

              return (
                <g
                  key={project.projet_slug}
                  className={
                    `graph-project
                    ${connected ? 'connected' : ''}
                    ${selectedSkill && !connected
                      ? 'dimmed' : ''}`
                  }
                >

                  <rect
                    x="650"
                    y={projectY(index) - 38}
                    width="330"
                    height="76"
                    rx="3"
                  />

                  <foreignObject
                    x="665"
                    y={projectY(index) - 33}
                    width="300"
                    height="66"
                  >
                    <div className="graph-project-title">
                      {project.titre}
                    </div>
                  </foreignObject>

                </g>
              )
            })}

          </svg>

        </div>

        <p className="connections-mobile-hint">
          ← Swipe to explore the connections →
        </p>

        <div className="connections-legend">

          <span>
            <i className="legend-transversal" />
            Transversal skill
          </span>

          <span>
            <i className="legend-standard" />
            Project-specific skill
          </span>

        </div>

      </div>

      {activeSkill && (
        <section className="connections-details">

          <p className="plaque-number">SKILL IN FOCUS</p>

          <h3>{activeSkill.nom}</h3>

          <p>
            Used in {activeSkill.nb_projets}{' '}
            {activeSkill.nb_projets === 1
              ? 'project' : 'projects'}
          </p>

          {projects
            .filter((project) =>
              activeSkill.projets?.includes(project.projet_slug)
            )
            .map((project) => (
              <div
                className="connections-related-project"
                key={project.projet_slug}
              >
                {project.titre}
              </div>
            ))}

          <button
            type="button"
            className="journey-read-more"
            onClick={() => setSelectedSkill(null)}
          >
            RESET CONNECTIONS ↗
          </button>

        </section>
      )}

    </div>
  )
}

export default Connections