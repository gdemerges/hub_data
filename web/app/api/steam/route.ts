import { NextResponse } from 'next/server'
import { loadSteam } from '@/lib/steam'

export const revalidate = 21600

const HEADERS = { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' }

export async function GET() {
  const data = await loadSteam()
  if (!data) {
    return NextResponse.json({ error: 'Failed to fetch Steam data' }, { status: 500 })
  }
  return NextResponse.json(data, { headers: HEADERS })
}
