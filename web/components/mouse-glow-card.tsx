'use client'

import Link from 'next/link'
import { useCallback } from 'react'

interface BaseProps {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

type Props =
  | (BaseProps & { href: string })
  | (BaseProps & { href?: undefined })

/**
 * Wrapper client qui pose --mx/--my (en %) sur l'élément au mousemove,
 * pour alimenter le radial highlight des cartes (.tech-card / .tech-card-raised).
 * Pas de state React → pas de re-render.
 */
export function MouseGlowCard({ className, style, children, ...rest }: Props) {
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
  }, [])

  if ('href' in rest && rest.href) {
    return (
      <Link href={rest.href} className={className} style={style} onMouseMove={onMouseMove}>
        {children}
      </Link>
    )
  }

  return (
    <div className={className} style={style} onMouseMove={onMouseMove}>
      {children}
    </div>
  )
}
