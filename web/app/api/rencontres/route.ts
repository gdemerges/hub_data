import { NextResponse } from 'next/server'
import { loadRencontres } from '@/lib/rencontres-loader'

export async function GET() {
  try {
    const result = await loadRencontres()
    return NextResponse.json(result, {
      headers: result.hasData
        ? { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' }
        : {},
    })
  } catch (error) {
    console.error('Rencontres API error:', error)
    return NextResponse.json(
      { partners: [], stats: null, hasData: false },
      { status: 500 }
    )
  }
}
