import type { Config } from 'tailwindcss'

/**
 * Solarpunk palette.
 * Per-section accents are exposed under both their natural names
 * AND the legacy `neon-*` keys, so existing components keep compiling
 * during the migration. The legacy aliases will be removed in PR C.
 */
const earth = {
  parchment: '#f5efe2',
  cream: '#fffdf7',
  taupe: '#ebe2d0',
  taupeDark: '#c8bba1',
  ink: '#1d2a1c',
  moss: '#5a7d4a',
  mossDeep: '#3f5a35',
  mossSoft: '#8ab274',
  fern: '#7ba896',
  sage: '#a3b598',
  terracotta: '#b86b3c',
  rust: '#a8552c',
  saffron: '#d9a441',
  amber: '#c8893f',
  clay: '#b06868',
  indigo: '#3d5170',
  slate: '#4a4a3d',
  leaf: '#4f8c4a',
  wine: '#8e3a3a',
}

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
          hover: 'rgb(var(--bg-hover) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
        },
        border: {
          subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
          default: 'rgb(var(--border-default) / <alpha-value>)',
          neon: earth.moss + '4d',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        accent: {
          primary: earth.moss,
          secondary: earth.terracotta,
          tertiary: earth.fern,
          warning: earth.saffron,
          glow: 'rgb(90 125 74 / 0.15)',
        },
        earth,
        // Legacy section aliases — same keys as before, new earthy hues
        neon: {
          cyan: earth.fern,
          magenta: earth.terracotta,
          green: earth.moss,
          yellow: earth.saffron,
          orange: earth.rust,
          pink: earth.clay,
          red: earth.clay,
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'soft': '0 1px 2px rgb(35 30 20 / 0.04), 0 1px 3px rgb(35 30 20 / 0.06)',
        'soft-md': '0 4px 12px rgb(35 30 20 / 0.08), 0 2px 4px rgb(35 30 20 / 0.05)',
        'soft-lg': '0 10px 24px rgb(35 30 20 / 0.10), 0 4px 8px rgb(35 30 20 / 0.06)',
        // Legacy aliases — glow effects flattened to soft shadows
        'neon-cyan': '0 4px 12px rgb(123 168 150 / 0.25)',
        'neon-magenta': '0 4px 12px rgb(184 107 60 / 0.25)',
        'neon-green': '0 4px 12px rgb(90 125 74 / 0.25)',
        'neon-sm': '0 1px 3px rgb(35 30 20 / 0.06)',
        'neon-md': '0 4px 12px rgb(35 30 20 / 0.10)',
        'neon-lg': '0 10px 24px rgb(35 30 20 / 0.12)',
        'inner-glow': 'inset 0 1px 2px rgb(35 30 20 / 0.04)',
      },
    },
  },
  plugins: [],
}
export default config
