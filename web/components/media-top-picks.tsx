'use client'

import { Star } from 'lucide-react'
import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

type Accent = 'moss' | 'fern' | 'terracotta' | 'rust' | 'saffron' | 'clay' | 'indigo'

const accentTokens: Record<
  Accent,
  { text: string; mesh: string; meshB: string; ring: string; rgb: string }
> = {
  moss: {
    text: 'text-earth-moss',
    mesh: '90 125 74',
    meshB: '138 178 116',
    ring: 'ring-earth-moss/30',
    rgb: '90 125 74',
  },
  fern: {
    text: 'text-earth-fern',
    mesh: '123 168 150',
    meshB: '163 181 152',
    ring: 'ring-earth-fern/30',
    rgb: '123 168 150',
  },
  terracotta: {
    text: 'text-earth-terracotta',
    mesh: '184 107 60',
    meshB: '217 164 65',
    ring: 'ring-earth-terracotta/30',
    rgb: '184 107 60',
  },
  rust: {
    text: 'text-earth-rust',
    mesh: '168 85 44',
    meshB: '217 164 65',
    ring: 'ring-earth-rust/30',
    rgb: '168 85 44',
  },
  saffron: {
    text: 'text-earth-saffron',
    mesh: '217 164 65',
    meshB: '184 107 60',
    ring: 'ring-earth-saffron/30',
    rgb: '217 164 65',
  },
  clay: {
    text: 'text-earth-clay',
    mesh: '176 104 104',
    meshB: '184 107 60',
    ring: 'ring-earth-clay/30',
    rgb: '176 104 104',
  },
  indigo: {
    text: 'text-earth-indigo',
    mesh: '61 81 112',
    meshB: '123 168 150',
    ring: 'ring-earth-indigo/30',
    rgb: '61 81 112',
  },
}

export interface TopPick {
  title: string
  imageUrl?: string
  metric?: string // ex: "18/20", "84 h"
  metricLabel?: string // ex: "Note", "Joué"
  meta?: string // year, platform, etc.
  onClick?: () => void
}

interface Props {
  picks: TopPick[]
  accent?: Accent
  /** Surtitre éditorial type "Top 3" */
  eyebrow?: string
  title: string
}

/**
 * Bandeau hero éditorial : 1 carte XL + 2 colonnes en pile.
 * Layout responsive : pile sur mobile, asymétrique en >= md.
 */
export function MediaTopPicks({ picks, accent: a = 'fern', eyebrow = 'Top 3', title }: Props) {
  const tokens = accentTokens[a]
  const top = picks.slice(0, 3)
  if (top.length === 0) return null

  const meshStyle = {
    ['--mesh-a' as string]: tokens.mesh,
    ['--mesh-b' as string]: tokens.meshB,
    ['--mesh-c' as string]: tokens.mesh,
    ['--accent' as string]: tokens.rgb,
  } as React.CSSProperties

  return (
    <section className="mb-10">
      <header className="flex items-end justify-between mb-5">
        <div>
          <div
            className={cn(
              'text-[10px] uppercase tracking-[0.22em] font-mono mb-2 flex items-center gap-2',
              tokens.text,
            )}
          >
            <span className="inline-block w-6 h-px" style={{ background: `rgb(${tokens.rgb})` }} />
            {eyebrow}
          </div>
          <h2 className="font-display text-2xl font-medium tracking-tight text-text-primary">
            {title}
          </h2>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5" style={meshStyle}>
        {/* Featured (XL) — premier item */}
        <FeaturedCard pick={top[0]} accent={a} />

        {/* Side pile — items 2 et 3 (s'il y en a) */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {top.slice(1).map((p, i) => (
            <SideCard key={p.title + i} pick={p} accent={a} rank={i + 2} />
          ))}
          {top.length === 1 && (
            <div className="hidden sm:flex items-center justify-center text-text-muted text-sm tech-card-flat min-h-[200px] sm:col-span-2">
              Pas assez d'éléments notés pour le top.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function FeaturedCard({ pick, accent: a }: { pick: TopPick; accent: Accent }) {
  const tokens = accentTokens[a]
  const Tag = pick.onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={pick.onClick}
      className={cn(
        'tech-card-raised gradient-mesh group relative overflow-hidden text-left',
        'aspect-[4/5] md:aspect-auto md:row-span-1 md:min-h-[420px]',
        'transition-transform duration-500',
      )}
    >
      {/* Image background */}
      {pick.imageUrl ? (
        <Image
          src={pick.imageUrl}
          alt={pick.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
          priority
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-display text-7xl italic opacity-30', tokens.text)}>
            {getInitials(pick.title)}
          </span>
        </div>
      )}

      {/* Bottom overlay éditorial */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 bg-gradient-to-t from-black/85 via-black/55 to-transparent">
        <div
          className={cn(
            'text-[10px] uppercase tracking-[0.22em] font-mono mb-1.5 flex items-center gap-2 text-white/80',
          )}
        >
          <span className="font-display text-base num font-medium">01</span>
          <span className="block w-4 h-px bg-white/40" />
          {pick.metricLabel ?? 'Top'}
        </div>
        <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white leading-[1.05] line-clamp-2">
          {pick.title}
        </h3>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          {pick.meta && <span className="text-xs text-white/70 num">{pick.meta}</span>}
          {pick.metric && (
            <span className="font-display text-2xl font-medium text-white num leading-none flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-current opacity-80" strokeWidth={0} />
              {pick.metric}
            </span>
          )}
        </div>
      </div>
    </Tag>
  )
}

function SideCard({ pick, accent: a, rank }: { pick: TopPick; accent: Accent; rank: number }) {
  const tokens = accentTokens[a]
  const Tag = pick.onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={pick.onClick}
      className={cn(
        'tech-card group relative overflow-hidden text-left',
        'aspect-[4/5] sm:aspect-auto sm:min-h-[200px]',
      )}
    >
      {pick.imageUrl ? (
        <Image
          src={pick.imageUrl}
          alt={pick.title}
          fill
          sizes="(max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-tertiary/50">
          <span className={cn('font-display text-5xl italic opacity-30', tokens.text)}>
            {getInitials(pick.title)}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 to-transparent">
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="font-display text-base font-medium text-white/70 num">
            {String(rank).padStart(2, '0')}
          </span>
          {pick.metric && (
            <span className="ml-auto font-display text-base font-medium text-white num flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current opacity-80" strokeWidth={0} />
              {pick.metric}
            </span>
          )}
        </div>
        <h3 className="font-display text-base font-medium tracking-tight text-white leading-tight line-clamp-2">
          {pick.title}
        </h3>
        {pick.meta && <p className="text-[11px] text-white/60 mt-1 num">{pick.meta}</p>}
      </div>
    </Tag>
  )
}
