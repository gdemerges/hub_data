'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchItem = {
  id: string
  title: string
  section: 'games' | 'films' | 'series' | 'books'
  href: string
  subtitle?: string
  year?: number
}

const SECTION_COLORS: Record<SearchItem['section'], string> = {
  games: 'text-neon-green',
  films: 'text-neon-magenta',
  series: 'text-neon-yellow',
  books: 'text-blue-400',
}

const SECTION_LABELS: Record<SearchItem['section'], string> = {
  games: 'GAMES',
  films: 'FILMS',
  series: 'SERIES',
  books: 'BOOKS',
}

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
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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

  const results = useMemo(() => {
    if (!query.trim()) return items.slice(0, 30)
    return items
      .map(item => ({ item, score: fuzzyScore(query, item.title) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map(x => x.item)
  }, [items, query])

  useEffect(() => {
    setSelected(0)
  }, [query])

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
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/70 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Recherche globale"
    >
      <div
        className="w-full max-w-2xl mx-4 bg-bg-primary border border-neon-cyan/40 rounded-xl shadow-[0_0_40px_rgba(0,255,255,0.15)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neon-cyan/20">
          <Search className="w-4 h-4 text-neon-cyan shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher jeux, films, séries, livres..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary/60 outline-none font-mono text-sm"
            aria-label="Requête de recherche"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-neon-cyan/10 text-text-secondary"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-secondary font-mono text-sm">
              {query ? 'Aucun résultat' : 'Chargement...'}
            </div>
          ) : (
            results.map((item, i) => (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href)
                  setOpen(false)
                }}
                onMouseEnter={() => setSelected(i)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:bg-neon-cyan/10',
                  i === selected ? 'bg-neon-cyan/10' : 'hover:bg-white/5'
                )}
              >
                <span className={cn('font-mono text-xs font-semibold w-16 shrink-0', SECTION_COLORS[item.section])}>
                  {SECTION_LABELS[item.section]}
                </span>
                <span className="flex-1 text-sm text-text-primary truncate">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-text-secondary font-mono truncate max-w-[120px]">{item.subtitle}</span>
                )}
                {item.year && (
                  <span className="text-xs text-text-secondary/60 font-mono">{item.year}</span>
                )}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t border-neon-cyan/20 text-[10px] font-mono text-text-secondary/60">
          <div className="flex gap-3">
            <span><kbd className="px-1 bg-bg-card rounded">↑↓</kbd> naviguer</span>
            <span><kbd className="px-1 bg-bg-card rounded">↵</kbd> ouvrir</span>
            <span><kbd className="px-1 bg-bg-card rounded">esc</kbd> fermer</span>
          </div>
          <span>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
