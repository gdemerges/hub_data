'use client'

import { useState, useMemo } from 'react'
import { MediaCard } from './media-card'
import { MediaDetail } from './media-detail'
import { Search, SlidersHorizontal } from 'lucide-react'

interface MediaItem {
  title: string
  imageUrl?: string
  subtitle?: string
  badge?: string
  [key: string]: any
}

interface MediaGridProps<T extends MediaItem> {
  items: T[]
  searchPlaceholder?: string
  renderDetail?: (item: T) => React.ReactNode
  filterOptions?: {
    label: string
    options: string[]
    getValue: (item: T) => string
  }
}

export function MediaGrid<T extends MediaItem>({
  items,
  searchPlaceholder = 'Rechercher...',
  renderDetail,
  filterOptions,
}: MediaGridProps<T>) {
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredItems = useMemo(() => {
    let result = items

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter((item) =>
        item.title.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (filter !== 'all' && filterOptions) {
      result = result.filter((item) => filterOptions.getValue(item) === filter)
    }

    return result
  }, [items, search, filter, filterOptions])

  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-glow transition-all"
          />
        </div>

        {filterOptions && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary hover:border-border-default transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtres</span>
          </button>
        )}
      </div>

      {/* Filter options */}
      {showFilters && filterOptions && (
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-in">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              filter === 'all'
                ? 'bg-accent-primary text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            Tous
          </button>
          {filterOptions.options.map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filter === option
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-sm text-text-muted mb-4">
        {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredItems.map((item, index) => (
          <MediaCard
            key={item.title}
            title={item.title}
            imageUrl={item.imageUrl}
            subtitle={item.subtitle}
            badge={item.badge}
            onClick={() => setSelectedItem(item)}
            priority={index < 12}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">Aucun résultat trouvé</p>
        </div>
      )}

      {/* Detail modal */}
      {renderDetail && selectedItem && (
        <MediaDetail
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          imageUrl={selectedItem.imageUrl}
        >
          {renderDetail(selectedItem)}
        </MediaDetail>
      )}
    </>
  )
}
