import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import EnTravaux from './pieces/EnTravaux'
import Entree from './pieces/Entree'
import Plan from './pieces/Plan'

// Les pièces sont chargées à la demande : l'entrée s'affiche vite, chaque pièce arrive quand on y entre
const Salon = lazy(() => import('./pieces/Salon'))
const Atelier = lazy(() => import('./pieces/Atelier'))
const Bibliotheque = lazy(() => import('./pieces/Bibliotheque'))
const Balcon = lazy(() => import('./pieces/Balcon'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p className="grid min-h-screen place-items-center text-slate-400">Chargement…</p>}>
        <Routes>
          <Route path="/" element={<Entree />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/salon" element={<Salon />} />
          <Route path="/atelier" element={<Atelier />} />
          <Route path="/bibliotheque" element={<Bibliotheque />} />
          <Route path="/balcon" element={<Balcon />} />
          <Route path="*" element={<EnTravaux titre="Cette page n'existe pas" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
