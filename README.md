# 🎯 Hub Médias

> Dashboard personnel pour centraliser et visualiser vos statistiques de jeux vidéo, films, séries et activité GitHub.

[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Description

Hub Médias est un tableau de bord interactif qui agrège et affiche vos données personnelles de consommation de médias :

- **🎮 Jeux Vidéo** : Visualisez votre bibliothèque avec jaquettes IGDB, heures de jeu, et plateformes
- **🎬 Films** : Suivez vos films visionnés avec posters TMDb
- **📺 Séries** : Gardez une trace de vos séries avec métadonnées enrichies
- **💻 GitHub** : Consultez vos statistiques de développement (repos, langages, contributions)

Le projet récupère automatiquement vos données depuis **SerieBox** et les enrichit via les APIs **IGDB**, **TMDb** et **GitHub**.

---

## ✨ Fonctionnalités

### 🎮 Onglet Jeux
- Affichage en grille avec jaquettes haute résolution (IGDB)
- Statistiques : heures jouées, nombre de jeux, top jeu
- Filtres : heures minimum, plateforme, tri personnalisé
- Chargement ultra-rapide avec Next.js

### 💻 Onglet GitHub
- Profil utilisateur avec avatar et bio
- Métriques : repos publics, followers, gists, ancienneté
- Activité récente (30 derniers jours) : commits, PRs, issues
- Top 10 langages de programmation utilisés

### 🎬 Onglets Films & Séries
- Import automatique depuis SerieBox
- Enrichissement des métadonnées via TMDb
- Filtres et recherche intégrés

---

## 🏗️ Architecture

```
hub_data/
├── web/                    # Application Next.js
│   ├── app/               # Pages (App Router)
│   ├── components/        # Composants React
│   ├── lib/               # Utilitaires TypeScript
│   ├── data/              # Données JSON générées
│   ├── scripts/           # Script build-data.ts
│   └── .env               # Variables d'environnement (APIs)
├── data/seriebox/          # Données CSV sources (depuis SerieBox)
├── pipelines/              # Scripts Python pour récupérer les données
└── README.md
```

---

## 🚀 Installation

### Prérequis
- **Node.js 18+**
- **Python 3.11+** (pour les pipelines de données)

### Étapes

1. **Cloner le projet**
   ```bash
   git clone https://github.com/votre-username/hub_data.git
   cd hub_data
   ```

2. **Aller dans le dossier web et installer les dépendances**
   ```bash
   cd web
   npm install
   ```

3. **Configurer les variables d'environnement**
   
   Créez le fichier `web/.env` avec vos clés API :
   ```env
   # IGDB (jeux)
   IGDB_CLIENT_ID=votre_client_id
   IGDB_CLIENT_SECRET=votre_client_secret

   # TMDb (films/séries)
   TMDB_API_KEY=votre_api_key

   # GitHub
   GITHUB_TOKEN=votre_token
   GITHUB_USERNAME=votre_username
   ```

4. **Générer les données (toujours depuis le dossier web/)**
   ```bash
   npm run build:data
   ```

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

6. Ouvrir [http://localhost:3000](http://localhost:3000)

> **Note** : Toutes les commandes npm doivent être exécutées depuis le dossier `web/`

---

## 📜 Scripts

### Mise à jour complète des données

```bash
# Depuis la racine du projet
python pipelines/update-data.py
```

Ce script :
1. Télécharge les données depuis SerieBox (jeux, films, séries)
2. Récupère les images depuis IGDB et TMDB
3. Génère les fichiers JSON pour l'application

**Options :**
- `--skip-seriebox` ou `-s` : Skip le téléchargement SerieBox, utilise les CSV existants

### Commandes npm (depuis le dossier web/)

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build de production |
| `npm run build:data` | Génère les JSON avec images (IGDB/TMDB) |
| `npm run start` | Lance le serveur de production |

---

## 🔑 APIs Utilisées

### IGDB (Internet Game Database)
- Endpoint : `https://api.igdb.com/v4/`
- Usage : Récupération des jaquettes de jeux
- [Documentation](https://api-docs.igdb.com/)

### TMDb (The Movie Database)
- Endpoint : `https://api.themoviedb.org/3/`
- Usage : Posters et métadonnées films/séries
- [Documentation](https://developers.themoviedb.org/)

### GitHub REST API
- Endpoint : `https://api.github.com/`
- Usage : Statistiques et activité développeur
- [Documentation](https://docs.github.com/rest)

---

## 🛠️ Stack Technique

- **Frontend** : Next.js 14 (App Router), React 18, TypeScript
- **Styling** : Tailwind CSS, Lucide Icons
- **Data** : CSV → JSON build step
- **APIs** : IGDB, TMDb, GitHub

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [SerieBox](https://www.seriebox.com/) pour le suivi des médias
- [IGDB](https://www.igdb.com/) pour les données de jeux
- [TMDb](https://www.themoviedb.org/) pour les données de films/séries
- [Next.js](https://nextjs.org/) pour le framework React
