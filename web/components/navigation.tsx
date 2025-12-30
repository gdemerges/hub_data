'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Gamepad2, Film, Tv, Github, LayoutDashboard, Activity, Music, Terminal, MapPin, Dumbbell, TrendingUp, BookOpen, Heart } from 'lucide-react'

const colorClasses = {
  cyan: {
    text: 'text-neon-cyan',
    hover: 'hover:text-neon-cyan hover:bg-neon-cyan/10',
    active: 'text-neon-cyan bg-neon-cyan/10',
    shadow: 'bg-neon-cyan shadow-[0_0_10px_#00ffff]',
  },
  magenta: {
    text: 'text-neon-magenta',
    hover: 'hover:text-neon-magenta hover:bg-neon-magenta/10',
    active: 'text-neon-magenta bg-neon-magenta/10',
    shadow: 'bg-neon-magenta shadow-[0_0_10px_#ff00ff]',
  },
  green: {
    text: 'text-neon-green',
    hover: 'hover:text-neon-green hover:bg-neon-green/10',
    active: 'text-neon-green bg-neon-green/10',
    shadow: 'bg-neon-green shadow-[0_0_10px_#00ff88]',
  },
  yellow: {
    text: 'text-neon-yellow',
    hover: 'hover:text-neon-yellow hover:bg-neon-yellow/10',
    active: 'text-neon-yellow bg-neon-yellow/10',
    shadow: 'bg-neon-yellow shadow-[0_0_10px_#ffff00]',
  },
  orange: {
    text: 'text-neon-orange',
    hover: 'hover:text-neon-orange hover:bg-neon-orange/10',
    active: 'text-neon-orange bg-neon-orange/10',
    shadow: 'bg-neon-orange shadow-[0_0_10px_#ff8800]',
  },
  blue: {
    text: 'text-blue-400',
    hover: 'hover:text-blue-400 hover:bg-blue-400/10',
    active: 'text-blue-400 bg-blue-400/10',
    shadow: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]',
  },
  purple: {
    text: 'text-purple-400',
    hover: 'hover:text-purple-400 hover:bg-purple-400/10',
    active: 'text-purple-400 bg-purple-400/10',
    shadow: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]',
  },
  red: {
    text: 'text-neon-red',
    hover: 'hover:text-neon-red hover:bg-neon-red/10',
    active: 'text-neon-red bg-neon-red/10',
    shadow: 'bg-neon-red shadow-[0_0_10px_#ff0000]',
  },
}

const navItems = [
  { href: '/', label: 'Aperçu', icon: LayoutDashboard, color: 'cyan' as const },
  { href: '/insights', label: 'Insights', icon: TrendingUp, color: 'magenta' as const },
  { href: '/games', label: 'Jeux', icon: Gamepad2, color: 'green' as const },
  { href: '/films', label: 'Films', icon: Film, color: 'magenta' as const },
  { href: '/series', label: 'Séries', icon: Tv, color: 'yellow' as const },
  { href: '/books', label: 'Livres', icon: BookOpen, color: 'blue' as const },
  { href: '/rencontres', label: 'Rencontres', icon: Heart, color: 'red' as const },
  { href: '/github', label: 'GitHub', icon: Github, color: 'cyan' as const },
  { href: '/spotify', label: 'Spotify', icon: Music, color: 'green' as const },
  { href: '/sport', label: 'Sport', icon: Dumbbell, color: 'orange' as const },
  { href: '/voyages', label: 'Voyages', icon: MapPin, color: 'purple' as const },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/90 backdrop-blur-xl border-b border-neon-cyan/20">
      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4 relative">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Terminal className="w-8 h-8 text-neon-cyan group-hover:animate-glitch" />
              <div className="absolute inset-0 text-neon-magenta opacity-0 group-hover:opacity-50 blur-sm">
                <Terminal className="w-8 h-8" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold tracking-wider text-neon-cyan neon-text-subtle">
                HUB_LIFE
              </span>
              <span className="text-[10px] font-mono text-neon-green/70 tracking-widest">
                v2.0.0 // ONLINE
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              const colors = colorClasses[item.color]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-medium transition-all duration-300',
                    isActive
                      ? `${colors.active} neon-border`
                      : `text-text-secondary ${colors.hover}`
                  )}
                >
                  <Icon className={cn(
                    'w-4 h-4 transition-all',
                    isActive && 'drop-shadow-[0_0_8px_currentColor]'
                  )} />
                  <span className="hidden sm:inline uppercase tracking-wider text-xs">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className={cn(
                      'absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5',
                      colors.shadow
                    )} />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
