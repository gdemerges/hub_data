import { cn } from '@/lib/utils'
import { LucideIcon, ArrowUpRight } from 'lucide-react'
import { MouseGlowCard } from './mouse-glow-card'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  className?: string
  color?: 'cyan' | 'magenta' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'purple'
  href?: string
}

type ColorTokens = {
  text: string
  // Triplets RGB pour --accent / --mesh-* (gradient mesh + glow curseur)
  accent: string
  warm: string
}

const colorTokens: Record<NonNullable<StatCardProps['color']>, ColorTokens> = {
  cyan:    { text: 'text-earth-fern',       accent: '123 168 150', warm: '163 181 152' },
  magenta: { text: 'text-earth-terracotta', accent: '184 107 60',  warm: '217 164 65'  },
  green:   { text: 'text-earth-moss',       accent: '90 125 74',   warm: '138 178 116' },
  yellow:  { text: 'text-earth-saffron',    accent: '217 164 65',  warm: '184 107 60'  },
  orange:  { text: 'text-earth-rust',       accent: '168 85 44',   warm: '217 164 65'  },
  red:     { text: 'text-earth-clay',       accent: '176 104 104', warm: '184 107 60'  },
  blue:    { text: 'text-earth-indigo',     accent: '61 81 112',   warm: '123 168 150' },
  purple:  { text: 'text-earth-sage',       accent: '163 181 152', warm: '90 125 74'   },
}

export function StatCard({ label, value, icon: Icon, className, color = 'cyan', href }: StatCardProps) {
  const tokens = colorTokens[color]

  const styleVars = {
    ['--accent' as string]: tokens.accent,
    ['--mesh-a' as string]: tokens.accent,
    ['--mesh-b' as string]: tokens.warm,
    ['--mesh-c' as string]: tokens.accent,
  } as React.CSSProperties

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
