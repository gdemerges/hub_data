import { getFilmsData } from '@/lib/data'
import { FilmsClient } from '@/components/films-client'
import { PageHeader } from '@/components'

export default async function FilmsPage() {
  const films = await getFilmsData()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="FILMS"
        systemName="SYSTEM"
        statusDetail="CINEMA_TRACKER v1.0"
        loadingMessage={`Loading ${films.length} films from collection...`}
        color="neon-magenta"
      />
      <FilmsClient films={films} />
    </div>
  )
}
