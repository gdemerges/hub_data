import { getGamesData } from '@/lib/data'
import { GamesPageClient, PageHeader } from '@/components'

export default async function GamesPage() {
  const games = await getGamesData()

  // Extract all unique platforms, including from multi-platform games
  const platformSet = new Set<string>()
  games.forEach(game => {
    if (game.platforms && game.platforms.length > 0) {
      // Multi-platform game: add all platforms
      game.platforms.forEach(p => platformSet.add(p.platform))
    } else if (game.platform) {
      // Single-platform game: add the platform
      platformSet.add(game.platform)
    }
  })
  const platforms = Array.from(platformSet).sort()

  // Calculate hours per platform
  const platformHours: { [key: string]: number } = {}
  games.forEach(game => {
    if (game.platforms && game.platforms.length > 0) {
      // Multi-platform game: use platform-specific hours
      game.platforms.forEach(p => {
        if (p.hoursPlayed) {
          platformHours[p.platform] = (platformHours[p.platform] || 0) + p.hoursPlayed
        }
      })
    } else if (game.platform && game.hoursPlayed) {
      // Single-platform game: use total hours
      platformHours[game.platform] = (platformHours[game.platform] || 0) + game.hoursPlayed
    }
  })

  // Convert to array and sort by hours
  const platformData = Object.entries(platformHours)
    .map(([platform, hours]) => ({ platform, hours }))
    .sort((a, b) => b.hours - a.hours)

  // Generate colors for the pie chart
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#14b8a6', // teal
    '#a855f7', // purple
  ]

  const pieChartData = platformData.map((item, index) => ({
    label: item.platform,
    value: Math.round(item.hours),
    color: colors[index % colors.length],
  }))

  const totalHours = platformData.reduce((sum, item) => sum + item.hours, 0)

  // Calculate hours per genre
  const genreHours: { [key: string]: number } = {}
  games.forEach(game => {
    if (game.genres && game.genres.length > 0 && game.hoursPlayed) {
      // Divide hours equally among all genres for this game
      const hoursPerGenre = game.hoursPlayed / game.genres.length
      game.genres.forEach(genre => {
        // Normalize RPG genres
        let normalizedGenre = genre
        if (genre.includes('RPG')) {
          normalizedGenre = 'RPG'
        }
        genreHours[normalizedGenre] = (genreHours[normalizedGenre] || 0) + hoursPerGenre
      })
    }
  })

  // Convert to array and sort by hours
  const genreData = Object.entries(genreHours)
    .map(([genre, hours]) => ({ genre, hours }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10) // Top 10 genres

  // Colors for genre chart (different from platform colors)
  const genreColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#22c55e', // green
    '#eab308', // yellow
    '#a855f7', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#6366f1', // indigo
  ]

  const genreChartData = genreData.map((item, index) => ({
    label: item.genre,
    value: Math.round(item.hours),
    color: genreColors[index % genreColors.length],
  }))

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="GAMES"
        systemName="SYSTEM"
        statusDetail="GAMING_LIBRARY v2.0"
        loadingMessage={`Loading ${games.length} games from collection...`}
        color="neon-green"
      />
      <GamesPageClient
        games={games}
        platforms={platforms}
        platformData={platformData}
        pieChartData={pieChartData}
        genreChartData={genreChartData}
        totalHours={totalHours}
      />
    </div>
  )
}
