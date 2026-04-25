import { NextRequest, NextResponse } from 'next/server'
import { tmdbFetch } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { safeParse, tmdbSearchResponseSchema, tmdbDetailsSchema } from '@/lib/api-schemas'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

export async function POST(request: NextRequest) {
  try {
    const { title, type } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
      throw new Error('TMDB API key not configured')
    }

    const mediaType = type === 'series' ? 'tv' : 'movie'
    const searchUrl = `${TMDB_BASE_URL}/search/${mediaType}?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=fr-FR`

    const searchResponse = await tmdbFetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error('TMDB API error')
    }

    const searchRaw = await searchResponse.json()
    const searchData = safeParse(tmdbSearchResponseSchema, searchRaw, 'tmdb:search')

    if (!searchData || searchData.results.length === 0) {
      return NextResponse.json({ poster: null })
    }

    const result = searchData.results[0]

    // Get additional details
    const detailsUrl = `${TMDB_BASE_URL}/${mediaType}/${result.id}?api_key=${apiKey}&language=fr-FR`
    const detailsResponse = await tmdbFetch(detailsUrl)
    const detailsRaw = await detailsResponse.json()
    const details = safeParse(tmdbDetailsSchema, detailsRaw, 'tmdb:details') ?? {
      genres: [],
      runtime: null,
      number_of_seasons: null,
      number_of_episodes: null,
    }

    return NextResponse.json({
      id: result.id,
      title: mediaType === 'tv' ? result.name : result.title,
      poster: result.poster_path
        ? `${TMDB_IMAGE_BASE}${result.poster_path}`
        : null,
      backdrop: result.backdrop_path
        ? `https://image.tmdb.org/t/p/original${result.backdrop_path}`
        : null,
      overview: result.overview || null,
      rating: result.vote_average ? Math.round(result.vote_average * 10) / 10 : null,
      releaseDate: mediaType === 'tv' ? result.first_air_date : result.release_date,
      genres: details.genres.map((g) => g.name),
      runtime: details.runtime ?? null,
      seasons: details.number_of_seasons ?? null,
      episodes: details.number_of_episodes ?? null,
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } })
  } catch (error) {
    logger.error('TMDB API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media data' },
      { status: 500 }
    )
  }
}
