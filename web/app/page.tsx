import { Terminal } from 'lucide-react'
import { YearFilter, OverviewSections, TemporalStats, YearComparison, PageHeader } from '@/components'
import { OverviewStats } from '@/components/overview-stats'
import { getGamesData, getFilmsData, getSeriesData } from '@/lib/data'

export const revalidate = 3600

export default async function HomePage({
  searchParams,
}: {
  searchParams: { year?: string }
}) {
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : null

  // GitHub contributions fetched client-side in OverviewStats (non-blocking)
  const [allGames, allFilms, allSeries] = await Promise.all([
    getGamesData(),
    getFilmsData(),
    getSeriesData(),
  ])

  // Filter by year if selected
  const games = selectedYear
    ? allGames.filter((game) => game.releaseYear === selectedYear)
    : allGames
  const films = selectedYear
    ? allFilms.filter((film) => film.releaseYear === selectedYear)
    : allFilms
  const series = selectedYear
    ? allSeries.filter((s) => s.releaseYear === selectedYear)
    : allSeries

  // Top items
  const topGames = games
    .sort((a, b) => (b.hoursPlayed || 0) - (a.hoursPlayed || 0))
    .slice(0, 6)
  const topFilms = films
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6)
  const topSeries = series
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="SYSTEM"
        systemName="DASHBOARD"
        statusDetail="MEDIA_TRACKER v2.0"
        loadingMessage="Initializing personal media dashboard..."
        color="neon-cyan"
        actions={<YearFilter />}
      />

      {/* Stats */}
      <OverviewStats
        gamesCount={games.length}
        filmsCount={films.length}
        seriesCount={series.length}
        selectedYear={selectedYear}
      />

      {/* Sections */}
      <OverviewSections
        topGames={topGames}
        topFilms={topFilms}
        topSeries={topSeries}
        gamesCount={games.length}
        filmsCount={films.length}
        seriesCount={series.length}
      />

      {/* Statistics Section */}
      <div className="mt-12 space-y-8">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-neon-magenta" />
          <h2 className="text-xl font-display font-bold tracking-wider text-text-primary">
            <span className="text-neon-magenta">DATA</span>_ANALYTICS
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TemporalStats
            films={allFilms}
            series={allSeries}
            games={allGames}
          />
          <YearComparison
            films={allFilms}
            series={allSeries}
            games={allGames}
          />
        </div>
      </div>
    </div>
  )
}
