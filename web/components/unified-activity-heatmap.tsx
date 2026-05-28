'use client'

import { useMemo, useState } from 'react'
import {
  Film,
  Gamepad2,
  Book,
  Activity,
  Github,
  Sparkles,
} from 'lucide-react'
import type { ActivitySource, UnifiedActivity } from '@/lib/activity'

interface Props {
  data: UnifiedActivity
}

type SourceMeta = {
  key: ActivitySource
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  // Tailwind text class for the active "tab" colour, plus an HSL-ish hex for cells.
  text: string
  hex: string
}

const SOURCES: SourceMeta[] = [
  { key: 'films', label: 'Films', icon: Film, text: 'text-earth-terracotta', hex: '#b86b3c' },
  { key: 'games', label: 'Jeux', icon: Gamepad2, text: 'text-earth-moss', hex: '#5a7d4a' },
  { key: 'books', label: 'Lecture', icon: Book, text: 'text-earth-indigo', hex: '#3d5170' },
  { key: 'sport', label: 'Sport', icon: Activity, text: 'text-earth-rust', hex: '#a8552c' },
  { key: 'github', label: 'GitHub', icon: Github, text: 'text-earth-fern', hex: '#7ba896' },
  { key: 'claude', label: 'Claude', icon: Sparkles, text: 'text-earth-leaf', hex: '#4f8c4a' },
]

function buildDateGrid(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function intensity(value: number, max: number): number {
  if (!value) return 0
  if (max <= 0) return 0
  // 4 levels (1..4) in non-linear ramp so that even small counts pop.
  const ratio = value / max
  if (ratio > 0.66) return 4
  if (ratio > 0.33) return 3
  if (ratio > 0.1) return 2
  return 1
}

function formatLongDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]
const DAY_LABELS = ['Lun', '', 'Mer', '', 'Ven', '', '']

export function UnifiedActivityHeatmap({ data }: Props) {
  const [active, setActive] = useState<ActivitySource>('films')

  const meta = SOURCES.find(s => s.key === active)!
  const source = data.sources.find(s => s.source === active)
  const byDate = source?.byDate ?? {}
  const total = source?.total ?? 0

  // Build columns aligned on Monday → Sunday, padding the first column with
  // empty cells so day-of-week stays consistent.
  const { columns, monthHeaders, max } = useMemo(() => {
    const dates = buildDateGrid(data.startDate, data.endDate)

    // Convert JS getDay() (Sun=0..Sat=6) to Mon=0..Sun=6.
    const dowMonFirst = (d: Date) => (d.getDay() + 6) % 7

    const cols: (string | null)[][] = []
    let current: (string | null)[] = []

    // Start: pad to align on Monday for first week
    const firstDow = dowMonFirst(new Date(dates[0] + 'T00:00:00'))
    for (let i = 0; i < firstDow; i++) current.push(null)

    for (const d of dates) {
      current.push(d)
      if (current.length === 7) {
        cols.push(current)
        current = []
      }
    }
    if (current.length) {
      while (current.length < 7) current.push(null)
      cols.push(current)
    }

    // Month label per column: show label when the first valid date of the
    // column is in the first week of a new month (avoids duplicates).
    const headers: { col: number; label: string }[] = []
    let prevMonth = -1
    cols.forEach((col, i) => {
      const firstDate = col.find(d => d !== null) as string | undefined
      if (!firstDate) return
      const m = parseInt(firstDate.slice(5, 7), 10) - 1
      if (m !== prevMonth && parseInt(firstDate.slice(8, 10), 10) <= 7) {
        headers.push({ col: i, label: MONTH_LABELS[m] })
        prevMonth = m
      }
    })

    const max = Math.max(...Object.values(byDate), 1)
    return { columns: cols, monthHeaders: headers, max }
  }, [data.startDate, data.endDate, byDate])

  const Icon = meta.icon

  return (
    <div className="tech-card p-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className={`p-2 bg-bg-card border border-border-subtle rounded-lg ${meta.text}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
            Activité 365 jours
          </h3>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            {total.toLocaleString('fr-FR')} {meta.label.toLowerCase()} · toutes sources cumulables
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          {SOURCES.map(s => {
            const isActive = s.key === active
            const SIcon = s.icon
            const count =
              data.sources.find(d => d.source === s.key)?.total ?? 0
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-full border transition-all ${
                  isActive
                    ? `${s.text} bg-bg-card border-current`
                    : 'text-text-muted border-transparent hover:text-text-primary hover:border-border-default'
                }`}
                title={`${s.label} · ${count}`}
              >
                <SIcon className="w-3 h-3" />
                {s.label}
                {count > 0 && (
                  <span className="text-[9px] opacity-70">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div
        className="overflow-x-auto"
        role="img"
        aria-label={`Heatmap d'activité sur 365 jours : ${total.toLocaleString('fr-FR')} ${meta.label.toLowerCase()} au total`}
      >
        <div className="inline-flex flex-col gap-1 min-w-full">
          {/* Month labels */}
          <div className="flex pl-8 gap-[3px] relative h-3 text-[10px] font-mono text-text-muted">
            {columns.map((_, i) => {
              const h = monthHeaders.find(x => x.col === i)
              return (
                <span
                  key={i}
                  className="w-[11px] flex-shrink-0"
                  style={{ position: 'relative' }}
                >
                  {h && <span className="absolute left-0 whitespace-nowrap">{h.label}</span>}
                </span>
              )
            })}
          </div>

          <div className="flex gap-[3px]">
            {/* Day-of-week labels (left) */}
            <div className="flex flex-col gap-[3px] pr-2">
              {DAY_LABELS.map((d, i) => (
                <span
                  key={i}
                  className="h-[11px] w-6 text-[9px] font-mono text-text-muted flex items-center"
                >
                  {d}
                </span>
              ))}
            </div>

            {columns.map((col, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {col.map((date, j) => {
                  if (!date) {
                    return (
                      <div
                        key={j}
                        className="w-[11px] h-[11px] rounded-sm"
                      />
                    )
                  }
                  const v = byDate[date] ?? 0
                  const lvl = intensity(v, max)
                  const opacity = lvl === 0 ? 0 : 0.2 + (lvl / 4) * 0.8
                  const tooltip =
                    v === 0
                      ? `${formatLongDate(date)} · aucune`
                      : `${formatLongDate(date)} · ${v} ${meta.label.toLowerCase()}`
                  return (
                    <div
                      key={j}
                      title={tooltip}
                      className="w-[11px] h-[11px] rounded-sm border border-border-subtle/40"
                      style={{
                        background:
                          v === 0
                            ? 'transparent'
                            : `${meta.hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-text-muted">
            <span>Moins</span>
            {[1, 2, 3, 4].map(lvl => (
              <div
                key={lvl}
                className="w-[11px] h-[11px] rounded-sm border border-border-subtle/40"
                style={{
                  background: `${meta.hex}${Math.round((0.2 + (lvl / 4) * 0.8) * 255)
                    .toString(16)
                    .padStart(2, '0')}`,
                }}
              />
            ))}
            <span>Plus</span>
          </div>
        </div>
      </div>
    </div>
  )
}
