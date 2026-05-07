'use client'

import { useEffect, useState } from 'react'
import { Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { ContributionCalendar } from '@/components'

interface PlaytimeData {
  totalHours: number
  totalMinutes: number
  daysPlayed: number
  playtime: {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
  }[]
}

export function SteamPlaytimeSection() {
  const [playtime, setPlaytime] = useState<PlaytimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setLoading(true)
        const res = await fetch(`/api/steam/playtime?year=${year}`)
        if (!res.ok) throw new Error('fetch failed')
        const data = (await res.json()) as PlaytimeData
        if (!cancelled) setPlaytime(data)
      } catch {
        if (!cancelled) setPlaytime(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [year])

  async function handleSync() {
    try {
      setSyncing(true)
      const res = await fetch('/api/steam/sync', { method: 'POST' })
      if (!res.ok) throw new Error('sync failed')
      const refreshed = await fetch(`/api/steam/playtime?year=${year}`)
      if (refreshed.ok) setPlaytime(await refreshed.json())
    } catch {
      alert('Échec de la synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
            <Clock className="w-5 h-5 text-neon-cyan" />
          </div>
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Playtime_Tracker
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {playtime && (
            <span className="text-xs font-mono text-text-muted">
              {playtime.totalHours}h // {playtime.daysPlayed} jours [{year}]
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 hover:border-neon-green/50 text-neon-green rounded text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            <span>SYNC</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear(year - 1)}
              disabled={loading}
              className="p-1 hover:bg-neon-cyan/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Année précédente"
            >
              <ChevronLeft className="w-4 h-4 text-neon-cyan" />
            </button>
            <span className="text-sm font-mono font-medium text-neon-cyan min-w-[4rem] text-center">
              {year}
            </span>
            <button
              onClick={() => setYear(year + 1)}
              disabled={year >= new Date().getFullYear() || loading}
              className="p-1 hover:bg-neon-cyan/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Année suivante"
            >
              <ChevronRight className="w-4 h-4 text-neon-cyan" />
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-sm text-text-muted">Chargement du temps de jeu...</div>
        </div>
      ) : playtime && playtime.playtime.length > 0 ? (
        <ContributionCalendar
          contributions={playtime.playtime}
          year={year}
          formatTooltip={(minutes, date) => {
            const hours = Math.floor(minutes / 60)
            const mins = minutes % 60
            const timeStr = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`
            return `${timeStr} de jeu le ${new Date(date).toLocaleDateString('fr-FR')}`
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <div className="text-sm text-text-muted">Aucune donnée pour {year}</div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-lg hover:bg-neon-green/20 hover:border-neon-green/50 transition-all font-mono text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            START_TRACKING
          </button>
        </div>
      )}
    </div>
  )
}
