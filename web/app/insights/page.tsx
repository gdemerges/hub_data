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
        color="fern"
        icon={Sparkle}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link
          href="/insights/correlations"
          className="tech-card p-5 hover:border-neon-cyan/50 transition-all flex items-center gap-4"
        >
          <TrendingUp className="w-6 h-6 text-neon-cyan shrink-0" />
          <div>
            <div className="font-mono text-sm font-semibold text-text-primary uppercase tracking-wider">Corrélations</div>
            <div className="text-xs text-text-secondary mt-1">Toutes les sections, année par année</div>
          </div>
        </Link>
        <Link
          href="/insights/year-in-review"
          className="tech-card p-5 hover:border-neon-magenta/50 transition-all flex items-center gap-4"
        >
          <Calendar className="w-6 h-6 text-neon-magenta shrink-0" />
          <div>
            <div className="font-mono text-sm font-semibold text-text-primary uppercase tracking-wider">Year in Review</div>
            <div className="text-xs text-text-secondary mt-1">Récap annuel toutes sections</div>
          </div>
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileRadar />
        <UnifiedTimeline />
      </div>
    </div>
  )
}
