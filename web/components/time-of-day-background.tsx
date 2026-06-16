'use client'

import { useEffect, useState } from 'react'

// Solarpunk palette tuned per period of day. Each entry is a 3-stop radial mesh
// applied behind the page content; transitions cross-fade smoothly when the
// hour rolls over.
const PERIODS = [
  { name: 'night', start: 0, end: 5, a: '#1d2a1c', b: '#3d5170', c: '#1d2a1c' },
  { name: 'dawn', start: 5, end: 8, a: '#d9a441', b: '#b86b3c', c: '#7ba896' },
  { name: 'morning', start: 8, end: 12, a: '#f5efe2', b: '#a3b598', c: '#d9a441' },
  { name: 'noon', start: 12, end: 16, a: '#fffdf7', b: '#8ab274', c: '#a3b598' },
  { name: 'afternoon', start: 16, end: 19, a: '#d9a441', b: '#a3b598', c: '#b86b3c' },
  { name: 'sunset', start: 19, end: 21, a: '#a8552c', b: '#8e3a3a', c: '#3d5170' },
  { name: 'dusk', start: 21, end: 24, a: '#3f5a35', b: '#3d5170', c: '#1d2a1c' },
]

function periodForHour(h: number): (typeof PERIODS)[number] {
  return PERIODS.find((p) => h >= p.start && h < p.end) ?? PERIODS[0]
}

export function TimeOfDayBackground() {
  // SSR-safe: start with a neutral period and refresh client-side, refreshing
  // every 5 minutes so the gradient drifts through the day without reloads.
  const [hour, setHour] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setHour(new Date().getHours())
    tick()
    const id = setInterval(tick, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const p = periodForHour(hour ?? 12)

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 transition-[background] duration-[2000ms] ease-out"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, ${p.a}55 0%, transparent 55%),
          radial-gradient(ellipse at 90% 30%, ${p.b}3a 0%, transparent 55%),
          radial-gradient(ellipse at 50% 100%, ${p.c}2a 0%, transparent 60%)
        `,
      }}
    >
      {/* Subtle grain via SVG noise — not animated, just adds texture */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="hub-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hub-grain)" />
      </svg>
    </div>
  )
}
