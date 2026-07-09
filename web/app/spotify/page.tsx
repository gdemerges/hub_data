import { Suspense } from 'react'
import { SpotifyClient, SpotifySkeleton } from '@/components/spotify-client'
import { loadSpotify } from '@/lib/spotify'

export const revalidate = 3600

export const metadata = { title: 'Spotify' }

export default function SpotifyPage() {
  const promise = loadSpotify()
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Suspense fallback={<SpotifySkeleton />}>
        <SpotifyClient promise={promise} />
      </Suspense>
    </div>
  )
}
