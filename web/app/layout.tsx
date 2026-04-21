import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter, JetBrains_Mono, Orbitron } from 'next/font/google'
import { Navigation, CommandPalette, ServiceWorkerRegister } from '@/components'
import { SWRProvider } from '@/lib/swr-config'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})
const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'Hub Life',
  description: 'Tableau de bord pour suivre vos jeux, films, séries et activité GitHub',
  manifest: '/manifest.json',
  themeColor: '#00ffff',
  appleWebApp: { capable: true, title: 'Hub Life', statusBarStyle: 'black-translucent' },
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('hub-theme')||'dark';document.documentElement.classList.toggle('light',t==='light');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} ${jetbrainsMono.variable} ${orbitron.variable}`}>
        <SWRProvider>
          <ServiceWorkerRegister />
          <a href="#main" className="skip-link">Aller au contenu</a>
          <Navigation />
          <CommandPalette />
          <main id="main" className="min-h-screen pb-16">
            <Suspense fallback={<PageFallback />}>
              {children}
            </Suspense>
          </main>
        </SWRProvider>
      </body>
    </html>
  )
}
