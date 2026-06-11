'use client'

import { useEffect, useRef, useState } from 'react'

// Easing ease-out cubic : démarre vite, atterrit en douceur.
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

// Valeur affichée à un instant donné du count-up (pure, testable).
export function countUpValue(target: number, elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0 || elapsedMs >= durationMs) return target
  if (elapsedMs <= 0) return 0
  return Math.round(target * easeOutCubic(elapsedMs / durationMs))
}

// Compte de 0 à target en durationMs via requestAnimationFrame.
// prefers-reduced-motion → valeur finale immédiate, sans animation.
export function useCountUp(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || target === 0) {
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const v = countUpValue(target, now - start, durationMs)
      setValue(v)
      if (v !== target) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, durationMs])

  return value
}
