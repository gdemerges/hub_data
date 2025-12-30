'use client'

import { Terminal, TrendingUp } from 'lucide-react'
import { ProfileRadar, UnifiedTimeline } from '@/components'

export default function InsightsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-bg-card border border-neon-cyan/30 rounded-lg">
            <Terminal className="w-8 h-8 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary">
              <span className="text-neon-cyan">INSIGHTS</span>_SYSTEM
            </h1>
            <p className="text-xs font-mono text-neon-magenta/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-magenta rounded-full animate-pulse" />
              STATUS: ANALYZING // DATA_VISUALIZER v1.0
            </p>
          </div>
        </div>
        <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-cyan/30 pl-4">
          &gt; Analyzing your personal data patterns...
          <span className="text-neon-cyan animate-pulse">_</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <ProfileRadar />

        {/* Timeline */}
        <UnifiedTimeline />
      </div>
    </div>
  )
}
