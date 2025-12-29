'use client'

import { useMemo } from 'react'
import { MediaCard } from './media-card'
import { Sparkles } from 'lucide-react'
import { Film, Series, Game } from '@/lib/types'

interface RecommendationsProps {
  type: 'films' | 'series' | 'games'
  currentItem: Film | Series | Game
  allItems: (Film | Series | Game)[]
  onItemClick: (item: Film | Series | Game) => void
}

export function Recommendations({
  type,
  currentItem,
  allItems,
  onItemClick,
}: RecommendationsProps) {
  const recommendations = useMemo(() => {
    const currentGenres = currentItem.genres || []
    const currentRating = currentItem.rating || 0

    if (currentGenres.length === 0) return []

    // Calculate similarity score for each item
    const scored = allItems
      .filter(item => item.title !== currentItem.title)
      .map(item => {
        const itemGenres = item.genres || []

        // Genre overlap score (0-1)
        const genreOverlap = itemGenres.filter(g => currentGenres.includes(g)).length
        const genreScore = currentGenres.length > 0
          ? genreOverlap / Math.max(currentGenres.length, itemGenres.length)
          : 0

        // Rating similarity score (0-1)
        const ratingDiff = Math.abs((item.rating || 0) - currentRating)
        const ratingScore = currentRating > 0 && item.rating
          ? 1 - (ratingDiff / 20)
          : 0

        // Weighted final score
        const score = genreScore * 0.7 + ratingScore * 0.3

        return { item, score }
      })
      .filter(({ score }) => score > 0.2) // Minimum similarity threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    return scored.map(({ item }) => item)
  }, [currentItem, allItems])

  if (recommendations.length === 0) return null

  const getImageUrl = (item: Film | Series | Game) => {
    if ('posterUrl' in item) return item.posterUrl
    if ('coverUrl' in item) return item.coverUrl
    return undefined
  }

  const getSubtitle = (item: Film | Series | Game) => {
    if ('releaseYear' in item && item.releaseYear) return String(item.releaseYear)
    return undefined
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent-primary" />
        <h3 className="text-lg font-semibold text-text-primary">
          Recommandations similaires
        </h3>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {recommendations.map((item) => (
          <MediaCard
            key={item.title}
            title={item.title}
            imageUrl={getImageUrl(item)}
            subtitle={getSubtitle(item)}
            badge={item.rating ? `${item.rating}/20` : undefined}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>
    </div>
  )
}
