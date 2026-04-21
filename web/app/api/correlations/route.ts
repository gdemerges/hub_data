import { NextResponse } from 'next/server'
import { getGamesData, getFilmsData, getSeriesData, getBooksData } from '@/lib/data'
import { logger } from '@/lib/logger'

export const revalidate = 3600

type YearStat = {
  year: number
  games: number
  films: number
  series: number
  books: number
}

function yearOf(d?: string): number | null {
  if (!d) return null
  const y = new Date(d).getFullYear()
  return Number.isFinite(y) ? y : null
}

export async function GET() {
  try {
    const [games, films, series, books] = await Promise.all([
      getGamesData(),
      getFilmsData(),
      getSeriesData(),
      getBooksData().catch(() => []),
    ])

    const map = new Map<number, YearStat>()
    const bump = (y: number | null, key: keyof Omit<YearStat, 'year'>) => {
      if (!y || y < 1980 || y > new Date().getFullYear() + 1) return
      if (!map.has(y)) map.set(y, { year: y, games: 0, films: 0, series: 0, books: 0 })
      map.get(y)![key]++
    }

    games.forEach(g => bump(g.releaseYear ?? null, 'games'))
    films.forEach(f => bump(yearOf(f.dateWatched) ?? f.releaseYear ?? null, 'films'))
    series.forEach(s => bump(yearOf(s.dateCompleted) ?? s.releaseYear ?? null, 'series'))
    books.forEach(b => bump(b.year ?? null, 'books'))

    const stats = Array.from(map.values()).sort((a, b) => b.year - a.year)
    return NextResponse.json({ stats, hasData: stats.length > 0 })
  } catch (e) {
    logger.error('correlations build failed', e)
    return NextResponse.json({ stats: [], hasData: false }, { status: 500 })
  }
}
