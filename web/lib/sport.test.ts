import { describe, expect, it } from 'vitest'
import {
  aggregateStats,
  computePersonalRecords,
  computeTrainingAnalysis,
  filterActivity,
  filterLabel,
  formatDuration,
  formatPace,
  formatRaceTime,
  monthlyTrend,
  paceDistribution,
  paceProgression,
  runCalendar,
  type SportActivity,
  yearlyStats,
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

describe('monthlyTrend', () => {
  const now = new Date('2026-04-15T00:00:00Z')

  it('buckets a metric into the last N months, chronological', () => {
    const acts = [
      mk({ startDate: '2026-04-10T08:00:00Z', distance: 10 }), // mois courant
      mk({ startDate: '2026-04-20T08:00:00Z', distance: 5 }), // mois courant
      mk({ startDate: '2026-03-01T08:00:00Z', distance: 8 }), // mois -1
    ]
    const trend = monthlyTrend(acts, 'distance', 3, now)
    expect(trend).toHaveLength(3)
    expect(trend[trend.length - 1]).toBe(15) // avril cumulé
    expect(trend[trend.length - 2]).toBe(8) // mars
    expect(trend[0]).toBe(0) // février, vide
  })

  it('ignores activities outside the window', () => {
    const acts = [mk({ startDate: '2025-01-01T08:00:00Z', distance: 99 })]
    expect(monthlyTrend(acts, 'distance', 3, now)).toEqual([0, 0, 0])
  })

  it('converts time to hours', () => {
    const acts = [mk({ startDate: '2026-04-10T08:00:00Z', movingTime: 120 })]
    expect(monthlyTrend(acts, 'time', 1, now)).toEqual([2])
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
      'distance',
    )
    expect(stats).toEqual([
      { year: 2024, value: 15 },
      { year: 2025, value: 20 },
    ])
  })

  it('hours mode uses movingTime/60', () => {
    const stats = yearlyStats([mk({ startDate: '2025-01-01T00:00:00Z', movingTime: 120 })], 'hours')
    expect(stats[0].value).toBe(2)
  })
})

describe('formatPace', () => {
  it('converts km/h to min/km', () => {
    expect(formatPace(12)).toBe('5\'00"')
    expect(formatPace(10)).toBe('6\'00"')
    expect(formatPace(60 / 5.5)).toBe('5\'30"')
  })
  it('handles invalid speed', () => {
    expect(formatPace(0)).toBe('—')
    expect(formatPace(-3)).toBe('—')
  })
  it('rolls 60s over to the next minute', () => {
    // pace 5'59.7" rounds to 6'00", not 5'60"
    expect(formatPace(60 / 5.995)).toBe('6\'00"')
  })
})

describe('formatRaceTime', () => {
  it('formats sub-hour as m\'ss"', () => {
    expect(formatRaceTime(44.5)).toBe('44\'30"')
  })
  it('formats over an hour as h"mm', () => {
    expect(formatRaceTime(150)).toBe('2h30')
    expect(formatRaceTime(63)).toBe('1h03')
  })
  it('handles invalid input', () => {
    expect(formatRaceTime(0)).toBe('—')
  })
})

describe('computePersonalRecords', () => {
  it('returns empty records for no runs', () => {
    const r = computePersonalRecords([])
    expect(r.bestAvgPace).toBeNull()
    expect(r.longestRun).toBeNull()
    expect(r.biggestElevation).toBeNull()
    expect(r.efforts).toEqual([])
  })

  it('finds longest run, biggest elevation and best average pace', () => {
    const runs = [
      mk({ id: 1, distance: 5, movingTime: 25, totalElevationGain: 50 }),
      mk({ id: 2, distance: 12, movingTime: 60, totalElevationGain: 200 }),
      mk({ id: 3, distance: 10, movingTime: 60, totalElevationGain: 0 }),
    ]
    const r = computePersonalRecords(runs)
    expect(r.longestRun?.id).toBe(2)
    expect(r.biggestElevation?.id).toBe(2)
    // r1 and r2 both at 5 min/km; r3 at 6 min/km
    expect(r.bestAvgPace?.paceMinPerKm).toBeCloseTo(5, 5)
  })

  it('estimates only achievable race efforts via Riegel', () => {
    const runs = [
      mk({ id: 1, distance: 5, movingTime: 25 }),
      mk({ id: 2, distance: 12, movingTime: 60 }),
    ]
    const r = computePersonalRecords(runs)
    // max distance 12 km → 5k and 10k achievable, semi/marathon not
    expect(r.efforts.map((e) => e.distance)).toEqual([5, 10])
    const tenK = r.efforts.find((e) => e.distance === 10)!
    // best 10k estimated from the 12 km run, so flagged as estimated
    expect(tenK.estimated).toBe(true)
    expect(tenK.estimatedTime).toBeLessThan(60)
  })
})

describe('paceProgression', () => {
  const now = new Date('2026-04-15T00:00:00Z')

  it('normalises each run to a 10k-equivalent pace, chronological', () => {
    // 5 km en 25 min (5'00"/km) → équivalent 10k plus lent (Riegel)
    const pts = paceProgression(
      [mk({ distance: 5, movingTime: 25, startDate: '2026-04-10T08:00:00Z' })],
      3,
      now,
    )
    expect(pts).toHaveLength(3)
    expect(pts[0].equivPace).toBeNull() // février, vide
    expect(pts[pts.length - 1].equivPace).toBeCloseTo(5.21, 1)
    expect(pts[pts.length - 1].runs).toBe(1)
  })

  it('ignores runs under 2 km and outside the window', () => {
    const pts = paceProgression(
      [
        mk({ distance: 1, movingTime: 6, startDate: '2026-04-10T08:00:00Z' }),
        mk({ distance: 10, movingTime: 60, startDate: '2024-01-01T08:00:00Z' }),
      ],
      3,
      now,
    )
    expect(pts.every((p) => p.equivPace === null)).toBe(true)
  })
})

describe('runCalendar', () => {
  it('keeps only the requested year and grades level by daily distance', () => {
    const days = runCalendar(
      [
        mk({ distance: 12, startDate: '2026-03-01T08:00:00' }),
        mk({ distance: 4, startDate: '2026-06-01T08:00:00' }),
        mk({ distance: 20, startDate: '2025-01-01T08:00:00' }),
      ],
      2026,
    )
    expect(days).toHaveLength(2)
    expect(days.find((d) => d.count === 12)?.level).toBe(3)
    expect(days.find((d) => d.count === 4)?.level).toBe(1)
  })

  it('sums multiple runs on the same day', () => {
    const days = runCalendar(
      [
        mk({ distance: 6, startDate: '2026-05-04T08:00:00' }),
        mk({ distance: 6, startDate: '2026-05-04T18:00:00' }),
      ],
      2026,
    )
    expect(days).toHaveLength(1)
    expect(days[0].count).toBe(12)
    expect(days[0].level).toBe(3)
  })
})

describe('paceDistribution', () => {
  it('returns zeros for no runs', () => {
    expect(paceDistribution([])).toEqual({ easy: 0, tempo: 0, hard: 0, thresholdPace: 0 })
  })

  it('splits volume into easy/tempo/hard around the threshold pace', () => {
    const runs = [
      mk({ distance: 10, movingTime: 50 }), // 5'/km → hard
      mk({ distance: 10, movingTime: 60 }), // 6'/km → seuil/tempo
      mk({ distance: 10, movingTime: 70 }), // 7'/km → easy
      mk({ distance: 10, movingTime: 80 }), // 8'/km → easy
    ]
    const d = paceDistribution(runs)
    expect(d.thresholdPace).toBeCloseTo(6, 5)
    expect(d.hard).toBeCloseTo(10, 5)
    expect(d.tempo).toBeCloseTo(10, 5)
    expect(d.easy).toBeCloseTo(20, 5)
  })
})

describe('computeTrainingAnalysis', () => {
  function recent(daysAgo: number, over: Partial<SportActivity> = {}): SportActivity {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return mk({ startDate: d.toISOString(), ...over })
  }

  it('exposes up to 8 weekly volumes in chronological order', () => {
    const runs = [
      recent(0, { distance: 8 }),
      recent(7, { distance: 6 }),
      recent(14, { distance: 10 }),
      recent(21, { distance: 5 }),
    ]
    const a = computeTrainingAnalysis(runs)
    expect(a.weeklyVolumes.length).toBeGreaterThan(0)
    expect(a.weeklyVolumes.length).toBeLessThanOrEqual(8)
    const starts = a.weeklyVolumes.map((w) => w.weekStart)
    expect([...starts].sort((x, y) => x - y)).toEqual(starts) // ascending
    // last bucket = current week
    expect(a.weeklyVolumes[a.weeklyVolumes.length - 1].distance).toBeCloseTo(8, 5)
  })

  it('produces success alert when no risk and some volume', () => {
    const runs = [
      recent(0, { distance: 8 }),
      recent(7, { distance: 8 }),
      recent(14, { distance: 8 }),
    ]
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
