'use client'

import { useEffect, useState } from 'react'

export interface ApiDataState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** HTTP status of the last response, when available. */
  status: number | null
}

/**
 * Hook for client pages that fetch a single JSON endpoint on mount.
 *
 * Replaces the recurring `useEffect + useState x3 + fetch` pattern.
 * For richer needs (revalidation, dedup), use SWR via `lib/swr-config.tsx`.
 */
export function useApiData<T>(
  url: string,
  opts: { errorMessage?: string } = {}
): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({
    data: null,
    loading: true,
    error: null,
    status: null,
  })

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const response = await fetch(url)
        if (cancelled) return
        if (!response.ok) {
          setState({ data: null, loading: false, error: null, status: response.status })
          return
        }
        const data = (await response.json()) as T
        if (cancelled) return
        setState({ data, loading: false, error: null, status: response.status })
      } catch (e) {
        if (cancelled) return
        const msg = opts.errorMessage ?? (e instanceof Error ? e.message : 'Erreur réseau')
        setState({ data: null, loading: false, error: msg, status: null })
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [url, opts.errorMessage])

  return state
}
