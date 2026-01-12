# HUB LIFE - Personal Data Dashboard

Un dashboard personnel cyberpunk pour visualiser et analyser toutes vos données : jeux, films, séries, livres, activités sportives, voyages, rencontres et plus encore.

## 🎮 Fonctionnalités

### 📊 Onglets Disponibles

- **Aperçu** - Vue d'ensemble de toutes vos statistiques
- **Insights** - Radar chart de votre profil d'activité et timeline unifiée
- **Jeux** - Collection de jeux avec statistiques par plateforme et genre
- **Films** - Bibliothèque de films avec filtres et notes
- **Séries** - Suivi de séries avec statuts de visionnage
- **Livres** - Bibliothèque de lecture avec notes et métadonnées
- **Rencontres** - Statistiques sociales (villes, nationalités, années)
- **GitHub** - Profil et contributions GitHub
- **Spotify** - Top artistes et statistiques d'écoute
- **Sport** - Activités Strava avec analyse d'entraînement avancée
- **Voyages** - Carte mondiale des pays visités et lieux fréquentés

### 🏃 Sport - Fonctionnalités détaillées

- **Filtres par activité** : Course à pied, Vélo, ou Global
- **Statistiques filtrées** : Distance, temps, dénivelé, nombre d'activités
- **Page de détail d'activité** : Carte du parcours, splits par km, profils d'altitude et fréquence cardiaque
- **Analyse d'entraînement (course à pied)** :
  - Comparaison hebdomadaire (cette semaine vs précédente vs moyenne 4 semaines)
  - Alertes de surcharge (règle des 10% : ne pas augmenter de plus de 10%/semaine)
  - Recommandations : objectif semaine, sortie longue max, projection mensuelle
- **Graphique annuel** : Évolution de la distance par année

### 🎨 Design

- **Style Cyberpunk** avec effets néon et animations
- **Thème sombre** optimisé pour la lecture
- **Interface responsive** adaptée mobile et desktop
- **Typographie monospace** pour un look terminal
- **Couleurs thématiques** par section

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation des dépendances

```bash
npm install
```

### Configuration

1. **Variables d'environnement** - Créez un fichier `.env.local` :

```env
# GitHub (optionnel)
GITHUB_TOKEN=votre_token_github

# Spotify (optionnel)
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
SPOTIFY_REFRESH_TOKEN=votre_refresh_token

# Steam (optionnel)
STEAM_API_KEY=votre_api_key
STEAM_ID=votre_steam_id

# Strava (optionnel)
STRAVA_CLIENT_ID=votre_client_id
STRAVA_CLIENT_SECRET=votre_client_secret
STRAVA_REFRESH_TOKEN=votre_refresh_token

# IGDB (pour les métadonnées de jeux)
IGDB_CLIENT_ID=votre_client_id
IGDB_CLIENT_SECRET=votre_client_secret
```

2. **Fichiers de données** - Placez vos fichiers dans le dossier `data/` :

```
data/
├── games.csv           # Liste de jeux
├── films.csv           # Liste de films
├── series.csv          # Liste de séries
├── books.xlsx          # Bibliothèque de livres (Excel)
├── partners.csv        # Données de rencontres
├── strava-tokens.json  # Tokens Strava (généré auto)
└── location-history/   # Historique Google Takeout
    └── *.json
```

### Formats des fichiers CSV/Excel

#### games.csv
```csv
title,platform,status,hoursPlayed,genres,rating,releaseYear
```

#### films.csv
```csv
title,titleVO,releaseYear,rating,avgRating,runtime,genres,watchStatus,dateAdded,dateWatched
```

#### series.csv
```csv
title,titleVF,status,rating,avgRating,episodesWatched,episodes,releaseYear,airingStatus,genres,watchStatus,dateAdded,dateCompleted
```

#### books.xlsx
Colonnes Excel : Titre VF, Titre VO, Auteur(s), Format, Lectorat, Genre 1, Genre 2, Editeur, Collection, Année, Nombre de pages, Langue, Note personnelle (/20), Moyenne (/20), Date de lecture, Date d'achat, Type de livre, ISBN

#### partners.csv
```csv
Prénom;Ville;Genre;Nationalité;Année;Pénétration;Année de naissance
```

## 🏃 Lancement

### Mode développement

```bash
cd web
npm run dev
```

L'application sera accessible sur `http://localhost:3001`

### Build production

```bash
cd web
npm run build
npm start
```

## 🔄 Mise à jour des données (Pipelines)

### Prérequis Python

```bash
pip install requests pandas python-dotenv browser-cookie3
```

### Mise à jour complète (Jeux, Films, Séries)

Le script principal télécharge les données depuis SerieBox et génère les fichiers JSON avec images :

```bash
cd pipelines
python update-data.py
```

Options :
- `--skip-seriebox` ou `-s` : Utiliser les données existantes sans re-télécharger depuis SerieBox

### Étapes détaillées

#### 1. Téléchargement depuis SerieBox

Le script télécharge automatiquement vos listes depuis SerieBox en utilisant les cookies de votre navigateur (Firefox ou Chrome). Assurez-vous d'être connecté à SerieBox dans votre navigateur.

```bash
python pipelines/seriesbox.py
```

Fichiers générés dans `data/seriebox/` :
- `shows.csv` - Séries
- `films_vus.csv` - Films
- `jeux.csv` - Jeux

#### 2. Génération des JSON avec images

Ce script récupère les images depuis IGDB (jeux) et TMDB (films/séries) :

```bash
cd web
npx tsx scripts/build-data.ts
```

Fichiers générés dans `web/data/` :
- `games.json` - Jeux avec covers IGDB
- `films.json` - Films avec posters TMDB
- `series.json` - Séries avec posters TMDB

#### 3. Enrichissement manuel des images (optionnel)

Si certaines images manquent, vous pouvez lancer les scripts d'enrichissement séparément :

```bash
# Images des jeux (IGDB)
python pipelines/image_game.py

# Images des films et séries (TMDB)
python pipelines/image_movies_series.py
```

### Variables d'environnement requises

Dans `web/.env` :

```env
# SerieBox (optionnel si vous utilisez les cookies navigateur)
SERIEBOX_USERNAME=votre_username
SERIEBOX_PASSWORD=votre_password

# IGDB (pour les covers de jeux)
IGDB_CLIENT_ID=votre_client_id
IGDB_CLIENT_SECRET=votre_client_secret

# TMDB (pour les posters films/séries)
TMDB_API_KEY=votre_api_key
```

### Workflow recommandé

1. Connectez-vous à SerieBox dans votre navigateur
2. Lancez `python pipelines/update-data.py`
3. Vérifiez les images manquantes et relancez les scripts d'enrichissement si nécessaire

## 📁 Structure du projet

```
hub_data/
├── pipelines/                 # Scripts de mise à jour des données
│   ├── update-data.py        # Script principal de mise à jour
│   ├── seriesbox.py          # Téléchargement depuis SerieBox
│   ├── image_game.py         # Enrichissement images IGDB
│   └── image_movies_series.py # Enrichissement images TMDB
├── data/                      # Données brutes (gitignored)
│   ├── seriebox/             # CSV téléchargés depuis SerieBox
│   └── seriebox_cleaned/     # CSV nettoyés
└── web/                       # Application Next.js
    ├── app/                   # Pages Next.js (App Router)
    │   ├── page.tsx          # Page d'aperçu
    │   ├── games/            # Page Jeux
    │   ├── films/            # Page Films
    │   ├── series/           # Page Séries
    │   ├── books/            # Page Livres
    │   ├── rencontres/       # Page Rencontres
    │   ├── insights/         # Page Insights
    │   ├── voyages/          # Page Voyages
    │   ├── sport/            # Page Sport
    │   │   ├── page.tsx      # Liste des activités + analyse
    │   │   └── activity/[id] # Détail d'une activité
    │   ├── github/           # Page GitHub
    │   ├── spotify/          # Page Spotify
    │   └── api/              # API Routes
    │       ├── strava/       # API Strava
    │       │   ├── route.ts  # Liste des activités
    │       │   └── activity/[id] # Détail d'une activité
    │       └── ...
    ├── components/           # Composants React réutilisables
    ├── scripts/              # Scripts de build
    │   └── build-data.ts     # Génération JSON avec images
    ├── lib/                  # Utilitaires et types
    ├── data/                 # JSON générés (gitignored)
    │   ├── games.json
    │   ├── films.json
    │   └── series.json
    └── public/               # Fichiers statiques
```

## 🎯 APIs Utilisées

- **IGDB** - Métadonnées de jeux vidéo
- **GitHub API** - Profil et contributions
- **Spotify API** - Statistiques d'écoute
- **Strava API** - Activités sportives
- **Steam API** - Bibliothèque et temps de jeu
- **Nominatim** - Géocodage pour les voyages

## 🔧 Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling avec thème cyberpunk personnalisé
- **Recharts** - Graphiques (radar, bar charts)
- **react-simple-maps** - Cartes géographiques
- **xlsx** - Lecture de fichiers Excel
- **Lucide Icons** - Icônes

## 📝 Notes

- Les données personnelles sont stockées localement dans le dossier `data/`
- Les fichiers sensibles sont listés dans `.gitignore`
- Les tokens API sont générés automatiquement lors de l'authentification
- Le geocoding des lieux est mis en cache pour optimiser les performances

## 🎨 Personnalisation

### Couleurs des onglets

Chaque onglet a sa propre couleur thématique définie dans `components/navigation.tsx` :

- Aperçu : cyan
- Insights : magenta
- Jeux : green
- Films : magenta
- Séries : yellow
- Livres : blue
- Rencontres : red
- GitHub : cyan
- Spotify : green
- Sport : orange
- Voyages : purple

### Thème

Le thème cyberpunk est défini dans `tailwind.config.js` avec des couleurs néon personnalisées.

## 📄 Licence

Usage personnel uniquement.
