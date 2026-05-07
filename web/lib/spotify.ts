import 'server-only'
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

const tokenCache = new TokenCache()

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

    const profile = spotifyProfileSchema.parse(profileRaw)
    const topTracks = spotifyPaginatedSchema(spotifyTrackSchema).parse(topTracksRaw)
    const topArtists = spotifyPaginatedSchema(spotifyArtistSchema).parse(topArtistsRaw)
    const recentlyPlayed = spotifyPaginatedSchema(spotifyRecentlyPlayedItemSchema).parse(recentlyPlayedRaw)

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
        spotifyUrl: artist.external_urls.spotify,
      })),
      recentlyPlayed: recentlyPlayed.items.map((item) => ({
        name: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(', '),
        album: item.track.album.name,
        albumCover: item.track.album.images[0]?.url ?? '',
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

    await writeFileCache(SPOTIFY_CACHE_FILE, data)
    return data
  } catch (error) {
    logger.error('Spotify fetch error:', error)
    return cached?.data ?? null
  }
}
