'use client'

import { ArrowUpDown, Calendar, ChevronDown, Clock, ListOrdered, Search, Star } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import { MediaTopPicks, type TopPick } from '@/components/media-top-picks'
import { StaggerContainer, StaggerItem } from '@/components/page-transition'
import { Recommendations } from '@/components/recommendations'
import { formatWatchHours } from '@/lib/series-time'
import type { Series } from '@/lib/types'

interface SeriesClientProps {
  series: Series[]
}

type SortKey = 'hours' | 'rating' | 'alpha' | 'episodes'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'hours', label: 'Plus vues (heures)' },
  { value: 'rating', label: 'Mieux notées' },
  { value: 'alpha', label: 'A – Z' },
  { value: 'episodes', label: "Plus d'épisodes vus" },
]

const SORT_COMPARATORS: Record<SortKey, (a: Series, b: Series) => number> = {
  hours: (a, b) => (b.watchMinutes ?? 0) - (a.watchMinutes ?? 0),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  alpha: (a, b) => a.title.localeCompare(b.title, 'fr'),
  episodes: (a, b) => (b.episodesWatched ?? 0) - (a.episodesWatched ?? 0),
}

export function SeriesClient({ series }: SeriesClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [sortBy, setSortBy] = useState<SortKey>('hours')
  const [selectedItem, setSelectedItem] = useState<Series | null>(null)
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    const open = searchParams.get('open')
    if (!open) return
    const match = series.find((s) => s.title === open)
    if (match) setSelectedItem(match)
    router.replace(pathname, { scroll: false })
  }, [searchParams, series, pathname, router])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (search) url.searchParams.set('q', search)
    else url.searchParams.delete('q')
    window.history.replaceState(null, '', url.toString())
  }, [search])

  const items = useMemo(() => {
    return series.map((s) => ({
      ...s,
      imageUrl: s.posterUrl,
      subtitle:
        [s.status, s.watchMinutes ? formatWatchHours(s.watchMinutes) : undefined]
          .filter(Boolean)
          .join(' · ') || undefined,
      badge: s.rating ? `${s.rating}/20` : undefined,
      progressBadge:
        s.episodes && s.episodesWatched !== undefined
          ? `${s.episodesWatched}/${s.episodes} ep.`
          : undefined,
    }))
  }, [series])

  const filteredItems = useMemo(() => {
    const base = !deferredSearch
      ? items
      : items.filter((item) => item.title.toLowerCase().includes(deferredSearch.toLowerCase()))
    return [...base].sort(SORT_COMPARATORS[sortBy])
  }, [items, deferredSearch, sortBy])

  const topPicks: TopPick[] = useMemo(() => {
    return [...series]
      .filter((s) => s.rating && s.rating > 0)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 3)
      .map((s) => ({
        title: s.title,
        imageUrl: s.posterUrl,
        metric: s.rating ? `${s.rating}/20` : undefined,
        metricLabel: 'Note',
        meta: s.status || undefined,
        onClick: () => setSelectedItem(s),
      }))
  }, [series])

  return (
    <>
      {!deferredSearch && topPicks.length > 0 && (
        <MediaTopPicks
          picks={topPicks}
          accent="saffron"
          title="Tes séries préférées"
          eyebrow="Top 3"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            strokeWidth={1.75}
          />
          <input
            type="text"
            placeholder="Rechercher une série…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-subtle rounded-full text-text-primary placeholder:text-text-muted focus:outline-none focus:border-earth-saffron/50 focus:ring-2 focus:ring-earth-saffron/15 transition-all"
          />
        </div>
        <div className="relative">
          <ArrowUpDown
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            strokeWidth={1.75}
          />
          <select
            aria-label="Trier les séries"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="appearance-none w-full sm:w-auto pl-10 pr-9 py-2.5 bg-bg-card border border-border-subtle rounded-full text-text-primary focus:outline-none focus:border-earth-saffron/50 focus:ring-2 focus:ring-earth-saffron/15 transition-all cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            strokeWidth={1.75}
          />
        </div>
      </div>

      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted mb-4 num">
        {filteredItems.length.toLocaleString('fr-FR')} série{filteredItems.length > 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredItems.map((item, index) => (
          <StaggerItem key={item.title} index={index}>
            <MediaCard
              title={item.title}
              imageUrl={item.imageUrl}
              subtitle={item.subtitle}
              badge={item.badge}
              progressBadge={item.progressBadge}
              onClick={() => setSelectedItem(item)}
              priority={index < 12}
              color="saffron"
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">Aucun résultat trouvé</p>
        </div>
      )}

      {/* Detail modal */}
      {selectedItem && (
        <MediaDetail
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          imageUrl={selectedItem.posterUrl}
        >
          <SeriesDetail series={selectedItem} />
          <Recommendations
            type="series"
            currentItem={selectedItem}
            allItems={series}
            onItemClick={(item) => setSelectedItem(item as Series)}
          />
        </MediaDetail>
      )}
    </>
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
        {series.episodes && (
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4" />
            <span>
              {series.episodesWatched || 0}/{series.episodes} épisodes
            </span>
          </div>
        )}
        {series.watchMinutes ? (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-earth-saffron" />
            <span>{formatWatchHours(series.watchMinutes)} de visionnage</span>
          </div>
        ) : null}
        {series.rating && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-earth-saffron" />
            <span>{series.rating}/20</span>
          </div>
        )}
      </div>

      {/* Status */}
      {series.status && (
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              series.status === 'Terminée'
                ? 'bg-earth-moss/20 text-earth-mossSoft'
                : series.status === 'A jour'
                  ? 'bg-earth-indigo/20 text-earth-indigo'
                  : series.status === 'En cours'
                    ? 'bg-earth-saffron/20 text-earth-saffron'
                    : series.status === 'Abandonnée'
                      ? 'bg-earth-clay/20 text-earth-clay'
                      : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {series.status}
          </span>
          {series.airingStatus && (
            <span className="text-xs text-text-muted">• {series.airingStatus}</span>
          )}
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
