import { Suspense } from 'react'
import { getGamesData } from '@/lib/data'
import { getMonthlyPlaytime, getCurrentMonth } from '@/lib/play-log'
import { GameController } from '@phosphor-icons/react/dist/ssr'
import { GamesPageClient, MonthlyPlaytime, PageHeader, SkeletonChart } from '@/components'

export const revalidate = 3600

export default async function GamesPage() {
  const games = await getGamesData()
  const currentMonth = getCurrentMonth()
  const monthlyPlaytime = getMonthlyPlaytime(currentMonth)

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

  // Palette earth/solarpunk pour les charts (10 stops construits sur la palette)
  const colors = [
    '#5a7d4a', // moss
    '#b86b3c', // terracotta
    '#7ba896', // fern
    '#d9a441', // saffron
    '#a8552c', // rust
    '#3d5170', // indigo
    '#a3b598', // sage
    '#b06868', // clay
    '#8ab274', // mossSoft
    '#c8893f', // amber
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

  // Genre palette : décalage par rapport au platform pour distinguer visuellement
  const genreColors = [
    '#3d5170', // indigo
    '#b86b3c', // terracotta
    '#5a7d4a', // moss
    '#d9a441', // saffron
    '#a3b598', // sage
    '#b06868', // clay
    '#7ba896', // fern
    '#a8552c', // rust
    '#8ab274', // mossSoft
    '#c8893f', // amber
  ]

  const genreChartData = genreData.map((item, index) => ({
    label: item.genre,
    value: Math.round(item.hours),
    color: genreColors[index % genreColors.length],
  }))

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Jeux"
        subtitle="Bibliothèque · plateformes, genres et heures jouées"
        eyebrow="Catalogue"
        dateline={`${games.length.toLocaleString('fr-FR')} jeux · ${Math.round(totalHours).toLocaleString('fr-FR')} h`}
        color="moss"
        icon={GameController}
      />
      <div className="mb-8">
        <MonthlyPlaytime month={currentMonth} playtime={monthlyPlaytime} />
      </div>

      <Suspense fallback={<SkeletonChart />}>
        <GamesPageClient
          games={games}
          platforms={platforms}
          platformData={platformData}
          pieChartData={pieChartData}
          genreChartData={genreChartData}
          totalHours={totalHours}
        />
      </Suspense>
    </div>
  )
}
