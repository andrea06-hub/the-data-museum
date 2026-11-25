import { useEffect, useState, useRef } from 'react'
import RelatedProjects from './RelatedProjects'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Collection() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)

  const galleryRef = useRef(null)

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch(
          `${API_URL}/api/candidats/andrea-vissoh/projets`
        )

        if (!response.ok) {
          throw new Error(`Erreur API : ${response.status}`)
        }

        const data = await response.json()
        setProjects(data.items ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const activeProject = projects.find(
    (project) => project.projet_slug === selectedProject
  )

  function scrollGallery(direction) {
    const gallery = galleryRef.current

    if (!gallery) return

    const card = gallery.firstElementChild

    if (!card) return

    const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0

    gallery.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
  }

  function openProject(slug) {
    const index = projects.findIndex(
      (project) => project.projet_slug === slug
    )

    if (index === -1) return

    setSelectedProject(slug)

    galleryRef.current?.children[index]?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  if (loading) {
    return <p>Opening the collection...</p>
  }

  if (error) {
    return <p>Impossible de charger les projets : {error}</p>
  }

  return (
    <div className="collection-gallery">

      <p className="museum-label">EXHIBITION 02</p>

      <p className="collection-intro">
        Every project is a new way of seeing the world
        through data and technology.
      </p>

      <p className="collection-count">
        {projects.length} WORKS ON DISPLAY
      </p>

      <div className="collection-panorama">

        <button
          type="button"
          className="gallery-arrow"
          aria-label="Previous projects"
          onClick={() => scrollGallery(-1)}
        >
          ‹
        </button>

        <div
          className="collection-grid"
          ref={galleryRef}
        >

          {projects.map((project, index) => (
            <article
              className="collection-exhibit"
              key={project.projet_slug}
            >

              <button
                type="button"
                className="collection-frame"
                aria-expanded={
                  selectedProject === project.projet_slug
                }
                onClick={() =>
                  setSelectedProject(
                    selectedProject === project.projet_slug
                      ? null
                      : project.projet_slug
                  )
                }
              >

                <span className="collection-number">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="collection-artwork">
                  {project.titre}
                </span>

                <span className="collection-discover">
                  {selectedProject === project.projet_slug
                    ? 'CLOSE EXHIBIT ↑'
                    : 'EXPLORE THE PROJECT ↗'}
                </span>

              </button>

              <div className="collection-plaque">

                <span className="plaque-number">
                  WORK {String(index + 1).padStart(2, '0')}
                </span>

                <div className="collection-skills">
                  {(project.competences ?? []).map((skill) => (
                    <span key={skill.skill_slug}>
                      {skill.nom}
                    </span>
                  ))}
                </div>

              </div>

            </article>
          ))}

        </div>

        <button
          type="button"
          className="gallery-arrow"
          aria-label="Next projects"
          onClick={() => scrollGallery(1)}
        >
          ›
        </button>

      </div>

      <p className="collection-scroll-hint">
        ← SLIDE TO EXPLORE THE COLLECTION →
      </p>

      {activeProject && (
        <section
          className="collection-details"
          key={activeProject.projet_slug}
        >

          <div className="collection-description">

            <h3>ABOUT THE PROJECT</h3>

            <h2 className="collection-detail-title">
              {activeProject.titre}
            </h2>

            <p>{activeProject.description}</p>

            <p className="collection-authors">
              {(activeProject.auteurs?.length ?? 0) > 1
                ? 'Collaborative project'
                : 'Individual project'}
            </p>

            {activeProject.date_debut && (
              <p>{activeProject.date_debut}</p>
            )}

            {activeProject.liens?.github && (
              <a
                href={activeProject.liens.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                VIEW ON GITHUB ↗
              </a>
            )}

            {activeProject.liens?.demo && (
              <a
                href={activeProject.liens.demo}
                target="_blank"
                rel="noopener noreferrer"
              >
                VIEW DEMO ↗
              </a>
            )}

          </div>

          <div className="collection-related-panel">

            <RelatedProjects
              project={activeProject}
              onSelectProject={openProject}
            />

          </div>

        </section>
      )}

      {projects.length === 0 && (
        <p>No projects on display yet.</p>
      )}

    </div>
  )
}

export default Collection