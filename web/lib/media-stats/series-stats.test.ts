import { describe, expect, it } from 'vitest'
import type { Series } from '@/lib/types'
import { computeSeriesStats } from './series-stats'

// Fixture helper : cast volontaire, seuls les champs utilisés par le calcul comptent.
function mkSeries(over: Partial<Series>): Series {
  return { title: 'Sans titre', ...over } as Series
}

describe('computeSeriesStats', () => {
  it('liste vide → stats neutres', () => {
    const s = computeSeriesStats([])
    expect(s.totalSeries).toBe(0)
    expect(s.totalEpisodes).toBe(0)
    expect(s.avgRating).toBe(0)
    expect(s.topWatched).toEqual([])
    expect(s.genreData).toEqual([])
    expect(s.statusData).toEqual([])
    expect(s.statusTotal).toBe(0)
    expect(s.decadeMax).toBe(1)
    expect(s.channelMax).toBe(1)
    expect(s.mostWatched).toBeUndefined()
    expect(s.totalMinutes).toBe(0)
  })

  it('totaux, top visionnage et note moyenne', () => {
    const s = computeSeriesStats([
      mkSeries({ title: 'A', watchMinutes: 600, episodesWatched: 10, rating: 16 }),
      mkSeries({ title: 'B', watchMinutes: 1200, episodesWatched: 20, rating: 12 }),
    ])
    expect(s.totalSeries).toBe(2)
    expect(s.totalEpisodes).toBe(30)
    expect(s.avgRating).toBe(14)
    expect(s.mostWatched?.title).toBe('B')
    expect(s.topWatched.map((x) => x.title)).toEqual(['B', 'A'])
  })

  it('répartition par statut avec Inconnu par défaut', () => {
    const s = computeSeriesStats([
      mkSeries({ title: 'A', status: 'Terminée' }),
      mkSeries({ title: 'B', status: 'Terminée' }),
      mkSeries({ title: 'C' }),
    ])
    expect(s.statusData).toEqual([
      ['Terminée', 2],
      ['Inconnu', 1],
    ])
    expect(s.statusTotal).toBe(3)
  })

  it('top chaînes : tri par nombre de séries puis minutes', () => {
    const s = computeSeriesStats([
      mkSeries({ title: 'A', channel: 'HBO', watchMinutes: 100 }),
      mkSeries({ title: 'B', channel: 'HBO', watchMinutes: 50 }),
      mkSeries({ title: 'C', channel: 'Netflix', watchMinutes: 900 }),
    ])
    expect(s.channelData[0]).toEqual({ name: 'HBO', minutes: 150, count: 2 })
    expect(s.channelData[1]).toEqual({ name: 'Netflix', minutes: 900, count: 1 })
    expect(s.channelMax).toBe(2)
  })

  it('top genres avec couleurs', () => {
    const s = computeSeriesStats([
      mkSeries({ title: 'A', genres: ['Drame', 'SF'] }),
      mkSeries({ title: 'B', genres: ['Drame'] }),
    ])
    expect(s.genreData[0].label).toBe('Drame')
    expect(s.genreData[0].value).toBe(2)
    expect(s.genreData[0].color).toBeTruthy()
  })

  it('minutes par décennie de sortie (ignore les séries sans watchMinutes)', () => {
    const s = computeSeriesStats([
      mkSeries({ title: 'A', releaseYear: 2015, watchMinutes: 300 }),
      mkSeries({ title: 'B', releaseYear: 2018, watchMinutes: 200 }),
      mkSeries({ title: 'C', releaseYear: 2018 }), // pas de minutes → ignorée
    ])
    expect(s.decadeData).toEqual([[2010, 500]])
    expect(s.decadeMax).toBe(500)
  })
})
