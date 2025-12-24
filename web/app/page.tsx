import { Gamepad2, Film, Tv, Github, Star, GitFork } from 'lucide-react'
import { StatCard } from '@/components'
import Link from 'next/link'
import { getGamesData, getFilmsData, getSeriesData } from '@/lib/data'

export default async function HomePage() {
  const [games, films, series] = await Promise.all([
    getGamesData(),
    getFilmsData(),
    getSeriesData(),
  ])

  const stats = [
    { label: 'Jeux joués', value: games.length, icon: Gamepad2 },
    { label: 'Films vus', value: films.length, icon: Film },
    { label: 'Séries suivies', value: series.length, icon: Tv },
  ]

  // Top items
  const topGames = games
    .sort((a, b) => (b.hoursPlayed || 0) - (a.hoursPlayed || 0))
    .slice(0, 6)
  const recentFilms = films.slice(0, 6)
  const recentSeries = series.slice(0, 6)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Bienvenue sur Hub Médias
        </h1>
        <p className="text-text-secondary">
          Votre tableau de bord personnel pour suivre vos médias préférés
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Recent sections */}
      <div className="space-y-12">
        {/* Top Games */}
        <Section title="Jeux les plus joués" href="/games" count={games.length}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topGames.map((game) => (
              <MediaPreviewCard
                key={game.title}
                title={game.title}
                imageUrl={game.coverUrl}
              />
            ))}
          </div>
        </Section>

        {/* Recent Films */}
        <Section title="Films récents" href="/films" count={films.length}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recentFilms.map((film) => (
              <MediaPreviewCard
                key={film.title}
                title={film.title}
                imageUrl={film.posterUrl}
              />
            ))}
          </div>
        </Section>

        {/* Recent Series */}
        <Section title="Séries récentes" href="/series" count={series.length}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recentSeries.map((s) => (
              <MediaPreviewCard
                key={s.title}
                title={s.title}
                imageUrl={s.posterUrl}
              />
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  href,
  count,
  children,
}: {
  title: string
  href: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <Link
          href={href}
          className="text-sm text-accent-primary hover:text-accent-secondary transition-colors"
        >
          Voir tout ({count}) →
        </Link>
      </div>
      {children}
    </section>
  )
}

function MediaPreviewCard({
  title,
  imageUrl,
}: {
  title: string
  imageUrl?: string
}) {
  return (
    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-card border border-border-subtle group">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary">
          <span className="text-lg font-bold text-text-muted">
            {title.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-sm font-medium text-white line-clamp-2">{title}</p>
        </div>
      </div>
    </div>
  )
}
