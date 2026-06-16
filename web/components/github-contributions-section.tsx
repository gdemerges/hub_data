'use client'

import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { startTransition, use, useOptimistic } from 'react'
import { ContributionCalendar } from '@/components'
import type { ContributionsData } from '@/lib/github'

interface Props {
  promise: Promise<ContributionsData | null>
  year: number
}

export function GitHubContributionsSection({ promise, year }: Props) {
  const data = use(promise)
  const [optimisticYear, setOptimisticYear] = useOptimistic(year)
  const currentYear = new Date().getFullYear()
  const canGoNext = year < currentYear

  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-earth-moss/10 border border-earth-moss/30 rounded">
            <Activity className="w-5 h-5 text-earth-moss" />
          </div>
          <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
            Calendrier de contributions
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data && (
            <span className="text-xs font-mono text-text-muted">
              {data.totalContributions} commits // [{optimisticYear}]
            </span>
          )}
          <div className="flex items-center gap-2">
            <Link
              href={`/github?year=${year - 1}`}
              onClick={() => startTransition(() => setOptimisticYear(year - 1))}
              prefetch={false}
              scroll={false}
              className="p-1 hover:bg-earth-moss/10 rounded transition-colors"
              aria-label="Année précédente"
            >
              <ChevronLeft className="w-4 h-4 text-earth-moss" />
            </Link>
            <span className="text-sm font-mono font-medium text-earth-moss min-w-[4rem] text-center">
              {optimisticYear}
            </span>
            {canGoNext ? (
              <Link
                href={`/github?year=${year + 1}`}
                onClick={() => startTransition(() => setOptimisticYear(year + 1))}
                prefetch={false}
                scroll={false}
                className="p-1 hover:bg-earth-moss/10 rounded transition-colors"
                aria-label="Année suivante"
              >
                <ChevronRight className="w-4 h-4 text-earth-moss" />
              </Link>
            ) : (
              <span className="p-1 opacity-50 cursor-not-allowed" aria-label="Année suivante">
                <ChevronRight className="w-4 h-4 text-earth-moss" />
              </span>
            )}
          </div>
        </div>
      </div>
      {data && data.contributions.length > 0 ? (
        <ContributionCalendar contributions={data.contributions} year={year} />
      ) : (
        <div className="flex items-center justify-center h-40">
          <div className="text-sm text-text-muted">Aucune contribution disponible</div>
        </div>
      )}
    </div>
  )
}

export function GitHubContributionsSkeleton() {
  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-earth-moss/10 border border-earth-moss/30 rounded">
          <Activity className="w-5 h-5 text-earth-moss" />
        </div>
        <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
          Calendrier de contributions
        </h3>
      </div>
      <div className="h-40 bg-bg-card/50 border border-border-subtle rounded animate-pulse" />
    </div>
  )
}
