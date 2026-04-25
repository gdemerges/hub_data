'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

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
      <div className="tech-card p-8 border-neon-red/30 text-center">
        <AlertTriangle className="w-10 h-10 text-neon-red/70 mx-auto mb-4" />
        <h2 className="text-lg font-display font-bold tracking-wider text-text-primary mb-2">
          SECTION_OFFLINE
        </h2>
        <p className="text-sm font-mono text-text-muted mb-6">
          Cette section a rencontré une erreur. Les autres sections restent disponibles.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-text-muted mb-6 opacity-60">
            digest: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-sm hover:bg-neon-cyan/20 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  )
}
