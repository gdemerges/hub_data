'use client'

import {
  ArrowUpDown,
  BarChart3,
  BookOpen,
  Calendar,
  Filter,
  Hash,
  Library,
  Search,
  Star,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { BooksStats, DeltaIndicator, ReadingDelay } from '@/components/books-stats'
import { MediaCard } from '@/components/media-card'
import { MediaDetail } from '@/components/media-detail'
import type { Book } from '@/lib/types'

type SortOption = 'recent_read' | 'recent_year' | 'oldest_year' | 'rating' | 'title' | 'author'
type ReadStatus = 'all' | 'read' | 'unread'
type Tab = 'library' | 'stats'

const SORT_LABELS: Record<SortOption, string> = {
  recent_read: 'Lus récemment',
  recent_year: 'Plus récent (parution)',
  oldest_year: 'Plus ancien (parution)',
  rating: 'Mieux notés',
  title: 'Ordre alphabétique',
  author: 'Par auteur',
}

function parseFrenchDateTime(s?: string): number {
  if (!s) return 0
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return 0
  return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10)).getTime()
}

interface BooksClientProps {
  books: Book[]
}

export function BooksClient({ books }: BooksClientProps) {
  const [tab, setTab] = useState<Tab>('library')
  const [search, setSearch] = useState('')
  const [author, setAuthor] = useState('')
  const [format, setFormat] = useState('')
  const [genre, setGenre] = useState('')
  const [lectorat, setLectorat] = useState('')
  const [readStatus, setReadStatus] = useState<ReadStatus>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent_read')
  const [selected, setSelected] = useState<Book | null>(null)

  const { authors, formats, genres, lectorats } = useMemo(() => {
    const authors = new Set<string>()
    const formats = new Set<string>()
    const genres = new Set<string>()
    const lectorats = new Set<string>()
    for (const b of books) {
      if (b.author) authors.add(b.author)
      if (b.format) formats.add(b.format)
      if (b.genre1) genres.add(b.genre1)
      if (b.genre2) genres.add(b.genre2)
      if (b.lectorat) lectorats.add(b.lectorat)
    }
    return {
      authors: Array.from(authors).sort((a, b) => a.localeCompare(b, 'fr')),
      formats: Array.from(formats).sort((a, b) => a.localeCompare(b, 'fr')),
      genres: Array.from(genres).sort((a, b) => a.localeCompare(b, 'fr')),
      lectorats: Array.from(lectorats).sort((a, b) => a.localeCompare(b, 'fr')),
    }
  }, [books])

  const filtered = useMemo(() => {
    let result = books
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.author?.toLowerCase().includes(q) ?? false) ||
          (b.titleVO?.toLowerCase().includes(q) ?? false),
      )
    }
    if (author) result = result.filter((b) => b.author === author)
    if (format) result = result.filter((b) => b.format === format)
    if (genre) result = result.filter((b) => b.genre1 === genre || b.genre2 === genre)
    if (lectorat) result = result.filter((b) => b.lectorat === lectorat)
    if (readStatus === 'read') result = result.filter((b) => b.dateRead?.trim())
    if (readStatus === 'unread') result = result.filter((b) => !b.dateRead?.trim())

    const sorted = [...result]
    switch (sortBy) {
      case 'recent_read':
        sorted.sort((a, b) => parseFrenchDateTime(b.dateRead) - parseFrenchDateTime(a.dateRead))
        break
      case 'recent_year':
        sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
        break
      case 'oldest_year':
        sorted.sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity))
        break
      case 'rating':
        sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
        break
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }))
        break
      case 'author':
        sorted.sort((a, b) =>
          (a.author ?? '').localeCompare(b.author ?? '', 'fr', { sensitivity: 'base' }),
        )
        break
    }
    return sorted
  }, [books, search, author, format, genre, lectorat, readStatus, sortBy])

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-subtle">
        {(
          [
            { key: 'library', label: 'Bibliothèque', Icon: Library },
            { key: 'stats', label: 'Statistiques', Icon: BarChart3 },
          ] as const
        ).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
              tab === key
                ? 'text-earth-indigo border-earth-indigo'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <>
          {/* Search + sort */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                strokeWidth={1.75}
              />
              <input
                type="text"
                placeholder="Rechercher un livre, un auteur…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-subtle rounded-full text-text-primary placeholder:text-text-muted focus:outline-none focus:border-earth-indigo/50 focus:ring-2 focus:ring-earth-indigo/15 transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <FilterSelect
                icon={<Filter className="w-4 h-4" />}
                value={author}
                onChange={setAuthor}
                placeholder="Tous les auteurs"
                options={authors}
              />
              <FilterSelect
                icon={<BookOpen className="w-4 h-4" />}
                value={format}
                onChange={setFormat}
                placeholder="Tous les formats"
                options={formats}
              />
              <FilterSelect
                icon={<Hash className="w-4 h-4" />}
                value={genre}
                onChange={setGenre}
                placeholder="Tous les genres"
                options={genres}
              />
              <FilterSelect
                icon={<Calendar className="w-4 h-4" />}
                value={lectorat}
                onChange={setLectorat}
                placeholder="Tous les lectorats"
                options={lectorats}
              />
              <div className="relative">
                <select
                  value={readStatus}
                  onChange={(e) => setReadStatus(e.target.value as ReadStatus)}
                  className="pl-3 pr-8 py-2.5 bg-bg-card border border-border-subtle rounded-full text-text-primary focus:outline-none focus:border-earth-indigo/50 focus:ring-2 focus:ring-earth-indigo/15 transition-all appearance-none cursor-pointer text-sm"
                >
                  <option value="all">Lus + à lire</option>
                  <option value="read">Lus</option>
                  <option value="unread">À lire</option>
                </select>
              </div>
              <div className="relative ml-auto">
                <ArrowUpDown
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
                  strokeWidth={1.75}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="pl-10 pr-8 py-2.5 bg-bg-card border border-border-subtle rounded-full text-text-primary focus:outline-none focus:border-earth-indigo/50 focus:ring-2 focus:ring-earth-indigo/15 transition-all appearance-none cursor-pointer text-sm"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
                    <option key={k} value={k}>
                      {SORT_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted mb-4 num">
            {filtered.length.toLocaleString('fr-FR')} livre{filtered.length > 1 ? 's' : ''}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((b, i) => (
              <MediaCard
                key={b.id}
                title={b.title}
                imageUrl={b.coverUrl}
                subtitle={b.author}
                badge={b.rating ? `${b.rating}/20` : undefined}
                onClick={() => setSelected(b)}
                priority={i < 12}
                color="indigo"
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-muted">Aucun résultat</p>
            </div>
          )}
        </>
      )}

      {tab === 'stats' && <BooksStats books={books} />}

      {selected && (
        <MediaDetail
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.title}
          imageUrl={selected.coverUrl}
        >
          <BookDetail book={selected} />
        </MediaDetail>
      )}
    </>
  )
}

function FilterSelect({
  icon,
  value,
  onChange,
  placeholder,
  options,
}: {
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
}) {
  if (options.length === 0) return null
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
        {icon}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-8 py-2.5 bg-bg-card border border-border-subtle rounded-full text-text-primary focus:outline-none focus:border-earth-indigo/50 focus:ring-2 focus:ring-earth-indigo/15 transition-all appearance-none cursor-pointer text-sm max-w-[200px]"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

function BookDetail({ book }: { book: Book }) {
  const meta: { label: string; value: React.ReactNode }[] = []
  if (book.author) meta.push({ label: 'Auteur', value: book.author })
  if (book.titleVO && book.titleVO !== book.title)
    meta.push({ label: 'Titre VO', value: book.titleVO })
  if (book.year) meta.push({ label: 'Année', value: book.year })
  if (book.pages) meta.push({ label: 'Pages', value: book.pages.toLocaleString('fr-FR') })
  if (book.format) meta.push({ label: 'Format', value: book.format })
  if (book.lectorat) meta.push({ label: 'Lectorat', value: book.lectorat })
  if (book.editeur) meta.push({ label: 'Éditeur', value: book.editeur })
  if (book.collection) meta.push({ label: 'Collection', value: book.collection })
  if (book.langue) meta.push({ label: 'Langue', value: book.langue })
  if (book.type) meta.push({ label: 'Support', value: book.type })
  if (book.isbn) meta.push({ label: 'ISBN', value: book.isbn })

  const dateRead = book.dateRead?.split(' ')[0]
  const datePurchase = book.datePurchase?.split(' ')[0]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 text-sm">
        {book.rating ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-earth-saffron/10 border border-earth-saffron/30">
            <Star className="w-4 h-4 text-earth-saffron fill-earth-saffron" />
            <span className="font-mono font-semibold text-earth-saffron">{book.rating}/20</span>
            {typeof book.avgRating === 'number' && book.avgRating > 0 ? (
              <span className="text-xs">
                <DeltaIndicator delta={book.rating - book.avgRating} />
              </span>
            ) : null}
          </div>
        ) : null}
        {dateRead && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-earth-fern/10 border border-earth-fern/30 text-earth-fern text-xs font-mono">
            <Calendar className="w-3.5 h-3.5" />
            Lu le {dateRead}
          </div>
        )}
      </div>

      {(book.genre1 || book.genre2) && (
        <div className="flex flex-wrap gap-2">
          {[book.genre1, book.genre2].filter(Boolean).map((g) => (
            <span
              key={g}
              className="px-3 py-1 bg-bg-tertiary rounded-full text-xs text-text-secondary"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {meta.map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between gap-3 border-b border-border-subtle/50 py-1"
          >
            <dt className="text-text-muted">{label}</dt>
            <dd className="text-text-primary text-right truncate">{value}</dd>
          </div>
        ))}
      </dl>

      {datePurchase && dateRead && (
        <div className="text-sm text-text-secondary">
          Acheté le {datePurchase} ·{' '}
          <ReadingDelay purchase={book.datePurchase} read={book.dateRead} />
        </div>
      )}
    </div>
  )
}
