"""Point d'entrée pour Vercel.

Vercel cherche une instance ``app`` dans ``main.py`` / ``app.py`` / ``index.py``
à la racine du Root Directory (ici ``backend/``), ou dans ``src/`` / ``app/``.
Notre application vit dans ``src/portfolio_api/main.py`` (layout src + package),
que Vercel ne détecte pas automatiquement. Ce fichier ajoute ``src/`` au
``sys.path`` puis ré-exporte l'app FastAPI pour que Vercel la trouve.

En local on continue d'utiliser ``portfolio_api.main:app`` via ``just dev`` ;
ce shim ne sert qu'au déploiement serverless.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from portfolio_api.main import app  # noqa: E402, F401
