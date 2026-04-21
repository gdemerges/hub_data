import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

/** Returns 401 response if CRON_SECRET is set and header doesn't match, null otherwise. */
export function verifyCronSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) return null // No secret configured — allow (dev mode)
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/** Call an internal GET route and return a cron result response. */
export async function warmRoute(path: string): Promise<NextResponse> {
  const url = `${getBaseUrl()}${path}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return NextResponse.json({
      success: true,
      path,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error(`Cron failed for ${path}:`, error)
    return NextResponse.json(
      { success: false, path, error: error instanceof Error ? error.message : 'Unknown', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
