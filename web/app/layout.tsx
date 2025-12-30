import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navigation } from '@/components'
import { SWRProvider } from '@/lib/swr-config'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hub Life',
  description: 'Tableau de bord pour suivre vos jeux, films, séries et activité GitHub',
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
          <main className="min-h-screen pb-16">{children}</main>
        </SWRProvider>
      </body>
    </html>
  )
}
