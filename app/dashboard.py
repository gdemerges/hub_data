"""
Dashboard de visualisation des médias (jeux, films, séries).
Utilise Streamlit pour afficher les jaquettes avec statistiques.

Lancer avec : streamlit run app/dashboard.py
"""

import os
import pandas as pd
import streamlit as st
import requests
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

# Chemins
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CLEAN_DIR = os.path.join(BASE_DIR, "data", "seriebox_cleaned")
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)

# --- Configuration Streamlit ---
st.set_page_config(
    page_title="Hub Médias",
    page_icon="🎮",
    layout="wide"
)

# --- Chargement CSS ---
def load_css(file_name):
    with open(file_name) as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

css_path = os.path.join(os.path.dirname(__file__), 'style.css')
load_css(css_path)


# --- Cache pour les appels API IGDB ---
@st.cache_data(ttl=86400)  # Cache 24h
def get_igdb_token() -> str | None:
    """Récupère un token OAuth2 pour IGDB."""
    client_id = os.getenv("IGDB_CLIENT_ID")
    client_secret = os.getenv("IGDB_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None
    try:
        resp = requests.post(
            "https://id.twitch.tv/oauth2/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "client_credentials"
            },
            timeout=10
        )
        if resp.status_code == 200:
            return resp.json().get("access_token")
    except Exception:
        pass
    return None


@st.cache_data(ttl=86400)
def search_game_cover(title: str, _token: str, client_id: str) -> str | None:
    """Recherche la jaquette d'un jeu via IGDB."""
    if not _token or not client_id:
        return None
    headers = {
        "Client-ID": client_id,
        "Authorization": f"Bearer {_token}"
    }
    try:
        # Recherche du jeu
        resp = requests.post(
            "https://api.igdb.com/v4/games",
            headers=headers,
            data=f'search "{title}"; fields name,cover; limit 1;',
            timeout=10
        )
        if resp.status_code != 200 or not resp.json():
            return None
        game = resp.json()[0]
        cover_id = game.get("cover")
        if not cover_id:
            return None
        # Récupération de l'URL du cover
        resp2 = requests.post(
            "https://api.igdb.com/v4/covers",
            headers=headers,
            data=f"where id = {cover_id}; fields image_id;",
            timeout=10
        )
        if resp2.status_code != 200 or not resp2.json():
            return None
        image_id = resp2.json()[0].get("image_id")
        if not image_id:
            return None
        return f"https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg"
    except Exception:
        return None


@st.cache_data(ttl=86400, show_spinner=False)
def batch_fetch_covers(titles: tuple[str, ...], _token: str, client_id: str) -> dict[str, str | None]:
    """Récupère les jaquettes pour plusieurs jeux en parallèle (batch).
    
    Utilise le multithreading pour accélérer les requêtes IGDB.
    Le résultat est mis en cache 24h par Streamlit.
    """
    if not _token or not client_id:
        return {}
    
    results = {}
    
    def fetch_single(title: str) -> tuple[str, str | None]:
        cover = search_game_cover(title, _token, client_id)
        return (title, cover)
    
    # Parallélisation avec max 10 workers pour ne pas surcharger l'API
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_single, t): t for t in titles}
        for future in as_completed(futures):
            try:
                title, cover = future.result()
                results[title] = cover
            except Exception:
                results[futures[future]] = None
    
    return results


def load_games_data() -> pd.DataFrame:
    """Charge et prépare les données des jeux."""
    csv_path = os.path.join(CLEAN_DIR, "jeux_clean.csv")
    if not os.path.exists(csv_path):
        return pd.DataFrame()
    
    df = pd.read_csv(csv_path, sep=";", dtype=str)
    df.columns = [c.strip() for c in df.columns]
    
    # Conversion heures en numérique
    if "Heures de jeu" in df.columns:
        df["Heures de jeu"] = pd.to_numeric(df["Heures de jeu"], errors="coerce").fillna(0).astype(int)
    else:
        df["Heures de jeu"] = 0
    
    # Agrégation par titre (somme des heures si plusieurs entrées)
    df_agg = df.groupby("Titre", as_index=False).agg({
        "Support": lambda x: ", ".join(sorted(set(str(s) for s in x if pd.notna(s)))),
        "Heures de jeu": "sum"
    })
    
    return df_agg.sort_values("Heures de jeu", ascending=False)


def render_game_card(title: str, hours: int, support: str, cover_url: str | None):
    """Affiche une carte de jeu avec jaquette et stats."""
    with st.container():
        st.markdown('<div class="game-card">', unsafe_allow_html=True)
        
        if cover_url:
            st.markdown(f'<img src="{cover_url}" class="game-cover">', unsafe_allow_html=True)
        else:
            st.markdown(
                f"""<div class="placeholder-cover">
                    <div>🎮<br>{title[:25]}{'...' if len(title) > 25 else ''}</div>
                </div>""",
                unsafe_allow_html=True
            )
            
        st.markdown(f"**{title}**")
        st.markdown(f'<div class="hours-badge">⏱️ {hours}h</div>', unsafe_allow_html=True)
        st.caption(f"📀 {support}")
        st.markdown('</div>', unsafe_allow_html=True)


def page_jeux():
    """Page des jeux vidéo."""
    st.header("🎮 Mes Jeux Vidéo")
    
    df = load_games_data()
    if df.empty:
        st.warning("Aucune donnée de jeux trouvée. Exécutez d'abord :")
        st.code("python -m pipelines.seriesbox", language="bash")
        return
    
    # Stats globales
    total_hours = df["Heures de jeu"].sum()
    total_games = len(df)
    games_played = len(df[df["Heures de jeu"] > 0])
    top_game = df.iloc[0]["Titre"] if not df.empty else "-"
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("🎯 Total Jeux", total_games)
    col2.metric("🕹️ Jeux joués", games_played)
    col3.metric("⏱️ Heures totales", f"{total_hours}h")
    col4.metric("🏆 Top jeu", top_game[:20])
    
    st.divider()
    
    # Filtres
    col_filter1, col_filter2, col_filter3 = st.columns(3)
    with col_filter1:
        min_hours = st.slider("Heures minimum", 0, max(1, int(df["Heures de jeu"].max())), 0)
    with col_filter2:
        all_supports = set()
        for supports in df["Support"]:
            if pd.notna(supports):
                for s in str(supports).split(","):
                    all_supports.add(s.strip())
        supports_list = ["Tous"] + sorted(all_supports)
        selected_support = st.selectbox("Plateforme", supports_list)
    with col_filter3:
        sort_order = st.selectbox("Tri", ["Heures (décroissant)", "Heures (croissant)", "Alphabétique"])
    
    # Filtrage
    df_filtered = df[df["Heures de jeu"] >= min_hours].copy()
    if selected_support != "Tous":
        df_filtered = df_filtered[df_filtered["Support"].str.contains(selected_support, na=False)]
    
    # Tri
    if sort_order == "Heures (croissant)":
        df_filtered = df_filtered.sort_values("Heures de jeu", ascending=True)
    elif sort_order == "Alphabétique":
        df_filtered = df_filtered.sort_values("Titre", ascending=True)
    
    st.subheader(f"📊 {len(df_filtered)} jeux affichés")
    
    # Récupération du token IGDB
    token = get_igdb_token()
    client_id = os.getenv("IGDB_CLIENT_ID", "")
    
    if not token:
        st.info("💡 Pour afficher les jaquettes, ajoutez `IGDB_CLIENT_ID` et `IGDB_CLIENT_SECRET` dans le fichier `.env`")
    
    # Pré-chargement de toutes les jaquettes en batch (parallèle + cache)
    covers_map = {}
    if token:
        titles_to_fetch = tuple(
            game["Titre"] for _, game in df_filtered.iterrows() 
            if game["Heures de jeu"] > 0
        )
        if titles_to_fetch:
            with st.spinner(f"⏳ Chargement des jaquettes ({len(titles_to_fetch)} jeux)..."):
                covers_map = batch_fetch_covers(titles_to_fetch, token, client_id)
    
    # Affichage en grille
    cols_per_row = 5
    rows = [df_filtered.iloc[i:i+cols_per_row] for i in range(0, len(df_filtered), cols_per_row)]
    
    for row_df in rows:
        cols = st.columns(cols_per_row)
        for idx, (_, game) in enumerate(row_df.iterrows()):
            with cols[idx]:
                # Récupération de la jaquette depuis le cache batch
                cover_url = covers_map.get(game["Titre"])
                
                render_game_card(
                    title=game["Titre"],
                    hours=game["Heures de jeu"],
                    support=game["Support"],
                    cover_url=cover_url
                )


def page_films():
    """Page des films (placeholder pour plus tard)."""
    st.header("🎬 Mes Films")
    st.info("🚧 Cette section sera détaillée plus tard.")
    
    csv_path = os.path.join(CLEAN_DIR, "films_vus_clean.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path, sep=";", dtype=str)
        st.metric("Nombre de films vus", len(df))
        if not df.empty:
            st.dataframe(df, use_container_width=True)
    else:
        st.warning("Fichier films introuvable. Exécutez d'abord `python -m pipelines.seriesbox`.")


def page_series():
    """Page des séries (placeholder pour plus tard)."""
    st.header("📺 Mes Séries")
    st.info("🚧 Cette section sera détaillée plus tard.")
    
    csv_path = os.path.join(CLEAN_DIR, "shows_clean.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path, sep=";", dtype=str)
        st.metric("Nombre de séries", len(df))
        if not df.empty:
            st.dataframe(df, use_container_width=True)
    else:
        st.warning("Fichier séries introuvable. Exécutez d'abord `python -m pipelines.seriesbox`.")


# --- GitHub API Functions ---
@st.cache_data(ttl=3600, show_spinner=False)  # Cache 1h
def get_github_user_stats(username: str, token: str | None = None) -> dict | None:
    """Récupère les statistiques globales d'un utilisateur GitHub."""
    headers = {}
    if token:
        headers["Authorization"] = f"token {token}"
    
    try:
        resp = requests.get(f"https://api.github.com/users/{username}", headers=headers, timeout=10)
        if resp.status_code != 200:
            return None
        return resp.json()
    except Exception:
        return None


@st.cache_data(ttl=3600, show_spinner=False)
def get_github_repos(username: str, token: str | None = None) -> list[dict]:
    """Récupère tous les repos publics d'un utilisateur GitHub."""
    headers = {}
    if token:
        headers["Authorization"] = f"token {token}"
    
    repos = []
    page = 1
    try:
        while True:
            resp = requests.get(
                f"https://api.github.com/users/{username}/repos",
                headers=headers,
                params={"per_page": 100, "page": page, "sort": "updated"},
                timeout=10
            )
            if resp.status_code != 200:
                break
            data = resp.json()
            if not data:
                break
            repos.extend(data)
            page += 1
            if len(data) < 100:
                break
    except Exception:
        pass
    return repos


@st.cache_data(ttl=3600, show_spinner=False)
def get_github_languages(repos: tuple) -> dict[str, int]:
    """Agrège les langages utilisés dans les repos."""
    languages = {}
    for repo in repos:
        if repo.get("language"):
            lang = repo["language"]
            languages[lang] = languages.get(lang, 0) + 1
    return languages


@st.cache_data(ttl=3600, show_spinner=False)
def get_recent_activity(username: str, token: str | None = None, days: int = 30) -> dict:
    """Récupère l'activité récente (commits, PRs, issues)."""
    headers = {}
    if token:
        headers["Authorization"] = f"token {token}"
    
    since = (datetime.now() - timedelta(days=days)).isoformat()
    
    try:
        # Events récents
        resp = requests.get(
            f"https://api.github.com/users/{username}/events",
            headers=headers,
            params={"per_page": 100},
            timeout=10
        )
        if resp.status_code != 200:
            return {"commits": 0, "prs": 0, "issues": 0}
        
        events = resp.json()
        commits = sum(1 for e in events if e.get("type") == "PushEvent")
        prs = sum(1 for e in events if e.get("type") == "PullRequestEvent")
        issues = sum(1 for e in events if e.get("type") == "IssuesEvent")
        
        return {"commits": commits, "prs": prs, "issues": issues}
    except Exception:
        return {"commits": 0, "prs": 0, "issues": 0}


def page_github():
    """Page des statistiques GitHub."""
    st.header("💻 GitHub Stats")
    
    # Configuration
    github_username = os.getenv("GITHUB_USERNAME")
    github_token = os.getenv("GITHUB_TOKEN")  # Optionnel, augmente rate limit
    
    if not github_username:
        st.warning("⚠️ Ajoutez `GITHUB_USERNAME` dans le fichier `.env` pour afficher vos stats GitHub.")
        st.code('GITHUB_USERNAME=votre_username', language="bash")
        return
    
    with st.spinner("⏳ Chargement des données GitHub..."):
        user_stats = get_github_user_stats(github_username, github_token)
        repos = get_github_repos(github_username, github_token)
        activity = get_recent_activity(github_username, github_token, days=30)
    
    if not user_stats:
        st.error(f"❌ Impossible de récupérer les données pour l'utilisateur `{github_username}`.")
        return
    
    # Header avec avatar
    col_avatar, col_info = st.columns([1, 3])
    with col_avatar:
        st.image(user_stats.get("avatar_url", ""), width=150)
    with col_info:
        st.subheader(user_stats.get("name", github_username))
        st.caption(f"@{github_username}")
        if user_stats.get("bio"):
            st.markdown(f"*{user_stats['bio']}*")
        if user_stats.get("location"):
            st.caption(f"📍 {user_stats['location']}")
    
    st.divider()
    
    # Métriques principales
    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("📦 Repos publics", user_stats.get("public_repos", 0))
    col2.metric("👥 Followers", user_stats.get("followers", 0))
    col3.metric("👤 Following", user_stats.get("following", 0))
    col4.metric("⭐ Gists", user_stats.get("public_gists", 0))
    
    created_at = datetime.strptime(user_stats["created_at"], "%Y-%m-%dT%H:%M:%SZ")
    years = (datetime.now() - created_at).days // 365
    col5.metric("📅 Compte créé", f"{years} ans")
    
    st.divider()
    
    # Activité récente (30 derniers jours)
    st.subheader("📊 Activité récente (30 jours)")
    col_act1, col_act2, col_act3 = st.columns(3)
    col_act1.metric("🔄 Push events", activity["commits"])
    col_act2.metric("🔀 Pull Requests", activity["prs"])
    col_act3.metric("📝 Issues", activity["issues"])
    
    st.divider()
    
    # Langages
    if repos:
        st.subheader("🔤 Langages utilisés")
        languages = get_github_languages(tuple(repos))
        if languages:
            # Tri par nombre de repos
            sorted_langs = sorted(languages.items(), key=lambda x: x[1], reverse=True)[:10]
            
            cols_lang = st.columns(5)
            for idx, (lang, count) in enumerate(sorted_langs):
                with cols_lang[idx % 5]:
                    st.metric(lang, f"{count} repos")
        
        st.divider()
        
        # Contributions (Graphique)
        st.subheader("📅 Contributions (Année écoulée)")
        st.markdown(f"""
        <div style="background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; text-align: center;">
            <img src="https://ghchart.rshah.io/58a6ff/{github_username}" alt="Graphique de contributions" style="width: 100%; max-width: 800px;">
        </div>
        """, unsafe_allow_html=True)
    
    # Info rate limit
    if not github_token:
        st.info("💡 Ajoutez `GITHUB_TOKEN` dans `.env` pour augmenter la limite de requêtes API.")


# --- Navigation ---
st.sidebar.title("🎯 Hub Médias")
st.sidebar.markdown("---")

page = st.sidebar.radio(
    "Navigation",
    ["🎮 Jeux", "🎬 Films", "📺 Séries", "💻 GitHub"],
    label_visibility="collapsed"
)

# Routing
if page == "🎮 Jeux":
    page_jeux()
elif page == "🎬 Films":
    page_films()
elif page == "📺 Séries":
    page_series()
else:
    page_github()

# Footer
st.sidebar.markdown("---")
st.sidebar.caption("📊 Données: SerieBox")
st.sidebar.caption("🖼️ Images: IGDB / TMDb")
