# 🌸 Frontend personnel — Manuella Gbedan (`ayadjenou-gbedan`)

Mon portfolio aux couleurs de mon univers **dreamingwith.her** (rose, girly-chic, vision board : post-it, polaroïds, journal, constellation), alimenté **uniquement par l'API d'équipe** (aucune donnée en dur).

- **Techno** : [Streamlit](https://streamlit.io/) (Python) pour appeler l'API + une page HTML/CSS/JavaScript pour la mise en page et les animations, et [force-graph](https://github.com/vasturiano/force-graph) pour le graphe interactif
- **`app.py`** : appelle les routes de l'API et rassemble les données (aucune donnée en dur)
- **`site/index.html`** : mise en page, animations, post-it déplaçables, polaroïds, graphe ; il n'affiche que des données venues de l'API
- **`site/avatar.png`** : mon avatar
- **`site/vercel.json`** : configuration de la version en ligne (relais des appels `/api/...` vers le backend d'équipe)

## Version en ligne (Vercel)

🌸 **Portfolio en ligne : _(lien à ajouter après déploiement)_**

- Le dossier `site/` est déployé tel quel sur Vercel (Root Directory = `frontends/frontend-Ayadjenou/site`, Framework Preset = *Other*, aucune commande de build).
- Dans cette version, c'est le JavaScript qui appelle lui-même les routes `/api/...` (avec `fetch`, en parallèle grâce à `Promise.all`).
- `vercel.json` relaie ces appels vers le backend d'équipe déployé (`https://2026-2027-rouen-portfolio-akatsuki.vercel.app`) : le navigateur ne parle qu'au domaine du portfolio, donc pas de problème de CORS.

## Lancer le frontend en local

Prérequis : l'API d'équipe tourne sur http://localhost:8000 (voir [`backend/README.md`](../../backend/README.md) : `just up`, `just seed`, `just dev`).

Depuis ce dossier `frontends/frontend-Ayadjenou/` :

```bash
uv sync                          # installe Streamlit et requests
uv run streamlit run app.py      # → http://localhost:8501
```

Variables optionnelles (valeurs par défaut entre parenthèses) :

| Variable | Rôle |
|---|---|
| `API_URL` (`http://localhost:8000`) | adresse de l'API d'équipe |
| `CANDIDAT_SLUG` (`ayadjenou-gbedan`) | candidat affiché |

Exemple : `API_URL=https://mon-api.vercel.app uv run streamlit run app.py` (PowerShell : `$env:API_URL="https://…"` puis la commande).

## Routes consommées par chaque vue

| Vue | Route | Base | Ce qu'elle affiche |
|---|---|---|---|
| **Accueil** + **Mon parcours** (journal) | R1 `GET /api/candidats/{slug}` | MongoDB `candidats` | profil, contacts, timeline des expériences et formations, langues |
| Stickers de l'accueil, bandeau, **post-it des compétences**, filtres des projets | R3 `GET /api/candidats/{slug}/stats` | MongoDB (pipeline d'agrégation) | nombre de projets et de compétences, liste du filtre |
| **Mes projets** (mur de polaroïds + détail) | R2 `GET /api/candidats/{slug}/projets?competence=…&page=1&size=100` | MongoDB `projets` | cartes de projets, détail au clic |
| **Ma constellation** (graphe) | R5 `GET /api/graph/competences/{slug}` | Neo4j | graphe Moi → projets → compétences (taille = nb de projets) |
| **Ma constellation** — « Ça te plaira aussi » | R4 `GET /api/graph/projets/{slug}/similaires?limit=5` | Neo4j | projets qui partagent des compétences avec le projet choisi/cliqué |
| **Ma constellation** — « Mes incontournables » | R7 `GET /api/graph/candidats/{slug}/competences-transversales?min_projets=2` | Neo4j | compétences utilisées dans au moins 2 projets |
