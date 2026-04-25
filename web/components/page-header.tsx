import type { Icon } from '@phosphor-icons/react'

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

const accentClass: Record<Accent, { text: string; bg: string; border: string; ring: string }> = {
  moss:       { text: 'text-earth-moss',       bg: 'bg-earth-moss/10',       border: 'border-earth-moss/30',       ring: 'bg-earth-moss' },
  fern:       { text: 'text-earth-fern',       bg: 'bg-earth-fern/10',       border: 'border-earth-fern/30',       ring: 'bg-earth-fern' },
  terracotta: { text: 'text-earth-terracotta', bg: 'bg-earth-terracotta/10', border: 'border-earth-terracotta/30', ring: 'bg-earth-terracotta' },
  rust:       { text: 'text-earth-rust',       bg: 'bg-earth-rust/10',       border: 'border-earth-rust/30',       ring: 'bg-earth-rust' },
  saffron:    { text: 'text-earth-saffron',    bg: 'bg-earth-saffron/10',    border: 'border-earth-saffron/30',    ring: 'bg-earth-saffron' },
  clay:       { text: 'text-earth-clay',       bg: 'bg-earth-clay/10',       border: 'border-earth-clay/30',       ring: 'bg-earth-clay' },
  indigo:     { text: 'text-earth-indigo',     bg: 'bg-earth-indigo/10',     border: 'border-earth-indigo/30',     ring: 'bg-earth-indigo' },
  sage:       { text: 'text-earth-sage',       bg: 'bg-earth-sage/15',       border: 'border-earth-sage/40',       ring: 'bg-earth-sage' },
  leaf:       { text: 'text-earth-leaf',       bg: 'bg-earth-leaf/10',       border: 'border-earth-leaf/30',       ring: 'bg-earth-leaf' },
}

// Map des anciens noms (compat : pages encore en `color="neon-cyan"` etc.)
const legacyMap: Record<string, Accent> = {
  'neon-cyan': 'fern',
  'neon-magenta': 'terracotta',
  'neon-green': 'moss',
  'neon-yellow': 'saffron',
  'neon-orange': 'rust',
  'neon-red': 'clay',
  'purple-400': 'indigo',
  'blue-400': 'indigo',
}

interface PageHeaderProps {
  title: string
  /** Anciennement `systemName`, ignoré dans le nouveau design. */
  systemName?: string
  /** Anciennement `statusDetail`, ignoré. */
  statusDetail?: string
  /** Statut court (ex. "12 jours d'activité") — affiché à côté du titre. */
  status?: string
  /** Sous-titre humain (remplace `loadingMessage`). */
  loadingMessage?: string
  subtitle?: string
  color: Accent | keyof typeof legacyMap
  icon?: Icon
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  status,
  subtitle,
  loadingMessage,
  color,
  icon: IconComponent,
  actions,
}: PageHeaderProps) {
  const accent = (legacyMap[color as keyof typeof legacyMap] ?? color) as Accent
  const c = accentClass[accent] ?? accentClass.moss
  const sub = subtitle ?? loadingMessage

  // Titre humain : "GAMES" → "Games", "STRAVA" → "Strava"
  const displayTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()

  return (
    <header className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {IconComponent && (
            <div className={`p-3 rounded-2xl ${c.bg} ${c.border} border`}>
              <IconComponent size={28} weight="duotone" className={c.text} />
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-text-primary">
              {displayTitle}
            </h1>
            {(sub || status) && (
              <p className="text-sm text-text-secondary mt-1 flex items-center gap-2 flex-wrap">
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
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
