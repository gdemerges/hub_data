import { NextRequest } from 'next/server'
import { verifyCronSecret, warmRoute } from '@/lib/cron-utils'

export async function GET(request: NextRequest) {
  const denied = verifyCronSecret(request)
  if (denied) return denied
  return warmRoute('/api/strava')
}
