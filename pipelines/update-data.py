#!/usr/bin/env python3
"""
Script simplifié pour mettre à jour les données Hub Médias.
Usage: python update-data.py [--skip-seriebox]
"""

import os
import sys
import requests
import pandas as pd
import time
from io import StringIO
from dotenv import load_dotenv

# Chemins
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, 'web', '.env')
DATA_DIR = os.path.join(BASE_DIR, 'data', 'seriebox')

load_dotenv(ENV_PATH)

# ============ SERIEBOX ============

def download_from_seriebox():
    """Télécharge les données depuis SerieBox"""
    print("📥 Téléchargement depuis SerieBox...")
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.seriebox.com/'
    })
    
    # Tentative avec cookies du navigateur
    try:
        import browser_cookie3
        try:
            cookies = browser_cookie3.firefox(domain_name="seriebox.com")
        except:
            cookies = browser_cookie3.chrome(domain_name="seriebox.com")
        
        for c in cookies:
            session.cookies.set(c.name, c.value, domain=c.domain)
        print("   ✓ Cookies chargés depuis le navigateur")
    except Exception as e:
        # Fallback: login avec username/password
        print(f"   ⚠ Pas de cookies navigateur, tentative de login...")
        login_data = {
            'req_username': os.getenv('SERIEBOX_USERNAME'),
            'req_password': os.getenv('SERIEBOX_PASSWORD'),
            'redirect_url': '/'
        }
        session.post('https://www.seriebox.com/forum/login.php?action=in', data=login_data)
    
    # Vérifier l'accès au profil
    profile = session.get('https://www.seriebox.com/profil/')
    if profile.status_code != 200 or 'Vous devez' in profile.text:
        print("   ❌ Impossible de se connecter à SerieBox")
        return False
    
    print("   ✓ Connecté à SerieBox")
    
    # Télécharger les CSVs
    os.makedirs(DATA_DIR, exist_ok=True)
    
    for list_name in ['shows', 'films_vus', 'jeux']:
        url = f'https://www.seriebox.com/profil/profil_export_csv.php?list={list_name}'
        time.sleep(1)
        
        response = session.get(url, headers={'Accept': 'text/csv,*/*'})
        
        if response.status_code == 200 and 'Vous devez' not in response.text:
            df = pd.read_csv(StringIO(response.text), sep=';', on_bad_lines='skip')
            csv_path = os.path.join(DATA_DIR, f"{list_name}.csv")
            df.to_csv(csv_path, index=False, sep=';')
            print(f"   ✓ {list_name}: {len(df)} éléments")
        else:
            print(f"   ❌ Échec pour {list_name}")
    
    return True

# ============ MAIN ============

def main():
    skip_seriebox = '--skip-seriebox' in sys.argv or '-s' in sys.argv
    
    print("🚀 Mise à jour Hub Médias\n")
    
    # Étape 1: Télécharger depuis SerieBox (optionnel)
    if not skip_seriebox:
        if not download_from_seriebox():
            print("\n⚠ Utilisation des données existantes")
    else:
        print("⏭ Skip téléchargement SerieBox\n")
    
    # Étape 2: Générer les JSON avec images
    print("\n🔄 Génération des JSON avec images...")
    os.chdir(os.path.join(BASE_DIR, 'web'))
    exit_code = os.system('npx tsx scripts/build-data.ts')
    
    if exit_code == 0:
        print("\n✨ Mise à jour terminée !")
    else:
        print("\n❌ Erreur lors de la génération")
        sys.exit(1)

if __name__ == '__main__':
    main()
