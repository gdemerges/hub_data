'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type Kind = 'nav' | 'games' | 'films' | 'series' | 'books'

type SearchItem = {
  id: string
  title: string
  section: Exclude<Kind, 'nav'>
  href: string
  subtitle?: string
  year?: number
}

type Result = {
  id: string
  title: string
  kind: Kind
  href: string
  subtitle?: string
  year?: number
}

const KIND_COLORS: Record<Kind, string> = {
  nav: 'text-earth-fern',
  games: 'text-earth-moss',
  films: 'text-earth-terracotta',
  series: 'text-earth-saffron',
  books: 'text-earth-indigo',
}

const KIND_LABELS: Record<Kind, string> = {
  nav: 'Aller à',
  games: 'Jeux',
  films: 'Films',
  series: 'Séries',
  books: 'Livres',
}

/** Commandes de navigation — la palette devient un navigateur d'application. */
const NAV_COMMANDS: Result[] = [
  { id: 'nav-overview', title: 'Aperçu', kind: 'nav', href: '/' },
  { id: 'nav-insights', title: 'Insights', kind: 'nav', href: '/insights' },
  { id: 'nav-games', title: 'Jeux', kind: 'nav', href: '/games' },
  { id: 'nav-films', title: 'Films', kind: 'nav', href: '/films' },
  { id: 'nav-series', title: 'Séries', kind: 'nav', href: '/series' },
  { id: 'nav-books', title: 'Lecture', kind: 'nav', href: '/books' },
  { id: 'nav-spotify', title: 'Musique', kind: 'nav', href: '/spotify' },
  { id: 'nav-sport', title: 'Sport', kind: 'nav', href: '/sport' },
  { id: 'nav-voyages', title: 'Voyages', kind: 'nav', href: '/voyages' },
  { id: 'nav-rencontres', title: 'Rencontres', kind: 'nav', href: '/rencontres' },
  { id: 'nav-github', title: 'Dev / GitHub', kind: 'nav', href: '/github' },
  { id: 'nav-steam', title: 'Steam', kind: 'nav', href: '/steam' },
]

function fuzzyScore(query: string, title: string): number {
  const q = query.toLowerCase()
  const t = title.toLowerCase()
  if (t === q) return 1000
  if (t.startsWith(q)) return 500 - (t.length - q.length)
  const idx = t.indexOf(q)
  if (idx >= 0) return 200 - idx
  // subsequence match
  let ti = 0
  for (const c of q) {
    const found = t.indexOf(c, ti)
    if (found < 0) return -1
    ti = found + 1
  }
  return 50 - (t.length - q.length)
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SearchItem[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    // Déclencheur explicite (boutons nav, y compris mobile) sans simuler ⌘K.
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('command-palette:open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('command-palette:open', onOpen)
    }
  }, [])

  useEffect(() => {
    if (!open || items.length > 0) return
    fetch('/api/search')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]))
  }, [open, items.length])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    const media: Result[] = items.map(it => ({
      id: it.id,
      title: it.title,
      kind: it.section,
      href: it.href,
      subtitle: it.subtitle,
      year: it.year,
    }))
    // Requête vide : la palette agit comme un navigateur (sections d'abord).
    if (!query.trim()) return NAV_COMMANDS
    return [...NAV_COMMANDS, ...media]
      .map(item => ({ item, score: fuzzyScore(query, item.title) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map(x => x.item)
  }, [items, query])

  useEffect(() => {
    setSelected(0)
  }, [query])

  // Garde l'élément sélectionné visible pendant la navigation clavier.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      const item = results[selected]
      if (item) {
        router.push(item.href)
        setOpen(false)
      }
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-earth-ink/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Recherche globale"
    >
      <div
        className="w-full max-w-2xl mx-4 bg-bg-card border border-border-default rounded-2xl shadow-soft-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <MagnifyingGlass size={16} className="text-earth-moss shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Aller à une section, rechercher jeux, films, séries, livres…"
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-sm"
            aria-label="Requête de recherche"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-full hover:bg-bg-hover text-text-secondary"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-muted text-sm">
              {query ? 'Aucun résultat' : 'Chargement…'}
            </div>
          ) : (
            results.map((item, i) => (
              <button
                key={item.id}
                data-idx={i}
                onClick={() => {
                  router.push(item.href)
                  setOpen(false)
                }}
                onMouseEnter={() => setSelected(i)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:bg-bg-hover',
                  i === selected ? 'bg-bg-hover' : 'hover:bg-bg-hover/60'
                )}
              >
                <span className={cn('text-xs font-medium w-16 shrink-0', KIND_COLORS[item.kind])}>
                  {KIND_LABELS[item.kind]}
                </span>
                <span className="flex-1 text-sm text-text-primary truncate">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-text-secondary truncate max-w-[120px]">{item.subtitle}</span>
                )}
                {item.year && (
                  <span className="text-xs text-text-muted num">{item.year}</span>
                )}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle text-[11px] text-text-muted">
          <div className="flex gap-3">
            <span><kbd className="px-1 bg-bg-secondary rounded font-mono">↑↓</kbd> naviguer</span>
            <span><kbd className="px-1 bg-bg-secondary rounded font-mono">↵</kbd> ouvrir</span>
            <span><kbd className="px-1 bg-bg-secondary rounded font-mono">esc</kbd> fermer</span>
          </div>
          <span>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
