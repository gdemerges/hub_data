'use client'

import { useState } from 'react'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import Link from 'next/link'
import { Game, Film, Series } from '@/lib/types'
import { Calendar, Clock, Star, Gamepad2, Film as FilmIcon, Tv, ChevronRight } from 'lucide-react'

const sectionColors = {
  green: {
    icon: 'text-neon-green',
    iconBg: 'bg-neon-green/10 border-neon-green/30',
    link: 'text-neon-green border-neon-green/30 hover:border-neon-green/60 hover:bg-neon-green/10',
  },
  magenta: {
    icon: 'text-neon-magenta',
    iconBg: 'bg-neon-magenta/10 border-neon-magenta/30',
    link: 'text-neon-magenta border-neon-magenta/30 hover:border-neon-magenta/60 hover:bg-neon-magenta/10',
  },
  yellow: {
    icon: 'text-neon-yellow',
    iconBg: 'bg-neon-yellow/10 border-neon-yellow/30',
    link: 'text-neon-yellow border-neon-yellow/30 hover:border-neon-yellow/60 hover:bg-neon-yellow/10',
  },
} as const

const badgeColors = {
  cyan: 'border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan',
  green: 'border-neon-green/30 bg-neon-green/5 text-neon-green',
  magenta: 'border-neon-magenta/30 bg-neon-magenta/5 text-neon-magenta',
  yellow: 'border-neon-yellow/30 bg-neon-yellow/5 text-neon-yellow',
} as const

interface OverviewSectionsProps {
  topGames: Game[]
  topFilms: Film[]
  topSeries: Series[]
  gamesCount: number
  filmsCount: number
  seriesCount: number
}

export function OverviewSections({
  topGames,
  topFilms,
  topSeries,
  gamesCount,
  filmsCount,
  seriesCount,
}: OverviewSectionsProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)

  return (
    <>
      <div className="space-y-12">
        {/* Top Games */}
        <Section title="Jeux les plus joués" href="/games" count={gamesCount} icon={Gamepad2} color="green">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topGames.map((game) => (
              <MediaCard
                key={game.title}
                title={game.title}
                imageUrl={game.coverUrl}
                badge={game.hoursPlayed ? `${game.hoursPlayed}h` : undefined}
                onClick={() => setSelectedGame(game)}
              />
            ))}
          </div>
        </Section>

        {/* Top Films */}
        <Section title="Films les mieux notés" href="/films" count={filmsCount} icon={FilmIcon} color="magenta">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topFilms.map((film) => (
              <MediaCard
                key={film.title}
                title={film.title}
                imageUrl={film.posterUrl}
                badge={film.rating ? `${film.rating}/20` : undefined}
                onClick={() => setSelectedFilm(film)}
              />
            ))}
          </div>
        </Section>

        {/* Top Series */}
        <Section title="Séries les mieux notées" href="/series" count={seriesCount} icon={Tv} color="yellow">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topSeries.map((s) => (
              <MediaCard
                key={s.title}
                title={s.title}
                imageUrl={s.posterUrl}
                badge={s.rating ? `${s.rating}/20` : undefined}
                onClick={() => setSelectedSeries(s)}
              />
            ))}
          </div>
        </Section>
      </div>

      {/* Detail modals */}
      {selectedGame && (
        <MediaDetail
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          title={selectedGame.title}
          imageUrl={selectedGame.coverUrl}
        >
          <GameDetail game={selectedGame} />
        </MediaDetail>
      )}

      {selectedFilm && (
        <MediaDetail
          isOpen={!!selectedFilm}
          onClose={() => setSelectedFilm(null)}
          title={selectedFilm.title}
          imageUrl={selectedFilm.posterUrl}
        >
          <FilmDetail film={selectedFilm} />
        </MediaDetail>
      )}

      {selectedSeries && (
        <MediaDetail
          isOpen={!!selectedSeries}
          onClose={() => setSelectedSeries(null)}
          title={selectedSeries.title}
          imageUrl={selectedSeries.posterUrl}
        >
          <SeriesDetail series={selectedSeries} />
        </MediaDetail>
      )}
    </>
  )
}

function Section({
  title,
  href,
  count,
  icon: Icon,
  color,
  children,
}: {
  title: string
  href: string
  count: number
  icon: React.ElementType
  color: keyof typeof sectionColors
  children: React.ReactNode
}) {
  const c = sectionColors[color]
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 border rounded-lg ${c.iconBg}`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
          <h2 className="text-lg font-mono font-bold tracking-wider uppercase text-text-primary">
            {title}
          </h2>
        </div>
        <Link
          href={href}
          className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider border px-3 py-1.5 rounded-lg transition-all duration-300 ${c.link}`}
        >
          Voir tout
          <span className="text-text-muted">({count})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {children}
    </section>
  )
}

function DetailMeta({ icon: Icon, label, color = 'cyan' }: { icon: React.ElementType; label: string; color?: keyof typeof badgeColors }) {
  const c = badgeColors[color]
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-mono ${c}`}>
      <Icon className="w-4 h-4" />
      <span className="text-text-secondary">{label}</span>
    </div>
  )
}

function DetailBadge({ label, color = 'cyan' }: { label: string; color?: keyof typeof badgeColors }) {
  const c = badgeColors[color]
  return (
    <span className={`px-3 py-1 border rounded text-xs font-mono ${c}`}>
      {label}
    </span>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted mb-2">{title}</h3>
      {children}
    </div>
  )
}

function GameDetail({ game }: { game: Game }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {game.hoursPlayed && <DetailMeta icon={Clock} label={`${game.hoursPlayed}h jouées`} color="green" />}
        {game.releaseYear && <DetailMeta icon={Calendar} label={`${game.releaseYear}`} color="cyan" />}
        {game.rating && <DetailMeta icon={Star} label={`${game.rating}/20`} color="yellow" />}
      </div>

      {game.platforms && game.platforms.length > 0 && (
        <DetailSection title="Plateformes">
          <div className="flex flex-wrap gap-2">
            {game.platforms.map((p) => (
              <DetailBadge key={p.platform} label={`${p.platform}${p.hoursPlayed ? ` — ${p.hoursPlayed}h` : ''}`} color="green" />
            ))}
          </div>
        </DetailSection>
      )}

      {game.genres && game.genres.length > 0 && (
        <DetailSection title="Genres">
          <div className="flex flex-wrap gap-2">
            {game.genres.map((genre) => (
              <DetailBadge key={genre} label={genre} color="magenta" />
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  )
}

function FilmDetail({ film }: { film: Film }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {film.releaseYear && <DetailMeta icon={Calendar} label={`${film.releaseYear}`} color="cyan" />}
        {film.runtime && <DetailMeta icon={Clock} label={`${film.runtime} min`} color="magenta" />}
        {film.rating && <DetailMeta icon={Star} label={`${film.rating}/20`} color="yellow" />}
      </div>

      {film.genres && film.genres.length > 0 && (
        <DetailSection title="Genres">
          <div className="flex flex-wrap gap-2">
            {film.genres.map((genre) => (
              <DetailBadge key={genre} label={genre} color="magenta" />
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  )
}

function SeriesDetail({ series }: { series: Series }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {series.releaseYear && <DetailMeta icon={Calendar} label={`${series.releaseYear}`} color="cyan" />}
        {series.episodesWatched !== undefined && series.episodes && (
          <DetailMeta icon={Tv} label={`${series.episodesWatched}/${series.episodes} épisodes`} color="yellow" />
        )}
        {series.rating && <DetailMeta icon={Star} label={`${series.rating}/20`} color="yellow" />}
      </div>

      {series.status && (
        <DetailSection title="Statut">
          <DetailBadge label={series.status} color="yellow" />
        </DetailSection>
      )}

      {series.genres && series.genres.length > 0 && (
        <DetailSection title="Genres">
          <div className="flex flex-wrap gap-2">
            {series.genres.map((genre) => (
              <DetailBadge key={genre} label={genre} color="magenta" />
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  )
}
