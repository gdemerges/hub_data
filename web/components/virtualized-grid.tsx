'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MediaCard } from './media-card'
import { MediaDetail } from './media-detail'
import { Search } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './page-transition'

interface VirtualizedItem {
  title: string
  imageUrl?: string
  subtitle?: string
  badge?: string
  progressBadge?: string
  [key: string]: any
}

interface VirtualizedGridProps<T extends VirtualizedItem> {
  items: T[]
  searchPlaceholder?: string
  renderDetail?: (item: T) => React.ReactNode
  getItemKey?: (item: T) => string
  itemsPerRow?: number
}

export function VirtualizedGrid<T extends VirtualizedItem>({
  items,
  searchPlaceholder = 'Rechercher...',
  renderDetail,
  getItemKey = (item) => item.title,
  itemsPerRow: forcedItemsPerRow,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Calculate items per row based on container width
  const itemsPerRow = useMemo(() => {
    if (forcedItemsPerRow) return forcedItemsPerRow
    if (containerWidth < 640) return 2
    if (containerWidth < 768) return 3
    if (containerWidth < 1024) return 4
    if (containerWidth < 1280) return 5
    return 6
  }, [containerWidth, forcedItemsPerRow])

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const filteredItems = useMemo(() => {
    if (!search) return items
    const searchLower = search.toLowerCase()
    return items.filter((item) =>
      item.title.toLowerCase().includes(searchLower)
    )
  }, [items, search])

  // Group items into rows
  const rows = useMemo(() => {
    const result: T[][] = []
    for (let i = 0; i < filteredItems.length; i += itemsPerRow) {
      result.push(filteredItems.slice(i, i + itemsPerRow))
    }
    return result
  }, [filteredItems, itemsPerRow])

  // Card dimensions
  const gap = 16
  const cardWidth = itemsPerRow > 0 ? (containerWidth - gap * (itemsPerRow - 1)) / itemsPerRow : 200
  const cardHeight = cardWidth * 1.5 + 60 // Aspect ratio 2:3 + info section

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => cardHeight + gap,
    overscan: 3,
  })

  // For small lists (< 50 items), don't use virtualization
  if (filteredItems.length < 50) {
    return (
      <>
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
        </div>

        <p className="text-sm text-text-muted mb-4">
          {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}
        </p>

        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredItems.map((item, index) => (
            <StaggerItem key={getItemKey(item)}>
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">Aucun résultat trouvé</p>
          </div>
        )}

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

  return (
    <>
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
      </div>

      <p className="text-sm text-text-muted mb-4">
        {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}
      </p>

      <div
        ref={parentRef}
        className="h-[calc(100vh-300px)] overflow-auto"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index]
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex gap-4"
              >
                {row.map((item) => (
                  <div
                    key={getItemKey(item)}
                    style={{ width: cardWidth }}
                  >
                    <MediaCard
                      title={item.title}
                      imageUrl={item.imageUrl}
                      subtitle={item.subtitle}
                      badge={item.badge}
                      progressBadge={item.progressBadge}
                      onClick={() => setSelectedItem(item)}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">Aucun résultat trouvé</p>
        </div>
      )}

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
