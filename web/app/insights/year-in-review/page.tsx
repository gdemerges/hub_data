'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components'
import { Film as FilmIcon, Tv, Gamepad2, BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type TopItem = { title: string; rating?: number; subtitle?: string }
type Review = {
  year: number
  films: { total: number; hoursWatched: number; topRated: TopItem[]; topGenres: { name: string; count: number }[] }
  series: { total: number; episodes: number; topRated: TopItem[]; topGenres: { name: string; count: number }[] }
  games: { total: number; hoursPlayed: number; topRated: TopItem[]; topPlatforms: { name: string; hours: number }[] }
  books: { total: number; pages: number; topRated: TopItem[]; topAuthors: { name: string; count: number }[] }
  highlights: string[]
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i)

function Section({
  icon: Icon,
  title,
  color,
  stats,
  topRated,
  extra,
}: {
  icon: typeof FilmIcon
  title: string
  color: string
  stats: string[]
  topRated: TopItem[]
  extra?: React.ReactNode
}) {
  return (
    <div className="tech-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Icon className={cn('w-5 h-5', color)} />
        <h3 className={cn('font-mono text-sm font-semibold uppercase tracking-wider', color)}>{title}</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {stats.map((s, i) => (
          <div key={i} className="text-xs font-mono text-text-secondary bg-bg-tertiary px-3 py-1.5 rounded border border-border-subtle">
            {s}
          </div>
        ))}
      </div>
      {topRated.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Top notes</div>
          {topRated.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm font-mono">
              <span className="text-text-primary truncate flex-1">
                <span className="text-text-muted mr-2">{i + 1}.</span>
                {item.title}
              </span>
              {item.rating && <span className="text-neon-yellow ml-2">{item.rating}</span>}
            </div>
          ))}
        </div>
      )}
      {extra}
    </div>
  )
}

export default function YearInReviewPage() {
  const [year, setYear] = useState(currentYear)
  const { data, isLoading } = useSWR<Review>(`/api/year-in-review?year=${year}`, fetcher, {
    dedupingInterval: 300_000, // 5min — données statiques, pas besoin de re-fetch fréquent
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title={`YEAR IN REVIEW ${year}`}
        systemName="INSIGHTS"
        statusDetail="ANNUAL_RECAP v1.0"
        loadingMessage={`Aggregating ${year} across all sections...`}
        color="neon-magenta"
      />

      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Sélection de l'année">
        {YEARS.map(y => (
          <button
            key={y}
            onClick={() => setYear(y)}
            aria-pressed={y === year}
            className={cn(
              'px-3 py-1.5 font-mono text-xs rounded border transition-all',
              y === year
                ? 'border-neon-magenta text-neon-magenta bg-neon-magenta/10'
                : 'border-border-subtle text-text-secondary hover:border-neon-magenta/40 hover:text-neon-magenta'
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="tech-card p-8 text-center text-text-muted font-mono">Chargement...</div>
      )}

      {data && (
        <>
          {data.highlights.length > 0 && (
            <div className="tech-card p-6 mb-6 bg-gradient-to-br from-neon-magenta/5 to-neon-cyan/5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-neon-magenta" />
                <h2 className="font-display font-semibold text-text-primary uppercase tracking-wider">Faits marquants</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {data.highlights.map((h, i) => (
                  <div key={i} className="px-4 py-2 bg-bg-card border border-neon-magenta/30 rounded-lg font-mono text-sm text-text-primary">
                    {h}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section
              icon={FilmIcon}
              title="Films"
              color="text-neon-magenta"
              stats={[`${data.films.total} films`, `~${data.films.hoursWatched}h`]}
              topRated={data.films.topRated}
              extra={
                data.films.topGenres.length > 0 ? (
                  <div className="text-xs font-mono text-text-secondary">
                    Genres: {data.films.topGenres.map(g => `${g.name} (${g.count})`).join(' · ')}
                  </div>
                ) : null
              }
            />
            <Section
              icon={Tv}
              title="Séries"
              color="text-neon-yellow"
              stats={[`${data.series.total} terminées`, `${data.series.episodes} épisodes`]}
              topRated={data.series.topRated}
              extra={
                data.series.topGenres.length > 0 ? (
                  <div className="text-xs font-mono text-text-secondary">
                    Genres: {data.series.topGenres.map(g => `${g.name} (${g.count})`).join(' · ')}
                  </div>
                ) : null
              }
            />
            <Section
              icon={Gamepad2}
              title="Jeux"
              color="text-neon-green"
              stats={[`${data.games.total} jeux`, `${data.games.hoursPlayed}h`]}
              topRated={data.games.topRated}
              extra={
                data.games.topPlatforms.length > 0 ? (
                  <div className="text-xs font-mono text-text-secondary">
                    Plateformes: {data.games.topPlatforms.map(p => `${p.name} (${p.hours}h)`).join(' · ')}
                  </div>
                ) : null
              }
            />
            <Section
              icon={BookOpen}
              title="Livres"
              color="text-blue-400"
              stats={[`${data.books.total} livres`, `${data.books.pages.toLocaleString('fr-FR')} pages`]}
              topRated={data.books.topRated}
              extra={
                data.books.topAuthors.length > 0 ? (
                  <div className="text-xs font-mono text-text-secondary">
                    Auteurs: {data.books.topAuthors.map(a => `${a.name} (${a.count})`).join(' · ')}
                  </div>
                ) : null
              }
            />
          </div>
        </>
      )}
    </div>
  )
}
