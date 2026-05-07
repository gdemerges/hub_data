import { NextResponse } from 'next/server'
import { loadStrava } from '@/lib/strava'

export const revalidate = 3600

export async function GET() {
  const data = await loadStrava()
  if (!data) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
  })
}
