import type { Game } from '@/lib/types'

// ——— Helpers (déplacés depuis components/games-stats.tsx, inchangés) ———

export function gameHours(g: Game): number {
  return g.hoursPlayed ?? 0
}

const UNPLAYED_STATUSES = new Set(['Wishé', 'Jamais joué'])

export function gameStatus(g: Game): string | undefined {
  if (g.status) return g.status
  if (g.platforms && g.platforms.length > 0) {
    if (g.platforms.some(p => p.status === 'Fini')) return 'Fini'
    if (g.platforms.some(p => p.status === 'En cours')) return 'En cours'
    // Prefer a "played" platform over a wished/unplayed one
    const played = g.platforms.find(p => p.status && !UNPLAYED_STATUSES.has(p.status))
    if (played) return played.status
    return g.platforms[0].status
  }
  return undefined
}

export function isUnplayed(g: Game): boolean {
  const s = gameStatus(g)
  return !!s && UNPLAYED_STATUSES.has(s)
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// Détection de saga : liste explicite (regex sur le titre). Premier match gagne.
const SAGAS: { name: string; pattern: RegExp }[] = [
  { name: 'Pokémon', pattern: /\bpok[eé]mon\b/i },
  { name: 'Final Fantasy', pattern: /\bfinal fantasy\b/i },
  { name: 'Dragon Quest', pattern: /\bdragon quest\b/i },
  { name: "Assassin's Creed", pattern: /\bassassin'?s creed\b/i },
  { name: 'Age of Empires', pattern: /\bage of empires\b/i },
  { name: 'Animal Crossing', pattern: /\banimal crossing\b/i },
  { name: 'Batman: Arkham', pattern: /\bbatman: arkham\b/i },
  { name: 'Baten Kaitos', pattern: /\bbaten kaitos\b/i },
  { name: 'Bravely Default', pattern: /\bbravely default\b/i },
  { name: 'Civilization', pattern: /\bcivilization\b/i },
  { name: 'FIFA', pattern: /\bfifa\b/i },
  { name: 'Football Manager', pattern: /\bfootball manager\b/i },
  { name: 'Gears of War', pattern: /\bgears( of war)?\b/i },
  { name: 'GTA', pattern: /\bgta\b/i },
  { name: 'Halo', pattern: /\bhalo\b/i },
  { name: 'Harry Potter', pattern: /\bharry potter\b/i },
  { name: 'Inazuma Eleven', pattern: /\binazuma eleven\b/i },
  { name: 'Kingdom Hearts', pattern: /\bkingdom hearts\b/i },
  { name: 'Tales of', pattern: /\btales of\b/i },
  { name: 'Total War', pattern: /\btotal war\b/i },
  { name: 'The Witcher', pattern: /\b(the )?witcher\b/i },
  { name: 'Call of Duty', pattern: /\bcall of duty\b/i },
  { name: 'Crash', pattern: /\bcrash\b/i },
  { name: 'Digimon', pattern: /\bdigimon\b/i },
  { name: 'Dragon Age', pattern: /\bdragon age\b/i },
  { name: 'Fire Emblem', pattern: /\bfire emblem\b/i },
  { name: 'Mario', pattern: /\b(super )?mario\b/i },
  { name: 'Zelda', pattern: /\b(zelda|hyrule)\b/i },
  { name: 'Metal Gear', pattern: /\bmetal gear\b/i },
  { name: 'Resident Evil', pattern: /\bresident evil\b/i },
  { name: 'Star Wars', pattern: /\bstar wars\b/i },
  { name: 'Asterix', pattern: /\bast[eé]rix\b/i },
  { name: 'Donkey Kong', pattern: /\bdonkey kong\b/i },
  { name: 'Red Dead', pattern: /\bred dead\b/i },
  { name: 'Mario Kart', pattern: /\bmario kart\b/i },
  { name: 'Mass Effect', pattern: /\bmass effect\b/i },
  { name: 'Monster Hunter', pattern: /\bmonster hunter\b/i },
  { name: 'Persona', pattern: /\bpersona\b/i },
  { name: 'The Elder Scrolls', pattern: /\b(the )?elder scrolls\b/i },
  { name: 'The Last of Us', pattern: /\bthe last of us\b/i },
  { name: 'Xenoblade', pattern: /\bxenoblade\b/i },
  { name: 'Les Sims', pattern: /\b(les sims|the sims|sims)\b/i },
  { name: 'Life is Strange', pattern: /\blife is strange\b/i },
  { name: 'Monument Valley', pattern: /\bmonument valley\b/i },
  { name: 'Ni no Kuni', pattern: /\bni no kuni\b/i },
  { name: 'Nier', pattern: /\bnier\b/i },
  { name: 'SimCity', pattern: /\bsimcity\b/i },
  { name: 'Super Smash Bros', pattern: /\b(super )?smash bros\b/i },
  { name: 'Theatrhythm', pattern: /\btheatrhythm\b/i },
  { name: 'Tomb Raider', pattern: /\btomb raider\b/i },
  { name: 'Trine', pattern: /\btrine\b/i },
  { name: 'Watch Dogs', pattern: /\bwatch dogs\b/i },
  { name: 'League of Legends', pattern: /\b(league of legends|lol|teamfight tactics|tft|wild rift|legends of runeterra)\b/i },
]

// Order matters: more-specific names ("Mario Kart") must beat shorter ones
// ("Mario") when both could match the same title.
SAGAS.sort((a, b) => b.name.length - a.name.length)

function detectSaga(title: string): string | null {
  for (const s of SAGAS) {
    if (s.pattern.test(title)) return s.name
  }
  return null
}

export interface SagaStats {
  name: string
  hours: number
  count: number
  cover?: string
  games: Game[]
}

export interface GameStatsData {
  totalGames: number
  totalHours: number
  finished: number
  completionRate: number
  avgRating: number
  avgVsCrowd: number
  topPlayed: Game[]
  topRated: Game[]
  statusBreakdown: { label: string; count: number }[]
  hoursByDecade: { decade: string; hours: number }[]
  avgRatingByGenre: { label: string; value: number; count: number }[]
  avgRatingByPlatform: { label: string; value: number; count: number }[]
  sagas: SagaStats[]
  unplayed: Game[]
  statusTotal: number
}

export function computeGameStats(games: Game[]): GameStatsData {
  // Separate played from wishlist / never-played: stats only consider played games.
  const played = games.filter(g => !isUnplayed(g))
  const unplayed = games.filter(isUnplayed)

  const totalGames = played.length
  const totalHours = played.reduce((s, g) => s + gameHours(g), 0)

  const finished = played.filter(g => gameStatus(g) === 'Fini').length
  const completionRate = totalGames ? (finished / totalGames) * 100 : 0

  const ratedGames = played.filter(g => typeof g.rating === 'number')
  const avgRating = avg(ratedGames.map(g => g.rating!))

  // Biais personnel : delta moyen entre note perso et note publique
  const bothRated = played.filter(
    g => typeof g.rating === 'number' && typeof g.avgRating === 'number'
  )
  const avgVsCrowd = avg(bothRated.map(g => g.rating! - g.avgRating!))

  const topPlayed = [...played]
    .filter(g => gameHours(g) > 0)
    .sort((a, b) => gameHours(b) - gameHours(a))
    .slice(0, 10)

  const topRated = [...ratedGames]
    .sort((a, b) => (b.rating! - a.rating!) || gameHours(b) - gameHours(a))
    .slice(0, 10)

  // Répartition par plateforme : une entrée par plateforme (un jeu PC+PS5 compte deux fois).
  // Exclut Wishé / Jamais joué.
  const statusCounts = new Map<string, number>()
  let statusTotal = 0
  for (const g of games) {
    const platformStatuses =
      g.platforms?.map(p => p.status) ?? (g.status ? [g.status] : [])
    for (const s of platformStatuses) {
      if (!s || UNPLAYED_STATUSES.has(s)) continue
      statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1)
      statusTotal += 1
    }
  }
  const statusBreakdown = Array.from(statusCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)

  const decadeMap = new Map<string, number>()
  for (const g of played) {
    if (!g.releaseYear) continue
    const decade = `${Math.floor(g.releaseYear / 10) * 10}s`
    decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + gameHours(g))
  }
  const hoursByDecade = Array.from(decadeMap.entries())
    .map(([decade, hours]) => ({ decade, hours }))
    .filter(d => d.hours > 0)
    .sort((a, b) => a.decade.localeCompare(b.decade))

  const byGenre = new Map<string, number[]>()
  for (const g of ratedGames) {
    for (const genre of g.genres ?? []) {
      if (!byGenre.has(genre)) byGenre.set(genre, [])
      byGenre.get(genre)!.push(g.rating!)
    }
  }
  const avgRatingByGenre = Array.from(byGenre.entries())
    .filter(([, arr]) => arr.length >= 3)
    .map(([genre, arr]) => ({ label: genre, value: avg(arr), count: arr.length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const byPlatform = new Map<string, number[]>()
  for (const g of ratedGames) {
    const plats = g.platforms?.map(p => p.platform) ?? (g.platform ? [g.platform] : [])
    for (const platform of plats) {
      if (!byPlatform.has(platform)) byPlatform.set(platform, [])
      byPlatform.get(platform)!.push(g.rating!)
    }
  }
  const avgRatingByPlatform = Array.from(byPlatform.entries())
    .filter(([, arr]) => arr.length >= 3)
    .map(([platform, arr]) => ({ label: platform, value: avg(arr), count: arr.length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const sagaMap = new Map<string, { hours: number; games: Game[] }>()
  for (const g of played) {
    const saga = detectSaga(g.title)
    if (!saga) continue
    const cur = sagaMap.get(saga) ?? { hours: 0, games: [] }
    cur.hours += gameHours(g)
    cur.games.push(g)
    sagaMap.set(saga, cur)
  }
  const sagas = Array.from(sagaMap.entries())
    .filter(([, v]) => v.games.length >= 2)
    .map(([name, v]) => {
      const sortedGames = [...v.games].sort((a, b) => gameHours(b) - gameHours(a))
      // Cover = jeu le plus joué avec une cover, sinon n'importe quelle cover de la saga
      const cover =
        sortedGames.find(g => g.coverUrl)?.coverUrl ??
        v.games.find(g => g.coverUrl)?.coverUrl
      return {
        name,
        hours: v.hours,
        count: v.games.length,
        cover,
        games: sortedGames,
      }
    })
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 20)

  return {
    totalGames,
    totalHours,
    finished,
    completionRate,
    avgRating,
    avgVsCrowd,
    topPlayed,
    topRated,
    statusBreakdown,
    hoursByDecade,
    avgRatingByGenre,
    avgRatingByPlatform,
    sagas,
    unplayed,
    statusTotal,
  }
}
