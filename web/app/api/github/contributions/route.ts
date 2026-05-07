import { NextRequest, NextResponse } from 'next/server'
import { loadGitHubContributions } from '@/lib/github'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  const yearParam = request.nextUrl.searchParams.get('year')
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()
  const data = await loadGitHubContributions(username, year)
  if (!data) return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' },
  })
}
