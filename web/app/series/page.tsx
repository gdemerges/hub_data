import { Television } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components'
import { SeriesPageClient } from '@/components/series-page-client'
import { getSeriesData } from '@/lib/data'
import { formatWatchHours, totalSeriesMinutes } from '@/lib/series-time'

export const revalidate = 3600

export default async function SeriesPage() {
  const series = await getSeriesData()
  const watchMinutes = totalSeriesMinutes(series)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Séries"
        subtitle="Suivi des séries · notes et progression"
        eyebrow="Catalogue"
        dateline={
          watchMinutes > 0
            ? `${series.length.toLocaleString('fr-FR')} séries · ${formatWatchHours(watchMinutes)} de visionnage`
            : `${series.length.toLocaleString('fr-FR')} séries`
        }
        color="saffron"
        icon={Television}
      />
      <SeriesPageClient series={series} />
    </div>
  )
}
