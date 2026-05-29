import { describe, expect, it } from 'vitest'
import { pickDailyBackdrop } from '@/lib/hero-backdrop'
import type { Film, Series } from '@/lib/types'

const film = (title: string, avgRating: number, backdropUrl?: string): Film => ({
  title,
  avgRating,
  backdropUrl,
})
const serie = (title: string, avgRating: number, backdropUrl?: string): Series => ({
  title,
  avgRating,
  backdropUrl,
})

const DAY = 86_400_000

describe('pickDailyBackdrop', () => {
  it("retourne null quand aucun titre n'a de backdrop", () => {
    const films = [film('A', 18), film('B', 19)]
    expect(pickDailyBackdrop(films, [], new Date('2026-05-29T12:00:00Z'))).toBeNull()
  })

  it('ignore les titres sans backdropUrl', () => {
    const films = [film('Sans', 20), film('Avec', 10, 'https://img/avec.jpg')]
    const result = pickDailyBackdrop(films, [], new Date('2026-05-29T12:00:00Z'))
    expect(result).toEqual({ url: 'https://img/avec.jpg', title: 'Avec' })
  })

  it('mélange films et séries dans le pool', () => {
    const films = [film('Film', 12, 'https://img/film.jpg')]
    const series = [serie('Serie', 19, 'https://img/serie.jpg')]
    const d0 = new Date(0) // seed 0 -> index 0 -> Serie (mieux notée)
    const d1 = new Date(DAY) // seed 1 -> index 1 -> Film
    expect(pickDailyBackdrop(films, series, d0)?.title).toBe('Serie')
    expect(pickDailyBackdrop(films, series, d1)?.title).toBe('Film')
  })

  it('est déterministe : même date -> même backdrop', () => {
    const films = [
      film('A', 18, 'https://img/a.jpg'),
      film('B', 17, 'https://img/b.jpg'),
      film('C', 16, 'https://img/c.jpg'),
    ]
    const date = new Date('2026-05-29T12:00:00Z')
    const first = pickDailyBackdrop(films, [], date)
    const again = pickDailyBackdrop(films, [], new Date('2026-05-29T23:59:00Z'))
    expect(first).toEqual(again)
  })

  it("tourne d'un jour à l'autre (pool > 1)", () => {
    const films = [film('A', 18, 'https://img/a.jpg'), film('B', 17, 'https://img/b.jpg')]
    const day = new Date('2026-05-29T12:00:00Z')
    const next = new Date(day.getTime() + DAY)
    expect(pickDailyBackdrop(films, [], day)).not.toEqual(pickDailyBackdrop(films, [], next))
  })

  it('ne garde que le top 12 par note', () => {
    const films = Array.from({ length: 13 }, (_, i) =>
      film(`F${i + 1}`, i + 1, `https://img/${i + 1}.jpg`),
    )
    const worst = 'F1' // note 1
    const titles = new Set<string>()
    for (let d = 0; d < 365; d++) {
      const r = pickDailyBackdrop(films, [], new Date(d * DAY))
      if (r) titles.add(r.title)
    }
    expect(titles.has(worst)).toBe(false)
    expect(titles.size).toBe(12)
  })
})
