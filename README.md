# ⚔️ Infinity Story Game

> **Un jeu narratif infini où chaque choix forge ton destin.**

L'histoire est générée dynamiquement selon tes décisions — sans aucune API IA externe. Le moteur narratif repose sur des templates dynamiques, de la logique conditionnelle et de la randomisation.

---

## 🧠 Concept

- Tu crées ton personnage (nom + classe)
- Le jeu te plonge dans une situation narrative immersive
- Tu choisis parmi 3 options
- Tes stats évoluent en conséquence
- Une nouvelle situation est générée — **la boucle est infinie**

---

## 🎮 Classes

| Classe | Description |
|--------|-------------|
| 🗡️ **Aventurier** | Courageux et intrépide. Affronte chaque obstacle de face. |
| 🗝️ **Voleur** | Rusé et discret. Les ombres sont tes alliées. |
| 💰 **Marchand** | Diplomate et calculateur. L'or ouvre toutes les portes. |

---

## 📊 Stats du joueur

| Stat | Plage | Valeur initiale |
|------|-------|-----------------|
| Réputation | -100 → +100 | 0 |
| Argent | 0 → ∞ | 50 |
| Influence | 0 → 100 | 10 |

---

## 🏗️ Architecture

```
infinity-story-game/
├── backend/
│   ├── main.py                  # Point d'entrée FastAPI
│   ├── requirements.txt         # Dépendances Python
│   ├── database.py              # Init et helpers SQLite
│   ├── models.py                # Modèles Pydantic
│   ├── engine/
│   │   ├── narrative.py         # Moteur narratif (sélection, continuité)
│   │   ├── templates.py         # 30+ situations narratives
│   │   └── rules.py             # Règles de jeu et limites des stats
│   └── routers/
│       └── game.py              # Routes API
├── frontend/
│   ├── index.html               # Interface du jeu
│   ├── style.css                # Thème sombre fantasy
│   └── app.js                   # Logique frontend
├── render.yaml                  # Config déploiement Render
└── README.md
```

---

## 🚀 Lancer en local

### Prérequis

- Python 3.10+

### Installation

```bash
# Cloner le repo
git clone https://github.com/Laz0ne/infinity-story-game.git
cd infinity-story-game

# Créer un environnement virtuel (recommandé)
python -m venv venv
source venv/bin/activate  # Windows : venv\Scripts\activate

# Installer les dépendances
pip install -r backend/requirements.txt
```

### Démarrer le serveur

```bash
uvicorn backend.main:app --reload
```

Puis ouvre [http://localhost:8000](http://localhost:8000) dans ton navigateur.

---

## ☁️ Déployer sur Render

1. Crée un compte sur [render.com](https://render.com)
2. Connecte ton dépôt GitHub
3. Clique **New → Web Service** et sélectionne ce repo
4. Render détecte automatiquement le fichier `render.yaml`
5. Clique **Deploy** — c'est tout !

La variable d'environnement `DB_PATH` est configurée automatiquement dans `render.yaml`.

---

## 🔌 API

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/game/new` | Créer un personnage + première situation |
| `POST` | `/api/game/choice` | Envoyer un choix + recevoir la suite |
| `GET` | `/api/game/stats/{player_id}` | Récupérer les stats d'un joueur |

Documentation Swagger disponible sur `/docs`.

---

## 🗺️ Roadmap

### Phase 1 — MVP ✅
- [x] Moteur narratif basé sur templates (30+ situations)
- [x] 3 classes de personnages
- [x] Stats dynamiques (réputation, argent, influence)
- [x] Logique conditionnelle et anti-répétition
- [x] Effet typewriter et interface immersive
- [x] Déploiement Render

### Phase 2 — Enrichissement
- [ ] Plus de situations (50+) avec des arcs narratifs longs
- [ ] Système de relations avec des PNJ récurrents
- [ ] Fin de partie (mort, retraite, apothéose)
- [ ] Sauvegarde locale / reconnexion à une partie

### Phase 3 — Social & Monétisation
- [ ] Tableau des scores et histoires partagées
- [ ] Actions journalières limitées (modèle freemium)
- [ ] Mode multijoueur narratif asynchrone
- [ ] Factions, guerres et alliances

---

## 📜 Licence

MIT
