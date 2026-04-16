import { NextResponse } from 'next/server'
import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { Book } from '@/lib/types'

interface BooksCache {
  books: Book[]
  count: number
  cachedAt: number
  sourceMtime: number
}

// Load covers cache
async function loadCoversCache(): Promise<Record<string, string | null>> {
  try {
    const cacheFile = path.join(process.cwd(), '..', 'data', 'books-covers-cache.json')
    if (fs.existsSync(cacheFile)) {
      const content = await fsp.readFile(cacheFile, 'utf-8')
      return JSON.parse(content) as Record<string, string | null>
    }
  } catch (e) {
    console.error('Failed to load covers cache:', e)
  }
  return {}
}

// Parse CSV content
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  if (lines.length === 0) return []

  // Detect separator
  const firstLine = lines[0]
  const separator = firstLine.includes(';') ? ';' : ','

  // Parse header
  const headers = firstLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''))

  // Parse rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

function mapRawToBooks(rawData: Record<string, string | number>[], coversCache: Record<string, string | null>): Book[] {
  return rawData.map((row, index) => {
    const title = String(row['Titre VF'] || '')
    const cacheKey = title.toLowerCase()
    const coverUrl = coversCache[cacheKey] || undefined

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
  }).filter(book => book.title)
}

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' }

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), '..', 'data')
    const possibleFiles = [
      path.join(dataDir, 'books.csv'),
      path.join(dataDir, 'books.xlsx'),
      path.join(dataDir, 'books.xls'),
    ]

    let dataFile: string | null = null
    for (const f of possibleFiles) {
      if (fs.existsSync(f)) {
        dataFile = f
        break
      }
    }

    if (!dataFile) {
      return NextResponse.json({ books: [], error: 'No books file found' })
    }

    // Get source file mtime
    const stat = await fsp.stat(dataFile)
    const sourceMtime = stat.mtimeMs

    // Try to serve from cache
    const cacheFile = path.join(dataDir, 'books-cache.json')
    if (fs.existsSync(cacheFile)) {
      try {
        const cached: BooksCache = JSON.parse(await fsp.readFile(cacheFile, 'utf-8'))
        if (cached.sourceMtime === sourceMtime) {
          return NextResponse.json(
            { books: cached.books, count: cached.count },
            { headers: CACHE_HEADERS }
          )
        }
      } catch {
        // Stale or corrupt cache — fall through to re-parse
      }
    }

    // Cache miss: parse source file
    const coversCache = await loadCoversCache()
    let rawData: Record<string, string | number>[]

    if (dataFile.endsWith('.csv')) {
      const content = await fsp.readFile(dataFile, 'utf-8')
      rawData = parseCSV(content)
    } else {
      const fileBuffer = await fsp.readFile(dataFile)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rawData = XLSX.utils.sheet_to_json(worksheet) as Record<string, string | number>[]
    }

    const books = mapRawToBooks(rawData, coversCache)

    // Persist cache
    try {
      const cache: BooksCache = { books, count: books.length, cachedAt: Date.now(), sourceMtime }
      await fsp.writeFile(cacheFile, JSON.stringify(cache))
    } catch (e) {
      console.error('Failed to write books cache:', e)
    }

    return NextResponse.json({ books, count: books.length }, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error('Books API error:', error)
    return NextResponse.json(
      { books: [], error: 'Failed to load books data' },
      { status: 500 }
    )
  }
}
