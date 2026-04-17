'use client'

import Image from 'next/image'
import { X } from 'lucide-react'

interface MediaDetailProps {
  isOpen: boolean
  onClose: () => void
  title: string
  imageUrl?: string
  children: React.ReactNode
}

export function MediaDetail({ isOpen, onClose, title, imageUrl, children }: MediaDetailProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto tech-card animate-slide-up rounded-lg">
        {/* Top neon accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 border border-neon-cyan/30 rounded-lg bg-bg-primary/80 backdrop-blur-sm text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/60 hover:bg-neon-cyan/10 transition-all duration-300"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Poster */}
          <div className="flex-shrink-0 w-full md:w-56">
            {imageUrl ? (
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-neon-magenta/20">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Image overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/40 to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="aspect-[2/3] rounded-lg border border-neon-cyan/20 bg-gradient-to-br from-neon-cyan/5 to-neon-magenta/5 flex items-center justify-center">
                <span className="text-3xl font-display font-bold text-neon-cyan/50 neon-text-subtle">
                  {title.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold tracking-wider uppercase text-text-primary mb-1">
              {title}
            </h2>
            <div className="h-px bg-gradient-to-r from-neon-cyan/40 to-transparent mb-5" />
            {children}
          </div>
        </div>

        {/* Bottom neon accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-magenta to-transparent" />
      </div>
    </div>
  )
}
