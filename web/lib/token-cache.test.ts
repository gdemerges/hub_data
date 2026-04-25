import { describe, it, expect, vi, afterEach } from 'vitest'
import { TokenCache } from './token-cache'

afterEach(() => {
  vi.useRealTimers()
})

describe('TokenCache', () => {
  it('returns null when empty', () => {
    expect(new TokenCache().get()).toBeNull()
  })

  it('returns the token when still valid', () => {
    const cache = new TokenCache()
    cache.set('abc', 3600)
    expect(cache.get()).toBe('abc')
  })

  it('returns null once expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const cache = new TokenCache()
    cache.set('tok', 100) // expires in 100s
    vi.setSystemTime(new Date('2026-01-01T00:01:41Z')) // +101s
    expect(cache.get()).toBeNull()
  })

  it('returns null inside the 60s safety buffer', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const cache = new TokenCache()
    cache.set('tok', 90) // 90s lifetime, but 60s buffer means usable < 30s
    vi.setSystemTime(new Date('2026-01-01T00:00:31Z'))
    expect(cache.get()).toBeNull()
  })

  it('returns the token within buffer window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const cache = new TokenCache()
    cache.set('tok', 3600)
    vi.setSystemTime(new Date('2026-01-01T00:30:00Z'))
    expect(cache.get()).toBe('tok')
  })
})
