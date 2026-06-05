import { describe, it, expect } from 'vitest'
import { parseDate, eventsOnThisDay } from './on-this-day'
import type { Film, Game, Book } from './types'

describe('parseDate', () => {
  it('parses ISO and French dates', () => {
    expect(parseDate('2024-05-29')).toEqual({ year: 2024, month: 5, day: 29 })
    expect(parseDate('29/05/2024')).toEqual({ year: 2024, month: 5, day: 29 })
  })

  it('returns null for missing or unrecognized input', () => {
    expect(parseDate(undefined)).toBeNull()
    expect(parseDate('hier')).toBeNull()
  })
})

describe('eventsOnThisDay', () => {
  const films: Film[] = [
    { title: 'Match', dateWatched: '2022-05-29', rating: 8 },
    { title: 'Wrong day', dateWatched: '2022-05-28' },
    { title: 'Wrong month', dateWatched: '2022-06-29' },
  ]
  const games: Game[] = [
    { title: 'Jeu fini', dateFinished: '2023-05-29' },
    { title: 'Jeu commencé', dateStarted: '2019-05-29' },
  ]
  const books: Book[] = [{ id: '1', title: 'Livre', dateRead: '29/05/2018', author: 'Auteur' }]

  const input = { films, games, books }
  const today = '2025-05-29'

  it('keeps only same month + day events', () => {
    const titles = eventsOnThisDay(input, today).map((e) => e.title)
    expect(titles).toContain('Match')
    expect(titles).not.toContain('Wrong day')
    expect(titles).not.toContain('Wrong month')
  })

  it('pulls events from every dated source (no series: undated at the source)', () => {
    const types = new Set(eventsOnThisDay(input, today).map((e) => e.type))
    expect(types).toEqual(new Set(['film', 'game', 'book']))
  })

  it('computes yearsAgo relative to today and sorts most recent first', () => {
    const events = eventsOnThisDay(input, today)
    expect(events[0].title).toBe('Jeu fini') // 2023, most recent
    const film = events.find((e) => e.title === 'Match')!
    expect(film.yearsAgo).toBe(3)
  })

  it('excludes future-dated events', () => {
    const future = eventsOnThisDay(input, '2021-05-29')
    expect(future.map((e) => e.title)).not.toContain('Jeu fini') // 2023 > 2021
  })

  it('returns empty when nothing matches', () => {
    expect(eventsOnThisDay(input, '2025-01-01')).toEqual([])
  })
})
