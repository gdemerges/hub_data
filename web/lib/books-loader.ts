import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { Book } from './types'
import { logger } from './logger'

interface BooksCache {
  books: Book[]
  count: number
  cachedAt: number
  sourceMtime: number
}

async function loadCoversCache(): Promise<Record<string, string | null>> {
  try {
    const cacheFile = path.join(process.cwd(), '..', 'data', 'books-covers-cache.json')
    if (fs.existsSync(cacheFile)) {
      return JSON.parse(await fsp.readFile(cacheFile, 'utf-8'))
    }
  } catch (e) {
    logger.error('Failed to load covers cache:', e)
  }
  return {}
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  if (lines.length === 0) return []
  const firstLine = lines[0]
  const separator = firstLine.includes(';') ? ';' : ','
  const headers = firstLine.split(separator).map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }
  return rows
}

/**
 * Le cache existant contient des clés mojibake (accents remplacés par des
 * caractères de contrôle U+0080–U+009F). On normalise des deux côtés en
 * strippant accents + contrôles pour retrouver les entrées corrompues.
 */
function normalizeKey(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-]/g, '')
}

function mapRawToBooks(
  rawData: Record<string, string | number>[],
  coversCache: Record<string, string | null>
): Book[] {
  // Pré-indexer le cache avec les clés normalisées pour gérer les entrées corrompues
  const normalizedCache: Record<string, string | null> = {}
  for (const [k, v] of Object.entries(coversCache)) {
    normalizedCache[normalizeKey(k)] = v
  }
  return rawData
    .map((row, index) => {
      const title = String(row['Titre VF'] || '')
      const exactKey = title.toLowerCase()
      const normKey = normalizeKey(title)
      const coverUrl =
        coversCache[exactKey] || normalizedCache[normKey] || undefined
      return {
        id: String(index + 1),
        title,
        titleVO: row['Titre VO'] ? String(row['Titre VO']) : undefined,
        author: row['Auteur(s)'] ? String(row['Auteur(s)']) : undefined,
        format: row['Format'] ? String(row['Format']) : undefined,
        lectorat: row['Lectorat'] ? String(row['Lectorat']) : undefined,
        genre1: row['Genre 1'] ? String(row['Genre 1']) : undefined,
        genre2: row['Genre 2'] ? String(row['Genre 2']) : undefined,
        editeur: row['Editeur'] ? String(row['Editeur']) : undefined,
        collection: row['Collection'] ? String(row['Collection']) : undefined,
        year: row['Année'] ? Number(row['Année']) : undefined,
        pages: row['Nombre de pages'] ? Number(row['Nombre de pages']) : undefined,
        langue: row['Langue'] ? String(row['Langue']) : undefined,
        rating: row['Note personnelle (/20)'] ? Number(row['Note personnelle (/20)']) : undefined,
        avgRating: row['Moyenne (/20)'] ? Number(row['Moyenne (/20)']) : undefined,
        dateRead: row['Date de lecture'] ? String(row['Date de lecture']) : undefined,
        datePurchase: row["Date d'achat"] ? String(row["Date d'achat"]) : undefined,
        type: row['Type de livre'] ? String(row['Type de livre']) : undefined,
        isbn: row['ISBN'] ? String(row['ISBN']) : undefined,
        coverUrl,
      }
    })
    .filter((book) => book.title)
}

/**
 * Server-only loader. Reads the books source file (xlsx/xls/csv) from ../data/,
 * uses an on-disk cache keyed on source mtime, returns [] if no source present.
 */
export async function loadBooks(): Promise<Book[]> {
  try {
    const dataDir = path.join(process.cwd(), '..', 'data')
    const candidates = [
      path.join(dataDir, 'books.xlsx'),
      path.join(dataDir, 'books.xls'),
      path.join(dataDir, 'books.csv'),
    ]
    const dataFile = candidates.find((f) => fs.existsSync(f))
    if (!dataFile) return []

    const stat = await fsp.stat(dataFile)
    const sourceMtime = stat.mtimeMs

    const cacheFile = path.join(dataDir, 'books-cache.json')
    if (fs.existsSync(cacheFile)) {
      try {
        const cached: BooksCache = JSON.parse(await fsp.readFile(cacheFile, 'utf-8'))
        if (cached.sourceMtime === sourceMtime) return cached.books
      } catch {
        // fallthrough
      }
    }

    const coversCache = await loadCoversCache()
    let rawData: Record<string, string | number>[]
    if (dataFile.endsWith('.csv')) {
      rawData = parseCSV(await fsp.readFile(dataFile, 'utf-8'))
    } else {
      const fileBuffer = await fsp.readFile(dataFile)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rawData = XLSX.utils.sheet_to_json(sheet) as Record<string, string | number>[]
    }

    const books = mapRawToBooks(rawData, coversCache)
    try {
      const cache: BooksCache = { books, count: books.length, cachedAt: Date.now(), sourceMtime }
      await fsp.writeFile(cacheFile, JSON.stringify(cache))
    } catch (e) {
      logger.error('Failed to write books cache:', e)
    }
    return books
  } catch (error) {
    logger.error('Books loader error:', error)
    return []
  }
}
