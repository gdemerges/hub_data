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
]

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
]

// 'unsafe-inline' on style-src est requis par next/font + Tailwind.
// 'unsafe-eval' uniquement en dev (Next dev server).
const isProd = process.env.NODE_ENV === 'production'
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https://${IMG_HOSTS.join(' https://')}`,
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
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig = {
  images: {
    remotePatterns: IMG_HOSTS.map((hostname) => ({ protocol: 'https', hostname })),
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    turbo: {
      root: '.',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

module.exports = nextConfig
