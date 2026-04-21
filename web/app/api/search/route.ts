import { NextResponse } from 'next/server'
import { getGamesData, getFilmsData, getSeriesData, getBooksData } from '@/lib/data'
import { logger } from '@/lib/logger'

export const revalidate = 3600

type SearchItem = {
  id: string
  title: string
  section: 'games' | 'films' | 'series' | 'books'
  href: string
  subtitle?: string
  year?: number
}

let cache: { at: number; items: SearchItem[] } | null = null
const TTL = 60 * 60 * 1000

async function buildIndex(): Promise<SearchItem[]> {
  const [games, films, series, books] = await Promise.all([
    getGamesData(),
    getFilmsData(),
    getSeriesData(),
    getBooksData().catch(() => []),
  ])

  const items: SearchItem[] = []

  games.forEach((g, i) => items.push({
    id: `games-${i}`,
    title: g.title,
    section: 'games',
    href: '/games',
    subtitle: g.platform ?? g.platforms?.[0]?.platform,
    year: g.releaseYear,
  }))
  films.forEach((f, i) => items.push({
    id: `films-${i}`,
    title: f.title,
    section: 'films',
    href: '/films',
    subtitle: f.genres?.[0],
    year: f.releaseYear,
  }))
  series.forEach((s, i) => items.push({
    id: `series-${i}`,
    title: s.title,
    section: 'series',
    href: '/series',
    subtitle: s.genres?.[0],
    year: s.releaseYear,
  }))
  books.forEach((b, i) => items.push({
    id: `books-${i}`,
    title: b.title,
    section: 'books',
    href: '/books',
    subtitle: b.author,
    year: b.year,
  }))

  return items
}

export async function GET() {
  try {
    const now = Date.now()
    if (!cache || now - cache.at > TTL) {
      cache = { at: now, items: await buildIndex() }
    }
    return NextResponse.json({ items: cache.items })
  } catch (e) {
    logger.error('search index build failed', e)
    return NextResponse.json({ items: [], hasData: false }, { status: 500 })
  }
}
