import { getSeriesData } from '@/lib/data'
import { SeriesClient } from '@/components/series-client'
import { Tv } from 'lucide-react'

export default async function SeriesPage() {
  const series = await getSeriesData()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-accent-primary/10 rounded-xl">
          <Tv className="w-6 h-6 text-accent-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Séries</h1>
          <p className="text-sm text-text-muted">{series.length} séries dans votre collection</p>
        </div>
      </div>

      {/* Client Grid */}
      <SeriesClient series={series} />
    </div>
  )
}
