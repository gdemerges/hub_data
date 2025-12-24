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


def normalize_game_title(title: str) -> list[str]:
    """Génère des variantes de titre pour améliorer la recherche."""
    import re
    import unicodedata
    variants = [title]

    # Normaliser les accents (Astérix -> Asterix)
    normalized = unicodedata.normalize('NFKD', title).encode('ASCII', 'ignore').decode('ASCII')
    if normalized != title and normalized:
        variants.append(normalized)

    # Enlever les suffixes courants après ":"
    if ":" in title:
        base = title.split(":")[0].strip()
        variants.append(base)
        # Aussi sans accents
        base_norm = unicodedata.normalize('NFKD', base).encode('ASCII', 'ignore').decode('ASCII')
        if base_norm != base:
            variants.append(base_norm)

    # Enlever les chiffres romains de version (II, III, IV, etc.)
    cleaned = re.sub(r'\s+(II|III|IV|V|VI|VII|VIII|IX|X)(\s|$|:)', ' ', title).strip()
    if cleaned != title:
        variants.append(cleaned)

    # Enlever "- " et ce qui suit
    if " - " in title:
        base = title.split(" - ")[0].strip()
        variants.append(base)

    # Enlever les parenthèses
    cleaned = re.sub(r'\s*\([^)]*\)', '', title).strip()
    if cleaned != title:
        variants.append(cleaned)

    # Enlever "Remastered", "Definitive Edition", etc.
    for suffix in ["Remastered", "Definitive Edition", "HD", "Edition", "Complete", "GOTY", "Game of the Year"]:
        cleaned = re.sub(rf'\s*:?\s*{suffix}.*$', '', title, flags=re.IGNORECASE).strip()
        if cleaned != title and cleaned:
            variants.append(cleaned)

    # Remplacer les chiffres arabes par romains et vice-versa
    arabic_to_roman = {"2": "II", "3": "III", "4": "IV", "5": "V", "6": "VI", "7": "VII", "8": "VIII", "9": "IX", "10": "X"}
    roman_to_arabic = {v: k for k, v in arabic_to_roman.items()}

    for arabic, roman in arabic_to_roman.items():
        if f" {arabic}" in title or title.endswith(arabic):
            variant = re.sub(rf'\b{arabic}\b', roman, title)
            variants.append(variant)

    for roman, arabic in roman_to_arabic.items():
        if f" {roman}" in title or title.endswith(roman):
            variant = re.sub(rf'\b{roman}\b', arabic, title)
            variants.append(variant)

    # Essayer sans "The" au début
    if title.lower().startswith("the "):
        variants.append(title[4:])

    # Enlever les caractères spéciaux
    cleaned = re.sub(r'[^\w\s]', '', title).strip()
    if cleaned != title and cleaned:
        variants.append(cleaned)

    return list(dict.fromkeys(variants))  # Supprimer les doublons en gardant l'ordre


@st.cache_data(ttl=86400)
def search_game_cover_and_info(title: str, _token: str, client_id: str) -> dict | None:
    """Recherche la jaquette et les infos d'un jeu via IGDB avec recherche améliorée."""
    if not _token or not client_id:
        return None

    headers = {"Client-ID": client_id, "Authorization": f"Bearer {_token}"}
    variants = normalize_game_title(title)

    for variant in variants:
        try:
            # Recherche du jeu avec plus de champs
            resp = requests.post(
                "https://api.igdb.com/v4/games",
                headers=headers,
                data=f'search "{variant}"; fields name,cover,summary,rating,first_release_date,genres.name,platforms.name; limit 5;',
                timeout=10
            )
            if resp.status_code != 200 or not resp.json():
                continue

            games = resp.json()

            # Trouver le meilleur match
            best_match = None
            for game in games:
                game_name = game.get("name", "").lower()
                variant_lower = variant.lower()

                # Match exact prioritaire
                if game_name == variant_lower:
                    best_match = game
                    break
                # Sinon, prendre le premier résultat avec une cover
                if not best_match and game.get("cover"):
                    best_match = game

            if not best_match:
                best_match = games[0] if games else None

            if not best_match:
                continue

            cover_id = best_match.get("cover")
            cover_url = None

            if cover_id:
                resp2 = requests.post(
                    "https://api.igdb.com/v4/covers",
                    headers=headers,
                    data=f"where id = {cover_id}; fields image_id;",
                    timeout=10
                )
                if resp2.status_code == 200 and resp2.json():
                    image_id = resp2.json()[0].get("image_id")
                    if image_id:
                        cover_url = f"https://images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg"

            # Formater la date
            release_date = None
            if best_match.get("first_release_date"):
                release_date = datetime.fromtimestamp(best_match["first_release_date"]).strftime("%Y")

            return {
                "cover_url": cover_url,
                "name": best_match.get("name"),
                "summary": best_match.get("summary"),
                "rating": round(best_match.get("rating", 0) / 10, 1) if best_match.get("rating") else None,
                "release_year": release_date,
                "genres": [g["name"] for g in best_match.get("genres", [])],
                "platforms": [p["name"] for p in best_match.get("platforms", [])]
            }

        except Exception:
            continue

    return None


@st.cache_data(ttl=86400)
def search_game_cover(title: str, _token: str, client_id: str) -> str | None:
    """Recherche la jaquette d'un jeu via IGDB (wrapper pour compatibilité)."""
    result = search_game_cover_and_info(title, _token, client_id)
    return result["cover_url"] if result else None


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


@st.cache_data(ttl=86400, show_spinner=False)
def batch_fetch_game_info(titles: tuple[str, ...], _token: str, client_id: str) -> dict[str, dict | None]:
    """Récupère les infos complètes pour plusieurs jeux en parallèle."""
    if not _token or not client_id:
        return {}
    results = {}
    def fetch_single(title: str) -> tuple[str, dict | None]:
        return (title, search_game_cover_and_info(title, _token, client_id))
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_single, t): t for t in titles}
        for future in as_completed(futures):
            try:
                title, info = future.result()
                results[title] = info
            except Exception:
                results[futures[future]] = None
    return results


# ============================================================================
# API FUNCTIONS - TMDb (Films & Séries)
# ============================================================================

@st.cache_data(ttl=86400, show_spinner=False)
def search_tmdb_movie_info(title: str, api_key: str | None = None) -> dict | None:
    """Recherche les infos d'un film via TMDb."""
    if not api_key:
        api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        return None

    try:
        # Recherche du film
        resp = requests.get(
            "https://api.themoviedb.org/3/search/movie",
            params={"api_key": api_key, "query": title, "language": "fr-FR"},
            timeout=10
        )
        if resp.status_code != 200 or not resp.json().get("results"):
            return None

        movie = resp.json()["results"][0]
        movie_id = movie["id"]

        # Récupérer les détails complets
        resp2 = requests.get(
            f"https://api.themoviedb.org/3/movie/{movie_id}",
            params={"api_key": api_key, "language": "fr-FR"},
            timeout=10
        )
        if resp2.status_code != 200:
            return None

        details = resp2.json()

        return {
            "title": details.get("title"),
            "original_title": details.get("original_title"),
            "poster_url": f"https://image.tmdb.org/t/p/w500{details['poster_path']}" if details.get("poster_path") else None,
            "backdrop_url": f"https://image.tmdb.org/t/p/w1280{details['backdrop_path']}" if details.get("backdrop_path") else None,
            "overview": details.get("overview"),
            "release_date": details.get("release_date", "")[:4] if details.get("release_date") else None,
            "rating": round(details.get("vote_average", 0), 1) if details.get("vote_average") else None,
            "runtime": details.get("runtime"),
            "genres": [g["name"] for g in details.get("genres", [])],
            "tagline": details.get("tagline")
        }
    except Exception:
        return None


@st.cache_data(ttl=86400, show_spinner=False)
def search_tmdb_series_info(title: str, api_key: str | None = None) -> dict | None:
    """Recherche les infos d'une série via TMDb."""
    if not api_key:
        api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        return None

    try:
        # Recherche de la série
        resp = requests.get(
            "https://api.themoviedb.org/3/search/tv",
            params={"api_key": api_key, "query": title, "language": "fr-FR"},
            timeout=10
        )
        if resp.status_code != 200 or not resp.json().get("results"):
            return None

        series = resp.json()["results"][0]
        series_id = series["id"]

        # Récupérer les détails complets
        resp2 = requests.get(
            f"https://api.themoviedb.org/3/tv/{series_id}",
            params={"api_key": api_key, "language": "fr-FR"},
            timeout=10
        )
        if resp2.status_code != 200:
            return None

        details = resp2.json()

        return {
            "name": details.get("name"),
            "original_name": details.get("original_name"),
            "poster_url": f"https://image.tmdb.org/t/p/w500{details['poster_path']}" if details.get("poster_path") else None,
            "backdrop_url": f"https://image.tmdb.org/t/p/w1280{details['backdrop_path']}" if details.get("backdrop_path") else None,
            "overview": details.get("overview"),
            "first_air_date": details.get("first_air_date", "")[:4] if details.get("first_air_date") else None,
            "last_air_date": details.get("last_air_date", "")[:4] if details.get("last_air_date") else None,
            "rating": round(details.get("vote_average", 0), 1) if details.get("vote_average") else None,
            "seasons": details.get("number_of_seasons"),
            "episodes": details.get("number_of_episodes"),
            "status": details.get("status"),
            "genres": [g["name"] for g in details.get("genres", [])],
            "tagline": details.get("tagline")
        }
    except Exception:
        return None


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


@st.cache_data(ttl=3600, show_spinner=False)
def get_github_contributions(username: str, year: int, token: str | None = None) -> dict[str, int]:
    """Récupère les contributions GitHub pour une année donnée via GraphQL."""
    if not token:
        # Sans token, on ne peut pas utiliser GraphQL, retourner des données vides
        return {}

    # Dates de début et fin pour l'année
    start_date = datetime(year, 1, 1)
    end_date = datetime(year, 12, 31)

    # Format ISO pour GraphQL
    from_date = start_date.strftime("%Y-%m-%dT00:00:00Z")
    to_date = end_date.strftime("%Y-%m-%dT23:59:59Z")

    # Query GraphQL pour récupérer les contributions
    query = """
    query($userName: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $userName) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
    """

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    variables = {
        "userName": username,
        "from": from_date,
        "to": to_date
    }

    contributions = {}

    try:
        resp = requests.post(
            "https://api.github.com/graphql",
            headers=headers,
            json={"query": query, "variables": variables},
            timeout=10
        )

        if resp.status_code == 200:
            data = resp.json()
            if "data" in data and data["data"] and "user" in data["data"] and data["data"]["user"]:
                calendar = data["data"]["user"]["contributionsCollection"]["contributionCalendar"]
                weeks = calendar["weeks"]

                for week in weeks:
                    for day in week["contributionDays"]:
                        date = day["date"]
                        count = day["contributionCount"]
                        if count > 0:
                            contributions[date] = count
    except Exception:
        # En cas d'erreur, retourner des données vides
        pass

    return contributions


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

def generate_contribution_heatmap(contributions: dict[str, int], year: int) -> str:
    """Génère le HTML d'une heatmap de contributions style GitHub."""
    # Période : année complète
    start_date = datetime(year, 1, 1)
    end_date = datetime(year, 12, 31)

    # Trouver le premier dimanche avant start_date pour aligner la grille
    days_since_sunday = (start_date.weekday() + 1) % 7
    grid_start_date = start_date - timedelta(days=days_since_sunday)

    # Créer la structure de données pour chaque jour
    weeks = []
    current_week = []
    current_date = grid_start_date

    # Déterminer les intensités max pour le scaling des couleurs
    max_contributions = max(contributions.values()) if contributions else 1

    # Générer les semaines et les jours
    while current_date <= end_date:
        day_str = current_date.strftime("%Y-%m-%d")
        count = contributions.get(day_str, 0)

        # Déterminer le niveau d'intensité (0-4)
        if count == 0:
            level = 0
        elif count <= max_contributions * 0.25:
            level = 1
        elif count <= max_contributions * 0.5:
            level = 2
        elif count <= max_contributions * 0.75:
            level = 3
        else:
            level = 4

        # Ajouter le jour à la semaine actuelle
        current_week.append({
            "date": day_str,
            "count": count,
            "level": level,
            "month": current_date.strftime("%b"),
            "is_outside_range": current_date < start_date or current_date > end_date
        })

        # Si c'est samedi, commencer une nouvelle semaine
        if current_date.weekday() == 6:  # Samedi
            weeks.append(current_week)
            current_week = []

        current_date += timedelta(days=1)

    # Ajouter la dernière semaine si elle n'est pas vide
    if current_week:
        weeks.append(current_week)

    # Générer les labels de mois
    month_labels = []
    last_month = None
    for week_idx, week in enumerate(weeks):
        if week:
            first_day = week[0]
            month = first_day["month"]
            if month != last_month and week_idx > 0:
                month_labels.append({"month": month, "offset": week_idx})
                last_month = month

    # Construire le HTML
    html = '<div class="contrib-heatmap">'

    # Labels de mois
    html += '<div class="contrib-months">'
    for label in month_labels:
        html += f'<span class="contrib-month" style="grid-column: {label["offset"] + 1};">{label["month"]}</span>'
    html += '</div>'

    # Grille de contributions
    html += '<div class="contrib-grid">'

    # Labels des jours (à gauche)
    html += '<div class="contrib-days-labels">'
    for day in ["Mon", "Wed", "Fri"]:
        html += f'<span class="contrib-day-label">{day}</span>'
    html += '</div>'

    # Cellules de contribution (organisées en colonnes = semaines)
    html += '<div class="contrib-weeks">'
    for week in weeks:
        html += '<div class="contrib-week">'
        for day in week:
            opacity = "0.3" if day["is_outside_range"] else "1"
            html += f'<div class="contrib-day level-{day["level"]}" title="{day["count"]} contributions on {day["date"]}" style="opacity: {opacity};"></div>'
        html += '</div>'
    html += '</div></div>'

    # Légende
    html += '<div class="contrib-legend">'
    html += '<span class="contrib-legend-label">Less</span>'
    html += '<div class="contrib-day level-0"></div>'
    html += '<div class="contrib-day level-1"></div>'
    html += '<div class="contrib-day level-2"></div>'
    html += '<div class="contrib-day level-3"></div>'
    html += '<div class="contrib-day level-4"></div>'
    html += '<span class="contrib-legend-label">More</span>'
    html += '</div></div>'

    return html


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


def media_card(title: str, image_url: str | None, subtitle: str = "", badge: str = "", clickable: bool = False, card_id: str = ""):
    """Carte média avec image et hover effect."""
    placeholder = f"""
    <div class="media-placeholder">
        <span>{title[:2].upper()}</span>
    </div>
    """
    image_html = f'<img src="{image_url}" alt="{title}" loading="lazy">' if image_url else placeholder
    badge_html = f'<div class="media-badge">{badge}</div>' if badge else ''
    subtitle_html = f'<div class="media-subtitle">{subtitle}</div>' if subtitle else ''

    clickable_class = "media-card-clickable" if clickable else ""
    data_id = f'data-card-id="{card_id}"' if card_id else ""

    return f"""
    <div class="media-card {clickable_class}" {data_id}>
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

    # Initialiser l'état pour le jeu sélectionné
    if "selected_game" not in st.session_state:
        st.session_state.selected_game = None

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

    # Récupération des infos complètes (covers + détails)
    token = get_igdb_token()
    client_id = os.getenv("IGDB_CLIENT_ID", "")
    games_info = {}

    if token:
        titles_to_fetch = tuple(game["Titre"] for _, game in df_filtered.iterrows())
        if titles_to_fetch:
            games_info = batch_fetch_game_info(titles_to_fetch, token, client_id)

    # Afficher le détail du jeu sélectionné
    if st.session_state.selected_game:
        game_title = st.session_state.selected_game
        game_data = df[df["Titre"] == game_title].iloc[0] if not df[df["Titre"] == game_title].empty else None
        game_api_info = games_info.get(game_title)

        st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)

        # Bouton fermer
        if st.button("← Retour à la liste", key="close_game_detail"):
            st.session_state.selected_game = None
            st.rerun()

        st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)

        # Layout détail
        col_img, col_info = st.columns([1, 2])

        with col_img:
            cover_url = game_api_info.get("cover_url") if game_api_info else None
            if cover_url:
                st.markdown(f'<img src="{cover_url}" style="width: 100%; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">', unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="width: 100%; aspect-ratio: 2/3; background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
                            border-radius: 12px; display: flex; align-items: center; justify-content: center;
                            font-size: 3rem; color: #71717a;">
                    {game_title[:2].upper()}
                </div>
                """, unsafe_allow_html=True)

        with col_info:
            st.markdown(f"### {game_title}")

            # Infos locales
            if game_data is not None:
                st.markdown(f"**Plateforme:** {game_data['Support']}")
                hours = game_data['Heures de jeu']
                if hours > 0:
                    st.markdown(f"**Temps de jeu:** {hours}h")

            # Infos API
            if game_api_info:
                if game_api_info.get("release_year"):
                    st.markdown(f"**Année de sortie:** {game_api_info['release_year']}")

                if game_api_info.get("rating"):
                    st.markdown(f"**Note:** {game_api_info['rating']}/10")

                if game_api_info.get("genres"):
                    genres_str = ", ".join(game_api_info["genres"][:5])
                    st.markdown(f"**Genres:** {genres_str}")

                if game_api_info.get("summary"):
                    st.markdown("**Description:**")
                    summary = game_api_info["summary"]
                    if len(summary) > 500:
                        summary = summary[:500] + "..."
                    st.markdown(f"<p style='color: #a1a1aa; font-size: 0.9rem;'>{summary}</p>", unsafe_allow_html=True)
            else:
                st.markdown("<p style='color: #71717a; font-style: italic;'>Informations supplémentaires non disponibles</p>", unsafe_allow_html=True)

        st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)
        st.markdown("---")
        st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)

    # Grille de jeux
    cols_per_row = 6
    for i in range(0, len(df_filtered), cols_per_row):
        cols = st.columns(cols_per_row)
        chunk = df_filtered.iloc[i:i+cols_per_row]
        for idx, (_, game) in enumerate(chunk.iterrows()):
            with cols[idx]:
                game_info = games_info.get(game["Titre"])
                cover_url = game_info.get("cover_url") if game_info else None
                badge = f"{game['Heures de jeu']}h" if game['Heures de jeu'] > 0 else ""

                # Bouton cliquable qui couvre toute la carte
                if st.button(
                    game["Titre"],
                    key=f"game_{game['Titre']}_{i}_{idx}",
                    use_container_width=True,
                    type="secondary"
                ):
                    st.session_state.selected_game = game["Titre"]
                    st.rerun()
                
                # Carte visuelle affichée en dessous (utilise CSS pour overlay)
                st.markdown(
                    f'<div class="media-card-overlay">{media_card(title=game["Titre"], image_url=cover_url, subtitle=game["Support"], badge=badge)}</div>',
                    unsafe_allow_html=True
                )


def page_films():
    """Page des films."""
    df = load_films_data()

    if df.empty:
        st.warning("Aucune donnée de films. Exécutez `python -m pipelines.seriesbox`")
        return

    # Initialiser l'état pour le film sélectionné
    if "selected_film" not in st.session_state:
        st.session_state.selected_film = None

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
    search = st.text_input("🔍 Rechercher un film", placeholder="Tapez pour rechercher...", label_visibility="collapsed", key="film_search")

    df_filtered = df.copy()
    if search:
        df_filtered = df_filtered[df_filtered["Titre"].str.lower().str.contains(search.lower(), na=False)]

    st.caption(f"{len(df_filtered)} films")

    # Afficher le détail du film sélectionné
    if st.session_state.selected_film:
        film_title = st.session_state.selected_film
        film_data = df[df["Titre"] == film_title].iloc[0] if not df[df["Titre"] == film_title].empty else None

        st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)

        # Bouton fermer
        if st.button("← Retour à la liste", key="close_film_detail"):
            st.session_state.selected_film = None
            st.rerun()

        st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)

        # Récupérer les infos TMDb
        film_api_info = search_tmdb_movie_info(film_title)

        # Layout détail
        col_img, col_info = st.columns([1, 2])

        with col_img:
            poster_url = film_api_info.get("poster_url") if film_api_info else None
            if not poster_url and film_data is not None:
                poster_url = film_data.get("image_url") if pd.notna(film_data.get("image_url")) else None

            if poster_url:
                st.markdown(f'<img src="{poster_url}" style="width: 100%; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">', unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="width: 100%; aspect-ratio: 2/3; background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
                            border-radius: 12px; display: flex; align-items: center; justify-content: center;
                            font-size: 3rem; color: #71717a;">
                    {film_title[:2].upper()}
                </div>
                """, unsafe_allow_html=True)

        with col_info:
            st.markdown(f"### {film_title}")

            # Infos API
            if film_api_info:
                if film_api_info.get("tagline"):
                    st.markdown(f"*{film_api_info['tagline']}*")

                if film_api_info.get("release_date"):
                    st.markdown(f"**Année de sortie:** {film_api_info['release_date']}")

                if film_api_info.get("runtime"):
                    st.markdown(f"**Durée:** {film_api_info['runtime']} min")

                if film_api_info.get("rating"):
                    st.markdown(f"**Note:** {film_api_info['rating']}/10")

                if film_api_info.get("genres"):
                    genres_str = ", ".join(film_api_info["genres"][:5])
                    st.markdown(f"**Genres:** {genres_str}")

                if film_api_info.get("overview"):
                    st.markdown("**Synopsis:**")
                    st.markdown(f"<p style='color: #a1a1aa; font-size: 0.9rem;'>{film_api_info['overview']}</p>", unsafe_allow_html=True)
            else:
                st.markdown("<p style='color: #71717a; font-style: italic;'>Informations supplémentaires non disponibles. Ajoutez TMDB_API_KEY dans .env</p>", unsafe_allow_html=True)

        st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)
        st.markdown("---")
        st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)

    st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)

    # Grille
    cols_per_row = 6
    for i in range(0, len(df_filtered), cols_per_row):
        cols = st.columns(cols_per_row)
        chunk = df_filtered.iloc[i:i+cols_per_row]
        for idx, (_, film) in enumerate(chunk.iterrows()):
            with cols[idx]:
                image_url = film.get("image_url") if pd.notna(film.get("image_url")) else None

                # Bouton cliquable qui couvre toute la carte
                if st.button(
                    film["Titre"],
                    key=f"film_{film['Titre']}_{i}_{idx}",
                    use_container_width=True,
                    type="secondary"
                ):
                    st.session_state.selected_film = film["Titre"]
                    st.rerun()
                
                # Carte visuelle affichée en dessous (utilise CSS pour overlay)
                st.markdown(
                    f'<div class="media-card-overlay">{media_card(title=film["Titre"], image_url=image_url)}</div>',
                    unsafe_allow_html=True
                )
                st.markdown('</div>', unsafe_allow_html=True)


def page_series():
    """Page des séries."""
    df = load_series_data()

    if df.empty:
        st.warning("Aucune donnée de séries. Exécutez `python -m pipelines.seriesbox`")
        return

    # Initialiser l'état pour la série sélectionnée
    if "selected_series" not in st.session_state:
        st.session_state.selected_series = None

    # Stats
    total_series = len(df)

    col1, col2 = st.columns(2)
    with col1:
        st.markdown(stat_card("Séries suivies", total_series, "📺"), unsafe_allow_html=True)
    with col2:
        st.markdown(stat_card("En cours", "—", "▶️"), unsafe_allow_html=True)

    st.markdown("<div style='height: 1.5rem'></div>", unsafe_allow_html=True)

    # Recherche
    search = st.text_input("🔍 Rechercher une série", placeholder="Tapez pour rechercher...", label_visibility="collapsed", key="series_search")

    df_filtered = df.copy()
    if search:
        df_filtered = df_filtered[df_filtered["Titre"].str.lower().str.contains(search.lower(), na=False)]

    st.caption(f"{len(df_filtered)} séries")

    # Afficher le détail de la série sélectionnée
    if st.session_state.selected_series:
        series_title = st.session_state.selected_series
        series_data = df[df["Titre"] == series_title].iloc[0] if not df[df["Titre"] == series_title].empty else None

        st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)

        # Bouton fermer
        if st.button("← Retour à la liste", key="close_series_detail"):
            st.session_state.selected_series = None
            st.rerun()

        st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)

        # Récupérer les infos TMDb
        series_api_info = search_tmdb_series_info(series_title)

        # Layout détail
        col_img, col_info = st.columns([1, 2])

        with col_img:
            poster_url = series_api_info.get("poster_url") if series_api_info else None
            if not poster_url and series_data is not None:
                poster_url = series_data.get("image_url") if pd.notna(series_data.get("image_url")) else None

            if poster_url:
                st.markdown(f'<img src="{poster_url}" style="width: 100%; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">', unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="width: 100%; aspect-ratio: 2/3; background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
                            border-radius: 12px; display: flex; align-items: center; justify-content: center;
                            font-size: 3rem; color: #71717a;">
                    {series_title[:2].upper()}
                </div>
                """, unsafe_allow_html=True)

        with col_info:
            st.markdown(f"### {series_title}")

            # Infos API
            if series_api_info:
                if series_api_info.get("tagline"):
                    st.markdown(f"*{series_api_info['tagline']}*")

                if series_api_info.get("first_air_date"):
                    years = series_api_info['first_air_date']
                    if series_api_info.get("last_air_date") and series_api_info["last_air_date"] != series_api_info["first_air_date"]:
                        years += f" - {series_api_info['last_air_date']}"
                    st.markdown(f"**Années:** {years}")

                if series_api_info.get("seasons"):
                    st.markdown(f"**Saisons:** {series_api_info['seasons']}")

                if series_api_info.get("episodes"):
                    st.markdown(f"**Épisodes:** {series_api_info['episodes']}")

                if series_api_info.get("status"):
                    status_map = {
                        "Returning Series": "En cours",
                        "Ended": "Terminée",
                        "Canceled": "Annulée",
                        "In Production": "En production"
                    }
                    status = status_map.get(series_api_info["status"], series_api_info["status"])
                    st.markdown(f"**Statut:** {status}")

                if series_api_info.get("rating"):
                    st.markdown(f"**Note:** {series_api_info['rating']}/10")

                if series_api_info.get("genres"):
                    genres_str = ", ".join(series_api_info["genres"][:5])
                    st.markdown(f"**Genres:** {genres_str}")

                if series_api_info.get("overview"):
                    st.markdown("**Synopsis:**")
                    st.markdown(f"<p style='color: #a1a1aa; font-size: 0.9rem;'>{series_api_info['overview']}</p>", unsafe_allow_html=True)
            else:
                st.markdown("<p style='color: #71717a; font-style: italic;'>Informations supplémentaires non disponibles. Ajoutez TMDB_API_KEY dans .env</p>", unsafe_allow_html=True)

        st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)
        st.markdown("---")
        st.markdown("<div style='height: 1rem'></div>", unsafe_allow_html=True)

    st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)

    # Grille
    cols_per_row = 6
    for i in range(0, len(df_filtered), cols_per_row):
        cols = st.columns(cols_per_row)
        chunk = df_filtered.iloc[i:i+cols_per_row]
        for idx, (_, series) in enumerate(chunk.iterrows()):
            with cols[idx]:
                image_url = series.get("image_url") if pd.notna(series.get("image_url")) else None

                # Bouton cliquable qui couvre toute la carte
                if st.button(
                    series["Titre"],
                    key=f"series_{series['Titre']}_{i}_{idx}",
                    use_container_width=True,
                    type="secondary"
                ):
                    st.session_state.selected_series = series["Titre"]
                    st.rerun()
                
                # Carte visuelle affichée en dessous (utilise CSS pour overlay)
                st.markdown(
                    f'<div class="media-card-overlay">{media_card(title=series["Titre"], image_url=image_url)}</div>',
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

    # Contribution heatmap (style GitHub)
    col_title, col_year = st.columns([3, 1])
    with col_title:
        st.markdown("#### Contributions")
    with col_year:
        # Sélecteur d'année
        current_year = datetime.now().year
        # Année de création du compte GitHub
        created_year = datetime.strptime(user_stats["created_at"], "%Y-%m-%dT%H:%M:%SZ").year
        years = list(range(current_year, created_year - 1, -1))
        selected_year = st.selectbox("Année", years, label_visibility="collapsed", key="contrib_year")

    st.markdown("<div style='height: 0.5rem'></div>", unsafe_allow_html=True)

    contributions = get_github_contributions(github_username, selected_year, github_token)

    # Afficher un message si pas de token
    if not github_token:
        st.warning("⚠️ Ajoutez `GITHUB_TOKEN` dans `.env` pour voir les contributions complètes")
    else:
        total_contribs = sum(contributions.values())
        st.caption(f"{total_contribs} contributions en {selected_year}")

    heatmap_html = generate_contribution_heatmap(contributions, selected_year)
    st.markdown(heatmap_html, unsafe_allow_html=True)
    
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
