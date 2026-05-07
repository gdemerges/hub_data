'use client'

import { use, useOptimistic, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { ContributionCalendar } from '@/components'
import { syncSteamAction } from '@/lib/steam-actions'
import type { PlaytimeData } from '@/lib/steam-playtime'

interface Props {
  promise: Promise<PlaytimeData>
  year: number
}

export function SteamPlaytimeSection({ promise, year }: Props) {
  const playtime = use(promise)
  const router = useRouter()
  const [pendingSync, startSyncTransition] = useTransition()
  const [optimisticYear, setOptimisticYear] = useOptimistic(year)

  const currentYear = new Date().getFullYear()
  const prevHref = `/steam?year=${year - 1}`
  const nextHref = `/steam?year=${year + 1}`
  const canGoNext = year < currentYear

  function handleSync() {
    startSyncTransition(async () => {
      const result = await syncSteamAction()
      if (!result.ok) alert('Échec de la synchronisation')
      router.refresh()
    })
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
          <span className="text-xs font-mono text-text-muted">
            {playtime.totalHours}h // {playtime.daysPlayed} jours [{optimisticYear}]
          </span>
          <button
            onClick={handleSync}
            disabled={pendingSync}
            className="flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 hover:border-neon-green/50 text-neon-green rounded text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${pendingSync ? 'animate-spin' : ''}`} />
            <span>SYNC</span>
          </button>
          <div className="flex items-center gap-2">
            <Link
              href={prevHref}
              onClick={() => setOptimisticYear(year - 1)}
              prefetch={false}
              className="p-1 hover:bg-neon-cyan/10 rounded transition-colors"
              aria-label="Année précédente"
            >
              <ChevronLeft className="w-4 h-4 text-neon-cyan" />
            </Link>
            <span className="text-sm font-mono font-medium text-neon-cyan min-w-[4rem] text-center">
              {optimisticYear}
            </span>
            {canGoNext ? (
              <Link
                href={nextHref}
                onClick={() => setOptimisticYear(year + 1)}
                prefetch={false}
                className="p-1 hover:bg-neon-cyan/10 rounded transition-colors"
                aria-label="Année suivante"
              >
                <ChevronRight className="w-4 h-4 text-neon-cyan" />
              </Link>
            ) : (
              <span className="p-1 opacity-50 cursor-not-allowed" aria-label="Année suivante">
                <ChevronRight className="w-4 h-4 text-neon-cyan" />
              </span>
            )}
          </div>
        </div>
      </div>
      {playtime.playtime.length > 0 ? (
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
            disabled={pendingSync}
            className="flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-lg hover:bg-neon-green/20 hover:border-neon-green/50 transition-all font-mono text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${pendingSync ? 'animate-spin' : ''}`} />
            START_TRACKING
          </button>
        </div>
      )}
    </div>
  )
}

export function SteamPlaytimeSkeleton() {
  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
          <Clock className="w-5 h-5 text-neon-cyan" />
        </div>
        <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
          Playtime_Tracker
        </h3>
      </div>
      <div className="h-40 bg-bg-card/50 border border-border-subtle rounded animate-pulse" />
    </div>
  )
}
