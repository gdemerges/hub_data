'use client'

import { BarChart3, Clock, Film, ListChecks, Radio, Star, Tv } from 'lucide-react'
import Image from 'next/image'
import { useMemo } from 'react'
import { EmptyState } from '@/components/empty-state'
import { PieChart } from '@/components/pie-chart'
import { seriesColor } from '@/lib/chart'
import { formatWatchHours, totalSeriesMinutes } from '@/lib/series-time'
import type { Series } from '@/lib/types'

interface SeriesStatsProps {
  series: Series[]
}

const STATUS_COLORS: Record<string, string> = {
  Terminée: '#5a7d4a',
  'A jour': '#3f6f8f',
  'En cours': '#d9a441',
  'En attente': '#8a8170',
  Abandonnée: '#b06868',
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function SeriesStats({ series }: SeriesStatsProps) {
  const stats = useMemo(() => {
    const totalSeries = series.length
    const totalMinutes = totalSeriesMinutes(series)
    const totalEpisodes = series.reduce((sum, s) => sum + (s.episodesWatched ?? 0), 0)
    const rated = series.filter((s) => s.rating && s.rating > 0)
    const avgRating = avg(rated.map((s) => s.rating as number))
    const mostWatched = [...series].sort((a, b) => (b.watchMinutes ?? 0) - (a.watchMinutes ?? 0))[0]

    // Top 10 par heures de visionnage
    const topWatched = [...series]
      .filter((s) => (s.watchMinutes ?? 0) > 0)
      .sort((a, b) => (b.watchMinutes ?? 0) - (a.watchMinutes ?? 0))
      .slice(0, 10)

    // Répartition par genre (nombre de séries)
    const genreCounts = new Map<string, number>()
    series.forEach((s) => {
      s.genres?.forEach((g) => genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1))
    })
    const genreData = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value], i) => ({ label, value, color: seriesColor(i) }))

    // Répartition par statut
    const statusCounts = new Map<string, number>()
    series.forEach((s) => {
      const key = s.status ?? 'Inconnu'
      statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1)
    })
    const statusData = [...statusCounts.entries()].sort((a, b) => b[1] - a[1])
    const statusTotal = statusData.reduce((sum, [, v]) => sum + v, 0)

    // Heures par décennie de sortie
    const decadeMinutes = new Map<number, number>()
    series.forEach((s) => {
      if (!s.releaseYear || !s.watchMinutes) return
      const decade = Math.floor(s.releaseYear / 10) * 10
      decadeMinutes.set(decade, (decadeMinutes.get(decade) ?? 0) + s.watchMinutes)
    })
    const decadeData = [...decadeMinutes.entries()].sort((a, b) => a[0] - b[0])
    const decadeMax = Math.max(...decadeData.map(([, v]) => v), 1)

    // Top chaînes / plateformes : heures + nombre de séries
    const channelStats = new Map<string, { minutes: number; count: number }>()
    series.forEach((s) => {
      if (!s.channel) return
      const entry = channelStats.get(s.channel) ?? { minutes: 0, count: 0 }
      entry.minutes += s.watchMinutes ?? 0
      entry.count += 1
      channelStats.set(s.channel, entry)
    })
    const channelData = [...channelStats.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count || b.minutes - a.minutes)
      .slice(0, 8)
    const channelMax = Math.max(...channelData.map((c) => c.count), 1)

    return {
      totalSeries,
      totalMinutes,
      totalEpisodes,
      avgRating,
      mostWatched,
      topWatched,
      genreData,
      statusData,
      statusTotal,
      decadeData,
      decadeMax,
      channelData,
      channelMax,
    }
  }, [series])

  if (stats.totalSeries === 0) {
    return <EmptyState description="Aucune série à analyser." />
  }

  const topMax = Math.max(...stats.topWatched.map((s) => s.watchMinutes ?? 0), 1)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={<Tv className="w-5 h-5" />}
          label="Séries"
          value={stats.totalSeries.toLocaleString('fr-FR')}
          sub="suivies"
        />
        <Kpi
          icon={<Clock className="w-5 h-5" />}
          label="Visionnage"
          value={formatWatchHours(stats.totalMinutes)}
          sub="au total"
        />
        <Kpi
          icon={<ListChecks className="w-5 h-5" />}
          label="Épisodes vus"
          value={stats.totalEpisodes.toLocaleString('fr-FR')}
          sub="cumulés"
        />
        <Kpi
          icon={<Star className="w-5 h-5" />}
          label="Note moyenne"
          value={stats.avgRating ? `${stats.avgRating.toFixed(1)}/20` : '—'}
          sub={stats.mostWatched ? `Top : ${stats.mostWatched.title}` : 'aucune note'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top heures */}
        <Card icon={<Clock className="w-5 h-5 text-earth-saffron" />} title="Top 10 — plus vues">
          {stats.topWatched.length > 0 ? (
            <ol className="space-y-2.5">
              {stats.topWatched.map((s, i) => (
                <li key={s.title} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-text-muted tabular-nums">
                    {i + 1}
                  </span>
                  <div className="relative w-8 h-11 shrink-0 overflow-hidden rounded bg-bg-tertiary">
                    {s.posterUrl && (
                      <Image src={s.posterUrl} alt="" fill sizes="32px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">{s.title}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-earth-saffron"
                        style={{ width: `${((s.watchMinutes ?? 0) / topMax) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-text-secondary tabular-nums">
                    {formatWatchHours(s.watchMinutes ?? 0)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState description="Aucune heure de visionnage." />
          )}
        </Card>

        {/* Genres */}
        <Card icon={<Film className="w-5 h-5 text-earth-saffron" />} title="Répartition par genre">
          {stats.genreData.length > 0 ? (
            <div className="flex justify-center">
              <PieChart data={stats.genreData} size={280} unit="" />
            </div>
          ) : (
            <EmptyState description="Aucun genre renseigné." />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut */}
        <Card icon={<BarChart3 className="w-5 h-5 text-earth-saffron" />} title="Par statut">
          <div className="space-y-3">
            {stats.statusData.map(([label, value]) => (
              <BarRow
                key={label}
                label={label}
                value={`${value} (${Math.round((value / stats.statusTotal) * 100)}%)`}
                ratio={value / stats.statusTotal}
                color={STATUS_COLORS[label] ?? '#8a8170'}
              />
            ))}
          </div>
        </Card>

        {/* Décennies */}
        <Card icon={<Clock className="w-5 h-5 text-earth-saffron" />} title="Heures par décennie">
          {stats.decadeData.length > 0 ? (
            <div className="space-y-3">
              {stats.decadeData.map(([decade, minutes]) => (
                <BarRow
                  key={decade}
                  label={`${decade}s`}
                  value={formatWatchHours(minutes)}
                  ratio={minutes / stats.decadeMax}
                  color="rgb(var(--dv-3))"
                />
              ))}
            </div>
          ) : (
            <EmptyState description="Aucune année de sortie." />
          )}
        </Card>
      </div>

      {/* Top chaînes / plateformes */}
      <Card
        icon={<Radio className="w-5 h-5 text-earth-saffron" />}
        title="Top chaînes / plateformes"
      >
        {stats.channelData.length > 0 ? (
          <div className="space-y-3">
            {stats.channelData.map((c) => (
              <BarRow
                key={c.name}
                label={c.name}
                value={`${c.count} série${c.count > 1 ? 's' : ''}`}
                ratio={c.count / stats.channelMax}
                color="rgb(var(--dv-5))"
              />
            ))}
          </div>
        ) : (
          <EmptyState description="Aucune chaîne renseignée." />
        )}
      </Card>
    </div>
  )
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-4">
      <div className="flex items-center gap-2 text-earth-saffron">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl text-text-primary tabular-nums">{value}</p>
      <p className="mt-0.5 truncate text-xs text-text-muted">{sub}</p>
    </div>
  )
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function BarRow({
  label,
  value,
  ratio,
  color,
}: {
  label: string
  value: string
  ratio: number
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text-primary">{label}</span>
        <span className="text-text-muted tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(ratio * 100, 2)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
