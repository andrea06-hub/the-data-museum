
import { useState } from 'react'
import ParticleReveal from './components/ParticleReveal'
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
            onClick={() => setRevealComplete(true)}
          >
            Passer l'introduction →
          </button>

          <div
            className={`entrance-content ${
              revealComplete
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

          <p>
            Exhibition coming soon.
          </p>
        </section>
      )}

    </main>
  )
}

export default App
