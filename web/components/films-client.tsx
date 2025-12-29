'use client'

import { useState, useMemo } from 'react'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import { Recommendations } from '@/components/recommendations'
import { StaggerContainer, StaggerItem } from '@/components/page-transition'
import { Search, Calendar, Star, Clock } from 'lucide-react'
import { Film } from '@/lib/types'

interface FilmsClientProps {
  films: Film[]
}

export function FilmsClient({ films }: FilmsClientProps) {
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<Film | null>(null)

  const items = useMemo(() => {
    return films.map((film) => ({
      ...film,
      imageUrl: film.posterUrl,
      subtitle: film.releaseYear?.toString(),
      badge: film.rating ? `${film.rating}/20` : undefined,
    }))
  }, [films])

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
            placeholder="Rechercher un film..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-glow transition-all"
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-text-muted mb-4">
        {filteredItems.length} film{filteredItems.length > 1 ? 's' : ''}
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
