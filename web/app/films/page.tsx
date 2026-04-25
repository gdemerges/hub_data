import { Suspense } from 'react'
import { FilmStrip } from '@phosphor-icons/react/dist/ssr'
import { getFilmsData } from '@/lib/data'
import { FilmsClient } from '@/components/films-client'
import { PageHeader } from '@/components'

export const revalidate = 3600

export default async function FilmsPage() {
  const films = await getFilmsData()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="Films"
        subtitle={`${films.length} films vus`}
        color="terracotta"
        icon={FilmStrip}
      />
      <Suspense>
        <FilmsClient films={films} />
      </Suspense>
    </div>
  )
}
