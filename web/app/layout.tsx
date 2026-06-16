import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import { Suspense } from 'react'
import {
  CommandPalette,
  Footer,
  Navigation,
  RouteProgress,
  RouteTransitionListener,
  ServiceWorkerRegister,
} from '@/components'
import { SWRProvider } from '@/lib/swr-config'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
})
// Police variable : on charge l'axe optique `opsz` (9→144) en plus du poids,
// pour que les grands titres gagnent en contraste/élégance (optical sizing).
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz'],
})

export const metadata: Metadata = {
  title: 'Hub Life',
  description: 'Tableau de bord pour suivre vos jeux, films, séries et activité GitHub',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Hub Life', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: '#5a7d4a',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: script inline anti-flash de thème, exécuté avant l'hydratation pour éviter le FOUC clair/sombre
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('hub-theme');var t=s||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('light',t==='light');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} font-sans`}
      >
        <SWRProvider>
          <ServiceWorkerRegister />
          <a href="#main" className="skip-link">
            Aller au contenu
          </a>
          <Suspense fallback={null}>
            <RouteProgress />
            <RouteTransitionListener />
          </Suspense>
          <Navigation />
          <CommandPalette />
          <main id="main" className="min-h-screen">
            <Suspense fallback={<PageFallback />}>{children}</Suspense>
          </main>
          <Footer />
        </SWRProvider>
      </body>
    </html>
  )
}
