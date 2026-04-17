#!/usr/bin/env python3
"""
Script simplifié pour mettre à jour les données Hub Médias.
Usage: python update-data.py [--skip-seriebox]
"""

import os
import sys
import time
from io import StringIO

import pandas as pd
import requests
from dotenv import load_dotenv

# Chemins
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, 'web', '.env')
DATA_DIR = os.path.join(BASE_DIR, 'data', 'seriebox')

load_dotenv(ENV_PATH)

# ============ SERIEBOX ============

MAX_RETRIES = 3
INITIAL_DELAY = 2  # seconds


def _fetch_with_backoff(session: requests.Session, url: str, description: str) -> requests.Response | None:
    """Fetch a URL with exponential backoff on failure."""
    for attempt in range(MAX_RETRIES):
        try:
            response = session.get(url, headers={'Accept': 'text/csv,*/*'}, timeout=30)
            if response.status_code == 429:
                delay = INITIAL_DELAY * (2 ** attempt)
                print(f"   ⏳ Rate limited for {description}, retrying in {delay}s...")
                time.sleep(delay)
                continue
            return response
        except requests.RequestException as e:
            delay = INITIAL_DELAY * (2 ** attempt)
            print(f"   ⚠ Request failed for {description}: {e}, retrying in {delay}s...")
            time.sleep(delay)

    print(f"   ❌ All {MAX_RETRIES} attempts failed for {description}")
    return None


def _get_seriebox_session() -> requests.Session:
    """Create an authenticated SerieBox session."""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.seriebox.com/'
    })

    # Try browser cookies first
    try:
        import browser_cookie3
        try:
            cookies = browser_cookie3.firefox(domain_name="seriebox.com")
        except Exception:
            cookies = browser_cookie3.chrome(domain_name="seriebox.com")

        for c in cookies:
            session.cookies.set(c.name, c.value, domain=c.domain)
        print("   ✓ Cookies chargés depuis le navigateur")
        return session
    except ImportError:
        print("   ⚠ browser_cookie3 non installé, tentative de login...")
    except Exception:
        print("   ⚠ Pas de cookies navigateur, tentative de login...")

    # Fallback: login with username/password
    username = os.getenv('SERIEBOX_USERNAME')
    password = os.getenv('SERIEBOX_PASSWORD')

    if not username or not password:
        raise ValueError(
            "SERIEBOX_USERNAME et SERIEBOX_PASSWORD requis dans .env "
            "(ou installer browser_cookie3 pour utiliser les cookies du navigateur)"
        )

    login_data = {
        'req_username': username,
        'req_password': password,
        'redirect_url': '/'
    }
    session.post('https://www.seriebox.com/forum/login.php?action=in', data=login_data, timeout=30)
    return session


def download_from_seriebox() -> bool:
    """Télécharge les données depuis SerieBox."""
    print("📥 Téléchargement depuis SerieBox...")

    try:
        session = _get_seriebox_session()
    except ValueError as e:
        print(f"   ❌ {e}")
        return False

    # Verify profile access
    try:
        profile = session.get('https://www.seriebox.com/profil/', timeout=30)
    except requests.RequestException as e:
        print(f"   ❌ Impossible de se connecter à SerieBox: {e}")
        return False

    if profile.status_code != 200 or 'Vous devez' in profile.text:
        print("   ❌ Impossible de se connecter à SerieBox (authentification échouée)")
        return False

    print("   ✓ Connecté à SerieBox")

    os.makedirs(DATA_DIR, exist_ok=True)
    success = True

    for list_name in ['shows', 'films_vus', 'jeux']:
        url = f'https://www.seriebox.com/profil/profil_export_csv.php?list={list_name}'
        time.sleep(1.5)  # Respect rate limits

        response = _fetch_with_backoff(session, url, list_name)

        if response is None:
            print(f"   ❌ Échec pour {list_name}")
            success = False
            continue

        if response.status_code != 200 or 'Vous devez' in response.text:
            print(f"   ❌ Échec pour {list_name} (status {response.status_code})")
            success = False
            continue

        try:
            df = pd.read_csv(StringIO(response.text), sep=';', on_bad_lines='skip')
            csv_path = os.path.join(DATA_DIR, f"{list_name}.csv")
            df.to_csv(csv_path, index=False, sep=';')
            print(f"   ✓ {list_name}: {len(df)} éléments")
        except pd.errors.ParserError as e:
            print(f"   ❌ Erreur de parsing CSV pour {list_name}: {e}")
            success = False

    return success


# ============ MAIN ============

def main():
    skip_seriebox = '--skip-seriebox' in sys.argv or '-s' in sys.argv

    print("🚀 Mise à jour Hub Médias\n")

    # Step 1: Download from SerieBox (optional)
    if not skip_seriebox:
        if not download_from_seriebox():
            print("\n⚠ Utilisation des données existantes")
    else:
        print("⏭ Skip téléchargement SerieBox\n")

    # Step 2: Generate JSON with images
    print("\n🔄 Génération des JSON avec images...")
    build_script = os.path.join(BASE_DIR, 'web', 'scripts', 'build-data.ts')
    if not os.path.exists(build_script):
        print(f"❌ Script introuvable: {build_script}")
        sys.exit(1)

    os.chdir(os.path.join(BASE_DIR, 'web'))
    exit_code = os.system('npx tsx scripts/build-data.ts')

    if exit_code == 0:
        print("\n✨ Mise à jour terminée !")
    else:
        print("\n❌ Erreur lors de la génération")
        sys.exit(1)


if __name__ == '__main__':
    main()
