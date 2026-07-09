'use client'

import type { CSSProperties, ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return <div className="animate-fade-in">{children}</div>
}

export function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const style: CSSProperties = delay
    ? { animationDelay: `${delay}s`, animationFillMode: 'backwards' }
    : {}
  return (
    <div className={`animate-slide-up ${className}`} style={style}>
      {children}
    </div>
  )
}

export function StaggerContainer({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

export function StaggerItem({
  children,
  className = '',
  index = 0,
}: {
  children: ReactNode
  className?: string
  index?: number
}) {
  // Le délai est plafonné : sans cap, une liste de 600 cartes donnerait à la
  // dernière un animationDelay de ~30s pendant lesquelles elle reste à
  // opacity:0 (fillMode backwards + keyframe slideUp qui part de 0). On garde
  // l'effet de cascade sur les premières cartes, puis tout apparaît ensemble.
  const delay = Math.min(index, 12) * 0.05
  return (
    <div
      className={`animate-slide-up ${className}`}
      style={{ animationDelay: `${delay}s`, animationFillMode: 'backwards' } as CSSProperties}
    >
      {children}
    </div>
  )
}
