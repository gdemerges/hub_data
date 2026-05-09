import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type Accent = 'moss' | 'fern' | 'terracotta' | 'rust' | 'saffron' | 'clay' | 'indigo' | 'sage'

const accent: Record<Accent, { text: string; bg: string; border: string; rgb: string }> = {
  moss:       { text: 'text-earth-moss',       bg: 'bg-earth-moss/10',       border: 'border-earth-moss/30',       rgb: '90 125 74'   },
  fern:       { text: 'text-earth-fern',       bg: 'bg-earth-fern/10',       border: 'border-earth-fern/30',       rgb: '123 168 150' },
  terracotta: { text: 'text-earth-terracotta', bg: 'bg-earth-terracotta/10', border: 'border-earth-terracotta/30', rgb: '184 107 60'  },
  rust:       { text: 'text-earth-rust',       bg: 'bg-earth-rust/10',       border: 'border-earth-rust/30',       rgb: '168 85 44'   },
  saffron:    { text: 'text-earth-saffron',    bg: 'bg-earth-saffron/10',    border: 'border-earth-saffron/30',    rgb: '217 164 65'  },
  clay:       { text: 'text-earth-clay',       bg: 'bg-earth-clay/10',       border: 'border-earth-clay/30',       rgb: '176 104 104' },
  indigo:     { text: 'text-earth-indigo',     bg: 'bg-earth-indigo/10',     border: 'border-earth-indigo/30',     rgb: '61 81 112'   },
  sage:       { text: 'text-earth-sage',       bg: 'bg-earth-sage/15',       border: 'border-earth-sage/40',       rgb: '163 181 152' },
}

interface SectionCardProps {
  title: string
  icon?: LucideIcon
  accent?: Accent
  raised?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Carte de section unifiée. Remplace les en-têtes "FOO_BAR" snake_case
 * par un titre éditorial sobre + ligne d'accent.
 */
export function SectionCard({
  title,
  icon: Icon,
  accent: a = 'moss',
  raised,
  className,
  children,
}: SectionCardProps) {
  const c = accent[a]
  return (
    <section
      className={cn(raised ? 'tech-card-raised' : 'tech-card', 'p-6 mb-8', className)}
      style={{ ['--accent' as string]: c.rgb }}
    >
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className={cn('p-2 rounded-xl border', c.bg, c.border)}>
              <Icon className={cn('w-4 h-4', c.text)} strokeWidth={1.75} />
            </span>
          )}
          <h3 className="font-display text-lg font-medium tracking-tight text-text-primary">
            {title}
          </h3>
        </div>
        <span className={cn('h-px flex-1 ml-6 max-w-[40%]', c.bg)} aria-hidden />
      </header>
      {children}
    </section>
  )
}

interface RankRowProps {
  rank: number
  primary: string
  secondary?: string
  metric: string
  accent?: Accent
}

export function RankRow({ rank, primary, secondary, metric, accent: a = 'moss' }: RankRowProps) {
  const c = accent[a]
  return (
    <li className="group flex items-center gap-4 py-2 px-2 -mx-2 rounded-lg hover:bg-bg-hover/50 transition-colors">
      <span className={cn('font-display text-2xl tracking-tight num leading-none w-8 text-right opacity-50 group-hover:opacity-100 transition-opacity', c.text)}>
        {String(rank).padStart(2, '0')}
      </span>
      <div className="flex-1 flex items-baseline justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <span className={cn('text-sm font-medium text-text-primary truncate transition-colors group-hover:[color:rgb(var(--accent))]')}>
            {primary}
          </span>
          {secondary && (
            <span className="text-xs text-text-muted ml-2">{secondary}</span>
          )}
        </div>
        <span className={cn('text-[11px] uppercase tracking-[0.16em] num shrink-0', c.text)}>
          {metric}
        </span>
      </div>
    </li>
  )
}
