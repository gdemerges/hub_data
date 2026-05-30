import { describe, expect, it } from 'vitest'
import { formatWatchHours, totalSeriesMinutes } from './series-time'
import type { Series } from './types'

describe('totalSeriesMinutes', () => {
  it('sums watchMinutes across series', () => {
    const series: Series[] = [
      { title: 'A', watchMinutes: 495 },
      { title: 'B', watchMinutes: 52 },
      { title: 'C', watchMinutes: 504 },
    ]
    expect(totalSeriesMinutes(series)).toBe(1051)
  })

  it('treats missing watchMinutes as 0', () => {
    const series: Series[] = [
      { title: 'A', watchMinutes: 100 },
      { title: 'B' },
      { title: 'C', watchMinutes: undefined },
    ]
    expect(totalSeriesMinutes(series)).toBe(100)
  })

  it('returns 0 for an empty list', () => {
    expect(totalSeriesMinutes([])).toBe(0)
  })
})

describe('formatWatchHours', () => {
  it('rounds minutes to whole hours', () => {
    expect(formatWatchHours(495)).toMatch(/^8 h$/)
    expect(formatWatchHours(52)).toMatch(/^1 h$/)
  })

  it('groups thousands with a space separator', () => {
    // 74460 min = 1241 h ; \s tolerates a regular or non-breaking space
    expect(formatWatchHours(74460)).toMatch(/^1\s241\sh$/)
  })

  it('returns "0 h" for 0, missing or negative input', () => {
    expect(formatWatchHours(0)).toMatch(/^0 h$/)
    expect(formatWatchHours(undefined as unknown as number)).toMatch(/^0 h$/)
    expect(formatWatchHours(-10)).toMatch(/^0 h$/)
  })
})
