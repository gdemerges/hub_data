'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components'
import { Film as FilmIcon, Tv, Gamepad2, BookOpen, Sparkles, ChevronDown } from 'lucide-react'
import { CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type TopItem = { title: string; rating?: number; subtitle?: string }
type Review = {
  year: number
  films: { total: number; hoursWatched: number; items: TopItem[]; topGenres: { name: string; count: number }[] }
  series: { total: number; episodes: number; items: TopItem[]; topGenres: { name: string; count: number }[] }
  games: { total: number; hoursPlayed: number; items: TopItem[]; topPlatforms: { name: string; hours: number }[] }
  books: { total: number; pages: number; items: TopItem[]; topAuthors: { name: string; count: number }[] }
  highlights: string[]
}

// Nombre d'items affichés avant de devoir dérouler la liste.
const VISIBLE_COUNT = 5

const fetcher = (url: string) => fetch(url).then(r => r.json())

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i)

function Section({
  icon: Icon,
  title,
  color,
  stats,
  items,
  extra,
}: {
  icon: typeof FilmIcon
  title: string
  color: string
  stats: string[]
  items: TopItem[]
  extra?: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, VISIBLE_COUNT)
  const hiddenCount = items.length - VISIBLE_COUNT

  return (
    <div className="tech-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Icon className={cn('w-5 h-5', color)} />
        <h3 className={cn('font-display text-base font-medium tracking-tight', color)}>{title}</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {stats.map((s, i) => (
          <div key={i} className="text-xs font-mono text-text-secondary bg-bg-tertiary px-3 py-1.5 rounded border border-border-subtle">
            {s}
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">Détail</div>
          {visible.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm font-mono">
              <span className="text-text-primary truncate flex-1">
                <span className="text-text-muted mr-2">{i + 1}.</span>
                {item.title}
              </span>
              {item.rating ? (
                <span className={cn('ml-2', color)}>{item.rating}</span>
              ) : (
                <span className="ml-2 text-text-muted">—</span>
              )}
            </div>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              className="mt-1 flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
              {expanded ? 'Réduire' : `Voir les ${hiddenCount} autre${hiddenCount > 1 ? 's' : ''}`}
            </button>
          )}
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
        title={`Rétrospective ${year}`}
        subtitle="Bilan annuel toutes sections confondues"
        color="terracotta"
        icon={CalendarBlank}
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
                ? 'border-earth-terracotta text-earth-terracotta bg-earth-terracotta/10'
                : 'border-border-subtle text-text-secondary hover:border-earth-terracotta/40 hover:text-earth-terracotta'
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
            <div className="tech-card p-6 mb-6 bg-gradient-to-br from-earth-terracotta/5 to-earth-fern/5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-earth-terracotta" />
                <h2 className="font-display font-semibold text-text-primary uppercase tracking-wider">Faits marquants</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {data.highlights.map((h, i) => (
                  <div key={i} className="px-4 py-2 bg-bg-card border border-earth-terracotta/30 rounded-lg font-mono text-sm text-text-primary">
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
              color="text-earth-terracotta"
              stats={[`${data.films.total} films`, `~${data.films.hoursWatched}h`]}
              items={data.films.items}
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
              color="text-earth-saffron"
              stats={[`${data.series.total} terminées`, `${data.series.episodes} épisodes`]}
              items={data.series.items}
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
              color="text-earth-moss"
              stats={[`${data.games.total} jeux`, `${data.games.hoursPlayed}h`]}
              items={data.games.items}
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
              color="text-earth-indigo"
              stats={[`${data.books.total} livres`, `${data.books.pages.toLocaleString('fr-FR')} pages`]}
              items={data.books.items}
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
