'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Gamepad2, Film, Tv, Github, LayoutDashboard, Activity, Music, Terminal, MapPin, Dumbbell } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Aperçu', icon: LayoutDashboard, color: 'cyan' },
  { href: '/games', label: 'Jeux', icon: Gamepad2, color: 'green' },
  { href: '/films', label: 'Films', icon: Film, color: 'magenta' },
  { href: '/series', label: 'Séries', icon: Tv, color: 'yellow' },
  { href: '/github', label: 'GitHub', icon: Github, color: 'cyan' },
  { href: '/steam', label: 'Steam', icon: Activity, color: 'blue' },
  { href: '/spotify', label: 'Spotify', icon: Music, color: 'green' },
  { href: '/sport', label: 'Sport', icon: Dumbbell, color: 'orange' },
  { href: '/voyages', label: 'Voyages', icon: MapPin, color: 'orange' },
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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-medium transition-all duration-300',
                    'hover:bg-neon-cyan/10',
                    isActive
                      ? 'text-neon-cyan bg-neon-cyan/10 neon-border'
                      : 'text-text-secondary hover:text-neon-cyan'
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
                    <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-neon-cyan shadow-[0_0_10px_#00ffff]" />
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
