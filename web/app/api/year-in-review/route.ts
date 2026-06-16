import { type NextRequest, NextResponse } from 'next/server'
import { getBooksData, getFilmsData, getGamesData } from '@/lib/data'
import { logger } from '@/lib/logger'
import type { Book, Film, Game } from '@/lib/types'

// Dynamique : la réponse varie selon ?year= (lecture de searchParams).
// Le cache CDN passe par l'en-tête Cache-Control de la réponse.
export const dynamic = 'force-dynamic'

type TopItem = { title: string; rating?: number; subtitle?: string }

type YearReview = {
  year: number
  films: {
    total: number
    hoursWatched: number
    items: TopItem[]
    topGenres: { name: string; count: number }[]
  }
  // undated : SerieBox n'exporte pas de date de fin de visionnage → pas de bilan par année.
  series: {
    total: number
    episodes: number
    items: TopItem[]
    topGenres: { name: string; count: number }[]
    undated: boolean
  }
  games: {
    total: number
    hoursPlayed: number
    items: TopItem[]
    topPlatforms: { name: string; hours: number }[]
  }
  books: {
    total: number
    pages: number
    items: TopItem[]
    topAuthors: { name: string; count: number }[]
  }
  highlights: string[]
}

// Tri d'affichage : les items notés d'abord (note décroissante), puis les
// non notés par ordre alphabétique. On liste TOUT (pas seulement le top noté)
// pour que rien ne disparaisse de la rétrospective.
function sortItems(items: TopItem[]): TopItem[] {
  return [...items].sort(
    (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.title.localeCompare(b.title, 'fr'),
  )
}

function yearOf(d?: string): number | null {
  if (!d) return null
  const y = new Date(d).getFullYear()
  return Number.isFinite(y) ? y : null
}

function topBy<T>(
  items: T[],
  key: (x: T) => string | undefined,
  n = 3,
): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  items.forEach((i) => {
    const k = key(i)
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1)
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }))
}

function buildReview(year: number, games: Game[], films: Film[], books: Book[]): YearReview {
  const filmsY = films.filter((f) => yearOf(f.dateWatched) === year)
  // Séries volontairement absentes : aucune date de fin de visionnage à la source.
  // Jeux « de l'année » = joués pendant l'année (commencés ou terminés), pas
  // sortis cette année-là. On exclut donc le backlog/wishlist non touché.
  const gamesY = games.filter(
    (g) => yearOf(g.dateStarted) === year || yearOf(g.dateFinished) === year,
  )
  const booksY = books.filter((b) => b.year === year)

  const genres = (items: { genres?: string[] }[], n = 3) => {
    const counts = new Map<string, number>()
    items.forEach((i) => (i.genres ?? []).forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1)))
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }))
  }

  const platformHours = new Map<string, number>()
  gamesY.forEach((g) => {
    if (g.platforms?.length)
      g.platforms.forEach((p) =>
        platformHours.set(p.platform, (platformHours.get(p.platform) ?? 0) + (p.hoursPlayed ?? 0)),
      )
    else if (g.platform)
      platformHours.set(g.platform, (platformHours.get(g.platform) ?? 0) + (g.hoursPlayed ?? 0))
  })

  const totalGameHours = Array.from(platformHours.values()).reduce((a, b) => a + b, 0)
  const totalFilmHours = filmsY.reduce((s, f) => s + (f.runtime ?? 0), 0) / 60
  const totalPages = booksY.reduce((s, b) => s + (b.pages ?? 0), 0)

  const highlights: string[] = []
  if (filmsY.length > 0)
    highlights.push(
      `${filmsY.length} film${filmsY.length > 1 ? 's' : ''} regardé${filmsY.length > 1 ? 's' : ''}`,
    )
  if (gamesY.length > 0) highlights.push(`${gamesY.length} jeu${gamesY.length > 1 ? 'x' : ''}`)
  if (booksY.length > 0) highlights.push(`${booksY.length} livre${booksY.length > 1 ? 's' : ''}`)
  if (totalGameHours > 100) highlights.push(`${Math.round(totalGameHours)}h de jeu`)
  if (totalPages > 1000) highlights.push(`${totalPages.toLocaleString('fr-FR')} pages lues`)

  return {
    year,
    films: {
      total: filmsY.length,
      hoursWatched: Math.round(totalFilmHours),
      items: sortItems(
        filmsY.map((f) => ({ title: f.title, rating: f.rating, subtitle: f.genres?.[0] })),
      ),
      topGenres: genres(filmsY),
    },
    series: {
      total: 0,
      episodes: 0,
      items: [],
      topGenres: [],
      undated: true,
    },
    games: {
      total: gamesY.length,
      hoursPlayed: Math.round(totalGameHours),
      items: sortItems(
        gamesY.map((g) => ({
          title: g.title,
          rating: g.rating,
          subtitle: g.platform ?? g.platforms?.[0]?.platform,
        })),
      ),
      topPlatforms: Array.from(platformHours.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, hours]) => ({ name, hours: Math.round(hours) })),
    },
    books: {
      total: booksY.length,
      pages: totalPages,
      items: sortItems(
        booksY.map((b) => ({ title: b.title, rating: b.rating, subtitle: b.author })),
      ),
      topAuthors: topBy(booksY, (b) => b.author),
    },
    highlights,
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const yearParam = url.searchParams.get('year')
  const currentYear = new Date().getFullYear()
  const parsedYear = yearParam ? parseInt(yearParam, 10) : currentYear
  const year = Number.isNaN(parsedYear)
    ? currentYear
    : Math.max(1980, Math.min(currentYear + 1, parsedYear))

  try {
    const [games, films, books] = await Promise.all([
      getGamesData(),
      getFilmsData(),
      getBooksData().catch(() => []),
    ])

    return NextResponse.json(buildReview(year, games, films, books), {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (e) {
    logger.error('year-in-review build failed', e)
    // Renvoie une rétrospective vide valide : le fetcher SWR client ne
    // vérifie pas response.ok, donc une forme {error} ferait planter le rendu.
    return NextResponse.json(buildReview(year, [], [], []), { status: 200 })
  }
}
