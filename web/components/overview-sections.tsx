'use client'

import { useState } from 'react'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import Link from 'next/link'
import { Game, Film, Series } from '@/lib/types'
import { Calendar, Clock, Star, Gamepad2 } from 'lucide-react'

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
        <Section title="Jeux les plus joués" href="/games" count={gamesCount}>
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
        <Section title="Films les mieux notés" href="/films" count={filmsCount}>
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
        <Section title="Séries les mieux notées" href="/series" count={seriesCount}>
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

function GameDetail({ game }: { game: Game }) {
  return (
    <div className="space-y-6">
      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
        {game.hoursPlayed && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{game.hoursPlayed}h jouées</span>
          </div>
        )}
        {game.releaseYear && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{game.releaseYear}</span>
          </div>
        )}
        {game.rating && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{game.rating}/20</span>
          </div>
        )}
      </div>

      {/* Platforms */}
      {game.platforms && game.platforms.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Plateformes</h3>
          <div className="flex flex-wrap gap-2">
            {game.platforms.map((p) => (
              <div
                key={p.platform}
                className="px-3 py-1 bg-bg-tertiary rounded-full text-xs text-text-secondary"
              >
                {p.platform}
                {p.hoursPlayed && ` - ${p.hoursPlayed}h`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genres */}
      {game.genres && game.genres.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {game.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-bg-tertiary rounded-full text-xs text-text-secondary"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FilmDetail({ film }: { film: Film }) {
  return (
    <div className="space-y-6">
      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
        {film.releaseYear && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{film.releaseYear}</span>
          </div>
        )}
        {film.runtime && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{film.runtime} min</span>
          </div>
        )}
        {film.rating && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{film.rating}/20</span>
          </div>
        )}
      </div>

      {/* Genres */}
      {film.genres && film.genres.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {film.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-bg-tertiary rounded-full text-xs text-text-secondary"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SeriesDetail({ series }: { series: Series }) {
  return (
    <div className="space-y-6">
      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
        {series.releaseYear && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{series.releaseYear}</span>
          </div>
        )}
        {series.episodesWatched !== undefined && series.episodes && (
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            <span>{series.episodesWatched}/{series.episodes} épisodes</span>
          </div>
        )}
        {series.rating && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{series.rating}/20</span>
          </div>
        )}
      </div>

      {/* Status */}
      {series.status && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Statut</h3>
          <span className="px-3 py-1 bg-bg-tertiary rounded-full text-xs text-text-secondary">
            {series.status}
          </span>
        </div>
      )}

      {/* Genres */}
      {series.genres && series.genres.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {series.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-bg-tertiary rounded-full text-xs text-text-secondary"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
