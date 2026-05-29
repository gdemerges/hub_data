import { describe, it, expect } from 'vitest'
import { eventsOnDate } from './day-detail'
import type { Film, Series, Game, Book } from './types'

describe('eventsOnDate', () => {
  const films: Film[] = [
    { title: 'Vu ce jour', dateWatched: '2026-05-29', rating: 7 },
    { title: 'Autre jour', dateWatched: '2026-05-28' },
  ]
  const series: Series[] = [{ title: 'Série finie', dateCompleted: '2026-05-29' }]
  const games: Game[] = [
    { title: 'Jeu commencé', dateStarted: '2026-05-29' },
    { title: 'Jeu fini', dateFinished: '2026-05-29' },
  ]
  const books: Book[] = [{ id: '1', title: 'Livre', dateRead: '29/05/2026', author: 'Auteur' }]

  const input = { films, series, games, books }

  it('returns only events on the exact date, across all sources', () => {
    const events = eventsOnDate(input, '2026-05-29')
    const titles = events.map((e) => e.title)
    expect(titles).toContain('Vu ce jour')
    expect(titles).toContain('Série finie')
    expect(titles).toContain('Livre')
    expect(titles).not.toContain('Autre jour')
    expect(new Set(events.map((e) => e.type))).toEqual(new Set(['film', 'series', 'game', 'book']))
  })

  it('distinguishes a started vs finished game', () => {
    const started = eventsOnDate(input, '2026-05-29').find((e) => e.title === 'Jeu commencé')
    const finished = eventsOnDate(input, '2026-05-29').find((e) => e.title === 'Jeu fini')
    expect(started?.subtitle).toBe('Commencé')
    expect(finished?.subtitle).toBe('Terminé')
  })

  it('matches French-formatted book dates against an ISO target', () => {
    expect(eventsOnDate(input, '2026-05-29').some((e) => e.type === 'book')).toBe(true)
  })

  it('returns empty for a date with nothing and for invalid input', () => {
    expect(eventsOnDate(input, '2026-01-01')).toEqual([])
    expect(eventsOnDate(input, 'pas une date')).toEqual([])
  })
})
