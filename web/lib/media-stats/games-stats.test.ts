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
    expect(s.unplayed.map((g) => g.title).sort()).toEqual(['B', 'C'])
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
      mkGame({
        title: 'Zelda: Breath of the Wild',
        status: 'Fini',
        hoursPlayed: 100,
        coverUrl: 'botw.jpg',
      }),
      mkGame({
        title: 'Zelda: Tears of the Kingdom',
        status: 'Fini',
        hoursPlayed: 80,
        coverUrl: 'totk.jpg',
      }),
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

  it('avgRatingByGenre : seuil ≥3 — genre avec 3 jeux inclus, genre avec 2 jeux absent', () => {
    const s = computeGameStats([
      mkGame({ title: 'RPG 1', status: 'Fini', rating: 16, genres: ['RPG'] }),
      mkGame({ title: 'RPG 2', status: 'Fini', rating: 14, genres: ['RPG'] }),
      mkGame({ title: 'RPG 3', status: 'Fini', rating: 12, genres: ['RPG'] }),
      mkGame({ title: 'FPS 1', status: 'Fini', rating: 10, genres: ['FPS'] }),
      mkGame({ title: 'FPS 2', status: 'Fini', rating: 12, genres: ['FPS'] }),
    ])
    const rpg = s.avgRatingByGenre.find((g) => g.label === 'RPG')
    expect(rpg).toBeDefined()
    expect(rpg).toEqual({ label: 'RPG', value: 14, count: 3 })

    const fps = s.avgRatingByGenre.find((g) => g.label === 'FPS')
    expect(fps).toBeUndefined()
  })

  it('avgRatingByPlatform : seuil ≥3 et fallback sur le champ top-level platform', () => {
    // 3 jeux avec platform top-level 'PC' (sans tableau platforms) → inclus
    // 2 jeux avec platform top-level 'Switch' → exclus
    const s = computeGameStats([
      mkGame({ title: 'PC 1', status: 'Fini', rating: 18, platform: 'PC' }),
      mkGame({ title: 'PC 2', status: 'Fini', rating: 16, platform: 'PC' }),
      mkGame({ title: 'PC 3', status: 'Fini', rating: 14, platform: 'PC' }),
      mkGame({ title: 'Switch 1', status: 'Fini', rating: 12, platform: 'Switch' }),
      mkGame({ title: 'Switch 2', status: 'Fini', rating: 10, platform: 'Switch' }),
    ])
    const pc = s.avgRatingByPlatform.find((p) => p.label === 'PC')
    expect(pc).toBeDefined()
    expect(pc).toEqual({ label: 'PC', value: 16, count: 3 })

    const sw = s.avgRatingByPlatform.find((p) => p.label === 'Switch')
    expect(sw).toBeUndefined()
  })

  it('sagas : "Mario Kart" (nom plus long) l\'emporte sur "Mario" pour les titres Mario Kart', () => {
    const s = computeGameStats([
      mkGame({ title: 'Mario Kart 8 Deluxe', status: 'Fini', hoursPlayed: 40 }),
      mkGame({ title: 'Mario Kart: Double Dash', status: 'Fini', hoursPlayed: 20 }),
    ])
    const names = s.sagas.map((sg) => sg.name)
    expect(names).toContain('Mario Kart')
    expect(names).not.toContain('Mario')
  })
})
