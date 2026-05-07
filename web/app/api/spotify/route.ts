import { NextResponse } from 'next/server'
import { loadSpotify } from '@/lib/spotify'

export const revalidate = 3600

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' }

export async function GET() {
  const data = await loadSpotify()
  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch Spotify data' }, { status: 500 })
  }
  return NextResponse.json(data, { headers: CACHE_HEADERS })
}
