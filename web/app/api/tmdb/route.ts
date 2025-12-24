import { NextRequest, NextResponse } from 'next/server'

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

    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error('TMDB API error')
    }

    const searchData = await searchResponse.json()

    if (searchData.results.length === 0) {
      return NextResponse.json({ poster: null })
    }

    const result = searchData.results[0]

    // Get additional details
    const detailsUrl = `${TMDB_BASE_URL}/${mediaType}/${result.id}?api_key=${apiKey}&language=fr-FR`
    const detailsResponse = await fetch(detailsUrl)
    const details = await detailsResponse.json()

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
      genres: details.genres?.map((g: any) => g.name) || [],
      runtime: details.runtime || null,
      seasons: details.number_of_seasons || null,
      episodes: details.number_of_episodes || null,
    })
  } catch (error) {
    console.error('TMDB API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media data' },
      { status: 500 }
    )
  }
}
