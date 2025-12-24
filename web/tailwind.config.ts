import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0b',
          secondary: '#111113',
          tertiary: '#18181b',
          hover: '#1f1f23',
          card: '#141416',
        },
        border: {
          subtle: '#27272a',
          default: '#3f3f46',
        },
        text: {
          primary: '#fafafa',
          secondary: '#a1a1aa',
          muted: '#71717a',
        },
        accent: {
          primary: '#6366f1',
          secondary: '#818cf8',
          glow: 'rgba(99, 102, 241, 0.15)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
