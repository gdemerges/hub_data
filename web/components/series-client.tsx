'use client'

import { useState, useMemo } from 'react'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import { Recommendations } from '@/components/recommendations'
import { StaggerContainer, StaggerItem } from '@/components/page-transition'
import { Search, Calendar, Star, ListOrdered } from 'lucide-react'
import { Series } from '@/lib/types'

interface SeriesClientProps {
  series: Series[]
}

export function SeriesClient({ series }: SeriesClientProps) {
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<Series | null>(null)

  const items = useMemo(() => {
    return series.map((s) => ({
      ...s,
      imageUrl: s.posterUrl,
      subtitle: s.status || undefined,
      badge: s.rating ? `${s.rating}/20` : undefined,
      progressBadge: s.episodes && s.episodesWatched !== undefined
        ? `${s.episodesWatched}/${s.episodes} ep.`
        : undefined,
    }))
  }, [series])

  const filteredItems = useMemo(() => {
    if (!search) return items

    const searchLower = search.toLowerCase()
    return items.filter((item) =>
      item.title.toLowerCase().includes(searchLower)
    )
  }, [items, search])

  return (
    <>
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher une série..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-glow transition-all"
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-text-muted mb-4">
        {filteredItems.length} série{filteredItems.length > 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredItems.map((item, index) => (
          <StaggerItem key={item.title}>
            <MediaCard
              title={item.title}
              imageUrl={item.imageUrl}
              subtitle={item.subtitle}
              badge={item.badge}
              progressBadge={item.progressBadge}
              onClick={() => setSelectedItem(item)}
              priority={index < 12}
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
            <span>{series.episodesWatched || 0}/{series.episodes} épisodes</span>
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
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs ${
            series.status === 'Terminée' ? 'bg-green-500/20 text-green-400' :
            series.status === 'A jour' ? 'bg-blue-500/20 text-blue-400' :
            series.status === 'En cours' ? 'bg-yellow-500/20 text-yellow-400' :
            series.status === 'Abandonnée' ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
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
