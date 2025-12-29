import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'partners.csv')

    if (!fs.existsSync(dataFile)) {
      return NextResponse.json({ count: 0, hasData: false })
    }

    const content = fs.readFileSync(dataFile, 'utf-8')
    const lines = content.trim().split('\n')

    // Count lines excluding header (first line)
    const count = Math.max(0, lines.length - 1)

    return NextResponse.json({ count, hasData: true })
  } catch (error) {
    console.error('Partners API error:', error)
    return NextResponse.json({ count: 0, hasData: false })
  }
}
