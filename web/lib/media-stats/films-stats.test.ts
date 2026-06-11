import { describe, expect, it } from 'vitest'
import type { Film } from '@/lib/types'
import { computeFilmStats } from './films-stats'

function mkFilm(over: Partial<Film>): Film {
  return { title: 'Sans titre', ...over } as Film
}

describe('computeFilmStats', () => {
  it('liste vide → stats neutres', () => {
    const s = computeFilmStats([])
    expect(s.totalFilms).toBe(0)
    expect(s.totalMinutes).toBe(0)
    expect(s.avgRuntime).toBe(0)
    expect(s.avgRating).toBe(0)
    expect(s.topRated).toEqual([])
    expect(s.genreData).toEqual([])
    expect(s.yearData).toEqual([])
    // garde-fous division : max à 1 minimum
    expect(s.yearMax).toBe(1)
    expect(s.decadeMax).toBe(1)
    expect(s.ratingMax).toBe(1)
  })

  it('totaux, moyennes et top noté', () => {
    const s = computeFilmStats([
      mkFilm({ title: 'A', runtime: 120, rating: 18 }),
      mkFilm({ title: 'B', runtime: 90, rating: 12 }),
      mkFilm({ title: 'C' }), // ni durée ni note
    ])
    expect(s.totalFilms).toBe(3)
    expect(s.totalMinutes).toBe(210)
    expect(s.avgRuntime).toBe(105) // moyenne sur les films AVEC durée
    expect(s.avgRating).toBe(15)
    expect(s.bestRated?.title).toBe('A')
    expect(s.topRated.map((f) => f.title)).toEqual(['A', 'B'])
  })

  it('films vus par année (dateWatched) et décennies de sortie', () => {
    const s = computeFilmStats([
      mkFilm({ title: 'A', dateWatched: '2024-03-01', releaseYear: 1999 }),
      mkFilm({ title: 'B', dateWatched: '2024-07-15', releaseYear: 2003 }),
      mkFilm({ title: 'C', dateWatched: '2025-01-02', releaseYear: 2001 }),
    ])
    expect(s.yearData).toEqual([
      [2024, 2],
      [2025, 1],
    ])
    expect(s.yearMax).toBe(2)
    expect(s.decadeData).toEqual([
      [1990, 1],
      [2000, 2],
    ])
  })

  it('répartition des notes arrondies, triée note décroissante', () => {
    const s = computeFilmStats([
      mkFilm({ title: 'A', rating: 15.4 }),
      mkFilm({ title: 'B', rating: 15 }),
      mkFilm({ title: 'C', rating: 12 }),
    ])
    expect(s.ratingData).toEqual([
      [15, 2],
      [12, 1],
    ])
    expect(s.ratingMax).toBe(2)
  })

  it('top 8 genres avec couleurs', () => {
    const s = computeFilmStats([
      mkFilm({ title: 'A', genres: ['SF', 'Drame'] }),
      mkFilm({ title: 'B', genres: ['SF'] }),
    ])
    expect(s.genreData[0].label).toBe('SF')
    expect(s.genreData[0].value).toBe(2)
    expect(s.genreData[0].color).toBeTruthy()
  })
})
