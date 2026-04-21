'use client'

import useSWR from 'swr'
import { PageHeader } from '@/components'

type YearStat = { year: number; games: number; films: number; series: number; books: number }

const fetcher = (url: string) => fetch(url).then(r => r.json())

const SECTIONS = [
  { key: 'games', label: 'Jeux', color: '#00ff88' },
  { key: 'films', label: 'Films', color: '#ff00ff' },
  { key: 'series', label: 'Séries', color: '#ffff00' },
  { key: 'books', label: 'Livres', color: '#60a5fa' },
] as const

export default function CorrelationsPage() {
  const { data, isLoading } = useSWR<{ stats: YearStat[]; hasData: boolean }>('/api/correlations', fetcher, {
    dedupingInterval: 60_000,
  })

  const stats = data?.stats ?? []
  const max = stats.reduce((m, s) => Math.max(m, s.games, s.films, s.series, s.books), 0) || 1

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="CORRELATIONS"
        systemName="INSIGHTS"
        statusDetail="CROSS_SECTION_VIEW v1.0"
        loadingMessage="Cross-referencing sections by year..."
        color="neon-cyan"
      />

      {isLoading && (
        <div className="tech-card p-8 text-center text-text-muted font-mono">Chargement...</div>
      )}

      {!isLoading && stats.length === 0 && (
        <div className="tech-card p-8 text-center text-text-muted font-mono">Aucune donnée.</div>
      )}

      {stats.length > 0 && (
        <div className="tech-card p-6 space-y-4">
          <div className="flex gap-4 flex-wrap">
            {SECTIONS.map(s => (
              <div key={s.key} className="flex items-center gap-2 text-xs font-mono">
                <span className="w-3 h-3 rounded" style={{ background: s.color }} />
                <span className="text-text-secondary uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {stats.map(row => (
              <div key={row.year} className="grid grid-cols-[80px_1fr] gap-4 items-center">
                <div className="font-mono text-sm text-neon-cyan font-semibold">{row.year}</div>
                <div className="space-y-1">
                  {SECTIONS.map(s => {
                    const v = row[s.key] as number
                    if (!v) return null
                    const w = (v / max) * 100
                    return (
                      <div key={s.key} className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-bg-tertiary rounded overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{ width: `${w}%`, background: s.color, boxShadow: `0 0 8px ${s.color}80` }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-xs text-text-secondary">{v}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
