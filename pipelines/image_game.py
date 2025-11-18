# pipelines/enrich_jeux_igdb.py

import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CLEAN_DIR = os.path.join(BASE_DIR, "data", "seriebox_cleaned")
CSV_PATH = os.path.join(CLEAN_DIR, "jeux_clean.csv")

ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

TWITCH_CLIENT_ID = os.getenv("IGDB_CLIENT_ID")
TWITCH_CLIENT_SECRET = os.getenv("IGDB_CLIENT_SECRET")


def get_igdb_token() -> str:
    """Récupère un token OAuth Twitch pour appeler IGDB."""
    url = "https://id.twitch.tv/oauth2/token"
    data = {
        "client_id": TWITCH_CLIENT_ID,
        "client_secret": TWITCH_CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    resp = requests.post(url, data=data)
    resp.raise_for_status()
    return resp.json()["access_token"]


def igdb_request(endpoint: str, body: str, token: str):
    """Envoie une requête à un endpoint IGDB v4."""
    url = f"https://api.igdb.com/v4/{endpoint}"
    headers = {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    resp = requests.post(url, headers=headers, data=body.encode("utf-8"))
    if resp.status_code != 200:
        print(f"[IGDB] Erreur {endpoint}: {resp.status_code} {resp.text[:200]}")
        return []
    return resp.json()


def build_cover_url(partial_url: str, size: str = "t_cover_big") -> str:
    """
    IGDB renvoie des URLs du type :
    //images.igdb.com/igdb/image/upload/t_thumb/co1abc.jpg
    On peut changer la taille (t_thumb -> t_cover_big).
    """
    if not partial_url:
        return None
    url = partial_url
    # forcer https
    if url.startswith("//"):
        url = "https:" + url
    # changer la taille si besoin
    return url.replace("t_thumb", size)


def find_game_cover_url(title: str, token: str) -> str | None:
    """Recherche un jeu par titre VO et renvoie une URL de cover si trouvée."""
    # 1) chercher le jeu
    body = f'search "{title}"; fields name,cover; limit 1;'
    games = igdb_request("games", body, token)
    if not games:
        print(f"[IGDB] Aucun résultat pour: {title}")
        return None

    game = games[0]
    cover_id = game.get("cover")
    if not cover_id:
        print(f"[IGDB] Pas de cover pour: {title}")
        return None

    # 2) récupérer la cover
    body = f"fields url; where id = {cover_id};"
    covers = igdb_request("covers", body, token)
    if not covers:
        print(f"[IGDB] Cover introuvable pour: {title}")
        return None

    cover = covers[0]
    partial_url = cover.get("url")
    full_url = build_cover_url(partial_url)
    print(f"[IGDB] {title} -> {full_url}")
    return full_url


def enrich_jeux_with_images():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"{CSV_PATH} introuvable")

    df = pd.read_csv(CSV_PATH, sep=";")

    # On suppose qu'il y a au moins une des colonnes de titre
    possible_title_cols = ["Titre VO", "Titre VF", "Titre"]
    existing_title_cols = [c for c in possible_title_cols if c in df.columns]
    if not existing_title_cols:
        raise ValueError('Aucune des colonnes de titre ("Titre VO", "Titre VF", "Titre") n\'est présente dans jeux_clean.csv')

    # Crée la colonne image_url si elle n'existe pas
    if "image_url" not in df.columns:
        df["image_url"] = None

    token = get_igdb_token()

    # Itérer sur les lignes sans image_url
    for idx, row in df[df["image_url"].isna()].iterrows():
        titles_to_try = []
        for col in ["Titre VO", "Titre VF", "Titre"]:
            if col in df.columns:
                value = str(row[col]).strip()
                if value and value.lower() != "nan" and value not in titles_to_try:
                    titles_to_try.append(value)

        if not titles_to_try:
            continue

        url = None
        for title in titles_to_try:
            try:
                url = find_game_cover_url(title, token)
            except Exception as e:
                print(f"[Erreur] {title}: {e}")
                url = None

            if url:
                break

            # éviter de se faire rate-limit entre deux requêtes IGDB
            time.sleep(0.25)

        if url:
            df.at[idx, "image_url"] = url

        # petite pause pour rester gentil avec l'API
        time.sleep(0.25)

    # Sauvegarde : soit on écrase, soit on fait un backup avant si tu préfères
    df.to_csv(CSV_PATH, sep=";", index=False)
    print(f"✅ Enrichissement terminé. Fichier mis à jour : {CSV_PATH}")


if __name__ == "__main__":
    enrich_jeux_with_images()
