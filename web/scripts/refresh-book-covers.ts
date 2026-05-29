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

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
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

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function authorLastName(a?: string): string {
  if (!a) return ''
  // Strip "et", "and", roles. Keep first comma-separated piece for primary author.
  const first = a.split(/[,;&]| et /i)[0].trim()
  // CSV uses "Asimov Isaac" — last name first.
  const tokens = first.split(/\s+/).filter(Boolean)
  return tokens[0] ? normalize(tokens[0]) : ''
}

function scoreMatch(
  candidateTitle: string,
  candidateAuthors: string[],
  expectedTitle: string,
  expectedAuthor?: string
): number {
  const ct = normalize(candidateTitle)
  const et = normalize(expectedTitle)
  let s = 0
  if (ct === et) s += 1000
  else if (ct.startsWith(`${et} `)) s += 500
  else if (ct.startsWith(et)) s += 350
  else if (ct.includes(et)) s += 150
  // shared word ratio
  const cw = new Set(ct.split(' '))
  const ew = et.split(' ')
  const shared = ew.filter(w => w.length > 2 && cw.has(w)).length
  s += shared * 25
  // author match
  if (expectedAuthor) {
    const expectedLast = authorLastName(expectedAuthor)
    if (expectedLast && candidateAuthors.some(a => normalize(a).includes(expectedLast))) {
      s += 200
    }
  }
  return s
}

async function openLibraryByIsbn(isbn: string): Promise<string | null> {
  // ?default=false → server returns 404 if no real cover (avoids placeholder image).
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (!res.ok) return null
    return url
  } catch {
    return null
  }
}

interface OLDoc {
  title?: string
  author_name?: string[]
  cover_i?: number
  isbn?: string[]
}

async function openLibrarySearch(title: string, author?: string): Promise<string | null> {
  const q = author ? `${title} ${author}` : title
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name,cover_i,isbn`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { docs?: OLDoc[] }
    const docs = data.docs ?? []
    if (!docs.length) return null
    const scored = docs
      .map(d => ({
        d,
        score: scoreMatch(d.title ?? '', d.author_name ?? [], title, author),
      }))
      .sort((a, b) => b.score - a.score)
    for (const { d, score } of scored) {
      if (score < 100) break // poor match — skip
      if (d.cover_i) return `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg?default=false`
      for (const isbn of (d.isbn ?? []).slice(0, 3)) {
        const cover = await openLibraryByIsbn(isbn)
        if (cover) return cover
      }
    }
    return null
  } catch {
    return null
  }
}

interface GoogleBookItem {
  volumeInfo?: {
    title?: string
    authors?: string[]
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
  }
}

function pickGoogleImage(links?: { thumbnail?: string; smallThumbnail?: string }): string | null {
  const raw = links?.thumbnail || links?.smallThumbnail
  if (!raw) return null
  // Drop edge=curl (paper-curl effect), bump zoom for higher resolution.
  return raw
    .replace(/^http:/, 'https:')
    .replace(/&edge=curl/g, '')
    .replace(/zoom=\d/, 'zoom=1')
}

async function googleBooks(title: string, author?: string, isbn?: string): Promise<string | null> {
  const q = isbn ? `isbn:${isbn}` : `intitle:${title}${author ? `+inauthor:${author}` : ''}`
  let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8`
  if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { items?: GoogleBookItem[] }
    const items = data.items ?? []
    if (!items.length) return null
    if (isbn) {
      // ISBN query is precise — first item with image wins.
      for (const it of items) {
        const img = pickGoogleImage(it.volumeInfo?.imageLinks)
        if (img) return img
      }
      return null
    }
    const scored = items
      .map(it => {
        const v = it.volumeInfo
        return {
          it,
          score: scoreMatch(v?.title ?? '', v?.authors ?? [], title, author),
        }
      })
      .sort((a, b) => b.score - a.score)
    for (const { it, score } of scored) {
      if (score < 100) break
      const img = pickGoogleImage(it.volumeInfo?.imageLinks)
      if (img) return img
    }
    return null
  } catch {
    return null
  }
}

async function findCover(book: BookRow): Promise<string | null> {
  // ISBN paths first — they're effectively unambiguous when valid.
  if (book.isbn) {
    const c = await openLibraryByIsbn(book.isbn)
    if (c) return c
    await sleep(150)
    const c2 = await googleBooks(book.title, book.author, book.isbn)
    if (c2) return c2
    await sleep(150)
  }
  // Title+author search with similarity scoring & author validation.
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
