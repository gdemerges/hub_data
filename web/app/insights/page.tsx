'use client'

import { ProfileRadar, UnifiedTimeline, PageHeader } from '@/components'

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
