'use client'

import { useState, useMemo } from 'react'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import { Search, SlidersHorizontal, Gamepad2, Clock, Calendar, Star } from 'lucide-react'
import { Game } from '@/lib/types'

interface GamesClientProps {
  games: Game[]
  platforms: string[]
}

export function GamesClient({ games, platforms }: GamesClientProps) {
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<Game | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [minHours, setMinHours] = useState<number>(0)
  const [sortBy, setSortBy] = useState<'hours' | 'rating' | 'title'>('hours')
  const [showFilters, setShowFilters] = useState(false)

  const items = useMemo(() => {
    return games.map((game) => ({
      ...game,
      imageUrl: game.coverUrl,
      subtitle: game.platform,
      badge: game.hoursPlayed ? `${game.hoursPlayed}h` : undefined,
    }))
  }, [games])

  const filteredItems = useMemo(() => {
    let result = items

    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter((item) =>
        item.title.toLowerCase().includes(searchLower)
      )
    }

    if (filter !== 'all') {
      result = result.filter((item) => item.platform === filter)
    }

    if (minHours > 0) {
      result = result.filter((item) => (item.hoursPlayed || 0) >= minHours)
    }

    // Tri
    result.sort((a, b) => {
      if (sortBy === 'hours') {
        return (b.hoursPlayed || 0) - (a.hoursPlayed || 0)
      } else if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0)
      } else {
        return a.title.localeCompare(b.title)
      }
    })

    return result
  }, [items, search, filter, minHours, sortBy])

  return (
    <>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher un jeu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-glow transition-all"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary hover:border-border-default transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtres</span>
        </button>
      </div>

      {/* Filter options */}
      {showFilters && (
        <div className="space-y-4 mb-6 p-4 bg-bg-secondary rounded-xl border border-border-subtle animate-fade-in">
          {/* Platform filter */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block">Plateforme</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filter === 'all'
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                Toutes
              </button>
              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => setFilter(platform)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    filter === platform
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Hours filter */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block">
              Heures minimum : {minHours}h
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minHours}
              onChange={(e) => setMinHours(Number(e.target.value))}
              className="w-full accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>0h</span>
              <span>50h</span>
              <span>100h+</span>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block">Trier par</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortBy('hours')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  sortBy === 'hours'
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                Heures jouées
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  sortBy === 'rating'
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                Note
              </button>
              <button
                onClick={() => setSortBy('title')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  sortBy === 'title'
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                Titre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Count */}
      <p className="text-sm text-text-muted mb-4">
        {filteredItems.length} jeu{filteredItems.length > 1 ? 'x' : ''}
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
      {selectedItem && (
        <MediaDetail
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          imageUrl={selectedItem.coverUrl}
        >
          <GameDetail game={selectedItem} />
        </MediaDetail>
      )}
    </>
  )
}

function GameDetail({ game }: { game: Game }) {
  return (
    <div className="space-y-6">
      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
        {/* Show platforms summary if multi-platform */}
        {game.platforms && game.platforms.length > 1 && (
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            <span>{game.platforms.length} plateformes</span>
          </div>
        )}
        {/* Show single platform if only one */}
        {game.platform && !game.platforms && (
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            <span>{game.platform}</span>
          </div>
        )}
        {game.hoursPlayed !== undefined && game.hoursPlayed > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{game.hoursPlayed}h jouées{game.platforms && game.platforms.length > 1 ? ' (total)' : ''}</span>
          </div>
        )}
        {game.releaseYear && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{game.releaseYear}</span>
          </div>
        )}
        {game.rating && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{game.rating}/20</span>
          </div>
        )}
        {game.status && !game.platforms && (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs ${
              game.status === 'Fini' ? 'bg-green-500/20 text-green-400' :
              game.status === 'En cours' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {game.status}
            </span>
          </div>
        )}
      </div>

      {/* Platform breakdown for multi-platform games */}
      {game.platforms && game.platforms.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Détail par plateforme</h3>
          <div className="space-y-2">
            {game.platforms.map((platform, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-medium text-text-primary">{platform.platform}</span>
                  {platform.status && (
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      platform.status === 'Fini' ? 'bg-green-500/20 text-green-400' :
                      platform.status === 'En cours' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {platform.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{platform.hoursPlayed || 0}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genres */}
      {game.genres && game.genres.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {game.genres.map((genre) => (
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
