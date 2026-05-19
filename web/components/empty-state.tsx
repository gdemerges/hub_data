import type { Icon } from '@phosphor-icons/react'
import { TreeEvergreen } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** Message principal — court, humain. */
  title?: string
  /** Précision optionnelle sous le titre. */
  description?: string
  icon?: Icon
  /** `inline` : transparent, pour l'intérieur d'une carte/chart.
   *  `card` : rend sa propre tech-card-flat. */
  variant?: 'inline' | 'card'
  className?: string
}

export function EmptyState({
  title = 'Aucune donnée',
  description,
  icon: IconComponent = TreeEvergreen,
  variant = 'inline',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center gap-3 px-6 py-10',
        variant === 'card' && 'tech-card-flat',
        className
      )}
    >
      <div className="gradient-mesh p-3 rounded-2xl border border-border-subtle shadow-soft">
        <IconComponent size={24} weight="duotone" className="text-text-muted" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        {description && (
          <p className="text-xs text-text-muted max-w-[28ch] mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
