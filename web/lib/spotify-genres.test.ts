import { describe, expect, it } from 'vitest'
import { aggregateGenres } from './spotify-utils'

describe('aggregateGenres', () => {
  it('counts genres across artists', () => {
    const artists = [
      { genres: ['french pop', 'indie'] },
      { genres: ['french pop', 'chanson'] },
      { genres: ['indie'] },
    ]
    const result = aggregateGenres(artists, 3)
    expect(result).toEqual([
      { genre: 'french pop', count: 2 },
      { genre: 'indie', count: 2 },
      { genre: 'chanson', count: 1 },
    ])
  })

  it('limits to the requested count', () => {
    const artists = [
      { genres: ['a', 'b', 'c', 'd', 'e'] },
    ]
    const result = aggregateGenres(artists, 2)
    expect(result).toHaveLength(2)
  })

  it('returns empty array for artists with no genres', () => {
    const artists = [{ genres: [] }, { genres: [] }]
    expect(aggregateGenres(artists, 10)).toEqual([])
  })

  it('sorts by count descending', () => {
    const artists = [
      { genres: ['rare'] },
      { genres: ['common', 'common2'] },
      { genres: ['common'] },
    ]
    const result = aggregateGenres(artists, 10)
    expect(result[0].genre).toBe('common')
  })
})
