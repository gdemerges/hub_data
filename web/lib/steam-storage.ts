import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const PLAYTIME_FILE = path.join(DATA_DIR, 'steam-playtime.json')

export interface PlaytimeEntry {
  date: string // YYYY-MM-DD
  totalMinutes: number
  games: {
    appid: number
    name: string
    minutesPlayed: number
  }[]
}

export interface GameSnapshot {
  appid: number
  name: string
  playtimeForever: number // Total playtime in minutes
}

export interface PlaytimeHistory {
  userId: string
  lastSnapshot: GameSnapshot[] // Last known playtime for each game
  lastSnapshotDate: string // Date of last snapshot
  entries: PlaytimeEntry[]
}

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Load playtime history from file
export function loadPlaytimeHistory(): PlaytimeHistory {
  ensureDataDir()

  if (!fs.existsSync(PLAYTIME_FILE)) {
    return {
      userId: '',
      lastSnapshot: [],
      lastSnapshotDate: '',
      entries: []
    }
  }

  try {
    const data = fs.readFileSync(PLAYTIME_FILE, 'utf-8')
    const history = JSON.parse(data)

    // Ensure backward compatibility with old format
    if (!history.lastSnapshot) {
      history.lastSnapshot = []
      history.lastSnapshotDate = ''
    }

    return history
  } catch (error) {
    console.error('Error loading playtime history:', error)
    return {
      userId: '',
      lastSnapshot: [],
      lastSnapshotDate: '',
      entries: []
    }
  }
}

// Save playtime history to file
export function savePlaytimeHistory(history: PlaytimeHistory) {
  ensureDataDir()

  try {
    fs.writeFileSync(PLAYTIME_FILE, JSON.stringify(history, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving playtime history:', error)
    throw error
  }
}

// Update playtime based on current snapshot
export function updatePlaytimeFromSnapshot(userId: string, currentSnapshot: GameSnapshot[]) {
  const history = loadPlaytimeHistory()

  // Update userId if it's the first entry
  if (!history.userId) {
    history.userId = userId
  }

  const today = new Date().toISOString().split('T')[0]

  // Calculate playtime difference from last snapshot
  const gamesPlayedToday: { appid: number; name: string; minutesPlayed: number }[] = []
  let totalMinutesToday = 0

  if (history.lastSnapshot.length === 0 || history.lastSnapshotDate !== today) {
    // First sync or new day: calculate difference from last snapshot
    currentSnapshot.forEach(currentGame => {
      const lastGame = history.lastSnapshot.find(g => g.appid === currentGame.appid)

      if (lastGame) {
        // Game existed before - calculate difference
        const minutesDiff = currentGame.playtimeForever - lastGame.playtimeForever

        if (minutesDiff > 0) {
          gamesPlayedToday.push({
            appid: currentGame.appid,
            name: currentGame.name,
            minutesPlayed: minutesDiff,
          })
          totalMinutesToday += minutesDiff
        }
      }
      // Note: We don't count new games added to library as "played today"
      // since playtime_forever includes all historical playtime
    })

    // If this is a new day, create a new entry
    if (history.lastSnapshotDate !== today && totalMinutesToday > 0) {
      const newEntry: PlaytimeEntry = {
        date: today,
        totalMinutes: totalMinutesToday,
        games: gamesPlayedToday,
      }

      history.entries.push(newEntry)
      history.entries.sort((a, b) => a.date.localeCompare(b.date))
    } else if (history.lastSnapshotDate === today) {
      // Same day, different sync - update today's entry
      const existingEntryIndex = history.entries.findIndex(e => e.date === today)

      if (existingEntryIndex >= 0) {
        // Add to existing entry
        const existingEntry = history.entries[existingEntryIndex]
        existingEntry.totalMinutes += totalMinutesToday

        // Merge games
        gamesPlayedToday.forEach(game => {
          const existingGame = existingEntry.games.find(g => g.appid === game.appid)
          if (existingGame) {
            existingGame.minutesPlayed += game.minutesPlayed
          } else {
            existingEntry.games.push(game)
          }
        })
      } else if (totalMinutesToday > 0) {
        // Create new entry for today
        history.entries.push({
          date: today,
          totalMinutes: totalMinutesToday,
          games: gamesPlayedToday,
        })
      }
    }
  }

  // Update last snapshot
  history.lastSnapshot = currentSnapshot
  history.lastSnapshotDate = today

  savePlaytimeHistory(history)
  return {
    history,
    minutesPlayedSinceLastSync: totalMinutesToday,
  }
}

// Get playtime entries for a specific year
export function getPlaytimeByYear(year: number): PlaytimeEntry[] {
  const history = loadPlaytimeHistory()
  return history.entries.filter(entry => {
    const entryYear = new Date(entry.date).getFullYear()
    return entryYear === year
  })
}
