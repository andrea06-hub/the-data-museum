
import { useState } from 'react'
import ParticleReveal from './components/ParticleReveal'
import Journey from './components/Journey'
import Collection from './components/Collection'
import Connections from './components/Connections'
import Exit from './components/Exit'
import './App.css'

function App() {
  const [page, setPage] = useState('intro')
  const [revealComplete, setRevealComplete] = useState(false)

  const openHall = () => setPage('hall')

  return (
    <main className="museum">

      {/* ÉTAPE 1 ET 2 : INTRODUCTION + ENTRÉE */}

      {page === 'intro' && (
        <section className="entrance">

          <ParticleReveal
            onComplete={() => setRevealComplete(true)}
          />


          <button
            type="button"
            className="skip-intro"
            onClick={openHall}
          >
            Passer l'introduction →
          </button>

          <div
            className={`entrance-content ${revealComplete
              ? 'reveal-complete'
              : 'reveal-pending'
              }`}
          >
            <p className="museum-label">
              THE DATA MUSEUM
            </p>

            <h1 className="entrance-name">
              ANDRÉA VISSOH
            </h1>

            <p className="entrance-subtitle">
              Every dataset tells a story. This one is mine.
            </p>

            <button
              type="button"
              className="enter-button"
              onClick={openHall}
            >
              ENTER THE MUSEUM <span>↗</span>
            </button>
          </div>

        </section>
      )}

      {/* ÉTAPE 3 : MAIN HALL */}

      {page === 'hall' && (
        <section className="main-hall">
          <div className="hall-scene">

            <img
              src="/museum/main-hall.png"
              alt="The Data Museum — Main Hall"
              className="hall-background"
            />

            <nav className="hall-navigation" aria-label="Navigation du musée">

              <button
                type="button"
                aria-label="Accueil"
                title="Accueil"
                onClick={() => {
                  setRevealComplete(false)
                  setPage('intro')
                }}
              />

              <button
                type="button"
                aria-label="Galerie"
                title="Galerie"
                onClick={() => setPage('collection')}
              />

              <button
                type="button"
                aria-label="À propos"
                title="À propos"
                onClick={() => setPage('journey')}
              />

              <details className="hall-info">
                <summary
                  aria-label="À propos du musée"
                  title="À propos du musée"
                />

                <div className="hall-info-panel">
                  <h3>THE DATA MUSEUM</h3>

                  <p>
                    An immersive portfolio exploring my journey,
                    projects and skills through the world of data.
                  </p>

                  <p>
                    Built with React, FastAPI, MongoDB and Neo4j.
                  </p>
                </div>
              </details>

            </nav>


            <button
              type="button"
              className="artwork-hotspot artwork-journey"
              aria-label="Explorer The Journey — Mon parcours"
              onClick={() => setPage('journey')}
            >
              <img src="/museum/journey.png" alt="" />
            </button>

            <button
              type="button"
              className="artwork-hotspot artwork-collection"
              aria-label="Explorer The Collection — Mes projets"
              onClick={() => setPage('collection')}
            >
              <img src="/museum/collection.png" alt="" />
            </button>

            <button
              type="button"
              className="artwork-hotspot artwork-connections"
              aria-label="Explorer The Connections — Mes compétences"
              onClick={() => setPage('connections')}
            >
              <img src="/museum/connections.png" alt="" />
            </button>
            <button
              type="button"
              className="hall-exit-button"
              onClick={() => setPage('exit')}
            >
              THE EXIT →
            </button>

          </div>

          {/* VERSION MOBILE DU MAIN HALL */}

          <div className="mobile-hall">

            <p className="mobile-hall-label">
              THE DATA MUSEUM
            </p>

            <h1 className="mobile-hall-title">
              MAIN <em>HALL</em>
            </h1>

            <p className="mobile-hall-subtitle">
              Explore my universe through three key exhibitions.
            </p>

            <div className="mobile-artworks">

              <button
                type="button"
                className="mobile-artwork"
                onClick={() => setPage('journey')}
              >
                <img
                  src="/museum/journey.png"
                  alt="The Journey — Mon parcours"
                />
              </button>

              <button
                type="button"
                className="mobile-artwork"
                onClick={() => setPage('collection')}
              >
                <img
                  src="/museum/collection.png"
                  alt="The Collection — Mes projets"
                />
              </button>

              <button
                type="button"
                className="mobile-artwork"
                onClick={() => setPage('connections')}
              >
                <img
                  src="/museum/connections.png"
                  alt="The Connections — Mes compétences"
                />
              </button>

            </div>

            <button
              type="button"
              className="enter-button"
              onClick={() => setPage('exit')}
            >
              THE EXIT →
            </button>

          </div>

        </section>
      )}

      {/* LES TROIS GALERIES */}

      {['journey', 'collection', 'connections'].includes(page) && (
        <section className="exhibition-placeholder">
          <button
            type="button"
            className="enter-button"
            onClick={openHall}
          >
            ← RETURN TO MAIN HALL
          </button>

          <h1>
            {page === 'journey'
              ? 'THE JOURNEY'
              : page === 'collection'
                ? 'THE COLLECTION'
                : 'THE CONNECTIONS'}
          </h1>
          {page === 'journey' && <Journey />}

          {page === 'collection' && <Collection />}

          {page === 'connections' && <Connections />}
        </section>
      )}

      {/* THE EXIT */}

      {page === 'exit' && (
        <Exit
          onReturn={openHall}
          onNavigate={(nextPage) => {
            if (nextPage === 'intro') {
              setRevealComplete(false)
            }

            setPage(nextPage)
          }}
        />
      )}

    </main>
  )
}

export default App