import { describe, it, expect } from 'vitest'
import {
  calculateTSS,
  calculateLTHR,
  calculateFitnessMetrics,
  predictRaceTimes,
  calculateTimeToTarget,
  analyzeRecovery,
  analyzePerformanceFactors,
  FITNESS_CONSTANTS,
} from './fitness-calculator'

interface Activity {
  startDate: string
  distance: number
  movingTime: number
  totalElevationGain: number
  type: string
  averageHeartrate?: number
}

const mkRun = (overrides: Partial<Activity> = {}): Activity => ({
  startDate: '2026-04-01T08:00:00Z',
  distance: 10,
  movingTime: 60,
  totalElevationGain: 0,
  type: 'Run',
  ...overrides,
})

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

describe('calculateLTHR', () => {
  it('returns default LTHR when no HR data', () => {
    expect(calculateLTHR([mkRun()])).toBe(FITNESS_CONSTANTS.DEFAULT_LTHR)
    expect(calculateLTHR([])).toBe(FITNESS_CONSTANTS.DEFAULT_LTHR)
  })

  it('estimates LTHR at ~90% of intense-effort average', () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      mkRun({ averageHeartrate: 180 + i, distance: 10, movingTime: 50 })
    )
    const lthr = calculateLTHR(activities)
    // avg is ~184.5, 90% ≈ 166
    expect(lthr).toBeGreaterThan(160)
    expect(lthr).toBeLessThan(170)
  })

  it('ignores activities under 3km', () => {
    const short = mkRun({ distance: 2, averageHeartrate: 200 })
    const long = mkRun({ distance: 10, averageHeartrate: 150, movingTime: 60 })
    const lthr = calculateLTHR([short, long])
    // Should use long only (via intensive-efforts path)
    expect(lthr).toBeLessThanOrEqual(150)
  })
})

describe('calculateTSS', () => {
  it('returns higher TSS for longer duration', () => {
    const short = calculateTSS(mkRun({ distance: 5, movingTime: 30 }))
    const long = calculateTSS(mkRun({ distance: 10, movingTime: 60 }))
    expect(long).toBeGreaterThan(short)
  })

  it('uses HR method when HR + LTHR provided', () => {
    const atThreshold = calculateTSS(
      mkRun({ movingTime: 60, averageHeartrate: 165 }),
      5.5,
      165
    )
    // At threshold for 1h, TSS ≈ 100
    expect(atThreshold).toBeGreaterThanOrEqual(95)
    expect(atThreshold).toBeLessThanOrEqual(105)
  })

  it('clamps intensity factor to MAX', () => {
    // Crazy fast HR (ratio > MAX)
    const tss = calculateTSS(mkRun({ movingTime: 60, averageHeartrate: 300 }), 5.5, 100)
    const maxTss = 60 / 60 * Math.pow(FITNESS_CONSTANTS.MAX_INTENSITY_FACTOR, 2) * 100
    // elevation multiplier = 1 (no elevation), so ceiling is maxTss
    expect(tss).toBeLessThanOrEqual(Math.round(maxTss) + 1)
  })

  it('adds elevation bonus in pace-based method', () => {
    const flat = calculateTSS(mkRun({ totalElevationGain: 0 }))
    const hilly = calculateTSS(mkRun({ totalElevationGain: 500 }))
    expect(hilly).toBeGreaterThan(flat)
  })
})

describe('predictRaceTimes', () => {
  it('returns empty array when no runs', () => {
    expect(predictRaceTimes([])).toEqual([])
    expect(predictRaceTimes([mkRun({ type: 'Ride' })])).toEqual([])
  })

  it('returns empty when no recent runs (>3 months)', () => {
    const oldRun = mkRun({ startDate: daysAgo(200) })
    expect(predictRaceTimes([oldRun])).toEqual([])
  })

  it('predicts 4 distances (5k/10k/21k/42k)', () => {
    const runs = Array.from({ length: 12 }, (_, i) =>
      mkRun({ startDate: daysAgo(i + 1), distance: 10, movingTime: 55 })
    )
    const predictions = predictRaceTimes(runs)
    expect(predictions.map((p) => p.distance)).toEqual([5, 10, 21.1, 42.2])
  })

  it('Riegel: longer distance = longer predicted time', () => {
    const runs = Array.from({ length: 12 }, (_, i) =>
      mkRun({ startDate: daysAgo(i + 1), distance: 10, movingTime: 55 })
    )
    const preds = predictRaceTimes(runs)
    const times = preds.map((p) => p.predictedTime)
    expect(times[0]).toBeLessThan(times[1])
    expect(times[1]).toBeLessThan(times[2])
    expect(times[2]).toBeLessThan(times[3])
  })

  it('marathon uses a more conservative exponent (1.08 vs 1.06)', () => {
    const runs = Array.from({ length: 12 }, (_, i) =>
      mkRun({ startDate: daysAgo(i + 1), distance: 10, movingTime: 60 })
    )
    const preds = predictRaceTimes(runs)
    const half = preds.find((p) => p.distance === 21.1)!
    const marathon = preds.find((p) => p.distance === 42.2)!
    // Marathon time should be > 2 * half (due to exponent > 1)
    expect(marathon.predictedTime).toBeGreaterThan(half.predictedTime * 2)
  })
})

describe('calculateTimeToTarget', () => {
  it('returns 0 when already at target', () => {
    expect(calculateTimeToTarget(50, 60, [])).toBe(0)
    expect(calculateTimeToTarget(50, 50, [])).toBe(0)
  })

  it('estimates days with conservative 3% when not enough data', () => {
    const days = calculateTimeToTarget(60, 55, [])
    expect(days).toBeGreaterThan(0)
    // gap = 5/60 ≈ 0.083, 0.083 / 0.03 ≈ 2.77 months ≈ 84 days
    expect(days).toBeGreaterThan(70)
    expect(days).toBeLessThan(100)
  })
})

describe('analyzeRecovery', () => {
  it('returns ready with no activities', () => {
    const r = analyzeRecovery([])
    expect(r.status).toBe('ready')
    expect(r.riskScore).toBe(0)
  })

  it('flags rest after very intense recent activity', () => {
    const recent = mkRun({
      startDate: daysAgo(0),
      distance: 30,
      movingTime: 180,
      averageHeartrate: 180,
    })
    const r = analyzeRecovery([recent])
    expect(['caution', 'rest']).toContain(r.status)
    expect(r.riskScore).toBeGreaterThan(0)
  })

  it('risk score is capped at 100', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      mkRun({
        startDate: daysAgo(i),
        distance: 30,
        movingTime: 180,
        averageHeartrate: 190,
      })
    )
    const r = analyzeRecovery(many)
    expect(r.riskScore).toBeLessThanOrEqual(100)
  })
})

describe('calculateFitnessMetrics', () => {
  it('returns empty for no activities', () => {
    expect(calculateFitnessMetrics([])).toEqual([])
  })

  it('returns empty when all activities are older than FITNESS_WINDOW_DAYS', () => {
    const old = mkRun({ startDate: daysAgo(365) })
    expect(calculateFitnessMetrics([old])).toEqual([])
  })

  it('CTL rises and plateaus with daily constant load', () => {
    const runs = Array.from({ length: 60 }, (_, i) =>
      mkRun({ startDate: daysAgo(60 - i), distance: 10, movingTime: 60 })
    )
    const metrics = calculateFitnessMetrics(runs)
    expect(metrics.length).toBeGreaterThan(0)
    const first = metrics[0]
    const last = metrics[metrics.length - 1]
    expect(last.ctl).toBeGreaterThan(first.ctl)
  })

  it('TSB = CTL - ATL', () => {
    const runs = Array.from({ length: 30 }, (_, i) =>
      mkRun({ startDate: daysAgo(30 - i), distance: 10, movingTime: 60 })
    )
    const metrics = calculateFitnessMetrics(runs)
    for (const m of metrics) {
      // Each value rounded to 0.1 independently, so tolerate rounding drift
      expect(Math.abs(m.tsb - (m.ctl - m.atl))).toBeLessThanOrEqual(0.15)
    }
  })
})

describe('analyzePerformanceFactors', () => {
  it('returns null with <10 activities', () => {
    expect(analyzePerformanceFactors([])).toBeNull()
    expect(
      analyzePerformanceFactors(Array.from({ length: 9 }, () => mkRun()))
    ).toBeNull()
  })

  it('identifies best day/time/rest with enough data', () => {
    const runs = Array.from({ length: 20 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i * 2)
      return mkRun({
        startDate: d.toISOString(),
        distance: 10,
        movingTime: 55 + (i % 5),
      })
    })
    const analysis = analyzePerformanceFactors(runs)
    expect(analysis).not.toBeNull()
    expect(analysis!.bestDayOfWeek).toBeTruthy()
    expect(analysis!.bestTimeOfDay).toBeTruthy()
    expect(analysis!.bestRestDays).toBeTruthy()
    expect(analysis!.insights.length).toBeGreaterThan(0)
  })
})
