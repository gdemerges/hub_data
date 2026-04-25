'use client'

import { useEffect } from 'react'
import { Warning, ArrowsClockwise } from '@phosphor-icons/react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[route-error]', error)
  }, [error])

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="tech-card p-8 text-center">
        <Warning size={40} weight="duotone" className="text-earth-clay mx-auto mb-4" />
        <h2 className="font-display text-xl font-medium tracking-tight text-text-primary mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Cette section n'a pas pu se charger. Les autres restent disponibles.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-text-muted mb-6 opacity-60">
            digest: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="btn-secondary"
        >
          <ArrowsClockwise size={16} />
          Réessayer
        </button>
      </div>
    </div>
  )
}
