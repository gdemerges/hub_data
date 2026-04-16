import { NextRequest } from 'next/server'
import { verifyCronSecret, warmRoute } from '@/lib/cron-utils'

export async function GET(request: NextRequest) {
  const denied = verifyCronSecret(request)
  if (denied) return denied

  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME
  if (!username) {
    return Response.json({ error: 'NEXT_PUBLIC_GITHUB_USERNAME not set' }, { status: 500 })
  }

  return warmRoute(`/api/github?username=${username}`)
}
