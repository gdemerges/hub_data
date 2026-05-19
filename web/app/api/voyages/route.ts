import { NextResponse } from 'next/server'
import { loadVoyages } from '@/lib/voyages'
import { logger } from '@/lib/logger'

const HEADERS = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' }

export async function GET() {
  try {
    const stats = await loadVoyages()
    if (!stats) {
      return NextResponse.json({ error: 'No location history data found' }, { status: 404 })
    }
    return NextResponse.json(stats, { headers: HEADERS })
  } catch (error) {
    logger.error('Voyages API error:', error)
    return NextResponse.json({ error: 'Failed to load voyages' }, { status: 500 })
  }
}
