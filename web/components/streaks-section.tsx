import { Flame } from 'lucide-react'
import { ACCENTS, type Accent } from '@/lib/accents'
import type { ActivitySource } from '@/lib/activity'
import type { StreaksResult } from '@/lib/streaks'
import { SectionCard } from './section-card'

interface StreaksSectionProps {
  streaks: StreaksResult
}

const SOURCE_ACCENT: Record<ActivitySource, Accent> = {
  films: 'terracotta',
  games: 'moss',
  books: 'indigo',
  sport: 'rust',
  github: 'fern',
  claude: 'leaf',
}

function dayLabel(n: number): string {
  return n > 1 ? `${n} jours` : `${n} jour`
}

export function StreaksSection({ streaks }: StreaksSectionProps) {
  const { combined, bySource } = streaks
  // On ne garde que les sources qui ont déjà connu une série (sinon bruit).
  const active = bySource
    .filter((s) => s.longest > 0)
    .sort((a, b) => b.current - a.current || b.longest - a.longest)

  const combinedRgb = ACCENTS.fern.accent

  return (
    <SectionCard title="Séries en cours" icon={Flame} accent="rust">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Flame
            className="w-9 h-9 shrink-0"
            style={{ color: `rgb(${combinedRgb})` }}
            strokeWidth={1.75}
          />
          <div>
            <p
              className="font-display text-4xl font-medium tracking-tight num leading-none"
              style={{ color: `rgb(${combinedRgb})` }}
            >
              {combined.current}
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted mt-1">
              Jours actifs d&apos;affilée
            </p>
          </div>
        </div>
        <span className="text-xs text-text-muted sm:ml-auto">
          Record : {dayLabel(combined.longest)}
        </span>
      </div>

      {active.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {active.map((s) => {
            const rgb = ACCENTS[SOURCE_ACCENT[s.source]].accent
            return (
              <li
                key={s.source}
                className="rounded-xl border border-border-subtle bg-bg-primary px-3 py-2.5"
              >
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="font-display text-2xl font-medium num leading-none"
                    style={{ color: `rgb(${rgb})` }}
                  >
                    {s.current}
                  </span>
                  <span className="text-[10px] text-text-muted">/ {s.longest} max</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-1 truncate">{s.label}</p>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
