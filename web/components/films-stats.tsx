'use client'

import { BarChart3, CalendarDays, Clapperboard, Clock, Film, Star } from 'lucide-react'
import Image from 'next/image'
import { EmptyState } from '@/components/empty-state'
import { PieChart } from '@/components/pie-chart'
import { formatWatchHours } from '@/lib/series-time'
import type { FilmStatsData } from '@/lib/media-stats'

interface FilmsStatsProps {
  stats: FilmStatsData
}

export function FilmsStats({ stats }: FilmsStatsProps) {
  if (stats.totalFilms === 0) {
    return <EmptyState description="Aucun film à analyser." />
  }

  const topMax = Math.max(...stats.topRated.map((f) => f.rating ?? 0), 1)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={<Film className="w-5 h-5" />}
          label="Films"
          value={stats.totalFilms.toLocaleString('fr-FR')}
          sub="vus"
        />
        <Kpi
          icon={<Clock className="w-5 h-5" />}
          label="Visionnage"
          value={formatWatchHours(stats.totalMinutes)}
          sub="au total"
        />
        <Kpi
          icon={<Clapperboard className="w-5 h-5" />}
          label="Durée moyenne"
          value={stats.avgRuntime ? `${Math.round(stats.avgRuntime)} min` : '—'}
          sub="par film"
        />
        <Kpi
          icon={<Star className="w-5 h-5" />}
          label="Note moyenne"
          value={stats.avgRating ? `${stats.avgRating.toFixed(1)}/20` : '—'}
          sub={stats.bestRated ? `Top : ${stats.bestRated.title}` : 'aucune note'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top notes */}
        <Card icon={<Star className="w-5 h-5 text-earth-terracotta" />} title="Top 10 — mieux notés">
          {stats.topRated.length > 0 ? (
            <ol className="space-y-2.5">
              {stats.topRated.map((f, i) => (
                <li key={f.title} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-text-muted tabular-nums">
                    {i + 1}
                  </span>
                  <div className="relative w-8 h-11 shrink-0 overflow-hidden rounded bg-bg-tertiary">
                    {f.posterUrl && (
                      <Image src={f.posterUrl} alt="" fill sizes="32px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">{f.title}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-earth-terracotta"
                        style={{ width: `${((f.rating ?? 0) / topMax) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-text-secondary tabular-nums">
                    {f.rating}/20
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState description="Aucune note renseignée." />
          )}
        </Card>

        {/* Genres */}
        <Card icon={<Film className="w-5 h-5 text-earth-terracotta" />} title="Répartition par genre">
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
        {/* Films vus par année */}
        <Card
          icon={<CalendarDays className="w-5 h-5 text-earth-terracotta" />}
          title="Films vus par année"
        >
          {stats.yearData.length > 0 ? (
            <div className="space-y-3">
              {stats.yearData.map(([year, count]) => (
                <BarRow
                  key={year}
                  label={String(year)}
                  value={`${count} film${count > 1 ? 's' : ''}`}
                  ratio={count / stats.yearMax}
                  color="rgb(var(--dv-5))"
                />
              ))}
            </div>
          ) : (
            <EmptyState description="Aucune date de visionnage." />
          )}
        </Card>

        {/* Décennies */}
        <Card
          icon={<Clock className="w-5 h-5 text-earth-terracotta" />}
          title="Par décennie de sortie"
        >
          {stats.decadeData.length > 0 ? (
            <div className="space-y-3">
              {stats.decadeData.map(([decade, count]) => (
                <BarRow
                  key={decade}
                  label={`${decade}s`}
                  value={`${count} film${count > 1 ? 's' : ''}`}
                  ratio={count / stats.decadeMax}
                  color="rgb(var(--dv-3))"
                />
              ))}
            </div>
          ) : (
            <EmptyState description="Aucune année de sortie." />
          )}
        </Card>
      </div>

      {/* Répartition des notes */}
      <Card icon={<BarChart3 className="w-5 h-5 text-earth-terracotta" />} title="Répartition des notes">
        {stats.ratingData.length > 0 ? (
          <div className="space-y-3">
            {stats.ratingData.map(([note, count]) => (
              <BarRow
                key={note}
                label={`${note}/20`}
                value={`${count} film${count > 1 ? 's' : ''}`}
                ratio={count / stats.ratingMax}
                color="rgb(var(--dv-2))"
              />
            ))}
          </div>
        ) : (
          <EmptyState description="Aucune note renseignée." />
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
      <div className="flex items-center gap-2 text-earth-terracotta">
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
