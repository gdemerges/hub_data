import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type Accent =
  | 'moss'
  | 'fern'
  | 'terracotta'
  | 'rust'
  | 'saffron'
  | 'clay'
  | 'indigo'
  | 'sage'
  | 'leaf'

type AccentTokens = {
  text: string
  border: string
  ring: string
  // Triplets RGB pour le gradient mesh local
  meshA: string
  meshB: string
}

const accentClass: Record<Accent, AccentTokens> = {
  moss:       { text: 'text-earth-moss',       border: 'border-earth-moss/30',       ring: 'bg-earth-moss',       meshA: '90 125 74',   meshB: '138 178 116' },
  fern:       { text: 'text-earth-fern',       border: 'border-earth-fern/30',       ring: 'bg-earth-fern',       meshA: '123 168 150', meshB: '163 181 152' },
  terracotta: { text: 'text-earth-terracotta', border: 'border-earth-terracotta/30', ring: 'bg-earth-terracotta', meshA: '184 107 60',  meshB: '217 164 65'  },
  rust:       { text: 'text-earth-rust',       border: 'border-earth-rust/30',       ring: 'bg-earth-rust',       meshA: '168 85 44',   meshB: '217 164 65'  },
  saffron:    { text: 'text-earth-saffron',    border: 'border-earth-saffron/30',    ring: 'bg-earth-saffron',    meshA: '217 164 65',  meshB: '184 107 60'  },
  clay:       { text: 'text-earth-clay',       border: 'border-earth-clay/30',       ring: 'bg-earth-clay',       meshA: '176 104 104', meshB: '184 107 60'  },
  indigo:     { text: 'text-earth-indigo',     border: 'border-earth-indigo/30',     ring: 'bg-earth-indigo',     meshA: '61 81 112',   meshB: '123 168 150' },
  sage:       { text: 'text-earth-sage',       border: 'border-earth-sage/40',       ring: 'bg-earth-sage',       meshA: '163 181 152', meshB: '90 125 74'   },
  leaf:       { text: 'text-earth-leaf',       border: 'border-earth-leaf/30',       ring: 'bg-earth-leaf',       meshA: '79 140 74',   meshB: '138 178 116' },
}

interface PageHeaderProps {
  title: string
  /** Statut court (ex. "12 jours d'activité") — affiché à côté du titre. */
  status?: string
  /** Sous-titre humain (remplace `loadingMessage`). */
  loadingMessage?: string
  subtitle?: string
  /** Petit label en surtitre, ex. "Section 03" ou "Personnel" */
  eyebrow?: string
  /** Date longue (mois Année), affichée à droite façon éditorial */
  dateline?: string
  color: Accent
  icon?: Icon
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  status,
  subtitle,
  loadingMessage,
  eyebrow,
  dateline,
  color,
  icon: IconComponent,
  actions,
}: PageHeaderProps) {
  const c = accentClass[color] ?? accentClass.moss
  const sub = subtitle ?? loadingMessage

  const displayTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()

  return (
    <header className="mb-12">
      {/* Ligne de surtitre : eyebrow + dateline. Ne s'affiche que si fournie. */}
      {(eyebrow || dateline) && (
        <div className="flex items-center justify-between mb-6 text-[10px] uppercase tracking-[0.22em] text-text-muted font-mono">
          <span className={cn('inline-flex items-center gap-2', c.text)}>
            <span className={`inline-block w-6 h-px ${c.ring}`} aria-hidden />
            {eyebrow ?? '·'}
          </span>
          {dateline && <span>{dateline}</span>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div className="flex items-start gap-4">
          {IconComponent && (
            <div
              className={`gradient-mesh p-3.5 rounded-2xl ${c.border} border shadow-soft mt-1`}
              style={{
                ['--mesh-a' as string]: c.meshA,
                ['--mesh-b' as string]: c.meshB,
                ['--mesh-c' as string]: c.meshA,
              } as React.CSSProperties}
            >
              <IconComponent size={28} weight="duotone" className={c.text} />
            </div>
          )}
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-text-primary leading-[0.95]">
              {displayTitle}
            </h1>
            {(sub || status) && (
              <p className="text-sm text-text-secondary mt-3 flex items-center gap-2 flex-wrap">
                {status && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.ring}`} aria-hidden />
                    {status}
                  </span>
                )}
                {status && sub && <span className="text-text-muted">·</span>}
                {sub && <span>{sub}</span>}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  )
}

