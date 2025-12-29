import { NextResponse } from 'next/server'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'

async function getAccessToken(): Promise<string | null> {
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
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting Spotify access token:', error)
    return null
  }
}

export async function GET() {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
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

    const [profile, topTracks, topArtists, recentlyPlayed] = await Promise.all([
      profileRes.json(),
      topTracksRes.json(),
      topArtistsRes.json(),
      recentlyPlayedRes.json(),
    ])

    // Calculate listening stats from recently played
    const genreCount: { [key: string]: number } = {}
    topArtists.items?.forEach((artist: any) => {
      artist.genres?.forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1
      })
    })

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }))

    return NextResponse.json({
      user: {
        name: profile.display_name,
        avatar: profile.images?.[0]?.url,
        followers: profile.followers?.total || 0,
        profileUrl: profile.external_urls?.spotify,
      },
      topTracks: topTracks.items?.map((track: any) => ({
        name: track.name,
        artist: track.artists?.map((a: any) => a.name).join(', '),
        album: track.album?.name,
        albumCover: track.album?.images?.[0]?.url,
        duration: track.duration_ms,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls?.spotify,
      })) || [],
      topArtists: topArtists.items?.map((artist: any) => ({
        name: artist.name,
        image: artist.images?.[0]?.url,
        genres: artist.genres?.slice(0, 3) || [],
        followers: artist.followers?.total || 0,
        spotifyUrl: artist.external_urls?.spotify,
      })) || [],
      recentlyPlayed: recentlyPlayed.items?.map((item: any) => ({
        name: item.track?.name,
        artist: item.track?.artists?.map((a: any) => a.name).join(', '),
        album: item.track?.album?.name,
        albumCover: item.track?.album?.images?.[0]?.url,
        playedAt: item.played_at,
        spotifyUrl: item.track?.external_urls?.spotify,
      })) || [],
      topGenres,
      stats: {
        totalTracks: topTracks.items?.length || 0,
        totalArtists: topArtists.items?.length || 0,
        totalGenres: topGenres.length,
      },
    })
  } catch (error) {
    console.error('Spotify API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Spotify data' }, { status: 500 })
  }
}
