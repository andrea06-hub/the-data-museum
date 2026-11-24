"""Frontend personnel de Manuella Gbedan — Portfolio Polyglotte (univers dreamingwith.her).

Répartition du travail :
  - app.py (ce fichier, Python) : appelle l'API d'équipe et rassemble les données.
  - site/index.html (HTML/CSS/JavaScript) : la mise en page rose et girly, les animations
    et le graphe interactif. Il ne contient AUCUNE donnée : il affiche ce que
    app.py lui transmet.

Routes consommées (aucune donnée en dur) :
  - Accueil + Mon parcours → R1 GET /api/candidats/{slug}                              (MongoDB)
  - Stickers + post-it      → R3 GET /api/candidats/{slug}/stats                       (MongoDB, agrégation)
  - Mes projets             → R2 GET /api/candidats/{slug}/projets[?competence=…]      (MongoDB)
  - Ma constellation        → R5 GET /api/graph/competences/{slug}                     (Neo4j)
                              R4 GET /api/graph/projets/{slug}/similaires              (Neo4j)
                              R7 GET /api/graph/candidats/{slug}/competences-transversales (Neo4j)

Les appels à l'API partent en parallèle et sont mis en cache 10 minutes.

Lancement : uv run streamlit run app.py
"""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path

from concurrent.futures import ThreadPoolExecutor

import requests
import streamlit as st
import streamlit.components.v1 as components  # solution de repli pour les anciennes versions

# ── Configuration ───────────────────────────────────────────────────────────

# Adresse de l'API d'équipe (modifiable sans toucher au code, ex. après déploiement)
API_URL = os.getenv("API_URL", "http://localhost:8000")
# Mon identifiant pivot, le même dans MongoDB et dans Neo4j
CANDIDAT_SLUG = os.getenv("CANDIDAT_SLUG", "ayadjenou-gbedan")
# La page (site/index.html) et mon avatar, rangés dans le dossier site/.
# Ce même dossier est déployé tel quel sur Vercel pour la version en ligne.
SITE = Path(__file__).with_name("site")
GABARIT = SITE / "index.html"
AVATAR = SITE / "avatar.png"

st.set_page_config(page_title="Manuella Gbedan — Portfolio", page_icon="🌸", layout="wide")

# On masque l'habillage par défaut de Streamlit : le portfolio occupe toute la page
st.markdown(
    """<style>
    #MainMenu, header, footer { visibility: hidden; }
    .block-container { padding: 0 !important; max-width: 100% !important; }
    .stApp { background: #FFF0F3; overflow: hidden; }
    /* le cadre prend toute la hauteur de l'écran : on ne défile que dans le portfolio */
    iframe { height: 100vh !important; border: none; }
    </style>""",
    unsafe_allow_html=True,
)


# ── Appels à l'API ──────────────────────────────────────────────────────────


def recuperer(chemin: str, params: dict | None = None) -> dict:
    """Appelle une route GET de l'API et renvoie le JSON."""
    reponse = requests.get(f"{API_URL}{chemin}", params=params, timeout=15)
    reponse.raise_for_status()  # lève une erreur si le code HTTP est 4xx/5xx
    return reponse.json()


@st.cache_data(ttl=600, show_spinner=False)
def charger_tout(slug: str) -> dict:
    """Récupère toutes les données du portfolio auprès de l'API.

    - Les appels partent EN PARALLÈLE (ThreadPoolExecutor) au lieu de l'un après
      l'autre : la page charge beaucoup plus vite, surtout avec des bases en ligne.
    - @st.cache_data garde le résultat 10 minutes : les rechargements suivants
      sont instantanés.
    """
    with ThreadPoolExecutor(max_workers=10) as pool:
        # Vague 1 : les 5 appels indépendants partent en même temps
        f_profil = pool.submit(recuperer, f"/api/candidats/{slug}")                          # R1 (MongoDB, embedding)
        f_stats = pool.submit(recuperer, f"/api/candidats/{slug}/stats")                     # R3 (MongoDB, agrégation)
        f_projets = pool.submit(recuperer, f"/api/candidats/{slug}/projets", {"page": 1, "size": 100})  # R2 (MongoDB)
        f_graphe = pool.submit(recuperer, f"/api/graph/competences/{slug}")                  # R5 (Neo4j)
        f_transversales = pool.submit(                                                       # R7 (Neo4j)
            recuperer, f"/api/graph/candidats/{slug}/competences-transversales", {"min_projets": 2}
        )
        profil, stats, graphe = f_profil.result(), f_stats.result(), f_graphe.result()
        projets = f_projets.result().get("items", [])
        transversales = f_transversales.result()

        # Vague 2 : ces appels dépendent de la vague 1, ils partent eux aussi tous en même temps
        # R2 avec ?competence=… : MongoDB renvoie les projets de chaque compétence (pour les filtres)
        f_par_comp = {
            c["skill_slug"]: pool.submit(
                recuperer, f"/api/candidats/{slug}/projets", {"competence": c["skill_slug"], "page": 1, "size": 100}
            )
            for c in stats.get("competences", [])
        }
        # R4 (Neo4j) : projets similaires de chacun de mes projets (encart « Ça te plaira aussi »)
        slugs_projets = [n["id"].split(":", 1)[1] for n in graphe.get("nodes", []) if n["type"] == "projet"]
        f_similaires = {s: pool.submit(recuperer, f"/api/graph/projets/{s}/similaires", {"limit": 5}) for s in slugs_projets}

        projets_par_competence = {c: [p["projet_slug"] for p in f.result().get("items", [])] for c, f in f_par_comp.items()}
        similaires = {s: f.result() for s, f in f_similaires.items()}

    return {
        "profil": profil,
        "stats": stats,
        "projets": projets,
        "projetsParCompetence": projets_par_competence,
        "graphe": graphe,
        "similaires": similaires,
        "transversales": transversales,
    }


# ── Récupération des données ────────────────────────────────────────────────

try:
    with st.spinner("Chargement de mon univers ✦"):
        donnees = charger_tout(CANDIDAT_SLUG)
except requests.RequestException as erreur:
    st.error(f"Impossible de joindre l'API ({API_URL}). Vérifiez que `just dev` tourne.\n\n{erreur}")
    st.stop()

# Mon avatar (image) est converti en texte base64 pour être intégré directement dans la page
donnees["avatar"] = ""
if AVATAR.exists():
    donnees["avatar"] = "data:image/png;base64," + base64.b64encode(AVATAR.read_bytes()).decode()

# ── Affichage : on injecte les données dans le gabarit HTML ─────────────────

# json.dumps transforme le dictionnaire Python en objet JavaScript.
# On remplace "</" pour qu'un texte contenant "</script>" ne casse pas la page.
donnees_js = json.dumps(donnees, ensure_ascii=False).replace("</", "<\\/")
page = GABARIT.read_text(encoding="utf-8").replace("__DATA__", donnees_js)

# st.iframe affiche la page dans un cadre de 1100 px de haut (on défile à l'intérieur).
# Sur les anciennes versions de Streamlit, on utilise components.html à la place.
if hasattr(st, "iframe"):
    st.iframe(page, height=1100)
else:
    components.html(page, height=1100, scrolling=True)
