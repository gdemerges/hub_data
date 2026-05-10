import 'server-only'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

import { readFileCache, writeFileCache, isCacheFresh } from './file-cache'
import { TokenCache } from './token-cache'
import {
  spotifyProfileSchema,
  spotifyPaginatedSchema,
  spotifyTrackSchema,
  spotifyArtistSchema,
  spotifyRecentlyPlayedItemSchema,
} from './api-schemas'
import { logger } from './logger'
import type { SpotifyData } from './types'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'
const SPOTIFY_CACHE_FILE = path.join(process.cwd(), 'data', 'spotify-cache.json')
const SPOTIFY_CACHE_TTL = 3600_000

type SpotifyArtist = z.infer<typeof spotifyArtistSchema>
type SpotifyTrackRaw = z.infer<typeof spotifyTrackSchema>

const tokenCache = new TokenCache()

function mapTracks(items: SpotifyTrackRaw[]) {
  return items.map(track => ({
    name: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    albumCover: track.album.images[0]?.url ?? '',
    duration: track.duration_ms,
    previewUrl: track.preview_url ?? undefined,
    spotifyUrl: track.external_urls.spotify,
  }))
}

function mapArtists(items: SpotifyArtist[]) {
  return items.map(artist => ({
    name: artist.name,
    image: artist.images[0]?.url ?? '',
    genres: artist.genres.slice(0, 3),
    followers: artist.followers.total,
    popularity: artist.popularity,
    spotifyUrl: artist.external_urls.spotify,
  }))
}

// Spotify can rotate refresh tokens on each refresh call. If the response includes
// a new refresh_token, we persist it back to web/.env so subsequent runs succeed.
function persistRefreshToken(newToken: string): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (!fs.existsSync(envPath)) return
    const content = fs.readFileSync(envPath, 'utf-8')
    const lines = content.split('\n')
    let found = false
    const updated = lines.map(l => {
      if (l.startsWith('SPOTIFY_REFRESH_TOKEN=')) {
        found = true
        return `SPOTIFY_REFRESH_TOKEN=${newToken}`
      }
      return l
    })
    if (!found) updated.push(`SPOTIFY_REFRESH_TOKEN=${newToken}`)
    fs.writeFileSync(envPath, updated.join('\n'))
    process.env.SPOTIFY_REFRESH_TOKEN = newToken
    logger.info('Spotify refresh token rotated and persisted to .env')
  } catch (e) {
    logger.error('Failed to persist rotated Spotify refresh token:', e)
  }
}

async function getAccessToken(): Promise<string | null> {
  const cached = tokenCache.get()
  if (cached) return cached

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    logger.error('Missing Spotify credentials')
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
    if (!data.access_token) {
      logger.error('Spotify token refresh failed:', data)
      return null
    }
    if (data.refresh_token && data.refresh_token !== refreshToken) {
      persistRefreshToken(data.refresh_token)
    }
    tokenCache.set(data.access_token, data.expires_in ?? 3600)
    return data.access_token
  } catch (error) {
    logger.error('Error getting Spotify access token:', error)
    return null
  }
}

export async function loadSpotify({ force = false }: { force?: boolean } = {}): Promise<SpotifyData | null> {
  const cached = await readFileCache<SpotifyData>(SPOTIFY_CACHE_FILE)
  if (!force && cached && isCacheFresh(cached.cachedAt, SPOTIFY_CACHE_TTL)) {
    return cached.data
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return cached?.data ?? null
  }

  const headers = { Authorization: `Bearer ${accessToken}` }

  try {
    const ranges: Array<'short_term' | 'medium_term' | 'long_term'> = [
      'short_term',
      'medium_term',
      'long_term',
    ]

    const [
      profileRes,
      tracksShortRes, tracksMedRes, tracksLongRes,
      artistsShortRes, artistsMedRes, artistsLongRes,
      recentlyPlayedRes,
    ] = await Promise.all([
      fetch(`${SPOTIFY_API_URL}/me`, { headers }),
      ...ranges.map(r =>
        fetch(`${SPOTIFY_API_URL}/me/top/tracks?limit=20&time_range=${r}`, { headers })
      ),
      ...ranges.map(r =>
        fetch(`${SPOTIFY_API_URL}/me/top/artists?limit=20&time_range=${r}`, { headers })
      ),
      fetch(`${SPOTIFY_API_URL}/me/player/recently-played?limit=50`, { headers }),
    ])

    const [
      profileRaw,
      tracksShortRaw, tracksMedRaw, tracksLongRaw,
      artistsShortRaw, artistsMedRaw, artistsLongRaw,
      recentlyPlayedRaw,
    ] = await Promise.all([
      profileRes.json(),
      tracksShortRes.json(), tracksMedRes.json(), tracksLongRes.json(),
      artistsShortRes.json(), artistsMedRes.json(), artistsLongRes.json(),
      recentlyPlayedRes.json(),
    ])

    const profile = spotifyProfileSchema.parse(profileRaw)
    const tracksShort = spotifyPaginatedSchema(spotifyTrackSchema).parse(tracksShortRaw)
    const tracksMed = spotifyPaginatedSchema(spotifyTrackSchema).parse(tracksMedRaw)
    const tracksLong = spotifyPaginatedSchema(spotifyTrackSchema).parse(tracksLongRaw)
    const artistsShort = spotifyPaginatedSchema(spotifyArtistSchema).parse(artistsShortRaw)
    const artistsMed = spotifyPaginatedSchema(spotifyArtistSchema).parse(artistsMedRaw)
    const artistsLong = spotifyPaginatedSchema(spotifyArtistSchema).parse(artistsLongRaw)
    const recentlyPlayed = spotifyPaginatedSchema(spotifyRecentlyPlayedItemSchema).parse(recentlyPlayedRaw)

    const topTracks = tracksMed
    const topArtists = artistsMed

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

    const data: SpotifyData = {
      user: {
        name: profile.display_name ?? '',
        avatar: profile.images[0]?.url ?? '',
        followers: profile.followers.total,
        profileUrl: profile.external_urls.spotify,
      },
      topTracks: topTracks.items.map((track) => ({
        name: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        albumCover: track.album.images[0]?.url ?? '',
        duration: track.duration_ms,
        previewUrl: track.preview_url ?? undefined,
        spotifyUrl: track.external_urls.spotify,
      })),
      topArtists: topArtists.items.map((artist) => ({
        name: artist.name,
        image: artist.images[0]?.url ?? '',
        genres: artist.genres.slice(0, 3),
        followers: artist.followers.total,
        popularity: artist.popularity,
        spotifyUrl: artist.external_urls.spotify,
      })),
      recentlyPlayed: recentlyPlayed.items.map((item) => ({
        name: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(', '),
        album: item.track.album.name,
        albumCover: item.track.album.images[0]?.url ?? '',
        playedAt: item.played_at,
        duration: item.track.duration_ms,
        spotifyUrl: item.track.external_urls.spotify,
      })),
      topTracksByRange: {
        short_term: mapTracks(tracksShort.items),
        medium_term: mapTracks(tracksMed.items),
        long_term: mapTracks(tracksLong.items),
      },
      topArtistsByRange: {
        short_term: mapArtists(artistsShort.items),
        medium_term: mapArtists(artistsMed.items),
        long_term: mapArtists(artistsLong.items),
      },
      topGenres,
      stats: {
        totalTracks: topTracks.items?.length || 0,
        totalArtists: topArtists.items?.length || 0,
        totalGenres: topGenres.length,
      },
      fetchedAt: new Date().toISOString(),
    }

    await writeFileCache(SPOTIFY_CACHE_FILE, data)
    return data
  } catch (error) {
    logger.error('Spotify fetch error:', error)
    return cached?.data ?? null
  }
}
