"""
Hub Médias - Dashboard moderne de visualisation des médias.
Design minimaliste inspiré de Notion/Linear.

"""

import os
import pandas as pd
import streamlit as st
import requests
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

# --- Chemins ---
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CLEAN_DIR = os.path.join(BASE_DIR, "data", "seriebox_cleaned")
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)

# --- Configuration Streamlit ---
st.set_page_config(
    page_title="Hub Médias",
    page_icon="◉",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# --- Chargement CSS ---
def load_css():
    css_path = os.path.join(os.path.dirname(__file__), 'style.css')
    if os.path.exists(css_path):
        with open(css_path) as f:
            st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

load_css()


# ============================================================================
# API FUNCTIONS - IGDB
# ============================================================================

@st.cache_data(ttl=86400)
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
    headers = {"Client-ID": client_id, "Authorization": f"Bearer {_token}"}
    try:
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
    """Récupère les jaquettes pour plusieurs jeux en parallèle."""
    if not _token or not client_id:
        return {}
    results = {}
    def fetch_single(title: str) -> tuple[str, str | None]:
        return (title, search_game_cover(title, _token, client_id))
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_single, t): t for t in titles}
        for future in as_completed(futures):
            try:
                title, cover = future.result()
                results[title] = cover
            except Exception:
                results[futures[future]] = None
    return results


# ============================================================================
# API FUNCTIONS - GitHub
# ============================================================================

@st.cache_data(ttl=3600, show_spinner=False)
def get_github_user_stats(username: str, token: str | None = None) -> dict | None:
    """Récupère les statistiques d'un utilisateur GitHub."""
    headers = {"Authorization": f"token {token}"} if token else {}
    try:
        resp = requests.get(f"https://api.github.com/users/{username}", headers=headers, timeout=10)
        return resp.json() if resp.status_code == 200 else None
    except Exception:
        return None


@st.cache_data(ttl=3600, show_spinner=False)
def get_github_repos(username: str, token: str | None = None) -> list[dict]:
    """Récupère tous les repos publics d'un utilisateur."""
    headers = {"Authorization": f"token {token}"} if token else {}
    repos = []
    page = 1
    try:
        while True:
            resp = requests.get(
                f"https://api.github.com/users/{username}/repos",
                headers=headers,
                params={"per_page": 100, "page": page, "sort": "pushed"},
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
    return dict(sorted(languages.items(), key=lambda x: x[1], reverse=True))


# ============================================================================
# DATA LOADERS
# ============================================================================

@st.cache_data(ttl=3600)
def load_games_data() -> pd.DataFrame:
    """Charge les données des jeux."""
    csv_path = os.path.join(CLEAN_DIR, "jeux_clean.csv")
    if not os.path.exists(csv_path):
        return pd.DataFrame()
    df = pd.read_csv(csv_path, sep=";", dtype=str)
    df.columns = [c.strip() for c in df.columns]
    if "Heures de jeu" in df.columns:
        df["Heures de jeu"] = pd.to_numeric(df["Heures de jeu"], errors="coerce").fillna(0).astype(int)
    else:
        df["Heures de jeu"] = 0
    df_agg = df.groupby("Titre", as_index=False).agg({
        "Support": lambda x: ", ".join(sorted(set(str(s) for s in x if pd.notna(s)))),
        "Heures de jeu": "sum"
    })
    return df_agg.sort_values("Heures de jeu", ascending=False)


@st.cache_data(ttl=3600)
def load_films_data() -> pd.DataFrame:
    """Charge les données des films."""
    csv_path = os.path.join(CLEAN_DIR, "films_vus_clean.csv")
    if not os.path.exists(csv_path):
        return pd.DataFrame()
    df = pd.read_csv(csv_path, sep=";", dtype=str)
    df.columns = [c.strip() for c in df.columns]
    return df


@st.cache_data(ttl=3600)
def load_series_data() -> pd.DataFrame:
    """Charge les données des séries."""
    csv_path = os.path.join(CLEAN_DIR, "shows_clean.csv")
    if not os.path.exists(csv_path):
        return pd.DataFrame()
    df = pd.read_csv(csv_path, sep=";", dtype=str)
    df.columns = [c.strip() for c in df.columns]
    return df


# ============================================================================
# UI COMPONENTS
# ============================================================================

def render_header():
    """Affiche le header principal."""
    st.markdown("""
    <div class="main-header">
        <h1>◉ Hub Médias</h1>
        <p class="header-subtitle">Tableau de bord personnel</p>
    </div>
    """, unsafe_allow_html=True)


def render_nav():
    """Navigation horizontale moderne."""
    if 'current_page' not in st.session_state:
        st.session_state.current_page = "overview"
    
    col1, col2, col3, col4, col5 = st.columns([1, 1, 1, 1, 1])
    
    with col1:
        if st.button("◉ Aperçu", use_container_width=True, 
                     type="primary" if st.session_state.current_page == "overview" else "secondary"):
            st.session_state.current_page = "overview"
            st.rerun()
    with col2:
        if st.button("🎮 Jeux", use_container_width=True,
                     type="primary" if st.session_state.current_page == "games" else "secondary"):
            st.session_state.current_page = "games"
            st.rerun()
    with col3:
        if st.button("🎬 Films", use_container_width=True,
                     type="primary" if st.session_state.current_page == "films" else "secondary"):
            st.session_state.current_page = "films"
            st.rerun()
    with col4:
        if st.button("📺 Séries", use_container_width=True,
                     type="primary" if st.session_state.current_page == "series" else "secondary"):
            st.session_state.current_page = "series"
            st.rerun()
    with col5:
        if st.button("⌘ GitHub", use_container_width=True,
                     type="primary" if st.session_state.current_page == "github" else "secondary"):
            st.session_state.current_page = "github"
            st.rerun()
    
    st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)


def stat_card(label: str, value: str | int, icon: str = ""):
    """Carte de statistique minimaliste."""
    return f"""
    <div class="stat-card">
        <div class="stat-icon">{icon}</div>
        <div class="stat-value">{value}</div>
        <div class="stat-label">{label}</div>
    </div>
    """


def media_card(title: str, image_url: str | None, subtitle: str = "", badge: str = ""):
    """Carte média avec image et hover effect."""
    placeholder = f"""
    <div class="media-placeholder">
        <span>{title[:2].upper()}</span>
    </div>
    """
    image_html = f'<img src="{image_url}" alt="{title}" loading="lazy">' if image_url else placeholder
    badge_html = f'<div class="media-badge">{badge}</div>' if badge else ''
    subtitle_html = f'<div class="media-subtitle">{subtitle}</div>' if subtitle else ''
    
    return f"""
    <div class="media-card">
        <div class="media-image">
            {image_html}
            {badge_html}
        </div>
        <div class="media-info">
            <div class="media-title">{title}</div>
            {subtitle_html}
        </div>
    </div>
    """


# ============================================================================
# PAGES
# ============================================================================

def page_overview():
    """Page vue d'ensemble avec résumé de toutes les stats."""
    df_games = load_games_data()
    df_films = load_films_data()
    df_series = load_series_data()
    
    # Stats globales
    total_games = len(df_games)
    total_films = len(df_films)
    total_series = len(df_series)
    total_hours = df_games["Heures de jeu"].sum() if not df_games.empty else 0
    
    st.markdown("### 📊 Aperçu global")
    st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)
    
    # Cartes de stats
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(stat_card("Jeux", total_games, "🎮"), unsafe_allow_html=True)
    with col2:
        st.markdown(stat_card("Films", total_films, "🎬"), unsafe_allow_html=True)
    with col3:
        st.markdown(stat_card("Séries", total_series, "📺"), unsafe_allow_html=True)
    with col4:
        st.markdown(stat_card("Heures jouées", f"{total_hours:,}h", "⏱️"), unsafe_allow_html=True)
    
    st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)
    
    # Sections récentes
    col_left, col_right = st.columns(2)
    
    with col_left:
        st.markdown("#### 🎮 Top Jeux")
        st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)
        if not df_games.empty:
            top_games = df_games.head(5)
            for _, game in top_games.iterrows():
                hours = game["Heures de jeu"]
                st.markdown(f"""
                <div class="list-item">
                    <span class="list-title">{game['Titre']}</span>
                    <span class="list-meta">{hours}h</span>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("Aucun jeu enregistré")
    
    with col_right:
        st.markdown("#### 🎬 Films récents")
        st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)
        if not df_films.empty:
            recent_films = df_films.head(5)
            for _, film in recent_films.iterrows():
                st.markdown(f"""
                <div class="list-item">
                    <span class="list-title">{film['Titre']}</span>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("Aucun film enregistré")
    
    st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)
    
    # GitHub quick stats
    github_username = os.getenv("GITHUB_USERNAME")
    if github_username:
        st.markdown("#### ⌘ GitHub")
        st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)
        user_stats = get_github_user_stats(github_username, os.getenv("GITHUB_TOKEN"))
        if user_stats:
            col1, col2, col3 = st.columns(3)
            with col1:
                st.markdown(stat_card("Repos", user_stats.get("public_repos", 0), "📦"), unsafe_allow_html=True)
            with col2:
                st.markdown(stat_card("Followers", user_stats.get("followers", 0), "👥"), unsafe_allow_html=True)
            with col3:
                st.markdown(stat_card("Following", user_stats.get("following", 0), "👤"), unsafe_allow_html=True)


def page_games():
    """Page des jeux vidéo."""
    df = load_games_data()
    
    if df.empty:
        st.warning("Aucune donnée de jeux. Exécutez `python -m pipelines.seriesbox`")
        return
    
    # Stats header
    total_hours = df["Heures de jeu"].sum()
    total_games = len(df)
    played = len(df[df["Heures de jeu"] > 0])
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(stat_card("Total", total_games, "🎮"), unsafe_allow_html=True)
    with col2:
        st.markdown(stat_card("Joués", played, "✓"), unsafe_allow_html=True)
    with col3:
        st.markdown(stat_card("Heures", f"{total_hours:,}h", "⏱️"), unsafe_allow_html=True)
    with col4:
        avg_hours = total_hours // played if played > 0 else 0
        st.markdown(stat_card("Moy/jeu", f"{avg_hours}h", "📊"), unsafe_allow_html=True)
    
    st.markdown("<div style='height: 1.5rem'></div>", unsafe_allow_html=True)
    
    # Filtres épurés
    with st.expander("⚙️ Filtres", expanded=False):
        col_f1, col_f2, col_f3 = st.columns(3)
        with col_f1:
            min_hours = st.slider("Heures minimum", 0, max(1, int(df["Heures de jeu"].max())), 0)
        with col_f2:
            all_supports = set()
            for supports in df["Support"]:
                if pd.notna(supports):
                    for s in str(supports).split(","):
                        all_supports.add(s.strip())
            supports_list = ["Tous"] + sorted(all_supports)
            selected_support = st.selectbox("Plateforme", supports_list)
        with col_f3:
            sort_order = st.selectbox("Tri", ["Heures ↓", "Heures ↑", "A-Z"])
    
    # Filtrage
    df_filtered = df[df["Heures de jeu"] >= min_hours].copy()
    if selected_support != "Tous":
        df_filtered = df_filtered[df_filtered["Support"].str.contains(selected_support, na=False)]
    
    if sort_order == "Heures ↑":
        df_filtered = df_filtered.sort_values("Heures de jeu", ascending=True)
    elif sort_order == "A-Z":
        df_filtered = df_filtered.sort_values("Titre", ascending=True)
    
    st.caption(f"{len(df_filtered)} jeux")
    
    # Récupération des covers
    token = get_igdb_token()
    client_id = os.getenv("IGDB_CLIENT_ID", "")
    covers_map = {}
    
    if token:
        titles_to_fetch = tuple(game["Titre"] for _, game in df_filtered.iterrows())
        if titles_to_fetch:
            covers_map = batch_fetch_covers(titles_to_fetch, token, client_id)
    
    # Grille de jeux
    cols_per_row = 6
    for i in range(0, len(df_filtered), cols_per_row):
        cols = st.columns(cols_per_row)
        chunk = df_filtered.iloc[i:i+cols_per_row]
        for idx, (_, game) in enumerate(chunk.iterrows()):
            with cols[idx]:
                cover_url = covers_map.get(game["Titre"])
                badge = f"{game['Heures de jeu']}h" if game['Heures de jeu'] > 0 else ""
                st.markdown(
                    media_card(
                        title=game["Titre"],
                        image_url=cover_url,
                        subtitle=game["Support"],
                        badge=badge
                    ),
                    unsafe_allow_html=True
                )


def page_films():
    """Page des films."""
    df = load_films_data()
    
    if df.empty:
        st.warning("Aucune donnée de films. Exécutez `python -m pipelines.seriesbox`")
        return
    
    # Stats
    total_films = len(df)
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(stat_card("Films vus", total_films, "🎬"), unsafe_allow_html=True)
    with col2:
        st.markdown(stat_card("Heures estimées", f"~{total_films * 2}h", "⏱️"), unsafe_allow_html=True)
    with col3:
        st.markdown(stat_card("Jours équivalent", f"~{(total_films * 2) // 24}j", "📅"), unsafe_allow_html=True)
    
    st.markdown("<div style='height: 1.5rem'></div>", unsafe_allow_html=True)
    
    # Recherche
    search = st.text_input("🔍 Rechercher un film", placeholder="Tapez pour rechercher...", label_visibility="collapsed")
    
    df_filtered = df.copy()
    if search:
        df_filtered = df_filtered[df_filtered["Titre"].str.lower().str.contains(search.lower(), na=False)]
    
    st.caption(f"{len(df_filtered)} films")
    st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)
    
    # Grille
    cols_per_row = 6
    for i in range(0, len(df_filtered), cols_per_row):
        cols = st.columns(cols_per_row)
        chunk = df_filtered.iloc[i:i+cols_per_row]
        for idx, (_, film) in enumerate(chunk.iterrows()):
            with cols[idx]:
                image_url = film.get("image_url") if pd.notna(film.get("image_url")) else None
                st.markdown(
                    media_card(
                        title=film["Titre"],
                        image_url=image_url,
                    ),
                    unsafe_allow_html=True
                )


def page_series():
    """Page des séries."""
    df = load_series_data()
    
    if df.empty:
        st.warning("Aucune donnée de séries. Exécutez `python -m pipelines.seriesbox`")
        return
    
    # Stats
    total_series = len(df)
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown(stat_card("Séries suivies", total_series, "📺"), unsafe_allow_html=True)
    with col2:
        st.markdown(stat_card("En cours", "—", "▶️"), unsafe_allow_html=True)
    
    st.markdown("<div style='height: 1.5rem'></div>", unsafe_allow_html=True)
    
    # Recherche
    search = st.text_input("🔍 Rechercher une série", placeholder="Tapez pour rechercher...", label_visibility="collapsed")
    
    df_filtered = df.copy()
    if search:
        df_filtered = df_filtered[df_filtered["Titre"].str.lower().str.contains(search.lower(), na=False)]
    
    st.caption(f"{len(df_filtered)} séries")
    st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)
    
    # Grille
    cols_per_row = 6
    for i in range(0, len(df_filtered), cols_per_row):
        cols = st.columns(cols_per_row)
        chunk = df_filtered.iloc[i:i+cols_per_row]
        for idx, (_, series) in enumerate(chunk.iterrows()):
            with cols[idx]:
                image_url = series.get("image_url") if pd.notna(series.get("image_url")) else None
                st.markdown(
                    media_card(
                        title=series["Titre"],
                        image_url=image_url,
                    ),
                    unsafe_allow_html=True
                )


def page_github():
    """Page GitHub."""
    github_username = os.getenv("GITHUB_USERNAME")
    github_token = os.getenv("GITHUB_TOKEN")
    
    if not github_username:
        st.warning("Ajoutez `GITHUB_USERNAME` dans `.env`")
        return
    
    user_stats = get_github_user_stats(github_username, github_token)
    repos = get_github_repos(github_username, github_token)
    
    if not user_stats:
        st.error(f"Impossible de charger les données pour @{github_username}")
        return
    
    # Profil header
    col_avatar, col_info = st.columns([1, 4])
    with col_avatar:
        st.markdown(f"""
        <div class="github-avatar">
            <img src="{user_stats.get('avatar_url', '')}" alt="avatar">
        </div>
        """, unsafe_allow_html=True)
    with col_info:
        name = user_stats.get("name", github_username)
        bio = user_stats.get("bio", "") or ""
        st.markdown(f"""
        <div class="github-profile">
            <h2>{name}</h2>
            <p class="github-handle">@{github_username}</p>
            <p class="github-bio">{bio}</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)
    
    # Stats
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(stat_card("Repositories", user_stats.get("public_repos", 0), "📦"), unsafe_allow_html=True)
    with col2:
        st.markdown(stat_card("Followers", user_stats.get("followers", 0), "👥"), unsafe_allow_html=True)
    with col3:
        st.markdown(stat_card("Following", user_stats.get("following", 0), "👤"), unsafe_allow_html=True)
    with col4:
        created_at = datetime.strptime(user_stats["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        years = (datetime.now() - created_at).days // 365
        st.markdown(stat_card("Années", years, "📅"), unsafe_allow_html=True)
    
    st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)
    
    # Langages
    if repos:
        st.markdown("#### Langages")
        st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)
        languages = get_github_languages(tuple(repos))
        if languages:
            top_langs = list(languages.items())[:8]
            total = sum(c for _, c in top_langs)
            
            colors = {
                "Python": "#3572A5", "JavaScript": "#f1e05a", "TypeScript": "#3178c6",
                "Java": "#b07219", "C++": "#f34b7d", "C#": "#178600", "Go": "#00ADD8",
                "Rust": "#dea584", "Ruby": "#701516", "PHP": "#4F5D95", "Swift": "#F05138",
                "Kotlin": "#A97BFF", "HTML": "#e34c26", "CSS": "#563d7c", "Shell": "#89e051"
            }
            
            # Barre de langages
            lang_html = '<div class="lang-bars">'
            for lang, count in top_langs:
                pct = (count / total) * 100
                color = colors.get(lang, "#8b949e")
                lang_html += f'<div class="lang-bar" style="width: {pct}%; background: {color};" title="{lang}: {count}"></div>'
            lang_html += '</div>'
            st.markdown(lang_html, unsafe_allow_html=True)
            
            # Légende
            legend_html = '<div class="lang-legend">'
            for lang, count in top_langs:
                color = colors.get(lang, "#8b949e")
                legend_html += f'<span class="lang-item"><span class="lang-dot" style="background: {color}"></span>{lang}</span>'
            legend_html += '</div>'
            st.markdown(legend_html, unsafe_allow_html=True)
    
    st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)
    
    # Contribution graph
    st.markdown("#### Contributions")
    st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)
    st.markdown(f"""
    <div class="contribution-graph">
        <img src="https://ghchart.rshah.io/6366f1/{github_username}" alt="Contributions">
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)
    
    # Top repos
    st.markdown("#### Repositories récents")
    st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)
    if repos:
        top_repos = sorted(repos, key=lambda x: x.get("pushed_at", ""), reverse=True)[:6]
        
        cols = st.columns(2)
        for idx, repo in enumerate(top_repos):
            with cols[idx % 2]:
                stars = repo.get("stargazers_count", 0)
                forks = repo.get("forks_count", 0)
                lang = repo.get("language", "") or ""
                desc = (repo.get("description", "") or "")[:80]
                
                st.markdown(f"""
                <div class="repo-card">
                    <div class="repo-header">
                        <span class="repo-name">{repo['name']}</span>
                        <span class="repo-lang">{lang}</span>
                    </div>
                    <p class="repo-desc">{desc}</p>
                    <div class="repo-stats">
                        <span>⭐ {stars}</span>
                        <span>🍴 {forks}</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)


# ============================================================================
# MAIN
# ============================================================================

def main():
    render_header()
    render_nav()
    
    page = st.session_state.get("current_page", "overview")
    
    if page == "overview":
        page_overview()
    elif page == "games":
        page_games()
    elif page == "films":
        page_films()
    elif page == "series":
        page_series()
    elif page == "github":
        page_github()


if __name__ == "__main__":
    main()
