import { NextRequest, NextResponse } from 'next/server'
import { loadGitHub } from '@/lib/github'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

  const data = await loadGitHub(username)
  if (!data) return NextResponse.json({ error: 'Failed to fetch GitHub data' }, { status: 500 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' },
  })
}
