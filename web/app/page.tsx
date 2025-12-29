import { Terminal } from 'lucide-react'
import { YearFilter, OverviewSections, TemporalStats, YearComparison } from '@/components'
import { OverviewStats } from '@/components/overview-stats'
import { getGamesData, getFilmsData, getSeriesData, getGitHubContributions } from '@/lib/data'

export default async function HomePage({
  searchParams,
}: {
  searchParams: { year?: string }
}) {
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : null

  const [allGames, allFilms, allSeries, contributions] = await Promise.all([
    getGamesData(),
    getFilmsData(),
    getSeriesData(),
    getGitHubContributions(selectedYear),
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
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bg-card border border-neon-cyan/30 rounded-lg">
              <Terminal className="w-8 h-8 text-neon-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
                <span className="text-neon-cyan">SYSTEM</span>_DASHBOARD
              </h1>
              <p className="text-xs font-mono text-neon-green/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
                STATUS: ONLINE // MEDIA_TRACKER v2.0
              </p>
            </div>
          </div>
          <YearFilter />
        </div>
        <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-cyan/30 pl-4">
          &gt; Initializing personal media dashboard...
          <span className="text-neon-cyan animate-pulse">_</span>
        </div>
      </div>

      {/* Stats */}
      <OverviewStats
        gamesCount={games.length}
        filmsCount={films.length}
        seriesCount={series.length}
        contributions={contributions}
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
