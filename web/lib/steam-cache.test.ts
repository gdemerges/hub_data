import { describe, it, expect } from 'vitest'
import { isSteamCacheFresh } from './steam-cache'

describe('isSteamCacheFresh', () => {
  it('returns true within 6h', () => {
    expect(isSteamCacheFresh(Date.now() - 60_000)).toBe(true)
  })

  it('returns false past 6h', () => {
    expect(isSteamCacheFresh(Date.now() - 7 * 60 * 60 * 1000)).toBe(false)
  })

  it('returns false at exactly 6h boundary', () => {
    expect(isSteamCacheFresh(Date.now() - 6 * 60 * 60 * 1000 - 1)).toBe(false)
  })
})
