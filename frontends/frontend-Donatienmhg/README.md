# 🏠 Frontend personnel : Donatien Tovihouande (`donatien-tovihouande`)

Mon portfolio se visite **comme un appartement** : on sonne, la porte s'ouvre, on consulte le plan, puis on entre dans chaque pièce. Chaque pièce correspond à une rubrique du portfolio et ses objets sont interactifs. Toutes les données viennent **uniquement de l'API d'équipe** (aucune donnée en dur).

| Pièce | Rubrique | Ce qu'on y trouve |
|---|---|---|
| 🚪 L'entrée | Accueil | porte animée, avatar, titre, bio, langues, contacts |
| 🗺️ Le plan | Navigation | plan d'architecte cliquable avec un aperçu de chaque pièce |
| 🛋️ Le salon | **Parcours** | expériences et formations accrochées au mur comme des cadres, télévision à 3 chaînes |
| 🛠️ L'atelier | **Projets** | fiches punaisées sur un tableau en liège, écran (tableau de bord + détail), panneau à outils = filtre par compétence |
| 📚 La bibliothèque | **Compétences** | un livre par compétence, carte murale (graphe Neo4j), « qui prouve cette compétence » |
| 🪟 Le balcon | **Contact** | boîte aux lettres, cartes de visite, ville de nuit dont les fenêtres sont les derniers projets de l'équipe |

## Technologie

- **[React 19](https://react.dev/) + [Vite](https://vite.dev/)** (JavaScript)
- **[Tailwind CSS 4](https://tailwindcss.com/)** pour le style (thème sombre + accent violet, défini dans `src/index.css`)
- **[Framer Motion](https://motion.dev/)** pour les animations (porte, zooms, cadres, parallaxe…)
- **[React Router](https://reactrouter.com/)** : une adresse par pièce (`/salon`, `/atelier`…)
- **[react-force-graph-2d](https://github.com/vasturiano/react-force-graph)** pour le graphe de compétences
- **[react-icons](https://react-icons.github.io/react-icons/)** pour les icônes (LinkedIn, GitHub…)
- Meubles et décors dessinés en **SVG** (dossier `src/components/meubles/`)

## Lancer le frontend en local

Prérequis : **[Node.js](https://nodejs.org/) 20.19 ou plus** (version LTS conseillée) (`node -v` pour vérifier).

Depuis ce dossier `frontends/frontend-Donatienmhg/` :

```bash
npm install        # installe les dépendances (une seule fois)
npm run dev        # → http://localhost:5173
```

> **Windows / PowerShell** : si `npm` est bloqué (« l'exécution de scripts est désactivée sur ce système »), utilisez `npm.cmd install` et `npm.cmd run dev`.

### Choisir l'API utilisée

Le frontend lit deux variables dans un fichier **`.env`** (à créer en copiant `.env.example` ; il n'est **pas commité**). Sans `.env`, les valeurs par défaut s'appliquent.

| Variable | Rôle | Valeur par défaut |
|---|---|---|
| `VITE_API_URL` | adresse de l'API d'équipe | `http://localhost:8000` |
| `VITE_CANDIDAT_SLUG` | candidat affiché | `donatien-tovihouande` |

Deux façons de travailler :

- **Avec l'API d'équipe déployée** (le plus simple, aucun backend à lancer) :
  ```
  VITE_API_URL=https://2026-2027-rouen-portfolio-akatsuki.vercel.app
  ```
- **Avec l'API en local** : laisser la valeur par défaut et lancer le backend (voir [`backend/README.md`](../../backend/README.md) : `just dev`).

Après une modification du `.env`, relancer `npm run dev` (Vite ne le lit qu'au démarrage).

### Autres commandes

```bash
npm run lint       # vérifie le code (ESLint)
npm run build      # construit la version de production dans dist/
npm run preview    # sert la version construite pour la tester
```

## Routes consommées par chaque page

Les numéros sont ceux de [`API_ROUTES.md`](../../API_ROUTES.md). Tous les appels sont regroupés dans [`src/api/client.js`](src/api/client.js).

| Page | Route | Base | Ce qu'elle affiche |
|---|---|---|---|
| **Entrée** (`/`) | 1 `GET /api/candidats/{slug}` | MongoDB | nom, titre, bio, langues, contacts |
| **Plan** (`/plan`) | 1 `GET /api/candidats/{slug}` | MongoDB | aperçu du salon (nombre d'expériences et de formations) |
| | 3 `GET /api/candidats/{slug}/stats` | MongoDB (agrégation) | aperçus de l'atelier et de la bibliothèque (nombre de projets, de compétences) |
| **Parcours : salon** (`/salon`) | 1 `GET /api/candidats/{slug}` | MongoDB | cadres (expériences + formations triées), télévision (en ce moment, chiffres, langues) |
| **Projets : atelier** (`/atelier`) | 2 `GET /api/candidats/{slug}/projets?page=1&size=100` | MongoDB | fiches du tableau en liège, détail d'un projet à l'écran |
| | 2 `…/projets?competence={skill_slug}&page=1&size=100` | MongoDB | filtre par compétence (panneau à outils) |
| | 3 `GET /api/candidats/{slug}/stats` | MongoDB (agrégation) | tableau de bord de l'écran, outils du panneau |
| | 4 `GET /api/graph/projets/{slug}/similaires?limit=4` | Neo4j | projets similaires sous le projet ouvert |
| | 1 `GET /api/candidats/{slug}` | MongoDB | prénom utilisé dans les conseils du chien |
| **Compétences : bibliothèque** (`/bibliotheque`) | 3 `GET /api/candidats/{slug}/stats` | MongoDB (agrégation) | un livre par compétence (projets, première et dernière utilisation) |
| | 5 `GET /api/graph/competences/{slug}` | Neo4j | carte des compétences (Moi → projets → compétences) |
| | 7 `GET /api/graph/candidats/{slug}/competences-transversales?min_projets=2` | Neo4j | compétences transversales (légende de la carte) |
| | 9 `GET /api/competences/{skill_slug}/preuves` | Neo4j + MongoDB | page « Qui d'autre la prouve ? » du livre ouvert |
| | 1 et 2 | MongoDB | titres des projets, nom affiché sur la carte |
| **Contact : balcon** (`/balcon`) | 1 `GET /api/candidats/{slug}` | MongoDB | cartes de visite (LinkedIn, GitHub, e-mail), boîte aux lettres |
| | 8 `GET /api/projets/recents?limit=6` | MongoDB | fenêtres violettes de la ville = derniers projets de l'équipe |
| | 6 `GET /api/graph/competences/communes?candidats={moi},{auteur}` | Neo4j | « ce que j'ai en commun » avec l'auteur d'un projet |

### Si Neo4j ne répond pas

Le portfolio reste utilisable :

- la **carte des compétences** est reconstruite à partir des routes MongoDB (1, 2 et 3) et le cadre l'indique (« reconstruite depuis MongoDB ») ;
- les **compétences transversales** sont calculées à partir de la route 3 ;
- les autres encarts Neo4j (projets similaires, preuves, compétences communes) affichent « momentanément indisponible », le reste de la pièce fonctionne.

## Organisation du code

```
src/
├── api/            client.js (une fonction par route) + useApi.js (chargement / erreur)
├── pieces/         une page par pièce (Entree, Plan, Salon, Atelier, Bibliotheque, Balcon)
│   ├── salon/        cadres, télévision, scène meublée
│   ├── atelier/      fiches, écran, scène meublée
│   ├── bibliotheque/ étagère, carte (graphe), livre ouvert, scène meublée
│   └── balcon/       ciel, ville, guirlande, lettre, vue à la longue-vue, scène
├── components/     éléments communs : en-tête des pièces, scène (mur + parquet), parallaxe
│   └── meubles/      meubles et objets en SVG (canapé, bureau, lampes, chien…)
└── utils/          dates, textes, graphe de secours, contacts, détection grand écran
```

## Interactions et accessibilité

- Sur ordinateur (≥ 1024 px), chaque pièce est une **scène meublée** : effet de profondeur qui suit la souris, lampes à allumer et éteindre, objets qui réagissent au survol, chien qui donne des conseils au clic.
- Sur téléphone et tablette, chaque pièce passe en **version simplifiée** (listes et cartes) avec les mêmes données.
- Les objets cliquables sont de vrais boutons ou liens : utilisables **au clavier** (Tab, Entrée, Échap pour fermer).
- Si le système demande de **réduire les animations**, les animations décoratives sont désactivées.
