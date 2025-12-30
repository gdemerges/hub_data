import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { Book } from '@/lib/types'

export async function GET() {
  try {
    // Check for both .xlsx and .xls files
    let dataFile = path.join(process.cwd(), 'data', 'books.xlsx')
    if (!fs.existsSync(dataFile)) {
      dataFile = path.join(process.cwd(), 'data', 'books.xls')
    }

    if (!fs.existsSync(dataFile)) {
      return NextResponse.json({ books: [], error: 'No books file found' })
    }

    // Read Excel file as buffer first (required for Next.js/webpack)
    const fileBuffer = fs.readFileSync(dataFile)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet)

    // Map to Book interface
    const books: Book[] = rawData.map((row, index) => {
      return {
        id: String(index + 1),
        title: row['Titre VF'] || '',
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
