/**
 * refresh-book-covers.ts
 *
 * Reconstruit ../data/books-covers-cache.json depuis le xlsx + Google Books
 * (et fallback Open Library). Sauve les clés en UTF-8 propre, ce qui n'est pas
 * le cas du cache historique.
 *
 *   npx tsx scripts/refresh-book-covers.ts            # complète les manquants
 *   npx tsx scripts/refresh-book-covers.ts --force    # repart de zéro
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import * as XLSX from 'xlsx'

const DATA_DIR = resolve(__dirname, '../../data')
const XLSX_FILE = resolve(DATA_DIR, 'books.xlsx')
const CACHE_FILE = resolve(DATA_DIR, 'books-covers-cache.json')

const force = process.argv.includes('--force')

function readBookTitles(): string[] {
  if (!existsSync(XLSX_FILE)) {
    console.error(`xlsx introuvable: ${XLSX_FILE}`)
    process.exit(1)
  }
  const wb = XLSX.readFile(XLSX_FILE)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)
  return rows
    .map((r) => String(r['Titre VF'] || '').trim())
    .filter(Boolean)
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

interface GoogleBookItem {
  volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } }
}

async function googleBooksCover(title: string): Promise<string | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=1&printType=books`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { items?: GoogleBookItem[] }
    const links = data.items?.[0]?.volumeInfo?.imageLinks
    const raw = links?.thumbnail || links?.smallThumbnail
    if (!raw) return null
    // Force HTTPS et zoom plus net
    return raw.replace(/^http:/, 'https:').replace(/zoom=\d/, 'zoom=2')
  } catch {
    return null
  }
}

async function openLibraryCover(title: string): Promise<string | null> {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { docs?: { cover_i?: number }[] }
    const id = data.docs?.[0]?.cover_i
    if (!id) return null
    return `https://covers.openlibrary.org/b/id/${id}-L.jpg`
  } catch {
    return null
  }
}

async function main() {
  const titles = readBookTitles()
  const cache = loadCache()

  let fetched = 0
  let cached = 0
  let missing = 0

  console.log(`${titles.length} livres dans le xlsx, ${Object.keys(cache).length} entrées dans le cache existant`)

  for (const title of titles) {
    const key = title.toLowerCase()
    if (!force && key in cache && cache[key]) {
      cached++
      continue
    }

    let cover = await googleBooksCover(title)
    if (!cover) cover = await openLibraryCover(title)

    cache[key] = cover
    if (cover) {
      fetched++
      console.log(`  ✓ ${title}`)
    } else {
      missing++
      console.log(`  ✗ ${title}`)
    }

    // Sauvegarder régulièrement et respecter les APIs
    if ((fetched + missing) % 10 === 0) saveCache(cache)
    await sleep(120)
  }

  saveCache(cache)
  console.log(`\nFini. cached=${cached} fetched=${fetched} missing=${missing}`)
  console.log(`Cache écrit: ${CACHE_FILE}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
