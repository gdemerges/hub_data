import { NextResponse } from 'next/server'
import path from 'path'

import { readFileCache, writeFileCache, isCacheFresh } from '@/lib/file-cache'
import { TokenCache } from '@/lib/token-cache'
import { spotifyProfileSchema, spotifyPaginatedSchema, spotifyTrackSchema, spotifyArtistSchema, spotifyRecentlyPlayedItemSchema } from '@/lib/api-schemas'

export const revalidate = 3600 // Revalidate every hour

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'
const SPOTIFY_CACHE_FILE = path.join(process.cwd(), 'data', 'spotify-cache.json')
const SPOTIFY_CACHE_TTL = 3600_000 // 1h
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' }

const tokenCache = new TokenCache()

import type { z } from 'zod'
type SpotifyArtist = z.infer<typeof import('@/lib/api-schemas').spotifyArtistSchema>
type SpotifyTrack = z.infer<typeof import('@/lib/api-schemas').spotifyTrackSchema>
type SpotifyRecentlyPlayedItem = z.infer<typeof import('@/lib/api-schemas').spotifyRecentlyPlayedItemSchema>

async function getAccessToken(): Promise<string | null> {
  const cached = tokenCache.get()
  if (cached) return cached

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('Missing Spotify credentials')
    return null
  }

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    })
    const data = await response.json()
    tokenCache.set(data.access_token, data.expires_in ?? 3600)
    return data.access_token
  } catch (error) {
    console.error('Error getting Spotify access token:', error)
    return null
  }
}

export async function GET() {
  try {
    // Serve from file cache if still fresh
    const cached = await readFileCache<Record<string, unknown>>(SPOTIFY_CACHE_FILE)
    if (cached && isCacheFresh(cached.cachedAt, SPOTIFY_CACHE_TTL)) {
      return NextResponse.json(cached.data, { headers: CACHE_HEADERS })
    }

    const accessToken = await getAccessToken()

    if (!accessToken) {
      // Fall back to stale cache on auth failure
      if (cached) return NextResponse.json(cached.data, { headers: CACHE_HEADERS })
      return NextResponse.json({ error: 'Failed to authenticate with Spotify' }, { status: 401 })
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    }

    // Fetch data in parallel
    const [profileRes, topTracksRes, topArtistsRes, recentlyPlayedRes] = await Promise.all([
      fetch(`${SPOTIFY_API_URL}/me`, { headers }),
      fetch(`${SPOTIFY_API_URL}/me/top/tracks?limit=10&time_range=medium_term`, { headers }),
      fetch(`${SPOTIFY_API_URL}/me/top/artists?limit=10&time_range=medium_term`, { headers }),
      fetch(`${SPOTIFY_API_URL}/me/player/recently-played?limit=20`, { headers }),
    ])

    const [profileRaw, topTracksRaw, topArtistsRaw, recentlyPlayedRaw] = await Promise.all([
      profileRes.json(),
      topTracksRes.json(),
      topArtistsRes.json(),
      recentlyPlayedRes.json(),
    ])

    // Validate responses with zod (defaults applied on partial data)
    const profile = spotifyProfileSchema.parse(profileRaw)
    const topTracks = spotifyPaginatedSchema(spotifyTrackSchema).parse(topTracksRaw)
    const topArtists = spotifyPaginatedSchema(spotifyArtistSchema).parse(topArtistsRaw)
    const recentlyPlayed = spotifyPaginatedSchema(spotifyRecentlyPlayedItemSchema).parse(recentlyPlayedRaw)

    // Calculate listening stats from recently played
    const genreCount: Record<string, number> = {}
    ;(topArtists.items as SpotifyArtist[]).forEach((artist) => {
      artist.genres?.forEach((genre) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1
      })
    })

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }))

    const responseData: Record<string, unknown> = {
      user: {
        name: profile.display_name,
        avatar: profile.images[0]?.url,
        followers: profile.followers.total,
        profileUrl: profile.external_urls.spotify,
      },
      topTracks: topTracks.items.map((track) => ({
        name: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        albumCover: track.album.images[0]?.url,
        duration: track.duration_ms,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
      })),
      topArtists: topArtists.items.map((artist) => ({
        name: artist.name,
        image: artist.images[0]?.url,
        genres: artist.genres.slice(0, 3),
        followers: artist.followers.total,
        spotifyUrl: artist.external_urls.spotify,
      })),
      recentlyPlayed: recentlyPlayed.items.map((item) => ({
        name: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(', '),
        album: item.track.album.name,
        albumCover: item.track.album.images[0]?.url,
        playedAt: item.played_at,
        spotifyUrl: item.track.external_urls.spotify,
      })),
      topGenres,
      stats: {
        totalTracks: topTracks.items?.length || 0,
        totalArtists: topArtists.items?.length || 0,
        totalGenres: topGenres.length,
      },
      fetchedAt: new Date().toISOString(),
    }

    await writeFileCache(SPOTIFY_CACHE_FILE, responseData)

    return NextResponse.json(responseData, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error('Spotify API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Spotify data' }, { status: 500 })
  }
}
