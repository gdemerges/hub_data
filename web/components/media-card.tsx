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
        'group relative w-full text-left bg-bg-card border border-border-subtle rounded-2xl overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:border-accent-primary hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(99,102,241,0.15)]',
        'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary'
      )}
    >
      {/* Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-bg-tertiary">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary">
            <span className="text-2xl font-bold text-text-muted tracking-wider">
              {getInitials(title)}
            </span>
          </div>
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute top-2 right-2 px-2.5 py-1 bg-accent-primary text-white text-xs font-semibold rounded-md backdrop-blur-sm">
            {badge}
          </div>
        )}

        {/* Progress Badge for series */}
        {progressBadge && (
          <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-md backdrop-blur-sm">
            {progressBadge}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-text-muted truncate">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  )
}
