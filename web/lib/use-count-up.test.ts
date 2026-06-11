import { describe, expect, it } from 'vitest'
import { countUpValue, easeOutCubic } from './use-count-up'

describe('easeOutCubic', () => {
  it('borne 0 → 0 et 1 → 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('démarre vite (au-dessus de la diagonale)', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })
})

describe('countUpValue', () => {
  it('atteint exactement la cible à la fin (et au-delà)', () => {
    expect(countUpValue(312, 1200, 1200)).toBe(312)
    expect(countUpValue(312, 5000, 1200)).toBe(312)
  })

  it('vaut 0 au départ', () => {
    expect(countUpValue(312, 0, 1200)).toBe(0)
  })

  it('progresse de façon monotone', () => {
    const a = countUpValue(1000, 300, 1200)
    const b = countUpValue(1000, 600, 1200)
    expect(b).toBeGreaterThan(a)
  })

  it('durée nulle ou négative → cible directe (garde-fou)', () => {
    expect(countUpValue(42, 0, 0)).toBe(42)
  })
})
