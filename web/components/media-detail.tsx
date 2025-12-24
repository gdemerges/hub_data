'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-bg-secondary border border-border-subtle rounded-2xl shadow-2xl animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-bg-tertiary/80 backdrop-blur-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Poster */}
          <div className="flex-shrink-0 w-full md:w-64">
            {imageUrl ? (
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-[2/3] rounded-xl bg-gradient-to-br from-bg-tertiary to-bg-card flex items-center justify-center">
                <span className="text-4xl font-bold text-text-muted">
                  {title.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-text-primary mb-4">{title}</h2>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
