'use client'

import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

interface MediaCardProps {
  title: string
  imageUrl?: string
  subtitle?: string
  badge?: string
  progressBadge?: string
  onClick?: () => void
  priority?: boolean
}

export function MediaCard({ title, imageUrl, subtitle, badge, progressBadge, onClick, priority = false }: MediaCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-left overflow-hidden',
        'bg-bg-card border border-border-subtle rounded-lg',
        'transition-all duration-300 ease-out',
        'hover:border-neon-cyan/50 hover:-translate-y-1',
        'hover:shadow-[0_0_20px_rgba(0,255,255,0.15)]',
        'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:ring-offset-2 focus:ring-offset-bg-primary'
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-cyan/40 rounded-tl-lg transition-all group-hover:border-neon-cyan group-hover:w-6 group-hover:h-6" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-magenta/40 rounded-br-lg transition-all group-hover:border-neon-magenta group-hover:w-6 group-hover:h-6" />

      {/* Image */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-bg-tertiary">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="!absolute !inset-0 !w-full !h-full object-cover transition-transform duration-500 group-hover:scale-110"
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              style={{ objectFit: 'cover', objectPosition: 'center center' }}
            />
            {/* Scan line effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/10 via-transparent to-neon-magenta/10" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary">
            <span className="text-2xl font-display font-bold text-neon-cyan/50 tracking-wider">
              {getInitials(title)}
            </span>
          </div>
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-bg-primary/90 backdrop-blur-sm border border-neon-cyan/50 text-neon-cyan text-xs font-mono font-bold rounded">
            <span className="drop-shadow-[0_0_4px_currentColor]">{badge}</span>
          </div>
        )}

        {/* Progress Badge for series */}
        {progressBadge && (
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-bg-primary/90 backdrop-blur-sm border-t border-neon-green/30 text-neon-green text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
              {progressBadge}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-bg-card">
        <h3 className="text-sm font-medium text-text-primary line-clamp-2 leading-tight group-hover:text-neon-cyan transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs font-mono text-text-muted truncate">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  )
}
