import { describe, expect, it } from 'vitest'
import type { Game } from '@/lib/types'
import { computeGameStats } from './games-stats'

// Fixture helper : cast volontaire, seuls les champs utilisés par le calcul comptent.
function mkGame(over: Partial<Game>): Game {
  return { title: 'Sans titre', ...over } as Game
}

describe('computeGameStats', () => {
  it('retourne des stats neutres pour une liste vide (pas de crash)', () => {
    const s = computeGameStats([])
    expect(s.totalGames).toBe(0)
    expect(s.totalHours).toBe(0)
    expect(s.completionRate).toBe(0)
    expect(s.avgRating).toBe(0)
    expect(s.topPlayed).toEqual([])
    expect(s.topRated).toEqual([])
    expect(s.statusBreakdown).toEqual([])
    expect(s.hoursByDecade).toEqual([])
    expect(s.sagas).toEqual([])
    expect(s.unplayed).toEqual([])
    expect(s.statusTotal).toBe(0)
  })

  it('exclut Wishé / Jamais joué des stats mais les liste dans unplayed', () => {
    const s = computeGameStats([
      mkGame({ title: 'A', status: 'Fini', hoursPlayed: 10, rating: 15 }),
      mkGame({ title: 'B', status: 'Wishé' }),
      mkGame({ title: 'C', status: 'Jamais joué' }),
    ])
    expect(s.totalGames).toBe(1)
    expect(s.unplayed.map(g => g.title).sort()).toEqual(['B', 'C'])
    // Le backlog n'apparaît pas dans la répartition par statut
    expect(s.statusBreakdown).toEqual([{ label: 'Fini', count: 1 }])
    expect(s.statusTotal).toBe(1)
  })

  it('calcule totaux, completion et note moyenne', () => {
    const s = computeGameStats([
      mkGame({ title: 'A', status: 'Fini', hoursPlayed: 10, rating: 16 }),
      mkGame({ title: 'B', status: 'En cours', hoursPlayed: 30, rating: 12 }),
    ])
    expect(s.totalHours).toBe(40)
    expect(s.finished).toBe(1)
    expect(s.completionRate).toBe(50)
    expect(s.avgRating).toBe(14)
    expect(s.topPlayed[0].title).toBe('B')
    expect(s.topRated[0].title).toBe('A')
  })

  it('multi-plateformes : statut Fini prioritaire, breakdown par plateforme', () => {
    const s = computeGameStats([
      mkGame({
        title: 'Multi',
        hoursPlayed: 20,
        platforms: [
          { platform: 'PC', status: 'Fini', hoursPlayed: 15 },
          { platform: 'PS5', status: 'En cours', hoursPlayed: 5 },
        ],
      }),
    ])
    expect(s.finished).toBe(1) // statut résolu = Fini
    // 2 entrées de statut (une par plateforme)
    expect(s.statusTotal).toBe(2)
    expect(s.statusBreakdown).toContainEqual({ label: 'Fini', count: 1 })
    expect(s.statusBreakdown).toContainEqual({ label: 'En cours', count: 1 })
  })

  it('avgVsCrowd : delta moyen entre note perso et note publique', () => {
    const s = computeGameStats([
      mkGame({ title: 'A', status: 'Fini', rating: 16, avgRating: 14 }),
      mkGame({ title: 'B', status: 'Fini', rating: 10, avgRating: 14 }),
    ])
    expect(s.avgVsCrowd).toBe(-1) // (+2 + -4) / 2
  })

  it('sagas : min 2 jeux, tri par heures, cover du plus joué', () => {
    const s = computeGameStats([
      mkGame({ title: 'Zelda: Breath of the Wild', status: 'Fini', hoursPlayed: 100, coverUrl: 'botw.jpg' }),
      mkGame({ title: 'Zelda: Tears of the Kingdom', status: 'Fini', hoursPlayed: 80, coverUrl: 'totk.jpg' }),
      mkGame({ title: 'Hadès', status: 'Fini', hoursPlayed: 50 }), // pas une saga listée
    ])
    expect(s.sagas).toHaveLength(1)
    expect(s.sagas[0].name).toBe('Zelda')
    expect(s.sagas[0].count).toBe(2)
    expect(s.sagas[0].hours).toBe(180)
    expect(s.sagas[0].cover).toBe('botw.jpg')
    expect(s.sagas[0].games[0].title).toBe('Zelda: Breath of the Wild')
  })

  it('heures par décennie de sortie', () => {
    const s = computeGameStats([
      mkGame({ title: 'A', status: 'Fini', hoursPlayed: 10, releaseYear: 1998 }),
      mkGame({ title: 'B', status: 'Fini', hoursPlayed: 20, releaseYear: 2021 }),
    ])
    expect(s.hoursByDecade).toEqual([
      { decade: '1990s', hours: 10 },
      { decade: '2020s', hours: 20 },
    ])
  })
})
