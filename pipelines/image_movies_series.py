import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CLEAN_DIR = os.path.join(BASE_DIR, "data", "seriebox_cleaned")
FILMS_CSV_PATH = os.path.join(CLEAN_DIR, "films_vus_clean.csv")
SERIES_CSV_PATH = os.path.join(CLEAN_DIR, "shows_clean.csv")

ENV_PATH = os.path.join(BASE_DIR, "web", ".env")
load_dotenv(ENV_PATH)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"


def search_movie(title: str, year: str = None) -> dict | None:
    """Recherche un film sur TMDb par titre et année optionnelle."""
    url = f"{TMDB_BASE_URL}/search/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "query": title,
        "language": "fr-FR"
    }
    if year:
        params["year"] = year
    
    resp = requests.get(url, params=params)
    if resp.status_code != 200:
        print(f"[TMDb] Erreur film {title}: {resp.status_code}")
        return None
    
    data = resp.json()
    results = data.get("results", [])
    return results[0] if results else None


def search_tv(title: str, year: str = None) -> dict | None:
    """Recherche une série sur TMDb par titre et année optionnelle."""
    url = f"{TMDB_BASE_URL}/search/tv"
    params = {
        "api_key": TMDB_API_KEY,
        "query": title,
        "language": "fr-FR"
    }
    if year:
        params["first_air_date_year"] = year
    
    resp = requests.get(url, params=params)
    if resp.status_code != 200:
        print(f"[TMDb] Erreur série {title}: {resp.status_code}")
        return None
    
    data = resp.json()
    results = data.get("results", [])
    return results[0] if results else None


def get_poster_url(poster_path: str) -> str | None:
    """Construit l'URL complète du poster à partir du chemin TMDb."""
    if not poster_path:
        return None
    return f"{TMDB_IMAGE_BASE_URL}{poster_path}"


def extract_year_from_date(date_str: str) -> str | None:
    """Extrait l'année d'une date au format YYYY-MM-DD ou YYYY."""
    if not date_str or str(date_str).lower() == "nan":
        return None
    date_str = str(date_str).strip()
    if len(date_str) >= 4:
        return date_str[:4]
    return None


def enrich_movies_with_images():
    """Enrichit le fichier films_clean.csv avec les images TMDb."""
    if not os.path.exists(FILMS_CSV_PATH):
        print(f"⚠️  {FILMS_CSV_PATH} introuvable")
        return

    df = pd.read_csv(FILMS_CSV_PATH, sep=";")
    
    if "image_url" not in df.columns:
        df["image_url"] = None

    for idx, row in df[df["image_url"].isna()].iterrows():
        title = str(row.get("Titre", row.get("Titre VF", row.get("Titre VO", "")))).strip()
        if not title or title.lower() == "nan":
            continue

        year = extract_year_from_date(row.get("Année", row.get("Date de sortie", "")))
        
        print(f"\n[Film] Recherche: {title}" + (f" ({year})" if year else ""))
        
        try:
            result = search_movie(title, year)
            if result and result.get("poster_path"):
                url = get_poster_url(result["poster_path"])
                df.at[idx, "image_url"] = url
                print(f"✅ Poster trouvé: {url}")
            else:
                print(f"❌ Aucun poster trouvé")
        except Exception as e:
            print(f"[Erreur] {title}: {e}")
        
        time.sleep(0.25)

    df.to_csv(FILMS_CSV_PATH, sep=";", index=False)
    print(f"\n✅ Films enrichis : {FILMS_CSV_PATH}")


def enrich_series_with_images():
    """Enrichit le fichier series_clean.csv avec les images TMDb."""
    if not os.path.exists(SERIES_CSV_PATH):
        print(f"⚠️  {SERIES_CSV_PATH} introuvable")
        return

    df = pd.read_csv(SERIES_CSV_PATH, sep=";")
    
    if "image_url" not in df.columns:
        df["image_url"] = None

    for idx, row in df[df["image_url"].isna()].iterrows():
        title = str(row.get("Titre", row.get("Titre VF", row.get("Titre VO", "")))).strip()
        if not title or title.lower() == "nan":
            continue

        year = extract_year_from_date(row.get("Année", row.get("Date de première diffusion", "")))
        
        print(f"\n[Série] Recherche: {title}" + (f" ({year})" if year else ""))
        
        try:
            result = search_tv(title, year)
            if result and result.get("poster_path"):
                url = get_poster_url(result["poster_path"])
                df.at[idx, "image_url"] = url
                print(f"✅ Poster trouvé: {url}")
            else:
                print(f"❌ Aucun poster trouvé")
        except Exception as e:
            print(f"[Erreur] {title}: {e}")
        
        time.sleep(0.25)

    df.to_csv(SERIES_CSV_PATH, sep=";", index=False)
    print(f"\n✅ Séries enrichies : {SERIES_CSV_PATH}")


if __name__ == "__main__":
    print("=== Enrichissement Films ===")
    enrich_movies_with_images()
    
    print("\n=== Enrichissement Séries ===")
    enrich_series_with_images()
