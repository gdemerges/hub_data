'use client'

import {
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Hash,
  Layers,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Book } from '@/lib/types'

interface BooksStatsProps {
  books: Book[]
}

// Saga detection — books-specific patterns. First match wins after specificity sort.
const BOOK_SAGAS: { name: string; pattern: RegExp }[] = [
  { name: 'Harry Potter', pattern: /\bharry potter\b/i },
  { name: 'Fondation', pattern: /\bfondation|foundation\b/i },
  { name: 'Astérix', pattern: /\bast[eé]rix\b/i },
  { name: 'Tintin', pattern: /\btintin\b/i },
  { name: 'Lucky Luke', pattern: /\blucky luke\b/i },
  { name: 'Spirou', pattern: /\bspirou\b/i },
  { name: 'XIII', pattern: /\bxiii\b/i },
  { name: 'Naruto', pattern: /\bnaruto\b/i },
  { name: 'GTO', pattern: /\bgto|great teacher onizuka\b/i },
  { name: 'Samurai Deeper Kyo', pattern: /\bsamurai deeper kyo\b/i },
  { name: 'Platinum End', pattern: /\bplatinum end|purachina endo\b/i },
  { name: 'The Breaker', pattern: /\bthe breaker\b/i },
  {
    name: 'Gardiens des cités perdues',
    pattern: /\bgardiens des cit[eé]s perdues|keeper of the lost cities\b/i,
  },
  { name: 'Hunger Games', pattern: /\bhunger games\b/i },
  { name: 'Le cycle des robots', pattern: /\bcycle des robots|i[, ]+robot\b/i },
  { name: 'Octofight', pattern: /\boctofight\b/i },
]
BOOK_SAGAS.sort((a, b) => b.name.length - a.name.length)

function detectSaga(title: string): string | null {
  for (const s of BOOK_SAGAS) if (s.pattern.test(title)) return s.name
  return null
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// "28/12/2023 12:55" or "28/12/2023" → Date
function parseFrenchDateTime(s?: string): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10))
}

export function BooksStats({ books }: BooksStatsProps) {
  const stats = useMemo(() => {
    const total = books.length
    const read = books.filter((b) => b.dateRead && b.dateRead.trim() !== '')
    const readCount = read.length
    const totalPages = read.reduce((s, b) => s + (b.pages ?? 0), 0)

    const rated = books.filter((b) => typeof b.rating === 'number' && b.rating! > 0)
    const avgRating = avg(rated.map((b) => b.rating!))

    const bothRated = books.filter(
      (b) => typeof b.rating === 'number' && b.rating! > 0 && typeof b.avgRating === 'number',
    )
    const avgVsCrowd = avg(bothRated.map((b) => b.rating! - b.avgRating!))

    const pagesByYear = new Map<number, number>()
    const booksByYear = new Map<number, number>()
    for (const b of read) {
      const d = parseFrenchDateTime(b.dateRead)
      if (!d) continue
      const y = d.getFullYear()
      pagesByYear.set(y, (pagesByYear.get(y) ?? 0) + (b.pages ?? 0))
      booksByYear.set(y, (booksByYear.get(y) ?? 0) + 1)
    }
    const yearStats = Array.from(pagesByYear.keys())
      .sort()
      .map((y) => ({
        year: y,
        pages: pagesByYear.get(y) ?? 0,
        books: booksByYear.get(y) ?? 0,
      }))

    const formats = new Map<string, number>()
    for (const b of books) {
      const f = b.format
      if (f) formats.set(f, (formats.get(f) ?? 0) + 1)
    }
    const formatBreakdown = Array.from(formats.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)

    const lectorats = new Map<string, number>()
    for (const b of books) {
      const f = b.lectorat
      if (f) lectorats.set(f, (lectorats.get(f) ?? 0) + 1)
    }
    const lectoratBreakdown = Array.from(lectorats.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)

    const authorMap = new Map<string, { count: number; pages: number; ratings: number[] }>()
    for (const b of books) {
      const a = b.author
      if (!a) continue
      const cur = authorMap.get(a) ?? { count: 0, pages: 0, ratings: [] }
      cur.count += 1
      cur.pages += b.pages ?? 0
      if (typeof b.rating === 'number' && b.rating > 0) cur.ratings.push(b.rating)
      authorMap.set(a, cur)
    }
    const topAuthors = Array.from(authorMap.entries())
      .map(([name, v]) => ({
        name,
        count: v.count,
        pages: v.pages,
        rating: v.ratings.length ? avg(v.ratings) : undefined,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const editorMap = new Map<string, number>()
    for (const b of books) {
      const e = b.editeur
      if (e) editorMap.set(e, (editorMap.get(e) ?? 0) + 1)
    }
    const topEditors = Array.from(editorMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const sagaMap = new Map<string, { books: Book[]; pages: number; ratings: number[] }>()
    for (const b of books) {
      const s = detectSaga(b.title)
      if (!s) continue
      const cur = sagaMap.get(s) ?? { books: [], pages: 0, ratings: [] }
      cur.books.push(b)
      cur.pages += b.pages ?? 0
      if (typeof b.rating === 'number' && b.rating > 0) cur.ratings.push(b.rating)
      sagaMap.set(s, cur)
    }
    const sagas = Array.from(sagaMap.entries())
      .filter(([, v]) => v.books.length >= 2)
      .map(([name, v]) => {
        const sortedBooks = [...v.books].sort((a, b) => {
          const ay = parseFrenchDateTime(a.dateRead)?.getTime() ?? 0
          const by = parseFrenchDateTime(b.dateRead)?.getTime() ?? 0
          return ay - by
        })
        const cover = sortedBooks.find((x) => x.coverUrl)?.coverUrl
        return {
          name,
          count: v.books.length,
          pages: v.pages,
          rating: v.ratings.length ? avg(v.ratings) : undefined,
          cover,
          books: sortedBooks,
        }
      })
      .sort((a, b) => b.pages - a.pages)
      .slice(0, 20)

    return {
      total,
      readCount,
      totalPages,
      avgRating,
      avgVsCrowd,
      yearStats,
      formatBreakdown,
      lectoratBreakdown,
      topAuthors,
      topEditors,
      sagas,
    }
  }, [books])

  return (
    <div className="space-y-6">
      <KpiRow {...stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PagesByYear items={stats.yearStats} />
        <Breakdown
          title="Par format"
          icon={<BookOpen className="w-5 h-5 text-earth-fern" />}
          items={stats.formatBreakdown}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopAuthors items={stats.topAuthors} />
        <Breakdown
          title="Par lectorat"
          icon={<Users className="w-5 h-5 text-earth-indigo" />}
          items={stats.lectoratBreakdown}
        />
      </div>

      <SagaList items={stats.sagas} />

      <TopEditors items={stats.topEditors} />
    </div>
  )
}

function KpiRow({
  total,
  readCount,
  totalPages,
  avgRating,
  avgVsCrowd,
}: {
  total: number
  readCount: number
  totalPages: number
  avgRating: number
  avgVsCrowd: number
}) {
  const items = [
    {
      label: 'Total',
      value: total.toString(),
      sub: 'livres dans la bibliothèque',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'text-earth-moss',
      bg: 'bg-earth-moss/10',
    },
    {
      label: 'Lus',
      value: readCount.toString(),
      sub: total ? `${Math.round((readCount / total) * 100)}%` : '0%',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-earth-leaf',
      bg: 'bg-earth-leaf/10',
    },
    {
      label: 'Pages lues',
      value: totalPages.toLocaleString('fr-FR'),
      sub: 'cumulées sur tous les livres lus',
      icon: <Hash className="w-5 h-5" />,
      color: 'text-earth-fern',
      bg: 'bg-earth-fern/10',
    },
    {
      label: 'Note moyenne',
      value: avgRating > 0 ? `${avgRating.toFixed(1)}/20` : '—',
      sub:
        avgVsCrowd > 0.05
          ? `+${avgVsCrowd.toFixed(1)} vs moyenne`
          : avgVsCrowd < -0.05
            ? `${avgVsCrowd.toFixed(1)} vs moyenne`
            : 'aligné sur la moyenne',
      icon: <Star className="w-5 h-5" />,
      color: 'text-earth-saffron',
      bg: 'bg-earth-saffron/10',
    },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it) => (
        <div key={it.label} className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${it.bg} ${it.color}`}>{it.icon}</div>
            <p className="text-xs text-text-secondary uppercase tracking-wide">{it.label}</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{it.value}</p>
          <p className="text-xs text-text-muted mt-1">{it.sub}</p>
        </div>
      ))}
    </div>
  )
}

function PagesByYear({ items }: { items: { year: number; pages: number; books: number }[] }) {
  if (!items.length) return null
  const max = Math.max(...items.map((i) => i.pages))
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-earth-terracotta" />
        <h3 className="text-sm font-semibold text-text-secondary">Pages lues par année</h3>
      </div>
      <div className="flex items-end gap-2 h-44">
        {items.map(({ year, pages, books }) => {
          const h = max ? (pages / max) * 100 : 0
          return (
            <div
              key={year}
              className="flex-1 flex flex-col items-center justify-end gap-2 group"
              title={`${pages.toLocaleString('fr-FR')} pages · ${books} livres`}
            >
              <span className="text-[10px] font-mono text-text-secondary">
                {pages.toLocaleString('fr-FR')}
              </span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-earth-terracotta to-earth-saffron group-hover:opacity-80 transition-opacity"
                style={{ height: `${h}%` }}
              />
              <span className="text-xs font-mono text-text-muted">{year}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Breakdown({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: { label: string; count: number }[]
}) {
  if (!items.length) return null
  const total = items.reduce((s, i) => s + i.count, 0)
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {items.map(({ label, count }) => {
          const pct = (count / total) * 100
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-primary">{label}</span>
                <span className="text-xs font-mono text-text-secondary">
                  {count} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-earth-fern to-earth-moss"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopAuthors({
  items,
}: {
  items: { name: string; count: number; pages: number; rating?: number }[]
}) {
  if (!items.length) return null
  const max = Math.max(...items.map((i) => i.count))
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-5 h-5 text-earth-moss" />
        <h3 className="text-sm font-semibold text-text-secondary">Top auteurs</h3>
      </div>
      <ol className="space-y-2.5">
        {items.map((a, i) => {
          const pct = max ? (a.count / max) * 100 : 0
          return (
            <li key={a.name} className="flex items-center gap-3">
              <span className="w-5 text-xs font-mono text-text-muted text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-sm text-text-primary truncate">{a.name}</span>
                  <span className="text-xs font-mono text-text-secondary shrink-0">
                    {a.count} livre{a.count > 1 ? 's' : ''}
                    {a.rating ? ` · ${a.rating.toFixed(1)}/20` : ''}
                  </span>
                </div>
                <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-earth-fern to-earth-moss"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function TopEditors({ items }: { items: { name: string; count: number }[] }) {
  if (!items.length) return null
  const max = Math.max(...items.map((i) => i.count))
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Building2 className="w-5 h-5 text-earth-clay" />
        <h3 className="text-sm font-semibold text-text-secondary">Top éditeurs</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {items.map(({ name, count }, i) => {
          const pct = max ? (count / max) * 100 : 0
          return (
            <div key={name} className="flex items-center gap-3">
              <span className="w-5 text-xs font-mono text-text-muted text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-sm text-text-primary truncate">{name}</span>
                  <span className="text-xs font-mono text-text-secondary shrink-0">{count}</span>
                </div>
                <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-earth-clay to-earth-saffron"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface SagaItem {
  name: string
  count: number
  pages: number
  rating?: number
  cover?: string
  books: Book[]
}

function SagaList({ items }: { items: SagaItem[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  if (!items.length) return null
  const max = Math.max(...items.map((i) => i.pages))
  const selectedSaga = items.find((s) => s.name === selected) ?? null

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Layers className="w-5 h-5 text-earth-indigo" />
        <h3 className="text-sm font-semibold text-text-secondary">Sagas &amp; cycles</h3>
        <span className="text-xs text-text-muted ml-auto">
          {items.length} sagas · clique pour déplier
        </span>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 sm:grid-flow-col gap-x-6 gap-y-3"
        style={{ gridTemplateRows: `repeat(${Math.ceil(items.length / 2)}, minmax(0, auto))` }}
      >
        {items.map((s, i) => {
          const pct = max ? (s.pages / max) * 100 : 0
          const isSelected = selected === s.name
          return (
            <button
              key={s.name}
              onClick={() => setSelected(isSelected ? null : s.name)}
              className={`flex items-center gap-3 text-left rounded-lg p-2 -m-2 transition-colors ${
                isSelected
                  ? 'bg-earth-indigo/10 border border-earth-indigo/30'
                  : 'border border-transparent hover:bg-bg-hover'
              }`}
            >
              <span className="w-5 text-xs font-mono text-text-muted text-right">{i + 1}</span>
              <div className="relative w-9 h-12 flex-shrink-0 rounded-md overflow-hidden bg-bg-tertiary border border-border-subtle">
                {s.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.cover} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-text-muted/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm text-text-primary truncate font-medium">{s.name}</p>
                  <span className="text-xs font-mono text-text-muted shrink-0">
                    {s.count} tome{s.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-earth-indigo to-earth-fern"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold text-text-primary shrink-0">
                    {s.pages.toLocaleString('fr-FR')}p
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${
                  isSelected ? 'rotate-180' : ''
                }`}
              />
            </button>
          )
        })}
      </div>

      {selectedSaga && (
        <div className="mt-6 pt-6 border-t border-border-subtle animate-fade-in">
          <div className="flex items-baseline justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-primary">
              {selectedSaga.name}{' '}
              <span className="text-text-muted font-normal">
                · {selectedSaga.count} tomes · {selectedSaga.pages.toLocaleString('fr-FR')} pages
                {selectedSaga.rating ? ` · ${selectedSaga.rating.toFixed(1)}/20` : ''}
              </span>
            </h4>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {selectedSaga.books.map((b, idx) => (
              <li key={`${b.id}-${idx}`} className="flex items-center gap-3 py-1.5">
                <div className="relative w-7 h-10 flex-shrink-0 rounded-sm overflow-hidden bg-bg-tertiary border border-border-subtle">
                  {b.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-text-muted/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{b.title}</p>
                  <p className="text-xs text-text-muted truncate">
                    {b.author || '—'}
                    {b.year ? ` · ${b.year}` : ''}
                  </p>
                </div>
                {b.rating ? (
                  <span className="text-xs font-mono font-semibold text-earth-saffron shrink-0">
                    {b.rating}/20
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function DeltaIndicator({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.05) return <span className="text-text-muted">≈ moyenne</span>
  const positive = delta > 0
  const Icon = positive ? TrendingUp : TrendingDown
  const color = positive ? 'text-earth-moss' : 'text-earth-clay'
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon className="w-3 h-3" />
      {positive ? '+' : ''}
      {delta.toFixed(1)}
    </span>
  )
}

export function ReadingDelay({ purchase, read }: { purchase?: string; read?: string }) {
  const p = parseFrenchDateTime(purchase)
  const r = parseFrenchDateTime(read)
  if (!p || !r) return null
  const days = Math.round((r.getTime() - p.getTime()) / 86400000)
  if (days < 0) return null
  if (days < 1) return <span className="text-text-muted">le jour même</span>
  if (days < 30)
    return (
      <span className="text-text-muted">
        {days} jour{days > 1 ? 's' : ''} après achat
      </span>
    )
  if (days < 365)
    return <span className="text-text-muted">{Math.round(days / 30)} mois après achat</span>
  return <span className="text-text-muted">{(days / 365).toFixed(1)} ans après achat</span>
}

export { Clock }
