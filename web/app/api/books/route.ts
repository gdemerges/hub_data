import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { Book } from '@/lib/types'

// Load covers cache
function loadCoversCache(): Record<string, string | null> {
  try {
    const cacheFile = path.join(process.cwd(), '..', 'data', 'books-covers-cache.json')
    if (fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to load covers cache:', e)
  }
  return {}
}

// Parse CSV content
function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n')
  if (lines.length === 0) return []

  // Detect separator
  const firstLine = lines[0]
  const separator = firstLine.includes(';') ? ';' : ','

  // Parse header
  const headers = firstLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''))

  // Parse rows
  const rows: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

export async function GET() {
  try {
    // Check for CSV, xlsx, or xls files in root data folder (in order of priority)
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

    // Load covers cache
    const coversCache = loadCoversCache()

    let rawData: any[]

    if (dataFile.endsWith('.csv')) {
      // Read CSV
      const content = fs.readFileSync(dataFile, 'utf-8')
      rawData = parseCSV(content)
    } else {
      // Read Excel file
      const fileBuffer = fs.readFileSync(dataFile)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rawData = XLSX.utils.sheet_to_json(worksheet)
    }

    // Map to Book interface
    const books: Book[] = rawData.map((row, index) => {
      const title = row['Titre VF'] || ''
      const cacheKey = title.toLowerCase()
      const coverUrl = coversCache[cacheKey] || undefined

      return {
        id: String(index + 1),
        title,
        titleVO: row['Titre VO'] || undefined,
        author: row['Auteur(s)'] || undefined,
        format: row['Format'] || undefined,
        lectorat: row['Lectorat'] || undefined,
        genre1: row['Genre 1'] || undefined,
        genre2: row['Genre 2'] || undefined,
        editeur: row['Editeur'] || undefined,
        collection: row['Collection'] || undefined,
        year: row['Année'] || undefined,
        pages: row['Nombre de pages'] || undefined,
        langue: row['Langue'] || undefined,
        rating: row['Note personnelle (/20)'] || undefined,
        avgRating: row['Moyenne (/20)'] || undefined,
        dateRead: row['Date de lecture'] || undefined,
        datePurchase: row["Date d'achat"] || undefined,
        type: row['Type de livre'] || undefined,
        isbn: row['ISBN'] || undefined,
        coverUrl,
      }
    }).filter(book => book.title) // Filter out empty entries

    return NextResponse.json({ books, count: books.length })
  } catch (error) {
    console.error('Books API error:', error)
    return NextResponse.json(
      { books: [], error: 'Failed to load books data' },
      { status: 500 }
    )
  }
}
