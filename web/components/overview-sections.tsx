'use client'

import { Calendar, ChevronRight, Clock, Film as FilmIcon, Gamepad2, Star, Tv } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import type { Film, Game, Series } from '@/lib/types'

const sectionColors = {
  moss: {
    icon: 'text-earth-moss',
    iconBg: 'bg-earth-moss/10 border-earth-moss/30',
    link: 'text-earth-moss border-earth-moss/30 hover:border-earth-moss/60 hover:bg-earth-moss/10',
  },
  terracotta: {
    icon: 'text-earth-terracotta',
    iconBg: 'bg-earth-terracotta/10 border-earth-terracotta/30',
    link: 'text-earth-terracotta border-earth-terracotta/30 hover:border-earth-terracotta/60 hover:bg-earth-terracotta/10',
  },
  saffron: {
    icon: 'text-earth-saffron',
    iconBg: 'bg-earth-saffron/10 border-earth-saffron/30',
    link: 'text-earth-saffron border-earth-saffron/30 hover:border-earth-saffron/60 hover:bg-earth-saffron/10',
  },
} as const

const badgeColors = {
  fern: 'border-earth-fern/30 bg-earth-fern/5 text-earth-fern',
  moss: 'border-earth-moss/30 bg-earth-moss/5 text-earth-moss',
  terracotta: 'border-earth-terracotta/30 bg-earth-terracotta/5 text-earth-terracotta',
  saffron: 'border-earth-saffron/30 bg-earth-saffron/5 text-earth-saffron',
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
        <Section
          title="Jeux les plus joués"
          href="/games"
          count={gamesCount}
          icon={Gamepad2}
          color="moss"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topGames.map((game) => (
              <MediaCard
                key={game.title}
                title={game.title}
                imageUrl={game.coverUrl}
                badge={game.hoursPlayed ? `${game.hoursPlayed}h` : undefined}
                onClick={() => setSelectedGame(game)}
                color="moss"
              />
            ))}
          </div>
        </Section>

        {/* Top Films */}
        <Section
          title="Films les mieux notés"
          href="/films"
          count={filmsCount}
          icon={FilmIcon}
          color="terracotta"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topFilms.map((film) => (
              <MediaCard
                key={film.title}
                title={film.title}
                imageUrl={film.posterUrl}
                badge={film.rating ? `${film.rating}/20` : undefined}
                onClick={() => setSelectedFilm(film)}
                color="terracotta"
              />
            ))}
          </div>
        </Section>

        {/* Top Series */}
        <Section
          title="Séries les mieux notées"
          href="/series"
          count={seriesCount}
          icon={Tv}
          color="saffron"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topSeries.map((s) => (
              <MediaCard
                key={s.title}
                title={s.title}
                imageUrl={s.posterUrl}
                badge={s.rating ? `${s.rating}/20` : undefined}
                onClick={() => setSelectedSeries(s)}
                color="saffron"
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
          className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] border px-3 py-1.5 rounded-lg transition-all duration-300 ${c.link}`}
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

function DetailMeta({
  icon: Icon,
  label,
  color = 'fern',
}: {
  icon: React.ElementType
  label: string
  color?: keyof typeof badgeColors
}) {
  const c = badgeColors[color]
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-mono ${c}`}>
      <Icon className="w-4 h-4" />
      <span className="text-text-secondary">{label}</span>
    </div>
  )
}

function DetailBadge({
  label,
  color = 'fern',
}: {
  label: string
  color?: keyof typeof badgeColors
}) {
  const c = badgeColors[color]
  return <span className={`px-3 py-1 border rounded text-xs font-mono ${c}`}>{label}</span>
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted mb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

function GameDetail({ game }: { game: Game }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {game.hoursPlayed && (
          <DetailMeta icon={Clock} label={`${game.hoursPlayed}h jouées`} color="moss" />
        )}
        {game.releaseYear && (
          <DetailMeta icon={Calendar} label={`${game.releaseYear}`} color="fern" />
        )}
        {game.rating && <DetailMeta icon={Star} label={`${game.rating}/20`} color="saffron" />}
      </div>

      {game.platforms && game.platforms.length > 0 && (
        <DetailSection title="Plateformes">
          <div className="flex flex-wrap gap-2">
            {game.platforms.map((p) => (
              <DetailBadge
                key={p.platform}
                label={`${p.platform}${p.hoursPlayed ? ` — ${p.hoursPlayed}h` : ''}`}
                color="moss"
              />
            ))}
          </div>
        </DetailSection>
      )}

      {game.genres && game.genres.length > 0 && (
        <DetailSection title="Genres">
          <div className="flex flex-wrap gap-2">
            {game.genres.map((genre) => (
              <DetailBadge key={genre} label={genre} color="terracotta" />
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
        {film.releaseYear && (
          <DetailMeta icon={Calendar} label={`${film.releaseYear}`} color="fern" />
        )}
        {film.runtime && (
          <DetailMeta icon={Clock} label={`${film.runtime} min`} color="terracotta" />
        )}
        {film.rating && <DetailMeta icon={Star} label={`${film.rating}/20`} color="saffron" />}
      </div>

      {film.genres && film.genres.length > 0 && (
        <DetailSection title="Genres">
          <div className="flex flex-wrap gap-2">
            {film.genres.map((genre) => (
              <DetailBadge key={genre} label={genre} color="terracotta" />
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
        {series.releaseYear && (
          <DetailMeta icon={Calendar} label={`${series.releaseYear}`} color="fern" />
        )}
        {series.episodesWatched !== undefined && series.episodes && (
          <DetailMeta
            icon={Tv}
            label={`${series.episodesWatched}/${series.episodes} épisodes`}
            color="saffron"
          />
        )}
        {series.rating && <DetailMeta icon={Star} label={`${series.rating}/20`} color="saffron" />}
      </div>

      {series.status && (
        <DetailSection title="Statut">
          <DetailBadge label={series.status} color="saffron" />
        </DetailSection>
      )}

      {series.genres && series.genres.length > 0 && (
        <DetailSection title="Genres">
          <div className="flex flex-wrap gap-2">
            {series.genres.map((genre) => (
              <DetailBadge key={genre} label={genre} color="terracotta" />
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  )
}
