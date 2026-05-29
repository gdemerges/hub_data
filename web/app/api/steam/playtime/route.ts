import { NextRequest, NextResponse } from 'next/server'
import { loadPlaytime } from '@/lib/steam-playtime'
import { logger } from '@/lib/logger'

// Dynamique : la réponse varie selon ?year=. Le cache est assuré côté CDN
// par l'en-tête Cache-Control ci-dessous, pas par l'ISR (revalidate), qui
// entrerait en conflit avec la lecture de searchParams au build.
export const dynamic = 'force-dynamic'

const HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' }

export async function GET(request: NextRequest) {
  try {
    const yearParam = request.nextUrl.searchParams.get('year')
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()
    return NextResponse.json(await loadPlaytime(year), { headers: HEADERS })
  } catch (error) {
    logger.error('Steam playtime API error:', error)
    return NextResponse.json({ error: 'Failed to fetch playtime data' }, { status: 500 })
  }
}
