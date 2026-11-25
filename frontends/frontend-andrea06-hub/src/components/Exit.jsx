import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ExitLink({ className, href, label, external, download }) {
  return (
    <a
      className={`exit-hotspot ${className}`}
      href={href || undefined}
      aria-disabled={!href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      download={download}
    >
      <span>{label}</span>
    </a>
  )
}

function Exit({ onReturn, onNavigate }) {
  const [contacts, setContacts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeMenu, setActiveMenu] = useState(null)

  function toggleMenu(menu) {
    setActiveMenu(current => current === menu ? null : menu)
  }

  useEffect(() => {
    async function loadContacts() {
      try {
        const response = await fetch(
          `${API_URL}/api/candidats/andrea-vissoh`
        )

        if (!response.ok) {
          throw new Error(`Erreur API : ${response.status}`)
        }

        const data = await response.json()
        setContacts(data.contacts ?? {})
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadContacts()
  }, [])

  return (
    <section className="exit-room">

      <div className="exit-scene">

        <img
          src={`${import.meta.env.BASE_URL}museum/exit.png`}
          alt=""
          className="exit-background"
        />

        {/* VERSION MOBILE */}

        <div className="exit-mobile-heading">
          <p>THE DATA MUSEUM</p>

          <h1>THE <em>EXIT</em></h1>

          <h2>
            Every great connection starts
            with a conversation.
          </h2>

          <p>Thank you for exploring my universe.</p>
        </div>

        {/* CONTACT */}

        <ExitLink
          className="exit-contact"
          href={
            contacts.email
              ? `mailto:${contacts.email}`
              : undefined
          }
          label="Contact me"
        />

        {/* CV */}

        <ExitLink
          className="exit-download"
          href={`${import.meta.env.BASE_URL}cv.pdf`}
          label="Download CV"
          download
        />

        {/* LINKEDIN */}

        <ExitLink
          className="exit-linkedin"
          href={contacts.linkedin}
          label="LinkedIn"
          external
        />

        {/* GITHUB */}

        <ExitLink
          className="exit-github"
          href={contacts.github}
          label="GitHub"
          external
        />

        {/* RETOUR AU MUSÉE */}

        <button
          type="button"
          className="exit-hotspot exit-return"
          onClick={onReturn}
        >
          <span>← Return to the Museum</span>
        </button>

        {/* NAVIGATION SUPÉRIEURE */}

        <button
          type="button"
          className="exit-hotspot exit-nav-home"
          onClick={() => onNavigate('intro')}
        >
          <span>Accueil</span>
        </button>

        <button
          type="button"
          className="exit-hotspot exit-nav-galleries"
          aria-expanded={activeMenu === 'galleries'}
          onClick={() => toggleMenu('galleries')}
        >
          <span>Galeries</span>
        </button>

        <button
          type="button"
          className="exit-hotspot exit-nav-about"
          aria-expanded={activeMenu === 'about'}
          onClick={() => toggleMenu('about')}
        >
          <span>À propos / CV</span>
        </button>

        <button
          type="button"
          className="exit-nav-info"
          aria-label="À propos du musée"
          aria-expanded={activeMenu === 'info'}
          onClick={() => toggleMenu('info')}
        >
          i
        </button>

        {/* MENU GALERIES */}

        {activeMenu === 'galleries' && (
          <div className="exit-menu exit-menu-galleries">

            <button
              type="button"
              onClick={() => onNavigate('journey')}
            >
              01 — The Journey
            </button>

            <button
              type="button"
              onClick={() => onNavigate('collection')}
            >
              02 — The Collection
            </button>

            <button
              type="button"
              onClick={() => onNavigate('connections')}
            >
              03 — The Connections
            </button>

          </div>
        )}

        {/* MENU À PROPOS / CV */}

        {activeMenu === 'about' && (
          <div className="exit-menu exit-menu-about">

            <button
              type="button"
              onClick={() => onNavigate('journey')}
            >
              Discover my journey ↗
            </button>

            <a
              href={`${import.meta.env.BASE_URL}cv.pdf`}
              download
              onClick={() => setActiveMenu(null)}
            >
              Download my CV ↓
            </a>

          </div>
        )}

        {/* INFORMATIONS SUR LE MUSÉE */}

        {activeMenu === 'info' && (
          <div className="exit-menu exit-menu-info">

            <h3>THE DATA MUSEUM</h3>

            <p>
              An immersive portfolio exploring my journey,
              projects and skills through the world of data.
            </p>

            <p>
              Built with React, FastAPI, MongoDB and Neo4j.
            </p>

          </div>
        )}

      </div>

      {/* ÉTAT DE CHARGEMENT */}

      {loading && (
        <p className="exit-status">
          Loading contacts...
        </p>
      )}

      {error && (
        <p className="exit-status">
          Unable to load contacts.
        </p>
      )}

      {!loading && !error &&
        (!contacts.email ||
          !contacts.linkedin ||
          !contacts.github) && (
          <p className="exit-status">
            Some contact links are currently unavailable.
          </p>
        )}

    </section>
  )
}

export default Exit