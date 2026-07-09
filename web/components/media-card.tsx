'use client'

import Image from 'next/image'
import type { Accent } from '@/lib/accents'
import { cn, getInitials } from '@/lib/utils'

interface MediaCardProps {
  title: string
  imageUrl?: string
  subtitle?: string
  badge?: string
  progressBadge?: string
  onClick?: () => void
  priority?: boolean
  color?: Accent
  /** Nom de View Transition posé sur le poster (morph vers le détail). */
  transitionName?: string
}

const accent: Record<
  Accent,
  {
    text: string
    border: string
    borderSoft: string
    bg10: string
    badgeText: string
    progressText: string
    progressBorder: string
    progressDot: string
  }
> = {
  moss: {
    text: 'group-hover:text-earth-moss',
    border: 'hover:border-earth-moss/50',
    borderSoft: 'border-earth-moss/40',
    bg10: 'bg-earth-moss/10',
    badgeText: 'text-earth-moss',
    progressText: 'text-earth-moss',
    progressBorder: 'border-earth-moss/30',
    progressDot: 'bg-earth-moss',
  },
  fern: {
    text: 'group-hover:text-earth-fern',
    border: 'hover:border-earth-fern/50',
    borderSoft: 'border-earth-fern/40',
    bg10: 'bg-earth-fern/10',
    badgeText: 'text-earth-fern',
    progressText: 'text-earth-fern',
    progressBorder: 'border-earth-fern/30',
    progressDot: 'bg-earth-fern',
  },
  terracotta: {
    text: 'group-hover:text-earth-terracotta',
    border: 'hover:border-earth-terracotta/50',
    borderSoft: 'border-earth-terracotta/40',
    bg10: 'bg-earth-terracotta/10',
    badgeText: 'text-earth-terracotta',
    progressText: 'text-earth-terracotta',
    progressBorder: 'border-earth-terracotta/30',
    progressDot: 'bg-earth-terracotta',
  },
  rust: {
    text: 'group-hover:text-earth-rust',
    border: 'hover:border-earth-rust/50',
    borderSoft: 'border-earth-rust/40',
    bg10: 'bg-earth-rust/10',
    badgeText: 'text-earth-rust',
    progressText: 'text-earth-rust',
    progressBorder: 'border-earth-rust/30',
    progressDot: 'bg-earth-rust',
  },
  saffron: {
    text: 'group-hover:text-earth-saffron',
    border: 'hover:border-earth-saffron/50',
    borderSoft: 'border-earth-saffron/40',
    bg10: 'bg-earth-saffron/10',
    badgeText: 'text-earth-saffron',
    progressText: 'text-earth-saffron',
    progressBorder: 'border-earth-saffron/30',
    progressDot: 'bg-earth-saffron',
  },
  clay: {
    text: 'group-hover:text-earth-clay',
    border: 'hover:border-earth-clay/50',
    borderSoft: 'border-earth-clay/40',
    bg10: 'bg-earth-clay/10',
    badgeText: 'text-earth-clay',
    progressText: 'text-earth-clay',
    progressBorder: 'border-earth-clay/30',
    progressDot: 'bg-earth-clay',
  },
  indigo: {
    text: 'group-hover:text-earth-indigo',
    border: 'hover:border-earth-indigo/50',
    borderSoft: 'border-earth-indigo/40',
    bg10: 'bg-earth-indigo/10',
    badgeText: 'text-earth-indigo',
    progressText: 'text-earth-indigo',
    progressBorder: 'border-earth-indigo/30',
    progressDot: 'bg-earth-indigo',
  },
  sage: {
    text: 'group-hover:text-earth-sage',
    border: 'hover:border-earth-sage/50',
    borderSoft: 'border-earth-sage/40',
    bg10: 'bg-earth-sage/15',
    badgeText: 'text-earth-sage',
    progressText: 'text-earth-sage',
    progressBorder: 'border-earth-sage/30',
    progressDot: 'bg-earth-sage',
  },
  leaf: {
    text: 'group-hover:text-earth-leaf',
    border: 'hover:border-earth-leaf/50',
    borderSoft: 'border-earth-leaf/40',
    bg10: 'bg-earth-leaf/10',
    badgeText: 'text-earth-leaf',
    progressText: 'text-earth-leaf',
    progressBorder: 'border-earth-leaf/30',
    progressDot: 'bg-earth-leaf',
  },
}

export function MediaCard({
  title,
  imageUrl,
  subtitle,
  badge,
  progressBadge,
  onClick,
  priority = false,
  color = 'fern',
  transitionName,
}: MediaCardProps) {
  const c = accent[color]
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-left overflow-hidden flex flex-col',
        // Hors écran, le navigateur saute le rendu de la carte (grosses grilles
        // de 600+ cartes). `auto` mémorise la taille réelle une fois rendue ;
        // 340px n'est que l'estimation initiale pour le placeholder de scroll.
        '[content-visibility:auto] [contain-intrinsic-size:auto_340px]',
        'bg-bg-card border border-border-subtle rounded-xl',
        'transition-all duration-300 ease-out',
        c.border,
        'hover:-translate-y-0.5 hover:shadow-soft-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
      )}
    >
      <div
        className="relative w-full aspect-[2/3] overflow-hidden bg-bg-tertiary"
        style={transitionName ? { viewTransitionName: transitionName } : undefined}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="!absolute !inset-0 !w-full !h-full object-cover object-center transition-transform duration-500 will-change-transform group-hover:scale-105"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary">
            <span
              className={cn(
                'font-display text-3xl font-medium tracking-tight italic opacity-40',
                c.badgeText,
              )}
            >
              {getInitials(title)}
            </span>
          </div>
        )}

        {/* Voile bas pour la lisibilité d'un overlay éventuel */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-card/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {badge && (
          <div
            className={cn(
              'absolute top-2 right-2 px-2 py-0.5 bg-bg-card/90 backdrop-blur-sm border rounded-full text-[11px] font-medium num',
              c.borderSoft,
              c.badgeText,
            )}
          >
            {badge}
          </div>
        )}

        {progressBadge && (
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-bg-card/90 backdrop-blur-sm border-t text-xs',
              c.progressBorder,
              c.progressText,
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', c.progressDot)} />
              {progressBadge}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-bg-card">
        <h3
          className={cn(
            'font-display text-sm font-medium tracking-tight text-text-primary line-clamp-2 leading-tight transition-colors',
            c.text,
          )}
        >
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-[11px] text-text-muted truncate">{subtitle}</p>}
      </div>
    </button>
  )
}
