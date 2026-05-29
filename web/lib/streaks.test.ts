import { describe, it, expect } from 'vitest'
import { computeStreak, computeStreaks } from './streaks'
import type { UnifiedActivity } from './activity'

describe('computeStreak', () => {
  it('returns zero for an empty map', () => {
    expect(computeStreak({}, '2026-05-29')).toEqual({ current: 0, longest: 0 })
  })

  it('counts a current streak ending today', () => {
    const byDate = { '2026-05-27': 1, '2026-05-28': 2, '2026-05-29': 1 }
    expect(computeStreak(byDate, '2026-05-29')).toEqual({ current: 3, longest: 3 })
  })

  it('keeps the streak alive when today is empty but yesterday is active', () => {
    const byDate = { '2026-05-27': 1, '2026-05-28': 1 }
    expect(computeStreak(byDate, '2026-05-29').current).toBe(2)
  })

  it('breaks the current streak when today and yesterday are both empty', () => {
    const byDate = { '2026-05-25': 1, '2026-05-26': 1 }
    expect(computeStreak(byDate, '2026-05-29').current).toBe(0)
  })

  it('finds the longest run even when it is in the past', () => {
    const byDate = {
      '2026-01-01': 1,
      '2026-01-02': 1,
      '2026-01-03': 1,
      '2026-01-04': 1,
      // gap
      '2026-05-29': 1,
    }
    const r = computeStreak(byDate, '2026-05-29')
    expect(r.longest).toBe(4)
    expect(r.current).toBe(1)
  })

  it('ignores days with a zero count', () => {
    const byDate = { '2026-05-28': 0, '2026-05-29': 1 }
    expect(computeStreak(byDate, '2026-05-29')).toEqual({ current: 1, longest: 1 })
  })

  it('handles month boundaries', () => {
    const byDate = { '2026-04-30': 1, '2026-05-01': 1 }
    expect(computeStreak(byDate, '2026-05-01').current).toBe(2)
  })
})

describe('computeStreaks', () => {
  const activity: UnifiedActivity = {
    endDate: '2026-05-29',
    startDate: '2025-05-30',
    sources: [
      { source: 'github', label: 'GitHub', total: 3, byDate: { '2026-05-28': 1, '2026-05-29': 2 } },
      { source: 'sport', label: 'Sport', total: 1, byDate: { '2026-05-29': 1 } },
    ],
  }

  it('computes a streak per source', () => {
    const { bySource } = computeStreaks(activity)
    expect(bySource).toHaveLength(2)
    expect(bySource.find((s) => s.source === 'github')?.current).toBe(2)
    expect(bySource.find((s) => s.source === 'sport')?.current).toBe(1)
  })

  it('computes a combined "active day" streak across sources', () => {
    const { combined } = computeStreaks(activity)
    expect(combined.current).toBe(2)
  })
})
