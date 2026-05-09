'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { UnifiedTimeline, PageHeader } from '@/components'
import { TrendingUp, Calendar } from 'lucide-react'
import { Sparkle } from '@phosphor-icons/react'

const ProfileRadar = dynamic(
  () => import('@/components/profile-radar').then((mod) => mod.ProfileRadar),
  {
    ssr: false,
    loading: () => (
      <div className="tech-card p-6 h-96 flex items-center justify-center">
        <div className="text-sm text-text-muted font-mono animate-pulse">
          Chargement du profil...
        </div>
      </div>
    ),
  }
)

export default function InsightsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Insights"
        subtitle="Analyses transverses sur l'ensemble des données"
        eyebrow="Méta-vue"
        dateline="Toutes sources"
        color="fern"
        icon={Sparkle}
      />
      <div className="motion-stagger grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/insights/correlations"
          className="tech-card p-6 group flex items-start gap-4"
          style={{ ['--accent' as string]: '123 168 150' } as React.CSSProperties}
        >
          <span className="gradient-mesh w-12 h-12 rounded-2xl border border-earth-fern/30 flex items-center justify-center shrink-0"
                style={{ ['--mesh-a' as string]: '123 168 150', ['--mesh-b' as string]: '163 181 152', ['--mesh-c' as string]: '123 168 150' } as React.CSSProperties}>
            <TrendingUp className="w-5 h-5 text-earth-fern" strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg text-text-primary tracking-tight">Corrélations</div>
            <div className="text-sm text-text-secondary mt-1">Toutes les sections, année par année</div>
          </div>
          <span className="text-text-muted group-hover:text-earth-fern group-hover:translate-x-0.5 transition-all">→</span>
        </Link>
        <Link
          href="/insights/year-in-review"
          className="tech-card p-6 group flex items-start gap-4"
          style={{ ['--accent' as string]: '184 107 60' } as React.CSSProperties}
        >
          <span className="gradient-mesh w-12 h-12 rounded-2xl border border-earth-terracotta/30 flex items-center justify-center shrink-0"
                style={{ ['--mesh-a' as string]: '184 107 60', ['--mesh-b' as string]: '217 164 65', ['--mesh-c' as string]: '184 107 60' } as React.CSSProperties}>
            <Calendar className="w-5 h-5 text-earth-terracotta" strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg text-text-primary tracking-tight">Year in Review</div>
            <div className="text-sm text-text-secondary mt-1">Récap annuel toutes sections</div>
          </div>
          <span className="text-text-muted group-hover:text-earth-terracotta group-hover:translate-x-0.5 transition-all">→</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileRadar />
        <UnifiedTimeline />
      </div>
    </div>
  )
}
