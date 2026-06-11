'use client'

import { useState, useMemo, useEffect, useDeferredValue } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import { withViewTransition } from '@/lib/view-transition'
import { MediaTopPicks, type TopPick } from '@/components/media-top-picks'
import { Recommendations } from '@/components/recommendations'
import { StaggerContainer, StaggerItem } from '@/components/page-transition'
import { Search, Calendar, Star, Clock, ArrowUpDown } from 'lucide-react'
import type { Film } from '@/lib/types'

type SortOption = 'recent' | 'oldest' | 'rating' | 'title'

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Plus récent',
  oldest: 'Plus ancien',
  rating: 'Mieux notés',
  title: 'Ordre alphabétique',
}

interface FilmsClientProps {
  films: Film[]
}

export function FilmsClient({ films }: FilmsClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [year, setYear] = useState<string>(() => searchParams.get('year') ?? '')
  const [sortBy, setSortBy] = useState<SortOption>(
    () => (searchParams.get('sort') as SortOption) || 'recent'
  )
  const [selectedItem, setSelectedItem] = useState<Film | null>(null)
  const deferredSearch = useDeferredValue(search)

  // Titre de la carte en cours de morph : seule cette carte porte le
  // view-transition-name (le navigateur exige un nom unique par document).
  const [morphTitle, setMorphTitle] = useState<string | null>(null)

  const openItem = (item: Film) => {
    // Pose le nom sur la carte cliquée AVANT la capture de l'état "old".
    flushSync(() => setMorphTitle(item.title))
    withViewTransition(() => {
      flushSync(() => setSelectedItem(item))
    })
  }

  const closeItem = () => {
    // Capture le titre en cours : si une autre carte est ouverte pendant les
    // ~300ms de transition, son morphTitle ne doit pas être écrasé.
    const closing = morphTitle
    withViewTransition(() => {
      flushSync(() => setSelectedItem(null))
    }).then(() => setMorphTitle((t) => (t === closing ? null : t)))
  }

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
    if (year) url.searchParams.set('year', year)
    else url.searchParams.delete('year')
    if (sortBy && sortBy !== 'recent') url.searchParams.set('sort', sortBy)
    else url.searchParams.delete('sort')
    window.history.replaceState(null, '', url.toString())
  }, [search, year, sortBy])

  const availableYears = useMemo(() => {
    const set = new Set<number>()
    for (const f of films) if (f.releaseYear) set.add(f.releaseYear)
    return Array.from(set).sort((a, b) => b - a)
  }, [films])

  const items = useMemo(() => {
    return films.map((film) => ({
      ...film,
      imageUrl: film.posterUrl,
      subtitle: film.releaseYear?.toString(),
      badge: film.rating ? `${film.rating}/20` : undefined,
    }))
  }, [films])

  const filteredItems = useMemo(() => {
    let result = items
    if (deferredSearch) {
      const searchLower = deferredSearch.toLowerCase()
      result = result.filter((item) => item.title.toLowerCase().includes(searchLower))
    }
    if (year) {
      const y = parseInt(year, 10)
      result = result.filter((item) => item.releaseYear === y)
    }
    const sorted = [...result]
    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0))
        break
      case 'oldest':
        sorted.sort((a, b) => (a.releaseYear ?? Infinity) - (b.releaseYear ?? Infinity))
        break
      case 'rating':
        sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
        break
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }))
        break
    }
    return sorted
  }, [items, deferredSearch, year, sortBy])

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

      {/* Search + year filter */}
      <div className="flex flex-col gap-3 mb-6">
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" strokeWidth={1.75} />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-bg-card border border-border-subtle rounded-full text-text-primary focus:outline-none focus:border-earth-terracotta/50 focus:ring-2 focus:ring-earth-terracotta/15 transition-all appearance-none cursor-pointer"
            >
              <option value="">Toutes les années</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 sm:flex-none">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" strokeWidth={1.75} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full pl-10 pr-8 py-2.5 bg-bg-card border border-border-subtle rounded-full text-text-primary focus:outline-none focus:border-earth-terracotta/50 focus:ring-2 focus:ring-earth-terracotta/15 transition-all appearance-none cursor-pointer"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
          </div>
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
              onClick={() => openItem(item)}
              priority={index < 12}
              color="terracotta"
              // Nom supprimé tant que le modal est ouvert : deux éléments avec le
              // même view-transition-name feraient skipper la transition.
              transitionName={morphTitle === item.title && !selectedItem ? 'media-cover' : undefined}
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
          onClose={closeItem}
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
