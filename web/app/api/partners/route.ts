import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'partners.csv')

    if (!fs.existsSync(dataFile)) {
      return NextResponse.json({ count: 0, hasData: false })
    }

    const content = fs.readFileSync(dataFile, 'utf-8')
    const lines = content.trim().split('\n')

    // Get year parameter from query string
    const year = request.nextUrl.searchParams.get('year')

    if (!year) {
      // No year filter - count all lines excluding header
      const count = Math.max(0, lines.length - 1)
      return NextResponse.json({ count, hasData: true })
    }

    // Filter by year - parse CSV and check "Année" column (index 4)
    const targetYear = parseInt(year)
    let count = 0

    for (let i = 1; i < lines.length; i++) {
      // Skip header (index 0)
      const line = lines[i]
      if (!line.trim()) continue // Skip empty lines

      const columns = line.split(';')
      const yearColumn = columns[4]?.trim() // "Année" column

      if (yearColumn && parseInt(yearColumn) === targetYear) {
        count++
      }
    }

    return NextResponse.json({ count, hasData: true })
  } catch (error) {
    console.error('Partners API error:', error)
    return NextResponse.json({ count: 0, hasData: false })
  }
}
