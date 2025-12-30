import { getSeriesData } from '@/lib/data'
import { SeriesClient } from '@/components/series-client'
import { Tv, Terminal } from 'lucide-react'

export default async function SeriesPage() {
  const series = await getSeriesData()

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
              <span className="text-neon-yellow">SERIES</span>_SYSTEM
            </h1>
            <p className="text-xs font-mono text-neon-cyan/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
              STATUS: ONLINE // TV_TRACKER v1.0
            </p>
          </div>
        </div>
        <div className="font-mono text-sm text-text-secondary border-l-2 border-neon-yellow/30 pl-4">
          &gt; Loading {series.length} series from collection...
          <span className="text-neon-yellow animate-pulse">_</span>
        </div>
      </div>

      {/* Client Grid */}
      <SeriesClient series={series} />
    </div>
  )
}
