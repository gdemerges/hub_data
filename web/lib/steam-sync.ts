import 'server-only'
import { type GameSnapshot, updatePlaytimeFromSnapshot } from './steam-storage'

const STEAM_API_BASE = 'https://api.steampowered.com'

export interface SyncResult {
  date: string
  gamesInSnapshot: number
  minutesPlayedSinceLastSync: number
  entriesInHistory: number
}

export async function syncSteamPlaytime(): Promise<SyncResult> {
  const apiKey = process.env.STEAM_API_KEY
  const userId = process.env.STEAM_USER_ID
  if (!apiKey || !userId) {
    throw new Error('Steam API key or User ID not configured')
  }

  const gamesResponse = await fetch(
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${userId}&include_appinfo=1&include_played_free_games=1`,
  )
  if (!gamesResponse.ok) {
    throw new Error(`Failed to fetch games (status ${gamesResponse.status})`)
  }

  const gamesData = await gamesResponse.json()
  interface SteamGameRaw {
    appid: number
    name: string
    playtime_forever: number
  }
  const games: SteamGameRaw[] = gamesData.response?.games || []

  const snapshot: GameSnapshot[] = games
    .filter((g) => g.playtime_forever > 0)
    .map((g) => ({ appid: g.appid, name: g.name, playtimeForever: g.playtime_forever }))

  const result = updatePlaytimeFromSnapshot(userId, snapshot)
  return {
    date: new Date().toISOString().split('T')[0],
    gamesInSnapshot: snapshot.length,
    minutesPlayedSinceLastSync: result.minutesPlayedSinceLastSync,
    entriesInHistory: result.history.entries.length,
  }
}
