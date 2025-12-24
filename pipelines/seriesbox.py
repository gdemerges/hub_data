import requests
import pandas as pd
import os
import time
from io import StringIO
from dotenv import load_dotenv
from http.cookies import SimpleCookie
from requests.cookies import create_cookie
import browser_cookie3

# Chargement des variables d'environnement
env_path = os.path.join(os.path.dirname(__file__), '..', 'web', '.env')
load_dotenv(env_path)

# Création du dossier data/seriebox s'il n'existe pas
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'seriebox')
os.makedirs(DATA_DIR, exist_ok=True)

# Dossier de sortie pour les CSV nettoyés
CLEAN_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'seriebox_cleaned')
os.makedirs(CLEAN_DIR, exist_ok=True)

def load_browser_cookies(session: requests.Session) -> bool:
    """Charge automatiquement les cookies du navigateur."""
    try:
        cookies = browser_cookie3.firefox(domain_name="seriebox.com")
    except:
        try:
            cookies = browser_cookie3.chrome(domain_name="seriebox.com")
        except:
            print("Impossible de charger automatiquement les cookies navigateur.")
            return False

    for c in cookies:
        session.cookies.set_cookie(
            create_cookie(
                name=c.name,
                value=c.value,
                domain=c.domain,
                path=c.path
            )
        )

    print("Cookies chargés automatiquement depuis le navigateur.")
    return True

def login(session: requests.Session) -> bool:
    """Tente de se connecter avec username/password"""
    session.get('https://www.seriebox.com/')
    
    login_data = {
        'req_username': os.getenv('SERIEBOX_USERNAME'),
        'req_password': os.getenv('SERIEBOX_PASSWORD'),
        'redirect_url': '/'
    }
    
    login_response = session.post(
        'https://www.seriebox.com/forum/login.php?action=in',
        data=login_data,
        allow_redirects=True
    )
    return login_response.status_code == 200

def download_csv(session: requests.Session, list_name: str) -> pd.DataFrame:
    """Télécharge et parse un CSV depuis seriebox"""
    url = f'https://www.seriebox.com/profil/profil_export_csv.php?list={list_name}'
    
    headers = {
        'Referer': 'https://www.seriebox.com/profil/',
        'Accept': 'text/csv,*/*'
    }
    
    time.sleep(1)
    response = session.get(url, headers=headers, allow_redirects=True)
    
    print(f"Debug {list_name}: status={response.status_code}, contenu début: {response.text[:100]}")
    
    if response.status_code != 200 or 'Vous devez' in response.text:
        print(f"Échec téléchargement {list_name}")
        return None
    
    try:
        df = pd.read_csv(
            StringIO(response.text),
            sep=';',
            quotechar='"',
            on_bad_lines='skip'
        )
        
        csv_path = os.path.join(DATA_DIR, f"{list_name}.csv")
        df.to_csv(csv_path, index=False, sep=';')
        print(f"{list_name}: {len(df)} lignes → {csv_path}")
        return df
        
    except Exception as e:
        print(f"Erreur parsing {list_name}: {e}")
        return None

def clean_downloaded_csvs():
    """Nettoie les CSVs téléchargés et conserve uniquement les colonnes demandées.
    - shows.csv      -> garde: ["Titre"]
    - films_vus.csv  -> garde: ["Titre"]
    - jeux.csv       -> garde: ["Titre", "Support", "Heures de jeu"]
    Les CSV nettoyés sont écrits dans data/seriebox_cleaned.
    """
    keep_map = {
        'shows': ["Titre"],
        'films_vus': ["Titre"],
        'jeux': ["Titre", "Support", "Heures de jeu"],
    }

    for list_name, keep_cols in keep_map.items():
        src_path = os.path.join(DATA_DIR, f"{list_name}.csv")
        if not os.path.exists(src_path):
            print(f"[clean] Ignoré: {src_path} introuvable")
            continue
        try:
            df = pd.read_csv(src_path, sep=';', dtype=str)
            df.columns = [c.strip() for c in df.columns]
            existing = [c for c in keep_cols if c in df.columns]
            if not existing:
                print(f"Aucune des colonnes demandées {keep_cols} n'existe dans {list_name}. Colonnes disponibles: {list(df.columns)}")
                continue
            cleaned = df[existing].copy()
            dst_path = os.path.join(CLEAN_DIR, f"{list_name}_clean.csv")
            cleaned.to_csv(dst_path, index=False, sep=';')
            print(f"[clean] {list_name}: {len(cleaned)} lignes -> {dst_path} avec colonnes {existing}")
        except Exception as e:
            print(f"[clean] Erreur pour {list_name}: {e}")

# Configuration de la session
session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://www.seriebox.com/'
})

# Authentification (cookies navigateur ou login)
if not load_browser_cookies(session):
    print("Tentative de connexion avec username/password...")
    if not login(session):
        print("✗ Échec de connexion")
        exit(1)

# Vérification accès profil
profile = session.get('https://www.seriebox.com/profil/')
if profile.status_code != 200 or 'Vous devez' in profile.text:
    print("Impossible d'accéder au profil. Vérifiez vos cookies ou identifiants.")
    exit(1)

print("Accès profil réussi")

for list_name in ['shows', 'films_vus', 'jeux']:
    download_csv(session, list_name)

clean_downloaded_csvs()
print("Nettoyage terminé. Fichiers nettoyés dans:", CLEAN_DIR)
