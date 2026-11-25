
import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CANDIDATE_SLUG = 'andrea-vissoh'

function RelatedProjects({ project, onSelectProject }) {
    const [open, setOpen] = useState(false)
    const [related, setRelated] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function toggleRelated() {
        if (open) {
            setOpen(false)
            return
        }

        setOpen(true)

        if (related !== null) return

        setLoading(true)
        setError('')

        try {
            const response = await fetch(
                `${API_URL}/api/graph/projets/${encodeURIComponent(project.projet_slug)}/similaires?limit=20`
            )

            if (!response.ok) {
                throw new Error(`Erreur API : ${response.status}`)
            }

            const data = await response.json()

            const myProjects = (data.similaires ?? []).filter(
                (item) => item.auteurs?.includes(CANDIDATE_SLUG)
            )

            setRelated(myProjects)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function getSkillName(slug) {
        return project.competences?.find(
            (skill) => skill.skill_slug === slug
        )?.nom ?? slug
    }

    return (
        <div className="related-projects">

            <button
                type="button"
                className="related-toggle"
                aria-expanded={open}
                onClick={toggleRelated}
            >
                {open
                    ? 'CLOSE RELATED PROJECTS ↑'
                    : 'EXPLORE RELATED PROJECTS ↗'}
            </button>

            {open && (
                <div className="related-content">

                    <h3>CONNECTED WORKS</h3>

                    <p className="related-intro">
                        Discover how shared skills connect my projects.
                    </p>

                    {loading && <p>Exploring connections...</p>}

                    {error && (
                        <p>Unable to load related projects: {error}</p>
                    )}

                    {!loading && !error && related?.length === 0 && (
                        <p>No related projects in my collection yet.</p>
                    )}

                    {related?.map((item) => (
                        <button
                            type="button"
                            className="related-card related-card-clickable"
                            key={item.projet_slug}
                            onClick={() => onSelectProject(item.projet_slug)}
                        >
                            <span className="related-score">
                                {item.score} SHARED {item.score === 1
                                    ? 'SKILL'
                                    : 'SKILLS'}
                            </span>

                            <span className="related-card-title">
                                {item.titre}
                            </span>

                            <span className="related-skills">
                                {(item.competences_communes ?? []).map(
                                    (skill) => (
                                        <span key={skill}>
                                            {getSkillName(skill)}
                                        </span>
                                    )
                                )}
                            </span>

                            <span className="related-card-discover">
                                EXPLORE THIS PROJECT ↗
                            </span>

                        </button>
                    ))}

                    <p className="related-source">
                        Connections powered by Neo4j
                    </p>

                </div>
            )}

        </div>
    )
}

export default RelatedProjects
