import { NextRequest, NextResponse } from 'next/server'
import { getGamesData, getFilmsData, getSeriesData, getBooksData } from '@/lib/data'
import { logger } from '@/lib/logger'
import type { Film, Series, Game, Book } from '@/lib/types'

export const revalidate = 3600

type TopItem = { title: string; rating?: number; subtitle?: string }

type YearReview = {
  year: number
  films: { total: number; hoursWatched: number; topRated: TopItem[]; topGenres: { name: string; count: number }[] }
  series: { total: number; episodes: number; topRated: TopItem[]; topGenres: { name: string; count: number }[] }
  games: { total: number; hoursPlayed: number; topRated: TopItem[]; topPlatforms: { name: string; hours: number }[] }
  books: { total: number; pages: number; topRated: TopItem[]; topAuthors: { name: string; count: number }[] }
  highlights: string[]
}

function yearOf(d?: string): number | null {
  if (!d) return null
  const y = new Date(d).getFullYear()
  return Number.isFinite(y) ? y : null
}

function topBy<T>(items: T[], key: (x: T) => string | undefined, n = 3): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  items.forEach(i => {
    const k = key(i)
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1)
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }))
}

function buildReview(year: number, games: Game[], films: Film[], series: Series[], books: Book[]): YearReview {
  const filmsY = films.filter(f => yearOf(f.dateWatched) === year)
  const seriesY = series.filter(s => yearOf(s.dateCompleted) === year)
  const gamesY = games.filter(g => g.releaseYear === year)
  const booksY = books.filter(b => b.year === year)

  const genres = (items: { genres?: string[] }[], n = 3) => {
    const counts = new Map<string, number>()
    items.forEach(i => (i.genres ?? []).forEach(g => counts.set(g, (counts.get(g) ?? 0) + 1)))
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }))
  }

  const platformHours = new Map<string, number>()
  gamesY.forEach(g => {
    if (g.platforms?.length) g.platforms.forEach(p => platformHours.set(p.platform, (platformHours.get(p.platform) ?? 0) + (p.hoursPlayed ?? 0)))
    else if (g.platform) platformHours.set(g.platform, (platformHours.get(g.platform) ?? 0) + (g.hoursPlayed ?? 0))
  })

  const totalGameHours = Array.from(platformHours.values()).reduce((a, b) => a + b, 0)
  const totalFilmHours = filmsY.reduce((s, f) => s + (f.runtime ?? 0), 0) / 60
  const totalEpisodes = seriesY.reduce((s, x) => s + (x.episodesWatched ?? x.episodes ?? 0), 0)
  const totalPages = booksY.reduce((s, b) => s + (b.pages ?? 0), 0)

  const highlights: string[] = []
  if (filmsY.length > 0) highlights.push(`${filmsY.length} film${filmsY.length > 1 ? 's' : ''} regardé${filmsY.length > 1 ? 's' : ''}`)
  if (seriesY.length > 0) highlights.push(`${seriesY.length} série${seriesY.length > 1 ? 's' : ''} terminée${seriesY.length > 1 ? 's' : ''}`)
  if (gamesY.length > 0) highlights.push(`${gamesY.length} jeu${gamesY.length > 1 ? 'x' : ''}`)
  if (booksY.length > 0) highlights.push(`${booksY.length} livre${booksY.length > 1 ? 's' : ''}`)
  if (totalGameHours > 100) highlights.push(`${Math.round(totalGameHours)}h de jeu`)
  if (totalPages > 1000) highlights.push(`${totalPages.toLocaleString('fr-FR')} pages lues`)

  return {
    year,
    films: {
      total: filmsY.length,
      hoursWatched: Math.round(totalFilmHours),
      topRated: [...filmsY].filter(f => f.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3).map(f => ({ title: f.title, rating: f.rating, subtitle: f.genres?.[0] })),
      topGenres: genres(filmsY),
    },
    series: {
      total: seriesY.length,
      episodes: totalEpisodes,
      topRated: [...seriesY].filter(s => s.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3).map(s => ({ title: s.title, rating: s.rating, subtitle: s.genres?.[0] })),
      topGenres: genres(seriesY),
    },
    games: {
      total: gamesY.length,
      hoursPlayed: Math.round(totalGameHours),
      topRated: [...gamesY].filter(g => g.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3).map(g => ({ title: g.title, rating: g.rating, subtitle: g.platform ?? g.platforms?.[0]?.platform })),
      topPlatforms: Array.from(platformHours.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, hours]) => ({ name, hours: Math.round(hours) })),
    },
    books: {
      total: booksY.length,
      pages: totalPages,
      topRated: [...booksY].filter(b => b.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3).map(b => ({ title: b.title, rating: b.rating, subtitle: b.author })),
      topAuthors: topBy(booksY, b => b.author),
    },
    highlights,
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const yearParam = url.searchParams.get('year')
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

    const [games, films, series, books] = await Promise.all([
      getGamesData(),
      getFilmsData(),
      getSeriesData(),
      getBooksData().catch(() => []),
    ])

    return NextResponse.json(
      buildReview(year, games, films, series, books),
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } }
    )
  } catch (e) {
    logger.error('year-in-review build failed', e)
    return NextResponse.json({ error: 'build failed' }, { status: 500 })
  }
}
