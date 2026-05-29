import type { Icon } from '@phosphor-icons/react'
import { ACCENTS, type Accent } from '@/lib/accents'
import { cn } from '@/lib/utils'

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
  /** Mode « cinéma » : texte clair par-dessus une image de fond assombrie. */
  overlay?: boolean
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
  overlay = false,
}: PageHeaderProps) {
  const c = ACCENTS[color] ?? ACCENTS.moss
  const sub = subtitle ?? loadingMessage

  const displayTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()

  // Dateline éditoriale systématique : si non fournie, mois + année courants.
  const resolvedDateline =
    dateline ?? new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <header className="mb-12">
      {/* Surtitre éditorial : eyebrow (optionnel) + dateline (toujours présente). */}
      <div
        className={cn(
          'flex items-center justify-between mb-6 text-[10px] uppercase tracking-[0.22em] font-mono',
          overlay ? 'text-white/75' : 'text-text-muted',
        )}
      >
        {eyebrow ? (
          <span
            className={cn('inline-flex items-center gap-2', overlay ? 'text-white/90' : c.text)}
          >
            <span className={`inline-block w-6 h-px ${c.ring}`} aria-hidden />
            {eyebrow}
          </span>
        ) : (
          <span aria-hidden className={`inline-block w-6 h-px ${c.ring}`} />
        )}
        <span>{resolvedDateline}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div className="flex items-start gap-4">
          {IconComponent && (
            <div
              className={`gradient-mesh p-3.5 rounded-2xl ${c.border} border shadow-soft mt-1`}
              style={
                {
                  ['--mesh-a' as string]: c.accent,
                  ['--mesh-b' as string]: c.warm,
                  ['--mesh-c' as string]: c.accent,
                } as React.CSSProperties
              }
            >
              <IconComponent size={28} weight="duotone" className={c.text} />
            </div>
          )}
          <div>
            <h1
              className={cn(
                'font-display text-4xl sm:text-5xl font-medium tracking-tight leading-[0.95] [font-optical-sizing:auto]',
                overlay ? 'text-white' : 'text-text-primary',
              )}
            >
              {displayTitle}
            </h1>
            {(sub || status) && (
              <p
                className={cn(
                  'text-sm mt-3 flex items-center gap-2 flex-wrap',
                  overlay ? 'text-white/85' : 'text-text-secondary',
                )}
              >
                {status && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.ring}`} aria-hidden />
                    {status}
                  </span>
                )}
                {status && sub && (
                  <span className={overlay ? 'text-white/55' : 'text-text-muted'}>·</span>
                )}
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
