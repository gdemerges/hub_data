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
- **Sport** - Activités Strava avec calendrier et statistiques
- **Voyages** - Carte mondiale des pays visités et lieux fréquentés

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
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### Build production

```bash
npm run build
npm start
```

## 📁 Structure du projet

```
web/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx           # Page d'aperçu
│   ├── games/             # Page Jeux
│   ├── films/             # Page Films
│   ├── series/            # Page Séries
│   ├── books/             # Page Livres
│   ├── rencontres/        # Page Rencontres
│   ├── insights/          # Page Insights
│   ├── voyages/           # Page Voyages
│   ├── sport/             # Page Sport
│   ├── github/            # Page GitHub
│   ├── spotify/           # Page Spotify
│   └── api/               # API Routes
│       ├── books/
│       ├── games/
│       ├── films/
│       ├── series/
│       ├── rencontres/
│       ├── voyages/
│       ├── strava/
│       ├── github/
│       └── spotify/
├── components/            # Composants React réutilisables
│   ├── navigation.tsx    # Barre de navigation
│   ├── stat-card.tsx     # Cartes de statistiques
│   ├── pie-chart.tsx     # Graphiques circulaires
│   ├── world-map.tsx     # Carte mondiale
│   └── ...
├── lib/                   # Utilitaires et types
│   ├── types.ts          # Types TypeScript
│   ├── data.ts           # Fonctions de chargement de données
│   └── utils.ts          # Fonctions utilitaires
├── data/                  # Fichiers de données (gitignored)
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
