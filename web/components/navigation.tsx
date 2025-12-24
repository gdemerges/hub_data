'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Circle, Gamepad2, Film, Tv, Github, LayoutDashboard } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Aperçu', icon: LayoutDashboard },
  { href: '/games', label: 'Jeux', icon: Gamepad2 },
  { href: '/films', label: 'Films', icon: Film },
  { href: '/series', label: 'Séries', icon: Tv },
  { href: '/github', label: 'GitHub', icon: Github },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Circle className="w-6 h-6 text-accent-primary fill-accent-primary" />
            <span className="text-xl font-bold text-text-primary tracking-tight">
              Hub Médias
            </span>
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
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
