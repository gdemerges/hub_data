'use client'

import { useState, useMemo } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { MessageSquare, Activity, Clock, Coins, Cpu, Calendar } from 'lucide-react'
import type { ClaudeStats } from '@/lib/claude'

type ActivityRange = '30d' | '90d' | 'all'

const RANGE_LABELS: Record<ActivityRange, string> = {
  '30d': '30 jours',
  '90d': '90 jours',
  all: 'Tout',
}

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} G`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} k`
  return n.toLocaleString('fr-FR')
}

function formatModelName(m: string): string {
  return m
    .replace(/^claude-/, '')
    .replace(/-\d{8}$/, '')
    .replace(/-/g, ' ')
}

function daysSince(iso?: string): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function ClaudeStatsSection({ stats }: { stats: ClaudeStats }) {
  // Hooks déclarés avant tout return conditionnel (règles des hooks).
  const [range, setRange] = useState<ActivityRange>('30d')
  const lastDays = useMemo(() => {
    const all = stats.dailyActivity ?? []
    if (range === 'all') return all
    const days = range === '30d' ? 30 : 90
    return all.slice(-days)
  }, [stats.dailyActivity, range])

  if (!stats.available) {
    return (
      <div className="tech-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-earth-fern/10 border border-earth-fern/30 rounded">
            <Sparkle className="w-5 h-5 text-earth-fern" />
          </div>
          <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
            Claude Code
          </h3>
        </div>
        <p className="text-sm text-text-muted">
          Aucune donnée locale trouvée (~/.claude/stats-cache.json absent).
        </p>
      </div>
    )
  }

  const dailyMax = Math.max(...lastDays.map(d => d.messageCount), 1)
  const hourMax = Math.max(...stats.hourCounts, 1)
  const since = daysSince(stats.firstSessionDate)
  const rangeMessages = lastDays.reduce((s, d) => s + d.messageCount, 0)

  return (
    <div className="tech-card p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-earth-fern/10 border border-earth-fern/30 rounded">
          <Sparkle className="w-5 h-5 text-earth-fern" />
        </div>
        <div>
          <h3 className="font-display text-base font-medium tracking-tight text-text-primary">
            Claude Code
          </h3>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            Sessions locales · depuis {since} jour{since > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi
          icon={<MessageSquare className="w-5 h-5" />}
          label="Sessions"
          value={stats.totalSessions.toLocaleString('fr-FR')}
          sub={`${stats.totalMessages.toLocaleString('fr-FR')} messages`}
        />
        <Kpi
          icon={<Activity className="w-5 h-5" />}
          label="Tool calls"
          value={stats.totalToolCalls.toLocaleString('fr-FR')}
          sub={`${stats.daysActive} jours actifs`}
        />
        <Kpi
          icon={<Cpu className="w-5 h-5" />}
          label="Tokens output"
          value={formatTokens(stats.totalOutputTokens)}
          sub={`${formatTokens(stats.totalCacheReadTokens)} en cache lu`}
        />
        <Kpi
          icon={<Coins className="w-5 h-5" />}
          label="Coût estimé"
          value={`$${stats.estimatedCostUSD.toFixed(0)}`}
          sub="basé sur tarifs publics"
        />
      </div>

      {/* Daily activity bar chart with toggle */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-earth-fern" />
          <h4 className="text-sm font-semibold text-text-secondary">
            Activité — {RANGE_LABELS[range].toLowerCase()}
          </h4>
          <span className="text-xs font-mono text-text-muted ml-2">
            · {rangeMessages.toLocaleString('fr-FR')} msgs
          </span>
          <div className="ml-auto flex gap-1">
            {(Object.keys(RANGE_LABELS) as ActivityRange[]).map(k => (
              <button
                key={k}
                onClick={() => setRange(k)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-full border transition-all ${
                  range === k
                    ? 'bg-earth-fern/15 text-earth-fern border-earth-fern/40'
                    : 'text-text-muted border-transparent hover:text-text-primary hover:border-border-default'
                }`}
              >
                {RANGE_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 h-28">
          {lastDays.map(d => {
            const h = (d.messageCount / dailyMax) * 100
            return (
              <div
                key={d.date}
                title={`${d.date} · ${d.messageCount} msgs · ${d.sessionCount} session${d.sessionCount > 1 ? 's' : ''}`}
                className="flex-1 flex flex-col justify-end group h-full"
              >
                <div
                  className="rounded-t bg-gradient-to-t from-earth-fern to-earth-terracotta opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{ height: `${h}%` }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-mono text-text-muted">
            {lastDays[0]?.date}
          </span>
          <span className="text-[10px] font-mono text-text-muted">
            {lastDays[lastDays.length - 1]?.date}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hour distribution */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-earth-fern" />
            <h4 className="text-sm font-semibold text-text-secondary">
              Heures de la journée
            </h4>
          </div>
          <div className="flex gap-1 h-20">
            {stats.hourCounts.map((c, h) => (
              <div
                key={h}
                title={`${h}h · ${c} sessions`}
                className="flex-1 flex flex-col justify-end h-full"
              >
                <div
                  className="rounded-t bg-earth-fern/60"
                  style={{ height: `${(c / hourMax) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] font-mono text-text-muted">
            <span>0h</span>
            <span>12h</span>
            <span>23h</span>
          </div>
        </div>

        {/* Top models */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-earth-fern" />
            <h4 className="text-sm font-semibold text-text-secondary">
              Modèles utilisés
            </h4>
          </div>
          <div className="space-y-2.5">
            {stats.modelBreakdown.map(m => {
              const max = stats.modelBreakdown[0]?.outputTokens || 1
              const pct = (m.outputTokens / max) * 100
              return (
                <div key={m.model} className="flex items-center gap-3">
                  <span className="text-xs text-text-primary w-32 truncate">
                    {formatModelName(m.model)}
                  </span>
                  <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-earth-fern to-earth-moss rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-text-secondary w-16 text-right">
                    {formatTokens(m.outputTokens)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {stats.longestSession && (
        <div className="mt-6 pt-4 border-t border-border-subtle text-xs text-text-muted">
          Plus longue session :{' '}
          <span className="text-text-primary font-mono">
            {stats.longestSession.messageCount} messages
          </span>{' '}
          ·{' '}
          <span className="text-text-primary font-mono">
            {stats.longestSession.durationHours.toFixed(1)} h
          </span>
        </div>
      )}
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
    <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-earth-fern/10 text-earth-fern">{icon}</div>
        <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted mt-1">{sub}</p>
    </div>
  )
}
