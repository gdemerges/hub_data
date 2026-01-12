#!/usr/bin/env python3
"""
Script pour enrichir les livres avec les couvertures depuis Open Library et Google Books.
Usage: python image_books.py
"""

import os
import time
import json
import requests
import pandas as pd
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CACHE_FILE = os.path.join(DATA_DIR, "books-covers-cache.json")

# Fichiers supportés (par ordre de priorité)
BOOKS_FILES = [
    os.path.join(DATA_DIR, "books.csv"),
    os.path.join(DATA_DIR, "books.xlsx"),
    os.path.join(DATA_DIR, "books.xls"),
]

ENV_PATH = os.path.join(BASE_DIR, "web", ".env")
load_dotenv(ENV_PATH)

GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")  # Optionnel


def load_cache() -> dict:
    """Charge le cache des couvertures."""
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict):
    """Sauvegarde le cache des couvertures."""
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def clean_isbn(isbn: str) -> str | None:
    """Nettoie un ISBN (retire les tirets, espaces, etc.)."""
    if not isbn or str(isbn).lower() == "nan":
        return None
    isbn = str(isbn).strip()
    # Retirer tout sauf les chiffres et X
    isbn = "".join(c for c in isbn if c.isdigit() or c.upper() == "X")
    if len(isbn) in [10, 13]:
        return isbn
    return None


def get_cover_from_openlibrary_isbn(isbn: str) -> str | None:
    """Récupère la couverture depuis Open Library via ISBN."""
    # Open Library permet d'accéder directement à l'image
    # On vérifie d'abord si l'image existe
    url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"

    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        # Open Library retourne une image de 1x1 pixel si pas de couverture
        if response.status_code == 200:
            content_length = response.headers.get("Content-Length", "0")
            if int(content_length) > 1000:  # Plus de 1KB = vraie image
                return url
    except Exception as e:
        print(f"  [OpenLibrary] Erreur: {e}")

    return None


def get_cover_from_openlibrary_search(title: str, author: str = None) -> str | None:
    """Recherche un livre sur Open Library et récupère la couverture."""
    query = title
    if author:
        query = f"{title} {author}"

    url = f"https://openlibrary.org/search.json?q={requests.utils.quote(query)}&limit=1"

    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return None

        data = response.json()
        docs = data.get("docs", [])

        if not docs:
            return None

        # Chercher un cover_i (cover ID)
        cover_id = docs[0].get("cover_i")
        if cover_id:
            return f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"

        # Sinon essayer avec l'ISBN du résultat
        isbns = docs[0].get("isbn", [])
        if isbns:
            for isbn in isbns[:3]:  # Essayer les 3 premiers
                cover_url = get_cover_from_openlibrary_isbn(isbn)
                if cover_url:
                    return cover_url

    except Exception as e:
        print(f"  [OpenLibrary Search] Erreur: {e}")

    return None


def get_cover_from_google_books(title: str, author: str = None, isbn: str = None) -> str | None:
    """Recherche un livre sur Google Books et récupère la couverture."""
    if isbn:
        query = f"isbn:{isbn}"
    else:
        query = f"intitle:{title}"
        if author:
            query += f"+inauthor:{author}"

    url = f"https://www.googleapis.com/books/v1/volumes?q={requests.utils.quote(query)}&maxResults=1"
    if GOOGLE_BOOKS_API_KEY:
        url += f"&key={GOOGLE_BOOKS_API_KEY}"

    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return None

        data = response.json()
        items = data.get("items", [])

        if not items:
            return None

        volume_info = items[0].get("volumeInfo", {})
        image_links = volume_info.get("imageLinks", {})

        # Préférer thumbnail ou smallThumbnail
        cover_url = image_links.get("thumbnail") or image_links.get("smallThumbnail")

        if cover_url:
            # Augmenter la taille de l'image
            cover_url = cover_url.replace("zoom=1", "zoom=2")
            # Forcer HTTPS
            cover_url = cover_url.replace("http://", "https://")
            return cover_url

    except Exception as e:
        print(f"  [Google Books] Erreur: {e}")

    return None


def find_book_cover(title: str, author: str = None, isbn: str = None) -> str | None:
    """Cherche la couverture d'un livre en essayant plusieurs sources."""

    # 1. Essayer avec ISBN sur Open Library
    if isbn:
        print(f"  Essai Open Library (ISBN: {isbn})...")
        cover = get_cover_from_openlibrary_isbn(isbn)
        if cover:
            print(f"  ✅ Trouvé via Open Library ISBN")
            return cover
        time.sleep(0.2)

    # 2. Essayer avec ISBN sur Google Books
    if isbn:
        print(f"  Essai Google Books (ISBN)...")
        cover = get_cover_from_google_books(title, author, isbn)
        if cover:
            print(f"  ✅ Trouvé via Google Books ISBN")
            return cover
        time.sleep(0.2)

    # 3. Recherche par titre/auteur sur Open Library
    print(f"  Essai Open Library (recherche)...")
    cover = get_cover_from_openlibrary_search(title, author)
    if cover:
        print(f"  ✅ Trouvé via Open Library Search")
        return cover
    time.sleep(0.2)

    # 4. Recherche par titre/auteur sur Google Books
    print(f"  Essai Google Books (recherche)...")
    cover = get_cover_from_google_books(title, author)
    if cover:
        print(f"  ✅ Trouvé via Google Books Search")
        return cover

    print(f"  ❌ Aucune couverture trouvée")
    return None


def main():
    print("📚 Enrichissement des couvertures de livres\n")

    # Trouver le fichier de livres
    books_file = None
    for f in BOOKS_FILES:
        if os.path.exists(f):
            books_file = f
            break

    if not books_file:
        print("❌ Aucun fichier de livres trouvé")
        print(f"   Fichiers recherchés:")
        for f in BOOKS_FILES:
            print(f"   - {f}")
        return

    print(f"📄 Fichier trouvé: {os.path.basename(books_file)}")

    # Charger les livres selon le format
    df = None

    # CSV
    if books_file.endswith('.csv'):
        try:
            # Essayer différents séparateurs
            for sep in [';', ',', '\t']:
                try:
                    df = pd.read_csv(books_file, sep=sep, encoding='utf-8')
                    if len(df.columns) > 1:
                        print(f"   ✓ Chargé (CSV, séparateur: '{sep}')")
                        break
                except:
                    pass
            if df is None or len(df.columns) <= 1:
                df = pd.read_csv(books_file, encoding='utf-8')
                print("   ✓ Chargé (CSV)")
        except Exception as e:
            # Essayer avec latin-1
            try:
                df = pd.read_csv(books_file, sep=';', encoding='latin-1')
                print("   ✓ Chargé (CSV, encoding latin-1)")
            except Exception as e2:
                print(f"⚠️  CSV échoué: {e2}")

    # XLSX
    elif books_file.endswith('.xlsx'):
        try:
            df = pd.read_excel(books_file, engine='openpyxl')
            print("   ✓ Chargé (xlsx)")
        except Exception as e:
            print(f"⚠️  xlsx échoué: {e}")

    # XLS
    elif books_file.endswith('.xls'):
        try:
            df = pd.read_excel(books_file, engine='xlrd')
            print("   ✓ Chargé (xls)")
        except Exception as e:
            print(f"⚠️  xls échoué: {e}")
            # Fallback pyexcel
            try:
                import pyexcel
                records = pyexcel.get_records(file_name=books_file)
                df = pd.DataFrame(records)
                print("   ✓ Chargé (pyexcel)")
            except Exception as e2:
                print(f"⚠️  pyexcel échoué: {e2}")

    if df is None or len(df) == 0:
        print("\n❌ Impossible de lire le fichier ou fichier vide")
        print("💡 Conseil: Exporte en CSV depuis Livraddict ou Excel/LibreOffice")
        return

    print(f"📖 {len(df)} livres chargés")
    print(f"   Colonnes: {', '.join(df.columns[:5])}{'...' if len(df.columns) > 5 else ''}\n")

    # Charger le cache
    cache = load_cache()
    print(f"💾 {len(cache)} couvertures en cache\n")

    # Colonnes possibles pour le titre
    title_cols = ["Titre VF", "Titre VO", "Titre"]
    title_col = next((c for c in title_cols if c in df.columns), None)

    if not title_col:
        print("❌ Aucune colonne de titre trouvée")
        return

    # Colonne auteur
    author_col = "Auteur(s)" if "Auteur(s)" in df.columns else None

    # Colonne ISBN
    isbn_col = "ISBN" if "ISBN" in df.columns else None

    found = 0
    not_found = 0
    cached = 0

    for idx, row in df.iterrows():
        title = str(row.get(title_col, "")).strip()
        if not title or title.lower() == "nan":
            continue

        # Clé de cache basée sur le titre
        cache_key = title.lower()

        # Vérifier le cache
        if cache_key in cache:
            cached += 1
            continue

        author = str(row.get(author_col, "")).strip() if author_col else None
        if author and author.lower() == "nan":
            author = None

        isbn = clean_isbn(row.get(isbn_col)) if isbn_col else None

        print(f"\n[{idx + 1}/{len(df)}] {title}")
        if author:
            print(f"  Auteur: {author}")
        if isbn:
            print(f"  ISBN: {isbn}")

        cover_url = find_book_cover(title, author, isbn)

        if cover_url:
            cache[cache_key] = cover_url
            found += 1
        else:
            cache[cache_key] = None  # Marquer comme cherché mais non trouvé
            not_found += 1

        # Sauvegarder le cache régulièrement
        if (found + not_found) % 10 == 0:
            save_cache(cache)

        time.sleep(0.3)  # Rate limiting

    # Sauvegarder le cache final
    save_cache(cache)

    print(f"\n✨ Terminé!")
    print(f"   - Trouvées: {found}")
    print(f"   - Non trouvées: {not_found}")
    print(f"   - En cache: {cached}")
    print(f"   - Cache total: {len(cache)} entrées")


if __name__ == "__main__":
    main()
