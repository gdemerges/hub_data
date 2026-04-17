'use client'

import dynamic from 'next/dynamic'
import { UnifiedTimeline, PageHeader } from '@/components'

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
        title="INSIGHTS"
        systemName="SYSTEM"
        statusDetail="DATA_VISUALIZER v1.0"
        loadingMessage="Analyzing your personal data patterns..."
        color="neon-cyan"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileRadar />
        <UnifiedTimeline />
      </div>
    </div>
  )
}
