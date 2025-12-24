import { getFilmsData } from '@/lib/data'
import { FilmsClient } from '@/components/films-client'
import { Film } from 'lucide-react'

export default async function FilmsPage() {
  const films = await getFilmsData()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-accent-primary/10 rounded-xl">
          <Film className="w-6 h-6 text-accent-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Films</h1>
          <p className="text-sm text-text-muted">{films.length} films dans votre collection</p>
        </div>
      </div>

      {/* Client Grid */}
      <FilmsClient films={films} />
    </div>
  )
}
