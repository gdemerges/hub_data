'use client'

import { useState, useEffect } from 'react'
import {
  Film,
  Tv,
  Gamepad2,
  Footprints,
  MapPin,
  Heart,
  Clock,
  Filter
} from 'lucide-react'

interface TimelineEvent {
  id: string
  type: 'film' | 'series' | 'game' | 'sport' | 'voyage' | 'partner'
  title: string
  subtitle?: string
  date: string
  icon: string
  color: string
  value?: string
}

const iconMap: Record<string, any> = {
  Film,
  Tv,
  Gamepad2,
  Footprints,
  MapPin,
  Heart,
}

const colorMap: Record<string, string> = {
  magenta: 'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta',
  yellow: 'border-neon-yellow/50 bg-neon-yellow/10 text-neon-yellow',
  green: 'border-neon-green/50 bg-neon-green/10 text-neon-green',
  orange: 'border-neon-orange/50 bg-neon-orange/10 text-neon-orange',
  cyan: 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan',
  red: 'border-neon-red/50 bg-neon-red/10 text-neon-red',
}

const typeLabels: Record<string, string> = {
  film: 'Films',
  series: 'Séries',
  game: 'Jeux',
  sport: 'Sport',
  voyage: 'Voyages',
  partner: 'Social',
}

export function UnifiedTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const [limit, setLimit] = useState(30)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const response = await fetch(`/api/timeline?limit=${limit}`)
        if (response.ok) {
          const result = await response.json()
          setEvents(result.events)
        }
      } catch (err) {
        console.error('Failed to load timeline:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [limit])

  const filteredEvents = filter
    ? events.filter((e) => e.type === filter)
    : events

  // Group events by year-month
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const yearMonth = event.date.substring(0, 7)
    if (!acc[yearMonth]) {
      acc[yearMonth] = []
    }
    acc[yearMonth].push(event)
    return acc
  }, {} as Record<string, TimelineEvent[]>)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatMonthYear = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="tech-card p-6 h-96 flex items-center justify-center">
        <div className="text-sm text-text-muted font-mono animate-pulse">
          Chargement de la timeline...
        </div>
      </div>
    )
  }

  return (
    <div className="tech-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded">
            <Clock className="w-5 h-5 text-neon-magenta" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Unified_Timeline
          </h3>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <div className="flex gap-1">
            <button
              onClick={() => setFilter(null)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                filter === null
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                  : 'bg-bg-tertiary text-text-muted hover:bg-bg-hover'
              }`}
            >
              Tout
            </button>
            {Object.entries(typeLabels).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? null : type)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  filter === type
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                    : 'bg-bg-tertiary text-text-muted hover:bg-bg-hover'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-neon-cyan/50 via-neon-magenta/50 to-neon-orange/50" />

        {Object.entries(groupedEvents).map(([yearMonth, monthEvents]) => (
          <div key={yearMonth} className="mb-6">
            {/* Month header */}
            <div className="flex items-center gap-4 mb-4 sticky top-0 bg-bg-card z-10 py-2">
              <div className="w-10 h-10 rounded-full bg-bg-tertiary border border-border-subtle flex items-center justify-center">
                <span className="text-xs font-mono text-text-muted">
                  {yearMonth.split('-')[1]}
                </span>
              </div>
              <span className="text-sm font-mono text-text-secondary capitalize">
                {formatMonthYear(yearMonth)}
              </span>
            </div>

            {/* Events for this month */}
            <div className="space-y-3 ml-2">
              {monthEvents.map((event) => {
                const Icon = iconMap[event.icon] || Film
                const colorClass = colorMap[event.color] || colorMap.cyan

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 group"
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 ${colorClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 bg-bg-primary border border-border-subtle rounded-lg p-3 group-hover:border-neon-cyan/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-neon-cyan transition-colors">
                            {event.title}
                          </h4>
                          {event.subtitle && (
                            <p className="text-xs text-text-muted font-mono mt-0.5 truncate">
                              {event.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {event.value && (
                            <span className={`text-xs font-mono font-semibold ${colorClass.split(' ')[2]}`}>
                              {event.value}
                            </span>
                          )}
                          <span className="text-xs text-text-muted font-mono">
                            {formatDate(event.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-text-muted font-mono text-sm">
            Aucun événement trouvé
          </div>
        )}
      </div>

      {/* Load more */}
      {events.length >= limit && (
        <div className="mt-4 pt-4 border-t border-border-subtle text-center">
          <button
            onClick={() => setLimit(limit + 30)}
            className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded text-neon-cyan text-sm font-mono hover:bg-neon-cyan/20 transition-colors"
          >
            Charger plus
          </button>
        </div>
      )}
    </div>
  )
}
