import { NextRequest, NextResponse } from 'next/server'
import { TokenCache } from '@/lib/token-cache'

const tokenCache = new TokenCache()

async function getAccessToken(): Promise<string> {
  const cached = tokenCache.get()
  if (cached) return cached

  const clientId = process.env.IGDB_CLIENT_ID
  const clientSecret = process.env.IGDB_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('IGDB credentials not configured')

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
  })
  if (!response.ok) throw new Error('Failed to get IGDB access token')

  const data = await response.json()
  tokenCache.set(data.access_token, data.expires_in)
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawName = body?.gameName

    if (!rawName || typeof rawName !== 'string') {
      return NextResponse.json({ error: 'Game name required' }, { status: 400 })
    }

    // Sanitize: max 100 chars, strip characters that break IGDB query syntax
    const gameName = rawName.trim().slice(0, 100).replace(/["\\]/g, '')

    if (!gameName) {
      return NextResponse.json({ error: 'Invalid game name' }, { status: 400 })
    }

    const accessToken = await getAccessToken()
    const clientId = process.env.IGDB_CLIENT_ID!

    // Search for the game
    const searchResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: `search "${gameName}"; fields name, cover.image_id, first_release_date, rating, summary, genres.name, platforms.name; limit 1;`,
    })

    if (!searchResponse.ok) {
      throw new Error('IGDB API error')
    }

    const games = await searchResponse.json()

    if (games.length === 0) {
      return NextResponse.json({ cover: null })
    }

    const game = games[0]
    const coverUrl = game.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
      : null

    return NextResponse.json({
      name: game.name,
      cover: coverUrl,
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : null,
      rating: game.rating ? Math.round(game.rating) : null,
      summary: game.summary || null,
      genres: (game.genres as { name: string }[] | undefined)?.map((g) => g.name) ?? [],
      platforms: (game.platforms as { name: string }[] | undefined)?.map((p) => p.name) ?? [],
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } })
  } catch (error) {
    console.error('IGDB API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game data' },
      { status: 500 }
    )
  }
}
