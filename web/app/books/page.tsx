'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Terminal, BookOpen, Star, Calendar, User, Hash } from 'lucide-react'
import { StatCard } from '@/components'
import { Book } from '@/lib/types'

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch('/api/books')
        if (response.ok) {
          const data = await response.json()
          setBooks(data.books || [])
        }
      } catch (err) {
        console.error('Failed to load books:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBooks()
  }, [])

  // Calculate stats
  const totalBooks = books.length
  const booksRead = books.filter(b => b.dateRead).length // Books with a read date are considered read
  const avgRating = books.filter(b => b.rating).reduce((sum, b) => sum + (b.rating || 0), 0) / books.filter(b => b.rating).length || 0
  const totalPages = books.reduce((sum, b) => sum + (b.pages || 0), 0)

  // Top rated books
  const topBooks = books
    .filter(b => b.rating && b.rating > 0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 12)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-bg-card border border-neon-yellow/30 rounded-lg">
              <Terminal className="w-8 h-8 text-neon-yellow" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
                <span className="text-neon-yellow">BOOKS</span>_SYSTEM
              </h1>
              <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                STATUS: LOADING // READING_TRACKER v1.0
              </p>
            </div>
          </div>
          <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-yellow/30 pl-4">
            &gt; Loading reading library...
            <span className="text-neon-yellow animate-pulse">_</span>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-bg-card rounded-2xl border border-border-subtle" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-bg-card rounded-2xl border border-border-subtle" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-bg-card border border-neon-yellow/30 rounded-lg">
            <Terminal className="w-8 h-8 text-neon-yellow" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
              <span className="text-neon-yellow">BOOKS</span>_SYSTEM
            </h1>
            <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
              STATUS: ONLINE // READING_TRACKER v1.0
            </p>
          </div>
        </div>
        <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-yellow/30 pl-4">
          &gt; Loading reading library...
          <span className="text-neon-yellow animate-pulse">_</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Livres" value={totalBooks} icon={BookOpen} color="yellow" />
        <StatCard label="Lus" value={booksRead} icon={BookOpen} color="green" />
        <StatCard label="Note moyenne" value={avgRating.toFixed(1)} icon={Star} color="orange" />
        <StatCard label="Pages" value={totalPages.toLocaleString('fr-FR')} icon={Hash} color="cyan" />
      </div>

      {/* Top Books */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-neon-yellow/10 border border-neon-yellow/30 rounded">
            <Star className="w-5 h-5 text-neon-yellow" />
          </div>
          <h2 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Meilleurs_Livres
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {topBooks.map((book) => (
            <div
              key={book.id}
              className="group tech-card p-3 hover:border-neon-yellow/60 transition-all duration-300"
            >
              <div className="flex flex-col h-full">
                {/* Cover */}
                <div className="relative aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-bg-primary border border-border-subtle">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-text-muted/30" />
                    </div>
                  )}
                  {book.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-bg-primary/90 rounded-full border border-neon-yellow/30">
                      <Star className="w-3 h-3 text-neon-yellow fill-neon-yellow" />
                      <span className="text-xs font-mono font-bold text-neon-yellow">
                        {book.rating}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-h-0">
                  <h3 className="font-medium text-sm text-text-primary group-hover:text-neon-yellow transition-colors mb-1 line-clamp-2">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-xs text-text-muted font-mono truncate">
                      {book.author}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Books List */}
      <div className="tech-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded">
            <BookOpen className="w-5 h-5 text-neon-cyan" />
          </div>
          <h2 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Tous_Les_Livres ({totalBooks})
          </h2>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {books.map((book, index) => (
            <div
              key={book.id}
              className="group flex items-center gap-4 p-3 bg-bg-primary border border-border-subtle rounded-lg hover:border-neon-cyan/50 transition-all duration-300"
            >
              {/* Mini cover */}
              <div className="w-10 h-14 rounded overflow-hidden bg-bg-card border border-border-subtle shrink-0">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-text-muted/30" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-text-primary group-hover:text-neon-cyan transition-colors truncate">
                  {book.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  {book.author && (
                    <span className="text-xs text-text-muted font-mono truncate max-w-[200px]">
                      {book.author}
                    </span>
                  )}
                  {book.year && (
                    <span className="text-xs text-text-muted font-mono">
                      {book.year}
                    </span>
                  )}
                  {book.genre1 && (
                    <span className="text-xs text-text-muted font-mono hidden sm:inline">
                      {book.genre1}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {book.pages && (
                  <span className="text-xs font-mono text-text-muted hidden sm:inline">
                    {book.pages}p
                  </span>
                )}
                {book.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-neon-yellow fill-neon-yellow" />
                    <span className="text-sm font-mono font-bold text-neon-yellow">
                      {book.rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
