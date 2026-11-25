
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Journey() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFullBio, setShowFullBio] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(
          `${API_URL}/api/candidats/andrea-vissoh`
        )

        if (!response.ok) {
          throw new Error(`Erreur API : ${response.status}`)
        }

        const data = await response.json()
        setProfile(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) {
    return <p>Opening the exhibition...</p>
  }

  if (error) {
    return <p>Impossible de charger le profil : {error}</p>
  }

  return (
    <div className="journey-gallery">

      {/* INTRODUCTION */}

      <p className="museum-label">EXHIBITION 01</p>

      <h3>
        {profile.prenom} {profile.nom}
      </h3>

      <p>{profile.titre}</p>

      <p>
        {showFullBio
          ? profile.bio
          : `${profile.bio.split(',')[0].trim()}.`}
      </p>

      <button
        type="button"
        className="journey-read-more"
        onClick={() => setShowFullBio(!showFullBio)}
        aria-expanded={showFullBio}
      >
        {showFullBio
          ? 'SHOW LESS ↑'
          : 'DISCOVER MY STORY ↗'}
      </button>

      {/* EXPÉRIENCES PROFESSIONNELLES */}

      <section className="journey-timeline">
        <h3>PROFESSIONAL EXPERIENCE</h3>

        {(profile.experiences ?? []).map((experience, index) => (
          <div className="museum-exhibit" key={index}>

            <article className="timeline-item">
              <span className="timeline-date">
                {experience.debut} — {experience.fin ?? 'Present'}
              </span>

              <h4>{experience.poste}</h4>

              <p>{experience.description}</p>
            </article>

            <div className="museum-plaque">
              <span className="plaque-number">
                EXHIBIT {String(index + 1).padStart(2, '0')}
              </span>

              <strong>{experience.entreprise}</strong>

              <span className="plaque-detail">
                {experience.type === 'stage'
                  ? 'INTERNSHIP'
                  : 'EMPLOYMENT'}
                {' · '}
                {experience.debut.slice(0, 4)}
              </span>
            </div>

          </div>
        ))}
      </section>

      {/* PARCOURS ACADÉMIQUE */}

      <section className="journey-timeline">
        <h3>ACADEMIC JOURNEY</h3>

        {(profile.formations ?? []).map((formation, index) => (
          <div className="museum-exhibit" key={index}>

            <article className="timeline-item">
              <span className="timeline-date">
                {formation.debut} — {formation.fin ?? 'Present'}
              </span>

              <h4>{formation.diplome}</h4>
            </article>

            <div className="museum-plaque">
              <span className="plaque-number">
                EXHIBIT {String(
                  (profile.experiences?.length ?? 0) + index + 1
                ).padStart(2, '0')}
              </span>

              <strong>{formation.ecole}</strong>

              <span className="plaque-detail">
                ACADEMIC JOURNEY · {formation.debut.slice(0, 4)}
              </span>
            </div>

          </div>
        ))}
      </section>

    </div>
  )
}

export default Journey
