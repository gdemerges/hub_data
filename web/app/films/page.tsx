import { FilmStrip } from '@phosphor-icons/react/dist/ssr'
import { getFilmsData } from '@/lib/data'
import { computeFilmStats } from '@/lib/media-stats'
import { FilmsPageClient } from '@/components/films-page-client'
import { PageHeader } from '@/components'

export const revalidate = 3600

export default async function FilmsPage() {
  const films = await getFilmsData()
  const filmStats = computeFilmStats(films)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Films"
        subtitle="Catalogue personnel · notes et favoris"
        eyebrow="Catalogue"
        dateline={`${films.length.toLocaleString('fr-FR')} films`}
        color="terracotta"
        icon={FilmStrip}
      />
      <FilmsPageClient films={films} filmStats={filmStats} />
    </div>
  )
}
