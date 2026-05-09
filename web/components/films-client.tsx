'use client'

import { useState, useMemo, useEffect, useDeferredValue } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import { MediaTopPicks, type TopPick } from '@/components/media-top-picks'
import { Recommendations } from '@/components/recommendations'
import { StaggerContainer, StaggerItem } from '@/components/page-transition'
import { Search, Calendar, Star, Clock } from 'lucide-react'
import { Film } from '@/lib/types'

interface FilmsClientProps {
  films: Film[]
}

export function FilmsClient({ films }: FilmsClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [selectedItem, setSelectedItem] = useState<Film | null>(null)
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    const open = searchParams.get('open')
    if (!open) return
    const match = films.find(f => f.title === open)
    if (match) setSelectedItem(match)
    router.replace(pathname, { scroll: false })
  }, [searchParams, films, pathname, router])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (search) url.searchParams.set('q', search)
    else url.searchParams.delete('q')
    window.history.replaceState(null, '', url.toString())
  }, [search])

  const items = useMemo(() => {
    return films.map((film) => ({
      ...film,
      imageUrl: film.posterUrl,
      subtitle: film.releaseYear?.toString(),
      badge: film.rating ? `${film.rating}/20` : undefined,
    }))
  }, [films])

  const filteredItems = useMemo(() => {
    if (!deferredSearch) return items
    const searchLower = deferredSearch.toLowerCase()
    return items.filter((item) => item.title.toLowerCase().includes(searchLower))
  }, [items, deferredSearch])

  // Top 3 par note (cachés si recherche active)
  const topPicks: TopPick[] = useMemo(() => {
    return [...films]
      .filter((f) => f.rating && f.rating > 0)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 3)
      .map((f) => ({
        title: f.title,
        imageUrl: f.posterUrl,
        metric: f.rating ? `${f.rating}/20` : undefined,
        metricLabel: 'Note',
        meta: f.releaseYear?.toString(),
        onClick: () => setSelectedItem(f),
      }))
  }, [films])

  return (
    <>
      {/* Top 3 — visible uniquement sans recherche */}
      {!deferredSearch && topPicks.length > 0 && (
        <MediaTopPicks picks={topPicks} accent="terracotta" title="Tes plus belles notes" eyebrow="Top 3" />
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Rechercher un film…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-subtle rounded-full text-text-primary placeholder:text-text-muted focus:outline-none focus:border-earth-terracotta/50 focus:ring-2 focus:ring-earth-terracotta/15 transition-all"
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted mb-4 num">
        {filteredItems.length.toLocaleString('fr-FR')} film{filteredItems.length > 1 ? 's' : ''}
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
              onClick={() => setSelectedItem(item)}
              priority={index < 12}
              color="terracotta"
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
          <FilmDetail film={selectedItem} />
          <Recommendations
            type="films"
            currentItem={selectedItem}
            allItems={films}
            onItemClick={(item) => setSelectedItem(item as Film)}
          />
        </MediaDetail>
      )}
    </>
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
            <Star className="w-4 h-4 text-earth-saffron" />
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
