'use client'

import { GithubLogo, Leaf } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function Footer() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const time = now ? now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'
  const date = now
    ? now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <footer className="border-t border-border-subtle mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-text-secondary hover:text-earth-moss transition-colors"
        >
          <Leaf size={16} weight="duotone" className="text-earth-moss" />
          <span className="font-display text-sm tracking-tight">Hub Life</span>
        </Link>

        <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-text-muted font-mono">
          <span suppressHydrationWarning>{date}</span>
          <span aria-hidden>·</span>
          <span className="num" suppressHydrationWarning>
            {time}
          </span>
        </div>

        <a
          href="https://github.com/gdemerges/hub_data"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-earth-moss transition-colors"
        >
          <GithubLogo size={14} weight="duotone" />
          <span>Source</span>
        </a>
      </div>
    </footer>
  )
}
