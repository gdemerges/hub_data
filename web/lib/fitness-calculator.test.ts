import { describe, expect, it } from 'vitest'
import {
  analyzePerformanceFactors,
  analyzeRecovery,
  calculateFitnessMetrics,
  calculateLTHR,
  calculateTimeToTarget,
  calculateTSS,
  estimateVdot,
  FITNESS_CONSTANTS,
  predictRaceTimes,
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
      mkRun({ averageHeartrate: 180 + i, distance: 10, movingTime: 50 }),
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
    const atThreshold = calculateTSS(mkRun({ movingTime: 60, averageHeartrate: 165 }), 5.5, 165)
    // At threshold for 1h, TSS ≈ 100
    expect(atThreshold).toBeGreaterThanOrEqual(95)
    expect(atThreshold).toBeLessThanOrEqual(105)
  })

  it('clamps intensity factor to MAX', () => {
    // Crazy fast HR (ratio > MAX)
    const tss = calculateTSS(mkRun({ movingTime: 60, averageHeartrate: 300 }), 5.5, 100)
    const maxTss = (60 / 60) * FITNESS_CONSTANTS.MAX_INTENSITY_FACTOR ** 2 * 100
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
      mkRun({ startDate: daysAgo(i + 1), distance: 10, movingTime: 55 }),
    )
    const predictions = predictRaceTimes(runs)
    expect(predictions.map((p) => p.distance)).toEqual([5, 10, 21.1, 42.2])
  })

  it('Riegel: longer distance = longer predicted time', () => {
    const runs = Array.from({ length: 12 }, (_, i) =>
      mkRun({ startDate: daysAgo(i + 1), distance: 10, movingTime: 55 }),
    )
    const preds = predictRaceTimes(runs)
    const times = preds.map((p) => p.predictedTime)
    expect(times[0]).toBeLessThan(times[1])
    expect(times[1]).toBeLessThan(times[2])
    expect(times[2]).toBeLessThan(times[3])
  })

  it('marathon uses a more conservative exponent (1.08 vs 1.06)', () => {
    const runs = Array.from({ length: 12 }, (_, i) =>
      mkRun({ startDate: daysAgo(i + 1), distance: 10, movingTime: 60 }),
    )
    const preds = predictRaceTimes(runs)
    const half = preds.find((p) => p.distance === 21.1)!
    const marathon = preds.find((p) => p.distance === 42.2)!
    // Marathon time should be > 2 * half (due to exponent > 1)
    expect(marathon.predictedTime).toBeGreaterThan(half.predictedTime * 2)
  })

  it('derives the reference from the best effort across ALL distances (#9)', () => {
    // Beaucoup de 10 km lents + un 5 km rapide. L'ancien code ne regardait que
    // la bande 9–11 km et prédisait ~60 min. Le 5 km rapide (équiv-10k ≈ 46 min)
    // doit désormais tirer la prédiction vers le bas.
    const slowTens = Array.from({ length: 10 }, (_, i) =>
      mkRun({ startDate: daysAgo(i + 1), distance: 10, movingTime: 60 }),
    )
    const fastFive = mkRun({ startDate: daysAgo(2), distance: 5, movingTime: 22 })
    const tenK = predictRaceTimes([...slowTens, fastFive]).find((p) => p.distance === 10)!
    expect(tenK.predictedTime).toBeLessThan(55)
  })

  it('boosts confidence when a run near the target distance exists (#9)', () => {
    const withTen = Array.from({ length: 10 }, (_, i) =>
      mkRun({ startDate: daysAgo(i + 1), distance: 10, movingTime: 55 }),
    )
    const onlyShort = Array.from({ length: 10 }, (_, i) =>
      mkRun({ startDate: daysAgo(i + 1), distance: 4, movingTime: 20 }),
    )
    const tenWith = predictRaceTimes(withTen).find((p) => p.distance === 10)!
    const tenWithout = predictRaceTimes(onlyShort).find((p) => p.distance === 10)!
    expect(tenWith.confidence).toBeGreaterThan(tenWithout.confidence)
  })
})

describe('estimateVdot', () => {
  it('returns null without recent runs', () => {
    expect(estimateVdot([])).toBeNull()
    expect(estimateVdot([mkRun({ startDate: daysAgo(200) })])).toBeNull()
    expect(estimateVdot([mkRun({ type: 'Ride', startDate: daysAgo(5) })])).toBeNull()
  })

  it('estimates a plausible VDOT from a recent 10k (~40 min → ~50)', () => {
    const vdot = estimateVdot([mkRun({ distance: 10, movingTime: 40, startDate: daysAgo(5) })])
    expect(vdot).not.toBeNull()
    expect(vdot!).toBeGreaterThan(45)
    expect(vdot!).toBeLessThan(55)
  })

  it('a faster runner scores a higher VDOT', () => {
    const slow = estimateVdot([mkRun({ distance: 10, movingTime: 55, startDate: daysAgo(5) })])!
    const fast = estimateVdot([mkRun({ distance: 10, movingTime: 38, startDate: daysAgo(5) })])!
    expect(fast).toBeGreaterThan(slow)
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
      }),
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

  it('aligns daily TSS on the local calendar day (#3 timezone)', () => {
    // Sortie récente à 20h heure locale (chaîne sans 'Z' = heure locale).
    // L'ancien code indexait la boucle en UTC et décalait le TSS d'un jour
    // pour les sorties du soir en fuseau négatif.
    const d = new Date()
    d.setDate(d.getDate() - 3)
    const pad = (n: number) => String(n).padStart(2, '0')
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T20:00:00`
    const metrics = calculateFitnessMetrics([
      mkRun({ startDate: local, distance: 10, movingTime: 60 }),
    ])
    const entry = metrics.find((m) => m.date === local.split('T')[0])
    expect(entry).toBeTruthy()
    expect(entry!.ctl).toBeGreaterThan(0)
  })

  it('CTL rises and plateaus with daily constant load', () => {
    const runs = Array.from({ length: 60 }, (_, i) =>
      mkRun({ startDate: daysAgo(60 - i), distance: 10, movingTime: 60 }),
    )
    const metrics = calculateFitnessMetrics(runs)
    expect(metrics.length).toBeGreaterThan(0)
    const first = metrics[0]
    const last = metrics[metrics.length - 1]
    expect(last.ctl).toBeGreaterThan(first.ctl)
  })

  it('TSB = CTL - ATL', () => {
    const runs = Array.from({ length: 30 }, (_, i) =>
      mkRun({ startDate: daysAgo(30 - i), distance: 10, movingTime: 60 }),
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
    expect(analyzePerformanceFactors(Array.from({ length: 9 }, () => mkRun()))).toBeNull()
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

  it('ranks the best day by distance-adjusted residual, not raw speed (#8)', () => {
    // Date locale (sans 'Z') pour le k-ème jour de semaine `targetDay` donné.
    function dateForWeekday(targetDay: number, k: number): string {
      const d = new Date(2026, 0, 1, 8, 0, 0)
      while (d.getDay() !== targetDay) d.setDate(d.getDate() + 1)
      d.setDate(d.getDate() + k * 7)
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T08:00:00`
    }
    const run = (day: number, k: number, distance: number, speed: number) =>
      mkRun({
        startDate: dateForWeekday(day, k),
        distance,
        movingTime: (distance / speed) * 60,
      })

    // Fond de carte : sorties sur la droite vitesse = 14 − 0.2·distance.
    const background = [
      run(3, 0, 8, 12.4),
      run(3, 1, 12, 11.6),
      run(5, 0, 16, 10.8),
      run(5, 1, 18, 10.4),
      run(0, 0, 6, 12.8),
      run(0, 1, 10, 12.0),
    ]
    // Mardi : sorties courtes rapides → vitesse brute la plus haute (13.2), mais
    // pile sur la droite (résidu ≈ 0).
    const fastShort = Array.from({ length: 4 }, (_, k) => run(2, k, 4, 13.2))
    // Jeudi : sorties longues, plus rapides que prévu pour 20 km (résidu +2),
    // mais vitesse brute plus basse (12.0).
    const relFastLong = Array.from({ length: 4 }, (_, k) => run(4, k, 20, 12.0))

    const analysis = analyzePerformanceFactors([...background, ...fastShort, ...relFastLong])!
    expect(analysis).not.toBeNull()

    const dayInsights = analysis.insights.filter((i) => i.factor === 'day')
    const maxRawSpeed = Math.max(...dayInsights.map((i) => i.avgSpeed))
    // Le meilleur jour n'est PAS celui de vitesse brute maximale (Mardi).
    expect(analysis.bestDayOfWeek.avgSpeed).toBeLessThan(maxRawSpeed)
    expect(analysis.bestDayOfWeek.improvement).toBeGreaterThan(0)
  })
})
