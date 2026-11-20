# Frontend de @ErwannNobime

Portfolio polyglotte — client de l'API d'équipe (voir `../../API_ROUTES.md`).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **next-themes** — toggle dark/light, dark par défaut
- **react-force-graph-2d** — graphe compétences × projets
- **lucide-react** — icônes

## Lancer en local

1. Prérequis : le backend doit tourner sur `http://localhost:8000` — depuis
   la racine du repo :

   ```bash
   just up && just seed && just dev
   ```

2. Côté frontend :

   ```bash
   cd frontends/frontend-ErwannNobime
   npm install          # (si pas déjà fait)
   npm run dev          # http://localhost:3000
   ```

## Variables d'environnement

Fichier `.env.local` à la racine du frontend :

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CANDIDAT_SLUG=erwann-nobime
```

## Routes du contrat consommées

- **Accueil** : R1 (profil), R5 (graphe de compétences en hero)
- **/parcours** : R1 (expériences + formations + langues)
- **/projets** : R2 (liste paginée, filtre `?competence=…`), R3 (stats pour les chips)
- **/graphe** : R5 (graphe complet), R7 (compétences transversales)

Les routes R4, R6, R8, R9 sont câblées dans `src/lib/api.ts` et prêtes à être
appelées depuis des sous-pages (détail projet, comparaison équipe, preuves
d'une compétence).

## Structure

```
src/
├── app/
│   ├── layout.tsx         # Header, Footer, Providers, fonts Inter + JetBrains Mono
│   ├── page.tsx           # Hero + GraphHero en fond
│   ├── providers.tsx      # ThemeProvider next-themes
│   ├── globals.css        # Palette dark/light (tokens CSS)
│   ├── parcours/page.tsx  # R1
│   ├── projets/page.tsx   # R2 + R3
│   └── graphe/page.tsx    # R5 + R7
├── components/
│   ├── header.tsx
│   ├── footer.tsx
│   ├── theme-toggle.tsx
│   └── graph-hero.tsx     # react-force-graph-2d (client only)
└── lib/
    ├── api.ts             # 9 fetchers typés + ApiError
    └── types.ts           # Types TS alignés sur les Pydantic models du backend
```

## Build

```bash
npm run build && npm start   # production
```

## Déploiement

Déployable sur **Vercel** en un clic. Pour que l'API soit joignable depuis
Vercel, il faudra exposer le backend (Fly.io, Railway, ngrok temporaire,
ou backend auto-hébergé) et renseigner `NEXT_PUBLIC_API_URL` dans les
variables Vercel.
