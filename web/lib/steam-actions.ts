'use server'

import { revalidatePath } from 'next/cache'
import { logger } from './logger'
import { syncSteamPlaytime } from './steam-sync'

export async function syncSteamAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    await syncSteamPlaytime()
    revalidatePath('/steam')
    return { ok: true }
  } catch (err) {
    logger.error('syncSteamAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'sync failed' }
  }
}
