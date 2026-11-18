# 📜 API_ROUTES - Contrat d'interface de l'équipe

> Contrat d'interface entre le backend d'équipe et **chaque** frontend personnel.
> Chaque membre peut coder son frontend avec ce seul document. Toute modification du contrat passe par une Pull Request relue par l'équipe.

Base URL : `http://localhost:8000` · Swagger : `http://localhost:8000/docs`

## Conventions

- Identifiants publics = **slugs** (`alice-martin`, `smartcity-explorer`, `mongodb`), jamais d'`ObjectId` exposé.
- Erreurs : `404 {"detail": "..."}` si la ressource n'existe pas.
- Pagination : `?page=1&size=20` → `{"items": [...], "total": 42, "page": 1, "size": 20}`.
- Dates : chaînes ISO 8601 `YYYY-MM-DD`, `null` quand la date n'existe pas (poste ou projet en cours).
- Slugs : minuscules, sans accents, tirets. Ils relient MongoDB et Neo4j.
- Autres erreurs : `400 {"detail": "..."}` pour un paramètre invalide (route 6), `422` pour un type incorrect (ex. `size=abc`).

Les trois écrans des frontends sont : **Parcours** (timeline), **Projets** et **Graphe de compétences**.

## `GET /api/health`

Fourni. Réponse : `{"status": "ok"}`

## 1. `GET /api/candidats/{slug}` : profil et timeline

- **Paramètres** : `slug` (chemin, obligatoire) : `candidat_slug`. Aucun paramètre de requête. Les listes `experiences` et `formations` sont triées par `debut` décroissant.
- **Écran qui l'utilise** : Parcours (en-tête du profil, contacts, langues, timeline expériences et formations).

```json
{
  "candidat_slug": "alice-martin",
  "nom": "Martin",
  "prenom": "Alice",
  "titre": "Étudiante ingénieure en data, recherche une alternance",
  "bio": "Passionnée par les données et les architectures backend.",
  "contacts": {
    "email": "alice.martin@example.com",
    "github": "https://github.com/alice-martin",
    "linkedin": "https://linkedin.com/in/alice-martin"
  },
  "langues": [
    { "langue": "Français", "niveau": "Natif" },
    { "langue": "Anglais", "niveau": "C1" }
  ],
  "experiences": [
    {
      "type": "alternance",
      "entreprise": "Normandie Tech",
      "poste": "Développeuse backend",
      "debut": "2026-09-01",
      "fin": null,
      "description": "Développement d'API REST en Python."
    },
    {
      "type": "stage",
      "entreprise": "Acme Data",
      "poste": "Stagiaire data engineer",
      "debut": "2025-06-01",
      "fin": "2025-08-31",
      "description": "Mise en place d'un pipeline d'ingestion de données."
    }
  ],
  "formations": [
    {
      "ecole": "ESIGELEC",
      "diplome": "Diplôme d'ingénieur, majeure data",
      "debut": "2024-09-01",
      "fin": null
    },
    {
      "ecole": "Lycée Corneille",
      "diplome": "Baccalauréat scientifique",
      "debut": "2021-09-01",
      "fin": "2024-06-30"
    }
  ]
}
```

Erreur : `404 {"detail": "Candidat 'xyz' introuvable"}`

## 2. `GET /api/candidats/{slug}/projets` : projets d'un candidat

- **Paramètres** : `slug` (chemin, obligatoire) ; `competence` (optionnel, `skill_slug`, ne garde que les projets qui utilisent cette compétence) ; `page` (défaut 1) ; `size` (défaut 20, max 100). Exemple : `?competence=mongodb&page=1&size=20`. Tri par `date_debut` décroissant.
- **Écran** : Projets (liste des projets avec filtre par compétence).

```json
{
  "items": [
    {
      "projet_slug": "portfolio-nosql",
      "titre": "Portfolio polyglotte",
      "description": "Portfolio personnel alimenté par une API unifiée MongoDB et Neo4j.",
      "type": "academique",
      "date_debut": "2026-11-02",
      "date_fin": null,
      "auteurs": ["alice-martin"],
      "competences": [
        { "skill_slug": "python", "nom": "Python" },
        { "skill_slug": "mongodb", "nom": "MongoDB" },
        { "skill_slug": "neo4j", "nom": "Neo4j" }
      ],
      "liens": { "github": "https://github.com/alice-martin/portfolio-nosql", "demo": null },
      "resultats": null
    },
    {
      "projet_slug": "smartcity-explorer",
      "titre": "SmartCity Explorer",
      "description": "Application de visualisation de données urbaines combinant MongoDB et Neo4j.",
      "type": "academique",
      "date_debut": "2026-01-15",
      "date_fin": "2026-03-30",
      "auteurs": ["alice-martin", "bob-durand"],
      "competences": [
        { "skill_slug": "python", "nom": "Python" },
        { "skill_slug": "mongodb", "nom": "MongoDB" },
        { "skill_slug": "fastapi", "nom": "FastAPI" }
      ],
      "liens": { "github": "https://github.com/nosql-esigelec/smartcity-explorer", "demo": null },
      "resultats": "Prototype fonctionnel présenté en soutenance."
    }
  ],
  "total": 2,
  "page": 1,
  "size": 20
}
```

Erreur : `404` si le candidat n'existe pas. Un candidat sans projet renvoie `200` avec `"items": []` et `"total": 0`.

## 3. `GET /api/candidats/{slug}/stats` : statistiques par compétence (agrégation MongoDB)

- **Paramètres** : `slug` (chemin, obligatoire). Aucun paramètre de requête. Les compétences sont triées par `nb_projets` décroissant, puis par `skill_slug`.
- **Écran** : Projets (bandeau de statistiques et choix du filtre par compétence).

```json
{
  "candidat_slug": "alice-martin",
  "nb_projets": 3,
  "nb_competences": 5,
  "competences": [
    {
      "skill_slug": "python",
      "nom": "Python",
      "nb_projets": 3,
      "projets": ["chatbot-rh", "portfolio-nosql", "smartcity-explorer"],
      "premiere_utilisation": "2025-09-10",
      "derniere_utilisation": "2026-11-02"
    },
    {
      "skill_slug": "mongodb",
      "nom": "MongoDB",
      "nb_projets": 2,
      "projets": ["portfolio-nosql", "smartcity-explorer"],
      "premiere_utilisation": "2026-01-15",
      "derniere_utilisation": "2026-11-02"
    },
    {
      "skill_slug": "fastapi",
      "nom": "FastAPI",
      "nb_projets": 1,
      "projets": ["smartcity-explorer"],
      "premiere_utilisation": "2026-01-15",
      "derniere_utilisation": "2026-01-15"
    },
    {
      "skill_slug": "neo4j",
      "nom": "Neo4j",
      "nb_projets": 1,
      "projets": ["portfolio-nosql"],
      "premiere_utilisation": "2026-11-02",
      "derniere_utilisation": "2026-11-02"
    },
    {
      "skill_slug": "nlp",
      "nom": "NLP",
      "nb_projets": 1,
      "projets": ["chatbot-rh"],
      "premiere_utilisation": "2025-09-10",
      "derniere_utilisation": "2025-09-10"
    }
  ]
}
```

Erreur : `404` si le candidat n'existe pas. Un candidat sans projet renvoie `200` avec `nb_projets: 0` et `competences: []`.

## 4. `GET /api/graph/projets/{slug}/similaires` : projets similaires (Neo4j)

- **Paramètres** : `slug` (chemin, obligatoire) : `projet_slug` ; `limit` (optionnel, défaut 5, max 20). Exemple : `?limit=3`. Deux projets sont similaires s'ils partagent des compétences : `score` = nombre de compétences communes. Tri par `score` décroissant, puis `projet_slug`.
- **Écran** : Graphe de compétences (encart « projets similaires » sous un projet sélectionné) et fiche projet.

```json
{
  "projet_slug": "smartcity-explorer",
  "similaires": [
    {
      "projet_slug": "portfolio-nosql",
      "titre": "Portfolio polyglotte",
      "date_debut": "2026-11-02",
      "auteurs": ["alice-martin"],
      "score": 2,
      "competences_communes": ["mongodb", "python"]
    },
    {
      "projet_slug": "chatbot-rh",
      "titre": "Chatbot RH",
      "date_debut": "2025-09-10",
      "auteurs": ["alice-martin"],
      "score": 1,
      "competences_communes": ["python"]
    },
    {
      "projet_slug": "iot-dashboard",
      "titre": "IoT Dashboard",
      "date_debut": "2026-04-01",
      "auteurs": ["bob-durand"],
      "score": 1,
      "competences_communes": ["python"]
    }
  ]
}
```

Erreur : `404` si le projet n'existe pas. Un projet sans similaire renvoie `200` avec `"similaires": []`.

## 5. `GET /api/graph/competences/{slug}` : graphe de compétences prêt à afficher (Neo4j)

- **Paramètres** : `slug` (chemin, obligatoire) : `candidat_slug` (le graphe est celui de ce candidat). Aucun paramètre de requête. Les `id` sont préfixés par le type (`candidat:`, `projet:`, `competence:`) pour éviter les collisions entre slugs. Une compétence porte `nb_projets` (nombre de projets du candidat qui l'utilisent), utile pour la taille du nœud.
- **Écran** : Graphe de compétences.

```json
{
  "candidat_slug": "alice-martin",
  "nodes": [
    { "id": "candidat:alice-martin", "type": "candidat", "label": "Alice Martin" },
    { "id": "projet:smartcity-explorer", "type": "projet", "label": "SmartCity Explorer" },
    { "id": "projet:portfolio-nosql", "type": "projet", "label": "Portfolio polyglotte" },
    { "id": "projet:chatbot-rh", "type": "projet", "label": "Chatbot RH" },
    { "id": "competence:python", "type": "competence", "label": "Python", "nb_projets": 3 },
    { "id": "competence:mongodb", "type": "competence", "label": "MongoDB", "nb_projets": 2 },
    { "id": "competence:fastapi", "type": "competence", "label": "FastAPI", "nb_projets": 1 },
    { "id": "competence:neo4j", "type": "competence", "label": "Neo4j", "nb_projets": 1 },
    { "id": "competence:nlp", "type": "competence", "label": "NLP", "nb_projets": 1 }
  ],
  "links": [
    { "source": "candidat:alice-martin", "target": "projet:smartcity-explorer", "type": "A_REALISE" },
    { "source": "candidat:alice-martin", "target": "projet:portfolio-nosql", "type": "A_REALISE" },
    { "source": "candidat:alice-martin", "target": "projet:chatbot-rh", "type": "A_REALISE" },
    { "source": "projet:smartcity-explorer", "target": "competence:python", "type": "UTILISE" },
    { "source": "projet:smartcity-explorer", "target": "competence:mongodb", "type": "UTILISE" },
    { "source": "projet:smartcity-explorer", "target": "competence:fastapi", "type": "UTILISE" },
    { "source": "projet:portfolio-nosql", "target": "competence:python", "type": "UTILISE" },
    { "source": "projet:portfolio-nosql", "target": "competence:mongodb", "type": "UTILISE" },
    { "source": "projet:portfolio-nosql", "target": "competence:neo4j", "type": "UTILISE" },
    { "source": "projet:chatbot-rh", "target": "competence:python", "type": "UTILISE" },
    { "source": "projet:chatbot-rh", "target": "competence:nlp", "type": "UTILISE" }
  ]
}
```

Erreur : `404` si le candidat n'existe pas. Un candidat sans projet renvoie `200` avec uniquement son nœud et `"links": []`.

## Routes supplémentaires

> Note backend : déclarer `/api/graph/competences/communes` (route 6) **avant** `/api/graph/competences/{slug}` (route 5), sinon `communes` serait lu comme un slug.

### 6. `GET /api/graph/competences/communes` : compétences communes entre candidats (Neo4j)

- **Paramètres** : `candidats` (requête, obligatoire) : `candidat_slug` séparés par des virgules, 2 minimum. Exemple : `?candidats=alice-martin,bob-durand`. Renvoie les compétences utilisées, via leurs projets, par **tous** les candidats listés.
- **Écran** : Page Équipe (comparaison de compétences entre membres).

```json
{
  "candidats": ["alice-martin", "bob-durand"],
  "competences_communes": [
    { "skill_slug": "python", "nom": "Python" }
  ]
}
```

Erreurs : `400 {"detail": "Au moins 2 candidats sont requis"}` ; `404` si un slug est inconnu. Aucune compétence commune renvoie `200` avec `"competences_communes": []`.

### 7. `GET /api/graph/candidats/{slug}/competences-transversales` : compétences utilisées dans plusieurs projets (Neo4j)

- **Paramètres** : `slug` (chemin, obligatoire) : `candidat_slug` ; `min_projets` (optionnel, défaut 2). Tri par `nb_projets` décroissant, puis `nom`.
- **Écran** : Graphe de compétences (liste des compétences récurrentes à côté du graphe).

```json
{
  "candidat_slug": "alice-martin",
  "min_projets": 2,
  "competences": [
    {
      "skill_slug": "python",
      "nom": "Python",
      "nb_projets": 3,
      "projets": ["chatbot-rh", "portfolio-nosql", "smartcity-explorer"]
    },
    {
      "skill_slug": "mongodb",
      "nom": "MongoDB",
      "nb_projets": 2,
      "projets": ["portfolio-nosql", "smartcity-explorer"]
    }
  ]
}
```

Erreur : `404` si le candidat n'existe pas.

### 8. `GET /api/projets/recents` : derniers projets de l'équipe (MongoDB)

- **Paramètres** : `limit` (optionnel, défaut 5, max 50). Exemple : `?limit=2`. Tous candidats confondus, tri par `date_debut` décroissant (pas de pagination `page`/`size`, c'est un « top N »).
- **Écran** : Accueil (bandeau « derniers projets »).

```json
{
  "items": [
    {
      "projet_slug": "portfolio-nosql",
      "titre": "Portfolio polyglotte",
      "description": "Portfolio personnel alimenté par une API unifiée MongoDB et Neo4j.",
      "type": "academique",
      "date_debut": "2026-11-02",
      "date_fin": null,
      "auteurs": ["alice-martin"],
      "competences": [
        { "skill_slug": "python", "nom": "Python" },
        { "skill_slug": "mongodb", "nom": "MongoDB" },
        { "skill_slug": "neo4j", "nom": "Neo4j" }
      ],
      "liens": { "github": "https://github.com/alice-martin/portfolio-nosql", "demo": null },
      "resultats": null
    },
    {
      "projet_slug": "iot-dashboard",
      "titre": "IoT Dashboard",
      "description": "Tableau de bord temps réel de capteurs connectés.",
      "type": "personnel",
      "date_debut": "2026-04-01",
      "date_fin": "2026-06-30",
      "auteurs": ["bob-durand"],
      "competences": [
        { "skill_slug": "python", "nom": "Python" },
        { "skill_slug": "docker", "nom": "Docker" }
      ],
      "liens": { "github": "https://github.com/bob-durand/iot-dashboard", "demo": null },
      "resultats": "Déployé sur un Raspberry Pi pour la démonstration."
    }
  ]
}
```

### 9. `GET /api/competences/{slug}/preuves` : qui prouve une compétence (Neo4j + MongoDB)

- **Paramètres** : `slug` (chemin, obligatoire) : `skill_slug`. Aucun paramètre de requête. Liste les candidats qui ont utilisé la compétence, avec les projets correspondants. Tri par `nb_projets` décroissant, puis `candidat_slug`.
- **Écran** : Page Compétence (preuves d'une compétence, cliquable depuis le graphe).

```json
{
  "skill_slug": "python",
  "nom": "Python",
  "candidats": [
    {
      "candidat_slug": "alice-martin",
      "prenom": "Alice",
      "nom": "Martin",
      "titre": "Étudiante ingénieure en data, recherche une alternance",
      "nb_projets": 3,
      "projets": [
        { "projet_slug": "chatbot-rh", "titre": "Chatbot RH" },
        { "projet_slug": "portfolio-nosql", "titre": "Portfolio polyglotte" },
        { "projet_slug": "smartcity-explorer", "titre": "SmartCity Explorer" }
      ]
    },
    {
      "candidat_slug": "bob-durand",
      "prenom": "Bob",
      "nom": "Durand",
      "titre": "Étudiant ingénieur en systèmes embarqués",
      "nb_projets": 2,
      "projets": [
        { "projet_slug": "iot-dashboard", "titre": "IoT Dashboard" },
        { "projet_slug": "smartcity-explorer", "titre": "SmartCity Explorer" }
      ]
    }
  ]
}
```

Erreur : `404` si la compétence n'existe pas.
