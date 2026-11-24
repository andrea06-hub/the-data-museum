# THE DATA MUSEUM

## Présentation

The Data Museum est un portfolio interactif et immersif
inspiré d'un musée numérique.

Le visiteur découvre mon parcours, mes projets et mes
compétences à travers différentes expositions.

Ce projet a été réalisé dans le cadre du cours NoSQL
à l'ESIGELEC, au sein de l'équipe Akatsuki.

## Technologies utilisées

- React : développement de l'interface utilisateur.
- Vite : environnement de développement et compilation.
- JavaScript : logique et interactions.
- CSS : design, animations et adaptation responsive.
- SVG : visualisation interactive des compétences.
- FastAPI : communication avec le backend.
- MongoDB : stockage des données du portfolio.
- Neo4j : exploitation des relations entre les compétences
  et les projets.

## Installation et lancement

### Prérequis

- Node.js et npm
- Backend FastAPI opérationnel
- MongoDB et Neo4j configurés

### Lancement du backend

Depuis la racine du dépôt :

```bash
just up
just install
just dev
```

L'API est accessible à l'adresse :

http://localhost:8000

Documentation interactive de l'API :

http://localhost:8000/docs

### Lancement du frontend

Dans un deuxième terminal, depuis la racine du dépôt :

```bash
cd frontends/frontend-andrea06-hub
npm install
npm run dev
```

Le portfolio est accessible à l'adresse :

http://localhost:5173

## Organisation du portfolio

### The Entrance

Introduction animée avec possibilité de passer directement
à la visite du musée.

### Main Hall

Hall principal permettant d'accéder aux trois expositions
et à l'espace de contact.

### The Journey

Présentation du profil, de la biographie, des expériences
professionnelles et des formations sous forme de timeline.

### The Collection

Galerie interactive présentant les projets réalisés,
leurs descriptions, les technologies utilisées et les
projets similaires identifiés grâce à Neo4j.

Les projets similaires affichés sont filtrés pour
rester dans mon portfolio personnel.

### The Connections

Graphe interactif permettant de visualiser les relations
entre les compétences et les projets.

La sélection d'une compétence met en évidence les
projets associés.

### The Exit

Espace de contact permettant de télécharger mon CV,
d'accéder à LinkedIn et GitHub et de me contacter
par courrier électronique.

## Routes API consommées

| Page | Méthode | Route |
|---|---|---|
| The Journey | GET | `/api/candidats/{slug}` |
| The Collection | GET | `/api/candidats/{slug}/projets` |
| The Collection | GET | `/api/graph/projets/{slug}/similaires` |
| The Connections | GET | `/api/candidats/{slug}/stats` |
| The Connections | GET | `/api/candidats/{slug}/projets` |
| The Connections | GET | `/api/graph/candidats/{slug}/competences-transversales` |
| The Exit | GET | `/api/candidats/{slug}` |

Identifiant du candidat : `andrea-vissoh`.

## Fonctionnalités

- Introduction animée.
- Navigation immersive entre les expositions.
- Chargement dynamique des données depuis l'API.
- Galerie de projets avec défilement horizontal.
- Exploration des projets similaires.
- Graphe interactif des compétences.
- Identification des compétences transversales.
- Gestion des états de chargement et des erreurs.
- Adaptation aux écrans mobiles.
- Téléchargement du CV et liens de contact.

## Vérifications techniques

```bash
npm run build
npm run lint
```

## Auteur

Andréa VISSOH

Étudiante ingénieure en Big Data à l'ESIGELEC.

Équipe Akatsuki — Projet NoSQL 2026-2027.

---

Every dataset tells a story. This one is mine.