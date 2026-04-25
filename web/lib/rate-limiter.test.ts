import { describe, it, expect } from 'vitest'
import { rateLimitedFetch } from './rate-limiter'

function fakeResponse(): Response {
  return new Response('ok', { status: 200 })
}

describe('rateLimitedFetch', () => {
  it('serializes consecutive calls with the configured minimum interval', async () => {
    const key = `test-${Math.random()}`
    const minInterval = 60
    const timestamps: number[] = []

    const calls = [0, 1, 2].map(() =>
      rateLimitedFetch(key, minInterval, async () => {
        timestamps.push(Date.now())
        return fakeResponse()
      })
    )
    await Promise.all(calls)

    expect(timestamps).toHaveLength(3)
    expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(minInterval - 5)
    expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(minInterval - 5)
  })

  it('isolates queues per apiKey', async () => {
    const minInterval = 80
    const start = Date.now()
    let tA = 0
    let tB = 0

    await Promise.all([
      rateLimitedFetch(`a-${Math.random()}`, minInterval, async () => {
        tA = Date.now() - start
        return fakeResponse()
      }),
      rateLimitedFetch(`b-${Math.random()}`, minInterval, async () => {
        tB = Date.now() - start
        return fakeResponse()
      }),
    ])

    // Both should run nearly immediately because they're on different queues
    expect(tA).toBeLessThan(minInterval)
    expect(tB).toBeLessThan(minInterval)
  })

  it('propagates errors from the fetch fn', async () => {
    const key = `err-${Math.random()}`
    await expect(
      rateLimitedFetch(key, 10, async () => {
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')
  })
})
