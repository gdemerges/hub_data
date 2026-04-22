'use client'

import { ReactNode, CSSProperties } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="animate-fade-in">
      {children}
    </div>
  )
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
  return (
    <div
      className={`animate-slide-up ${className}`}
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' } as CSSProperties}
    >
      {children}
    </div>
  )
}
