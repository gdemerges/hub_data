import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { syncSteamPlaytime } from '@/lib/steam-sync'

export async function POST() {
  try {
    const result = await syncSteamPlaytime()
    return NextResponse.json({
      success: true,
      message: 'Playtime data synced successfully',
      ...result,
    })
  } catch (error) {
    logger.error('Steam sync error:', error)
    return NextResponse.json({ error: 'Failed to sync Steam data' }, { status: 500 })
  }
}
