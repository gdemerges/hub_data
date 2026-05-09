'use client'

import { use } from 'react'
import { BarChart } from '@/components'
import { TrendingUp } from 'lucide-react'
import type { YearlyContributionsData } from '@/lib/github'

interface Props {
  promise: Promise<YearlyContributionsData | null>
}

export function GitHubYearlySection({ promise }: Props) {
  const data = use(promise)

  return (
    <div className="tech-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-earth-saffron/10 border border-earth-saffron/30 rounded">
          <TrendingUp className="w-5 h-5 text-earth-saffron" />
        </div>
        <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
          Yearly_Evolution
        </h3>
      </div>
      {data && data.yearlyContributions.length > 0 ? (
        <YearlyChart data={data} />
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-text-muted">Aucune donnée disponible</div>
        </div>
      )}
    </div>
  )
}

function YearlyChart({ data }: { data: YearlyContributionsData }) {
  const filtered = data.yearlyContributions.filter((y) => y.year >= 2022)
  const total = filtered.reduce((acc, y) => acc + y.contributions, 0)
  return (
    <>
      <p className="text-xs font-mono text-text-muted mb-6">
        {total.toLocaleString('fr-FR')} commits // {filtered.length} years
      </p>
      <BarChart data={filtered} />
    </>
  )
}

export function GitHubYearlySkeleton() {
  return (
    <div className="tech-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-earth-saffron/10 border border-earth-saffron/30 rounded">
          <TrendingUp className="w-5 h-5 text-earth-saffron" />
        </div>
        <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
          Yearly_Evolution
        </h3>
      </div>
      <div className="h-64 bg-bg-card/50 border border-border-subtle rounded animate-pulse" />
    </div>
  )
}
