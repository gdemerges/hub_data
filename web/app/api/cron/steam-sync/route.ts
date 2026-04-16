import { NextRequest, NextResponse } from 'next/server'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

async function syncWithRetry(retries = MAX_RETRIES): Promise<unknown> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/steam/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`Sync failed with status ${response.status}`)
    return await response.json()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      return syncWithRetry(retries - 1)
    }
    throw error
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncWithRetry()
    return NextResponse.json({
      success: true,
      message: 'Steam sync completed',
      timestamp: new Date().toISOString(),
      syncResult: result,
    })
  } catch (error) {
    console.error('Steam cron sync failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
