'use server'

import { revalidatePath } from 'next/cache'
import { loadGitHub } from './github'
import { logger } from './logger'

export async function syncGitHubAction(username: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await loadGitHub(username, { force: true })
    if (!data) return { ok: false, error: 'GitHub fetch failed' }
    revalidatePath('/github')
    return { ok: true }
  } catch (err) {
    logger.error('syncGitHubAction error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'sync failed' }
  }
}
