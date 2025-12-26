import { NextResponse } from 'next/server'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000 // 5 seconds

async function syncWithRetry(retries = MAX_RETRIES): Promise<any> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/steam/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Sync failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (retries > 0) {
      console.log(`Sync failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      return syncWithRetry(retries - 1)
    }
    throw error
  }
}

export async function GET() {
  try {
    const result = await syncWithRetry()

    return NextResponse.json({
      success: true,
      message: 'Automatic Steam sync completed',
      timestamp: new Date().toISOString(),
      syncResult: result,
    })
  } catch (error) {
    console.error('Automatic Steam sync failed after retries:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync Steam data after multiple retries',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
