'use server'

import { revalidatePath } from 'next/cache'
import { logger } from './logger'
import { loadSpotify } from './spotify'

export async function syncSpotifyAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await loadSpotify({ force: true })
    if (!data) return { ok: false, error: 'Spotify fetch failed' }
    revalidatePath('/spotify')
    return { ok: true }
  } catch (err) {
    logger.error('syncSpotifyAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'sync failed' }
  }
}
