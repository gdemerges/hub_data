# 🎯 Hub Médias

> Dashboard personnel pour centraliser et visualiser vos statistiques de jeux vidéo, films, séries et activité GitHub.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-red.svg)](https://streamlit.io/)
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
- Chargement optimisé avec cache et multithreading

### 💻 Onglet GitHub
- Profil utilisateur avec avatar et bio
- Métriques : repos publics, followers, gists, ancienneté
- Activité récente (30 derniers jours) : commits, PRs, issues
- Top 10 langages de programmation utilisés
- Graphique de contributions annuel

### 🎬 🎬 Onglets Films & Séries
- Import automatique depuis SerieBox
- Enrichissement des métadonnées via TMDb
- *(Visualisation avancée à venir)*

---

## 🚀 Installation

### Prérequis
- **Python 3.11+**
- **Compte SerieBox** (pour les données de médias)
- **Clés API** (optionnelles mais recommandées) :
  - [IGDB](https://api.igdb.com/) (Twitch Developer)
  - [TMDb](https://www.themoviedb.org/settings/api)
  - [GitHub Personal Access Token](https://github.com/settings/tokens)

### Étapes

1. **Cloner le repository**
   ```bash
   git clone https://github.com/gdemerges/hub_data.git
   cd hub_data
   ```

2. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurer les variables d'environnement**
   
   Créez un fichier `.env` à la racine du projet :
   ```env
   # IGDB (jaquettes de jeux)
   IGDB_CLIENT_ID=votre_client_id
   IGDB_CLIENT_SECRET=votre_client_secret
   
   # TMDb (posters films/séries)
   TMDB_API_KEY=votre_api_key
   
   # GitHub (statistiques)
   GITHUB_USERNAME=votre_username
   GITHUB_TOKEN=votre_token_optionnel
   
   # SerieBox (authentification)
   SERIEBOX_EMAIL=votre_email
   SERIEBOX_PASSWORD=votre_mot_de_passe
   ```

4. **Récupérer vos données SerieBox**
   ```bash
   python -m pipelines.seriesbox
   ```

5. **Enrichir avec les images (optionnel)**
   ```bash
   python -m pipelines.image_movies_series
   ```

6. **Lancer le dashboard**
   ```bash
   streamlit run app/dashboard.py
   ```

Le dashboard sera accessible sur **http://localhost:8501**

---

## 📁 Structure du projet

```
hub_data/
├── app/
│   ├── dashboard.py         # Application Streamlit principale
│   └── style.css            # Thème visuel (dark mode)
├── pipelines/
│   ├── seriesbox.py         # Scraping SerieBox + nettoyage
│   ├── clean_seriesbox.py   # Nettoyage des CSVs exportés
│   └── image_movies_series.py  # Enrichissement TMDb
├── data/
│   ├── seriebox/            # Exports bruts CSV
│   └── seriebox_cleaned/    # Données nettoyées
├── .env                     # Configuration (à créer)
├── requirements.txt
└── README.md
```

---

## 🛠️ Technologies utilisées

| Domaine | Technologies |
|---------|-------------|
| **Backend** | Python 3.11, Pandas |
| **Frontend** | Streamlit |
| **APIs** | IGDB (IGDB.com), TMDb, GitHub REST API |
| **Web Scraping** | Requests, browser_cookie3 |
| **Concurrence** | ThreadPoolExecutor |
| **Styling** | CSS personnalisé (dark theme) |

---

## 📊 Captures d'écran

### Onglet Jeux
![Jeux](https://via.placeholder.com/800x400?text=Grid+View+with+Game+Covers)

### Onglet GitHub
![GitHub](https://via.placeholder.com/800x400?text=GitHub+Stats+Dashboard)

---

## 🔧 Configuration avancée

### Optimisation des performances
- Les jaquettes IGDB sont **cachées 24h** via `@st.cache_data`
- Récupération parallèle des covers (max 10 workers simultanés)
- Les données GitHub sont rafraîchies toutes les heures

### Personnalisation du thème
Modifiez `app/style.css` pour adapter les couleurs, animations, ou typographie.

---

## 🗺️ Roadmap

- [x] Import automatique SerieBox
- [x] Dashboard Streamlit avec jeux
- [x] Intégration GitHub
- [x] Thème dark moderne
- [ ] Visualisation avancée Films/Séries
- [ ] Export PDF des statistiques
- [ ] Graphiques interactifs (Plotly)
- [ ] Support multi-utilisateurs
- [ ] Déploiement cloud (Streamlit Cloud)

---

## 🤝 Contribution

Ce projet est personnel, mais les suggestions sont les bienvenues ! N'hésitez pas à ouvrir une **issue** ou une **pull request**.

---

## 📄 License

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👤 Auteur

**Guillaume Demerges**  
- GitHub: [@gdemerges](https://github.com/gdemerges)

---

## 🙏 Remerciements

- [IGDB](https://www.igdb.com/) pour l'API de jaquettes de jeux
- [TMDb](https://www.themoviedb.org/) pour les métadonnées de films/séries
- [SerieBox](https://www.seriebox.com/) pour le tracking de médias
- [Streamlit](https://streamlit.io/) pour le framework de dashboard
