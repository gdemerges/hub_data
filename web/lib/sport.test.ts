import { describe, it, expect } from 'vitest'
import {
  filterActivity,
  filterLabel,
  formatDuration,
  aggregateStats,
  yearlyStats,
  computeTrainingAnalysis,
  SportActivity,
} from './sport'

const mk = (over: Partial<SportActivity> = {}): SportActivity => ({
  id: 1,
  name: 'Morning run',
  type: 'Run',
  distance: 10,
  movingTime: 60,
  totalElevationGain: 0,
  startDate: '2026-04-10T08:00:00Z',
  averageSpeed: 10,
  ...over,
})

describe('filterActivity', () => {
  it('all matches everything', () => {
    expect(filterActivity({ type: 'Run', name: 'x' }, 'all')).toBe(true)
    expect(filterActivity({ type: 'Ride', name: 'y' }, 'all')).toBe(true)
  })
  it('RPM matches by name', () => {
    expect(filterActivity({ type: 'Ride', name: 'RPM 55' }, 'RPM')).toBe(true)
    expect(filterActivity({ type: 'Ride', name: 'Road ride' }, 'RPM')).toBe(false)
  })
  it('Ride excludes RPM', () => {
    expect(filterActivity({ type: 'Ride', name: 'Road ride' }, 'Ride')).toBe(true)
    expect(filterActivity({ type: 'Ride', name: 'RPM 55' }, 'Ride')).toBe(false)
  })
  it('Run matches type', () => {
    expect(filterActivity({ type: 'Run', name: 'x' }, 'Run')).toBe(true)
    expect(filterActivity({ type: 'Ride', name: 'x' }, 'Run')).toBe(false)
  })
})

describe('filterLabel', () => {
  it('maps keys to fr labels', () => {
    expect(filterLabel('all')).toBe('Total')
    expect(filterLabel('Run')).toBe('Course')
    expect(filterLabel('RPM')).toBe('RPM')
    expect(filterLabel('Ride')).toBe('Vélo')
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m')
  })
  it('formats hours and minutes', () => {
    expect(formatDuration(135)).toBe('2h 15m')
  })
})

describe('aggregateStats', () => {
  it('sums distance / time / elevation / count', () => {
    const stats = aggregateStats([
      mk({ distance: 10, movingTime: 60, totalElevationGain: 100 }),
      mk({ distance: 5, movingTime: 30, totalElevationGain: 50 }),
    ])
    expect(stats.totalDistance).toBe(15)
    expect(stats.totalTime).toBe(1.5)
    expect(stats.totalElevation).toBe(150)
    expect(stats.totalActivities).toBe(2)
  })
})

describe('yearlyStats', () => {
  it('groups distance per year ascending', () => {
    const stats = yearlyStats(
      [
        mk({ startDate: '2024-06-01T00:00:00Z', distance: 10 }),
        mk({ startDate: '2024-07-01T00:00:00Z', distance: 5 }),
        mk({ startDate: '2025-01-01T00:00:00Z', distance: 20 }),
      ],
      'distance'
    )
    expect(stats).toEqual([
      { year: 2024, value: 15 },
      { year: 2025, value: 20 },
    ])
  })

  it('hours mode uses movingTime/60', () => {
    const stats = yearlyStats(
      [mk({ startDate: '2025-01-01T00:00:00Z', movingTime: 120 })],
      'hours'
    )
    expect(stats[0].value).toBe(2)
  })
})

describe('computeTrainingAnalysis', () => {
  function recent(daysAgo: number, over: Partial<SportActivity> = {}): SportActivity {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return mk({ startDate: d.toISOString(), ...over })
  }

  it('produces success alert when no risk and some volume', () => {
    const runs = [recent(0, { distance: 8 }), recent(7, { distance: 8 }), recent(14, { distance: 8 })]
    const a = computeTrainingAnalysis(runs)
    expect(a.alerts.some((x) => x.type === 'success')).toBe(true)
  })

  it('flags danger when weekly volume jumps > 20%', () => {
    const runs = [
      recent(0, { distance: 50 }),
      recent(8, { distance: 10 }),
      recent(15, { distance: 10 }),
      recent(22, { distance: 10 }),
    ]
    const a = computeTrainingAnalysis(runs)
    expect(a.alerts.some((x) => x.type === 'danger')).toBe(true)
    expect(a.increaseFromLastWeek).toBeGreaterThan(20)
  })

  it('daysSinceLastRun null when no runs', () => {
    const a = computeTrainingAnalysis([])
    expect(a.daysSinceLastRun).toBeNull()
    expect(a.lastRun).toBeNull()
  })
})
