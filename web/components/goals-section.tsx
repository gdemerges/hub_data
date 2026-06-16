import { Target } from 'lucide-react'
import Link from 'next/link'
import { ACCENTS } from '@/lib/accents'
import type { GoalProgress } from '@/lib/goals'
import { SectionCard } from './section-card'

interface GoalsSectionProps {
  goals: GoalProgress[]
  year: number
}

export function GoalsSection({ goals, year }: GoalsSectionProps) {
  return (
    <SectionCard title={`Objectifs ${year}`} icon={Target} accent="fern">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {goals.map((goal) => {
          const rgb = ACCENTS[goal.accent].accent
          const reached = goal.current >= goal.target
          return (
            <li key={goal.key}>
              <Link href={goal.href} className="group block">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span
                    className="text-sm font-medium text-text-primary transition-colors group-hover:[color:rgb(var(--g))]"
                    style={{ ['--g' as string]: rgb }}
                  >
                    {goal.label}
                  </span>
                  {goal.undated ? (
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted border border-border-subtle rounded px-1.5 py-0.5 shrink-0"
                      title="SerieBox n'exporte pas de date de fin de visionnage : objectif non mesurable par année."
                    >
                      non daté
                    </span>
                  ) : (
                    <span className="text-xs num text-text-muted shrink-0">
                      <span className="font-semibold" style={{ color: `rgb(${rgb})` }}>
                        {goal.current.toLocaleString('fr-FR')}
                      </span>
                      {' / '}
                      {goal.target.toLocaleString('fr-FR')}
                    </span>
                  )}
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-bg-primary border border-border-subtle">
                  {!goal.undated && (
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${goal.pct}%`,
                        background: reached
                          ? `rgb(${rgb})`
                          : `linear-gradient(to right, rgb(${rgb} / 0.55), rgb(${rgb}))`,
                      }}
                    />
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}
