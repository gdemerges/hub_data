import { Sun, ChartLineUp } from '@phosphor-icons/react/dist/ssr'
import { YearFilter, OverviewSections, TemporalStats, YearComparison, PageHeader, OverviewHero, GoalsSection, StreaksSection, OnThisDaySection } from '@/components'
import { OverviewStats } from '@/components/overview-stats'
import { getGamesData, getFilmsData, getSeriesData, getBooksData, getGitHubContributions } from '@/lib/data'
import { loadUnifiedActivity } from '@/lib/activity'
import { computeStreaks } from '@/lib/streaks'
import { computeGoals } from '@/lib/goals'
import { eventsOnThisDay } from '@/lib/on-this-day'
import { UnifiedActivityHeatmap } from '@/components/unified-activity-heatmap'

const GITHUB_USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'gdemerges'

export const revalidate = 3600

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year } = await searchParams
  const selectedYear = year ? parseInt(year, 10) : null

  const goalsYear = selectedYear ?? new Date().getFullYear()

  // GitHub contributions fetched client-side in OverviewStats (non-blocking);
  // a separate cached call here feeds the annual goals (server-side).
  const [allGames, allFilms, allSeries, allBooks, activity, githubContributions] = await Promise.all([
    getGamesData(),
    getFilmsData(),
    getSeriesData(),
    getBooksData(),
    loadUnifiedActivity(GITHUB_USERNAME),
    getGitHubContributions(goalsYear),
  ])

  const onThisDay = eventsOnThisDay(
    { films: allFilms, series: allSeries, games: allGames, books: allBooks },
    new Date().toISOString().slice(0, 10)
  )

  const streaks = computeStreaks(activity)
  const goals = computeGoals({
    films: allFilms,
    series: allSeries,
    games: allGames,
    books: allBooks,
    githubContributions,
    year: goalsYear,
  })

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
      <OverviewHero>
        <PageHeader
          title="Aperçu"
          subtitle="Tableau de bord personnel · jeux, films, séries, lecture"
          eyebrow={selectedYear ? `Année ${selectedYear}` : 'Vue d\'ensemble'}
          dateline={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          color="moss"
          icon={Sun}
          actions={<YearFilter />}
        />
      </OverviewHero>

      {/* Stats */}
      <OverviewStats
        gamesCount={games.length}
        filmsCount={films.length}
        seriesCount={series.length}
        selectedYear={selectedYear}
      />

      {/* On this day — masqué les jours sans souvenir */}
      <OnThisDaySection events={onThisDay} />

      {/* Unified activity heatmap */}
      <div className="mb-8">
        <UnifiedActivityHeatmap data={activity} />
      </div>

      {/* Goals & streaks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-start">
        <GoalsSection goals={goals} year={goalsYear} />
        <StreaksSection streaks={streaks} />
      </div>

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
          <ChartLineUp size={24} weight="duotone" className="text-earth-terracotta" />
          <h2 className="font-display text-2xl font-medium tracking-tight text-text-primary">
            Statistiques
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
