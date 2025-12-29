import { Gamepad2, Film, Tv, Github } from 'lucide-react'
import { StatCard, YearFilter, OverviewSections } from '@/components'
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

  const stats = [
    { label: 'Jeux joués', value: games.length, icon: Gamepad2 },
    { label: 'Films vus', value: films.length, icon: Film },
    { label: 'Séries suivies', value: series.length, icon: Tv },
    { label: 'Contributions', value: contributions, icon: Github },
  ]

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold text-text-primary">
            Bienvenue sur Hub Médias
          </h1>
          <YearFilter />
        </div>
        <p className="text-text-secondary">
          Votre tableau de bord personnel pour suivre vos médias préférés
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
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
    </div>
  )
}
