import { describe, it, expect } from 'vitest'
import { yearOf, computeGoals, DEFAULT_TARGETS } from './goals'
import type { Film, Series, Game, Book } from './types'

describe('yearOf', () => {
  it('parses ISO dates', () => {
    expect(yearOf('2026-05-29')).toBe(2026)
  })

  it('parses French DD/MM/YYYY dates', () => {
    expect(yearOf('29/05/2026')).toBe(2026)
  })

  it('returns null for missing or unrecognized dates', () => {
    expect(yearOf(undefined)).toBeNull()
    expect(yearOf('')).toBeNull()
    expect(yearOf('mai 2026')).toBeNull()
  })
})

describe('computeGoals', () => {
  const films: Film[] = [
    { title: 'A', dateWatched: '2026-01-10' },
    { title: 'B', dateWatched: '2026-03-02' },
    { title: 'C', dateWatched: '2025-12-31' },
  ]
  const series: Series[] = [{ title: 'S', dateCompleted: '2026-02-01' }]
  const games: Game[] = [{ title: 'G', dateFinished: '2026-04-04' }]
  const books: Book[] = [
    { id: '1', title: 'Dune', dateRead: '12/01/2026' },
    { id: '2', title: 'Foundation', dateRead: '05/07/2025' },
  ]

  const input = { films, series, games, books, githubContributions: 750, year: 2026 }

  it('counts only items dated within the target year', () => {
    const goals = computeGoals(input)
    expect(goals.find((g) => g.key === 'films')?.current).toBe(2)
    expect(goals.find((g) => g.key === 'series')?.current).toBe(1)
    expect(goals.find((g) => g.key === 'games')?.current).toBe(1)
    expect(goals.find((g) => g.key === 'books')?.current).toBe(1)
  })

  it('passes github contributions through unchanged', () => {
    expect(computeGoals(input).find((g) => g.key === 'github')?.current).toBe(750)
  })

  it('computes a percentage capped at 100', () => {
    const goals = computeGoals({ ...input, githubContributions: 99999 })
    const gh = goals.find((g) => g.key === 'github')!
    expect(gh.target).toBe(DEFAULT_TARGETS.github)
    expect(gh.pct).toBe(100)
  })

  it('honors custom targets', () => {
    const goals = computeGoals(input, { ...DEFAULT_TARGETS, films: 4 })
    expect(goals.find((g) => g.key === 'films')?.pct).toBe(50)
  })
})
