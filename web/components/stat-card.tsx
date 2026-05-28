import { cn } from '@/lib/utils'
import { LucideIcon, ArrowUpRight } from 'lucide-react'
import { MouseGlowCard } from './mouse-glow-card'
import { ACCENTS, accentMeshVars, type Accent } from '@/lib/accents'
import { Sparkline } from './sparkline'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
  color?: Accent
  href?: string
  /** Série de valeurs pour une mini-tendance sous le chiffre (optionnel). */
  trend?: number[]
}

export function StatCard({ label, value, icon: Icon, className, color = 'fern', href, trend }: StatCardProps) {
  const tokens = ACCENTS[color]

  const styleVars = accentMeshVars(color)

  const cardClasses = cn(
    'tech-card p-6 group block',
    href && 'cursor-pointer',
    className,
  )

  return (
    <MouseGlowCard className={cardClasses} style={styleVars} {...(href ? { href } : {})}>
      <div className="flex items-start justify-between mb-6">
        {Icon && (
          <div className="gradient-mesh w-12 h-12 rounded-2xl flex items-center justify-center border border-border-subtle">
            <Icon className={cn('w-5 h-5', tokens.text)} strokeWidth={1.75} />
          </div>
        )}
        {href && (
          <ArrowUpRight
            className="w-4 h-4 text-text-muted opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300"
            strokeWidth={2}
          />
        )}
      </div>

      <div className={cn('font-display text-5xl font-medium tracking-tight num leading-none', tokens.text)}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </div>

      {trend && trend.length > 1 && (
        <div className="mt-4">
          <Sparkline data={trend} accent={tokens.accent} />
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <span
          className="h-px flex-1 transition-all duration-500 group-hover:flex-[1.4]"
          style={{ background: `linear-gradient(to right, rgb(${tokens.accent} / 0.6), transparent)` }}
          aria-hidden
        />
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted whitespace-nowrap">
          {label}
        </span>
      </div>
    </MouseGlowCard>
  )
}
