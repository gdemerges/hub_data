import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter } from 'next/font/google'
import { Navigation } from '@/components'
import { SWRProvider } from '@/lib/swr-config'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hub Life',
  description: 'Tableau de bord pour suivre vos jeux, films, séries et activité GitHub',
}

function PageFallback() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-bg-card rounded-2xl border border-border-subtle" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-bg-card rounded-2xl border border-border-subtle" />
          ))}
        </div>
        <div className="h-64 bg-bg-card rounded-2xl border border-border-subtle" />
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>
        <SWRProvider>
          <Navigation />
          <main className="min-h-screen pb-16">
            <Suspense fallback={<PageFallback />}>
              {children}
            </Suspense>
          </main>
        </SWRProvider>
      </body>
    </html>
  )
}
