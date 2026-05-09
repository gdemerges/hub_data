'use client'

import { cn } from '@/lib/utils'

type Accent = 'moss' | 'fern' | 'terracotta' | 'rust' | 'saffron' | 'clay' | 'indigo' | 'sage'

const accentRgb: Record<Accent, string> = {
  moss: '90 125 74',
  fern: '123 168 150',
  terracotta: '184 107 60',
  rust: '168 85 44',
  saffron: '217 164 65',
  clay: '176 104 104',
  indigo: '61 81 112',
  sage: '163 181 152',
}

interface SkeletonProps {
  className?: string
  /** Couleur du shimmer — sinon teinte neutre */
  accent?: Accent
}

export function Skeleton({ className, accent }: SkeletonProps) {
  const style = accent
    ? ({ ['--accent' as string]: accentRgb[accent] } as React.CSSProperties)
    : undefined
  return (
    <div
      style={style}
      className={cn(
        'rounded-lg bg-bg-tertiary/50 skeleton-shimmer',
        className,
      )}
    />
  )
}

export function SkeletonStatCard({ accent }: { accent?: Accent }) {
  const style = accent
    ? ({ ['--accent' as string]: accentRgb[accent] } as React.CSSProperties)
    : undefined
  return (
    <div
      style={style}
      className="tech-card p-6 skeleton-shimmer"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-2xl bg-bg-tertiary/40" />
      </div>
      <div className="h-12 w-2/3 rounded-lg bg-bg-tertiary/40" />
      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-bg-tertiary/40" />
        <div className="h-2 w-16 rounded-full bg-bg-tertiary/40" />
      </div>
    </div>
  )
}

export function SkeletonChart({ accent }: { accent?: Accent }) {
  const style = accent
    ? ({ ['--accent' as string]: accentRgb[accent] } as React.CSSProperties)
    : undefined
  return (
    <div
      style={style}
      className="tech-card p-6 skeleton-shimmer"
    >
      <div className="h-4 w-48 mb-6 rounded bg-bg-tertiary/40" />
      <div className="h-64 w-full rounded-lg bg-bg-tertiary/30" />
    </div>
  )
}

export function SkeletonProfile({ accent }: { accent?: Accent }) {
  const style = accent
    ? ({ ['--accent' as string]: accentRgb[accent] } as React.CSSProperties)
    : undefined
  return (
    <div
      style={style}
      className="tech-card p-6 skeleton-shimmer"
    >
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="w-[120px] h-[120px] rounded-full bg-bg-tertiary/40" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-40 rounded bg-bg-tertiary/40" />
          <div className="h-4 w-24 rounded bg-bg-tertiary/40" />
          <div className="h-4 w-64 rounded bg-bg-tertiary/40" />
          <div className="flex gap-4 mt-4">
            <div className="h-4 w-24 rounded bg-bg-tertiary/40" />
            <div className="h-4 w-24 rounded bg-bg-tertiary/40" />
          </div>
        </div>
      </div>
    </div>
  )
}
