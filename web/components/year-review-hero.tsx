'use client'

import { useCountUp } from '@/lib/use-count-up'

export interface YearReviewHeroData {
  films: { total: number }
  games: { hoursPlayed: number }
  books: { total: number; pages: number }
  highlights: string[]
}

function Counter({ value, label, accent }: { value: number; label: string; accent: string }) {
  const display = useCountUp(value)
  return (
    <div>
      <p
        className={`font-display text-5xl sm:text-6xl font-semibold tracking-tight tabular-nums ${accent}`}
      >
        {display.toLocaleString('fr-FR')}
      </p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#c4b89a]">
        {label}
      </p>
    </div>
  )
}

export function YearReviewHero({ year, data }: { year: number; data: YearReviewHeroData | null }) {
  // Skeleton pendant le chargement SWR (même hauteur → pas de saut de layout)
  if (!data) {
    return (
      <div className="mb-6 h-52 animate-pulse rounded-2xl border border-border-subtle bg-bg-card" />
    )
  }

  const counters = [
    { value: data.films.total, label: 'Films', accent: 'text-[#e8965a]' },
    { value: data.games.hoursPlayed, label: 'Heures de jeu', accent: 'text-[#9db86f]' },
    { value: data.books.total, label: 'Livres', accent: 'text-[#a8b4e0]' },
    { value: data.books.pages, label: 'Pages lues', accent: 'text-[#d9a441]' },
  ].filter((c) => c.value > 0)

  if (counters.length === 0 && data.highlights.length === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-border-subtle bg-bg-card p-8 text-center font-mono text-sm text-text-muted">
        Aucune activité enregistrée cette année-là.
      </div>
    )
  }

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-[#2e2a22] to-[#3d342a] p-8 shadow-soft-md">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d9a441]">
        Rétrospective · {year}
      </p>
      <div className="mt-6 flex flex-wrap gap-x-12 gap-y-6">
        {counters.map((c) => (
          <Counter key={c.label} value={c.value} label={c.label} accent={c.accent} />
        ))}
      </div>
      {data.highlights.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {data.highlights.map((h) => (
            <span
              key={h}
              className="rounded-full border border-[#d9a441]/30 bg-[#d9a441]/10 px-3 py-1 font-mono text-xs text-[#f0e6d2]"
            >
              {h}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
