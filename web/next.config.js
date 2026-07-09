const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */

const IMG_HOSTS = [
  'images.igdb.com',
  'image.tmdb.org',
  'avatars.githubusercontent.com',
  'avatars.steamstatic.com',
  'media.steampowered.com',
  'i.scdn.co',
  'mosaic.scdn.co',
  'platform-lookaside.fbsbx.com',
  'dgalywyr863hv.cloudfront.net',
  'books.google.com',
  'covers.openlibrary.org',
]

// Wildcard image hosts (Spotify users linked via Facebook serve avatars from
// regional fbcdn subdomains like scontent-fra5-1.xx.fbcdn.net).
const IMG_WILDCARD_HOSTS = ['*.fbcdn.net']

const CONNECT_HOSTS = [
  'api.themoviedb.org',
  'api.igdb.com',
  'id.twitch.tv',
  'api.spotify.com',
  'accounts.spotify.com',
  'api.github.com',
  'api.strava.com',
  'www.strava.com',
  'api.steampowered.com',
  'cdn.jsdelivr.net', // world-atlas geojson for maps
]

// 'unsafe-inline' on style-src est requis par next/font + Tailwind.
// 'unsafe-eval' uniquement en dev (Next dev server).
const isProd = process.env.NODE_ENV === 'production'
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https://${IMG_HOSTS.join(' https://')} https://${IMG_WILDCARD_HOSTS.join(' https://')}`,
  `connect-src 'self' https://${CONNECT_HOSTS.join(' https://')}`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig = {
  // Permet d'isoler un build de vérification (NEXT_BUILD_DIR=.next-verify
  // next build) du `.next` utilisé par `next dev` : sinon le build écrase les
  // manifests du serveur dev en cours et provoque des ENOENT. Sans la var, le
  // comportement par défaut (`.next`) reste inchangé pour dev/build/Vercel.
  ...(process.env.NEXT_BUILD_DIR ? { distDir: process.env.NEXT_BUILD_DIR } : {}),
  images: {
    remotePatterns: [
      ...IMG_HOSTS.map((hostname) => ({ protocol: 'https', hostname })),
      ...IMG_WILDCARD_HOSTS.map((hostname) => ({ protocol: 'https', hostname })),
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  // TypeScript 7 (compilateur natif Go) a déplacé son API JS sous
  // `typescript/unstable/*` ; le typecheck intégré de `next build` appelle
  // encore l'ancienne API top-level et échoue. On désactive donc le typecheck
  // interne de Next et on rebranche un `tsc --noEmit` explicite en amont du
  // build (script `typecheck`, chaîné dans `build`/`vercel-build`) : même
  // garantie de types, exécutée par le moteur natif rapide. À retirer quand
  // Next supportera l'API TS 7.
  typescript: { ignoreBuildErrors: true },
  // reactCompiler a quitté `experimental` en Next 16 (option stable racine).
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@phosphor-icons/react', 'react-simple-maps'],
    staleTimes: { dynamic: 30, static: 180 },
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
