# ⚙️ Backend — Portfolio Polyglotte API (équipe Akatsuki)

API FastAPI unifiée qui sert les données des 5 portfolios de l'équipe à partir de **MongoDB** (profils, projets, agrégations) et de **Neo4j** (graphe candidats → projets → compétences).

> Objectif de ce README : un·e développeur·se qui clone le dépôt sur une **machine neuve** doit pouvoir lancer l'API et appeler les 9 routes en suivant uniquement ces étapes.
> Contrat détaillé des routes : [`API_ROUTES.md`](../API_ROUTES.md) · Modèles de données : [`ARCHITECTURE.md`](../ARCHITECTURE.md)

---

## 1. Prérequis

| Outil | Rôle | Installation |
|---|---|---|
| **Git** | cloner le dépôt | https://git-scm.com/downloads |
| **Docker Desktop** (ou Docker Engine sous Linux) | faire tourner MongoDB et Neo4j en local | https://www.docker.com/products/docker-desktop/ |
| **uv** | gestionnaire Python : installe Python et les dépendances du backend | https://docs.astral.sh/uv/getting-started/installation/ |
| **just** | lanceur des commandes du projet (`just up`, `just seed`…) | macOS : `brew install just` · Linux : `apt install just` · Windows : `uv tool install rust-just` (ou `winget install Casey.Just`) |

- **Python** : rien à installer à la main, `uv` télécharge la bonne version au premier `just install`.
- **Systèmes testés** : macOS, Linux, Windows (PowerShell + Git for Windows, ou WSL).
- ⚠️ **Windows** : `just` exécute ses commandes avec `sh`, fourni par Git for Windows. Si `just` affiche `could not find the shell sh`, voir le [Troubleshooting](#6-troubleshooting).

---

## 2. Installation et démarrage

Toutes les commandes se lancent depuis la **racine du dépôt** (là où se trouve le `justfile`).

```bash
git clone git@github.com:nosql-esigelec/2026-2027-rouen-portfolio-akatsuki.git
cd 2026-2027-rouen-portfolio-akatsuki

cp .env.example .env      # Windows PowerShell : copy .env.example .env
just install              # cd backend && uv sync  → installe Python + dépendances
just up                   # démarre MongoDB (port 27018) et Neo4j (ports 7475 / 7688) dans Docker
just seed                 # peuple les 2 bases depuis data/ (idempotent : relançable sans doublons)
just dev                  # lance l'API → http://localhost:8000/docs
```

✅ **Vérifier que tout marche** : ouvrir http://localhost:8000/docs (Swagger), ou :

```bash
curl http://localhost:8000/api/health
# {"status":"ok"}
```

Autres commandes utiles :

| Commande | Effet |
|---|---|
| `just` | liste toutes les commandes disponibles |
| `just down` | arrête MongoDB et Neo4j |
| `just reset` | supprime les bases (volumes Docker) et les redémarre vides → relancer ensuite `just seed` |
| `just test` | lance les tests du backend |

---

## 3. Variables d'environnement (`.env` à la racine)

Le fichier `.env` n'est **jamais** versionné (il est dans `.gitignore`). On le crée à partir de `.env.example` :

```env
APP_NAME="Portfolio Polyglotte API"
DEBUG=true

# MongoDB (port décalé : 27018)
MONGO_URL=mongodb://localhost:27018
MONGO_DB=portfolio

# Neo4j (bolt décalé : 7688)
NEO4J_URI=bolt://localhost:7688
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# CORS : URLs des frontends (séparées par des virgules)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8501
```

- Les ports **27018** (MongoDB) et **7688 / 7475** (Neo4j) sont décalés volontairement pour ne pas entrer en conflit avec le projet SmartCity.
- **Bases dans le cloud (MongoDB Atlas / Neo4j Aura)** au lieu du Docker local : il suffit de remplacer `MONGO_URL`, `NEO4J_URI`, `NEO4J_USER` et `NEO4J_PASSWORD` (et `MONGO_DB` si besoin) par les identifiants fournis. Dans ce cas, `just up` est inutile. ⚠️ Ne jamais committer ces identifiants.
- **Un frontend sur un autre port** : ajouter son URL dans `CORS_ORIGINS`, sinon le navigateur bloquera les appels à l'API.

---

## 4. Les 9 routes (exemples `curl`)

Les exemples utilisent les **vraies données seedées** depuis `data/` :

- candidats : `erwann-nobime`, `donatien-tovihouande`, `andrea-vissoh`, `rayan-marmouri`, `ayadjenou-gbedan`
- projet commun aux 5 : `smartcity-explorer`
- compétence partagée : `python`

> 💡 `| jq` met en forme le JSON (optionnel : https://jqlang.org/download/). Sans `jq`, retirez simplement `| jq`.
> 💡 **Windows PowerShell** : écrivez `curl.exe` au lieu de `curl` (dans PowerShell 5, `curl` est un alias d'une autre commande). Gardez les guillemets autour des URL qui contiennent `?` ou `&`.

### Parcours et projets (MongoDB)

```bash
# R1 — Profil complet d'un candidat (contacts, langues, timeline expériences + formations)
curl http://localhost:8000/api/candidats/erwann-nobime | jq

# R2 — Projets d'un candidat, paginés, filtrables par compétence
curl "http://localhost:8000/api/candidats/ayadjenou-gbedan/projets?competence=mongodb&page=1&size=20" | jq

# R3 — Statistiques par compétence d'un candidat (pipeline d'agrégation MongoDB)
curl http://localhost:8000/api/candidats/donatien-tovihouande/stats | jq

# R8 — Derniers projets de toute l'équipe (top N, tri par date de début)
curl "http://localhost:8000/api/projets/recents?limit=3" | jq
```

### Graphe de compétences (Neo4j)

```bash
# R4 — Projets similaires à un projet (score = nombre de compétences communes)
curl "http://localhost:8000/api/graph/projets/smartcity-explorer/similaires?limit=3" | jq

# R5 — Graphe d'un candidat prêt à afficher (nodes + links)
curl http://localhost:8000/api/graph/competences/ayadjenou-gbedan | jq

# R6 — Compétences communes à plusieurs candidats (2 minimum, séparés par des virgules)
curl "http://localhost:8000/api/graph/competences/communes?candidats=erwann-nobime,ayadjenou-gbedan" | jq

# R7 — Compétences transversales d'un candidat (utilisées dans au moins min_projets projets)
curl "http://localhost:8000/api/graph/candidats/erwann-nobime/competences-transversales?min_projets=2" | jq
```

### Neo4j + MongoDB

```bash
# R9 — Qui prouve une compétence : candidats + projets correspondants
curl http://localhost:8000/api/competences/python/preuves | jq
```

### Codes d'erreur

| Code | Quand | Exemple |
|---|---|---|
| `404` | slug inconnu | `curl http://localhost:8000/api/candidats/inconnu` → `{"detail": "Candidat 'inconnu' introuvable"}` |
| `400` | paramètre invalide (R6 avec moins de 2 candidats) | `curl "http://localhost:8000/api/graph/competences/communes?candidats=erwann-nobime"` |
| `422` | type incorrect | `curl "http://localhost:8000/api/candidats/erwann-nobime/projets?size=abc"` |

---

## 5. Tests

```bash
just test        # cd backend && uv run pytest -q
```

- Tous les tests sont **mockés** : pas besoin que Docker ni les bases tournent.
- `backend/tests/test_data_integrity.py` vérifie aussi les fichiers de `data/` **avant le seed** (slugs uniques et bien formés, auteurs existants, variantes du type `power-bi`/`powerbi`, niveaux, dates). À lancer après toute modification de vos données :

```bash
cd backend
uv run pytest tests/test_data_integrity.py -v
```

---

## 6. Troubleshooting

**`just` : `could not find the shell sh: program not found` (Windows)**
`just` utilise `sh`, installé avec Git for Windows mais absent du PATH. Dans PowerShell :
```powershell
$env:Path += ";C:\Program Files\Git\bin"                           # pour le terminal en cours
[Environment]::SetEnvironmentVariable("Path", $env:Path, "User")   # pour le rendre permanent
```
Puis fermer et rouvrir le terminal.

**`just seed` échoue avec « DNS resolve » ou « Timed out » (Atlas / Aura)**
Votre `.env` pointe vers le cloud au lieu du Docker local. Remettez `MONGO_URL` et `NEO4J_URI` sur `localhost` (voir section 3), ou vérifiez vos identifiants cloud.

**Neo4j Browser (http://localhost:7475) demande un login**
Connexion `bolt://localhost:7688`, identifiants `neo4j` / `password`. Si le premier lancement vous force à changer le mot de passe, reportez le nouveau dans `NEO4J_PASSWORD` du `.env`.

**`port is already allocated` / « port already in use » sur 27018, 7475 ou 7688**
Un autre `docker compose` tourne (souvent celui de SmartCity). `docker ps` pour voir les conteneurs actifs, puis arrêtez l'autre projet ou `just down` pour arrêter le nôtre.

**`just up` : `Cannot connect to the Docker daemon` / `docker_engine: The system cannot find the file specified`**
Docker Desktop n'est pas lancé. Ouvrez-le et attendez « Engine running » avant de relancer `just up`.

**Repartir de zéro**
```bash
just reset      # supprime les volumes et redémarre des bases vides
just seed       # repeuple depuis data/
```

**Le navigateur n'arrive pas à joindre http://localhost:8000 (« Failed to fetch » / « ERR_CONNECTION_REFUSED »)**
L'API ne tourne pas : relancez `just dev` et laissez ce terminal ouvert pendant que vous utilisez l'API.