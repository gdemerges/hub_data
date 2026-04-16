/**
 * Simple in-process rate limiter using a request queue per API key.
 *
 * Guarantees a minimum interval between consecutive calls to the same API,
 * serializing requests rather than dropping them. This is sufficient for
 * single-process Next.js deployments (local dev, single-instance prod).
 *
 * Usage:
 *   const data = await rateLimitedFetch('nominatim', 1100, () =>
 *     fetch('https://nominatim.openstreetmap.org/...')
 *   )
 */

// Per-API queue: each API key holds the tail of its promise chain
const queues = new Map<string, Promise<void>>()
// Timestamp of the last dispatched call per API
const lastCallAt = new Map<string, number>()

/**
 * Wraps a fetch call so that calls to the same `apiKey` are serialized
 * with at least `minIntervalMs` between them.
 */
export async function rateLimitedFetch(
  apiKey: string,
  minIntervalMs: number,
  fetchFn: () => Promise<Response>
): Promise<Response> {
  // Attach to the current tail of this API's queue
  const tail = queues.get(apiKey) ?? Promise.resolve()

  // Build the next slot: wait for the previous one, then enforce the minimum gap
  const nextSlot = tail.then(async () => {
    const elapsed = Date.now() - (lastCallAt.get(apiKey) ?? 0)
    const wait = Math.max(0, minIntervalMs - elapsed)
    if (wait > 0) await new Promise<void>(resolve => setTimeout(resolve, wait))
    lastCallAt.set(apiKey, Date.now())
  })

  // Advance the queue tail (ignore errors in the slot itself — they surface below)
  queues.set(apiKey, nextSlot.catch(() => {}))

  // Wait for our slot, then execute
  await nextSlot
  return fetchFn()
}

// Pre-configured helpers for the APIs we actually call

/** Nominatim: max 1 request/second per their usage policy */
export function nominatimFetch(url: string, init?: RequestInit): Promise<Response> {
  return rateLimitedFetch('nominatim', 1100, () => fetch(url, init))
}

/** TMDB: conservative 3 requests/second (well under their 40 req/10s limit) */
export function tmdbFetch(url: string, init?: RequestInit): Promise<Response> {
  return rateLimitedFetch('tmdb', 350, () => fetch(url, init))
}
