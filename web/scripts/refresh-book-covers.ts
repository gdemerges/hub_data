/**
 * refresh-book-covers.ts
 *
 * Reconstruit ../data/books-covers-cache.json en cherchant les couvertures via
 * Open Library (ISBN puis recherche) et Google Books (ISBN puis recherche).
 * Lit books.csv / books.xls / books.xlsx (par ordre de priorité).
 *
 *   npx tsx scripts/refresh-book-covers.ts            # complète les manquants
 *   npx tsx scripts/refresh-book-covers.ts --force    # repart de zéro
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import * as XLSX from 'xlsx'

const DATA_DIR = resolve(__dirname, '../../data')
const BOOKS_FILES = ['books.csv', 'books.xlsx', 'books.xls'].map((f) => resolve(DATA_DIR, f))
const CACHE_FILE = resolve(DATA_DIR, 'books-covers-cache.json')
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY

const force = process.argv.includes('--force')

interface BookRow {
  title: string
  author?: string
  isbn?: string
}

function readBooks(): BookRow[] {
  const file = BOOKS_FILES.find((f) => existsSync(f))
  if (!file) {
    console.error(`Aucun fichier livres trouvé dans ${DATA_DIR} (books.csv/.xls/.xlsx)`)
    process.exit(1)
  }
  console.log(`Source: ${file}`)
  const wb = XLSX.readFile(file)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false })

  const titleCols = ['Titre VF', 'Titre VO', 'Titre']
  const authorCol = 'Auteur(s)'
  const isbnCol = 'ISBN'

  const out: BookRow[] = []
  for (const r of rows) {
    const titleCol = titleCols.find((c) => r[c])
    if (!titleCol) continue
    const title = String(r[titleCol]).trim()
    if (!title || title.toLowerCase() === 'nan') continue
    const authorRaw = r[authorCol] ? String(r[authorCol]).trim() : ''
    const author = authorRaw && authorRaw.toLowerCase() !== 'nan' ? authorRaw : undefined
    out.push({ title, author, isbn: cleanIsbn(r[isbnCol]) })
  }
  return out
}

function cleanIsbn(raw: unknown): string | undefined {
  if (raw == null) return undefined
  let s = String(raw).trim()
  if (!s || s.toLowerCase() === 'nan') return undefined
  // Excel scientific notation, FR or EN decimal sep
  if (/e[+-]/i.test(s)) {
    const n = Number(s.replace(',', '.'))
    if (!Number.isFinite(n)) return undefined
    s = String(Math.round(n))
  }
  s = s.replace(/[^0-9Xx]/g, '')
  return s.length === 10 || s.length === 13 ? s : undefined
}

function loadCache(): Record<string, string | null> {
  if (force || !existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, string | null>): void {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function openLibraryByIsbn(isbn: string): Promise<string | null> {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (!res.ok) return null
    const len = Number(res.headers.get('content-length') ?? '0')
    return len > 1000 ? url : null
  } catch {
    return null
  }
}

async function openLibrarySearch(title: string, author?: string): Promise<string | null> {
  const q = author ? `${title} ${author}` : title
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=1`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { docs?: { cover_i?: number; isbn?: string[] }[] }
    const doc = data.docs?.[0]
    if (!doc) return null
    if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    for (const isbn of (doc.isbn ?? []).slice(0, 3)) {
      const cover = await openLibraryByIsbn(isbn)
      if (cover) return cover
    }
    return null
  } catch {
    return null
  }
}

interface GoogleBookItem {
  volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } }
}

async function googleBooks(title: string, author?: string, isbn?: string): Promise<string | null> {
  const q = isbn ? `isbn:${isbn}` : `intitle:${title}${author ? `+inauthor:${author}` : ''}`
  let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`
  if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { items?: GoogleBookItem[] }
    const links = data.items?.[0]?.volumeInfo?.imageLinks
    const raw = links?.thumbnail || links?.smallThumbnail
    if (!raw) return null
    return raw.replace(/^http:/, 'https:').replace(/zoom=\d/, 'zoom=2')
  } catch {
    return null
  }
}

async function findCover(book: BookRow): Promise<string | null> {
  if (book.isbn) {
    const c = await openLibraryByIsbn(book.isbn)
    if (c) return c
    await sleep(150)
    const c2 = await googleBooks(book.title, book.author, book.isbn)
    if (c2) return c2
    await sleep(150)
  }
  const c3 = await openLibrarySearch(book.title, book.author)
  if (c3) return c3
  await sleep(150)
  return googleBooks(book.title, book.author)
}

async function main() {
  const books = readBooks()
  const cache = loadCache()

  let fetched = 0
  let cached = 0
  let missing = 0

  console.log(`${books.length} livres, ${Object.keys(cache).length} entrées en cache`)

  for (const book of books) {
    const key = book.title.toLowerCase()
    if (!force && key in cache) {
      cached++
      continue
    }

    const cover = await findCover(book)
    cache[key] = cover

    if (cover) {
      fetched++
      console.log(`  ✓ ${book.title}`)
    } else {
      missing++
      console.log(`  ✗ ${book.title}`)
    }

    if ((fetched + missing) % 10 === 0) saveCache(cache)
    await sleep(300)
  }

  saveCache(cache)
  console.log(`\nFini. cached=${cached} fetched=${fetched} missing=${missing}`)
  console.log(`Cache: ${CACHE_FILE}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
