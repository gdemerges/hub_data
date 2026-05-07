import { NextResponse } from 'next/server'
import { loadVoyages } from '@/lib/voyages'

const HEADERS = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' }

export async function GET() {
  const stats = await loadVoyages()
  if (!stats) {
    return NextResponse.json({ error: 'No location history data found' }, { status: 404 })
  }
  return NextResponse.json(stats, { headers: HEADERS })
}
