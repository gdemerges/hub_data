import { type NextRequest, NextResponse } from 'next/server'
import { getFilmsData, getGamesData, getBooksData } from '@/lib/data'
import { eventsOnDate } from '@/lib/day-detail'
import { logger } from '@/lib/logger'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  if (!date || !DATE_RE.test(date)) {
    return NextResponse.json({ events: [], hasData: false, error: 'Invalid date' }, { status: 400 })
  }

  try {
    const [films, games, books] = await Promise.all([
      getFilmsData(),
      getGamesData(),
      getBooksData(),
    ])

    const events = eventsOnDate({ films, games, books }, date)

    return NextResponse.json(
      { events, hasData: events.length > 0 },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } }
    )
  } catch (error) {
    logger.error('Day detail API error:', error)
    return NextResponse.json({ events: [], hasData: false }, { status: 500 })
  }
}
