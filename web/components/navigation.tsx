'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  House,
  Sparkle,
  GameController,
  FilmStrip,
  Television,
  Books,
  HeartHalf,
  GithubLogo,
  MusicNote,
  PersonSimpleRun,
  Compass,
  SteamLogo,
  List,
  X,
  MagnifyingGlass,
  Leaf,
  type Icon,
} from '@phosphor-icons/react'
import { ThemeToggle } from './theme-toggle'

type Accent = 'moss' | 'fern' | 'terracotta' | 'rust' | 'saffron' | 'clay' | 'indigo' | 'sage' | 'leaf'

const accentText: Record<Accent, string> = {
  moss: 'text-earth-moss',
  fern: 'text-earth-fern',
  terracotta: 'text-earth-terracotta',
  rust: 'text-earth-rust',
  saffron: 'text-earth-saffron',
  clay: 'text-earth-clay',
  indigo: 'text-earth-indigo',
  sage: 'text-earth-sage',
  leaf: 'text-earth-leaf',
}
const accentBg: Record<Accent, string> = {
  moss: 'bg-earth-moss/10',
  fern: 'bg-earth-fern/10',
  terracotta: 'bg-earth-terracotta/10',
  rust: 'bg-earth-rust/10',
  saffron: 'bg-earth-saffron/12',
  clay: 'bg-earth-clay/10',
  indigo: 'bg-earth-indigo/10',
  sage: 'bg-earth-sage/15',
  leaf: 'bg-earth-leaf/10',
}

const navItems: { href: string; label: string; icon: Icon; color: Accent }[] = [
  { href: '/', label: 'Aperçu', icon: House, color: 'moss' },
  { href: '/insights', label: 'Insights', icon: Sparkle, color: 'fern' },
  { href: '/games', label: 'Jeux', icon: GameController, color: 'moss' },
  { href: '/films', label: 'Films', icon: FilmStrip, color: 'terracotta' },
  { href: '/series', label: 'Séries', icon: Television, color: 'saffron' },
  { href: '/books', label: 'Lecture', icon: Books, color: 'indigo' },
  { href: '/rencontres', label: 'Rencontres', icon: HeartHalf, color: 'clay' },
  { href: '/github', label: 'GitHub', icon: GithubLogo, color: 'indigo' },
  { href: '/spotify', label: 'Spotify', icon: MusicNote, color: 'leaf' },
  { href: '/sport', label: 'Sport', icon: PersonSimpleRun, color: 'rust' },
  { href: '/voyages', label: 'Voyages', icon: Compass, color: 'sage' },
  { href: '/steam', label: 'Steam', icon: SteamLogo, color: 'moss' },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavLink = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
    const isActive = pathname === item.href
    const Icon = item.icon
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          'relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors',
          isActive
            ? `${accentBg[item.color]} ${accentText[item.color]}`
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
        )}
      >
        <Icon size={18} weight={isActive ? 'duotone' : 'regular'} />
        <span className="whitespace-nowrap">{item.label}</span>
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/85 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="p-1.5 rounded-xl bg-earth-moss/10 border border-earth-moss/30">
              <Leaf size={20} weight="duotone" className="text-earth-moss" />
            </span>
            <span className="font-display text-lg font-medium tracking-tight text-text-primary">
              Hub Life
            </span>
          </Link>

          <nav className="hidden lg:flex flex-wrap items-center justify-end gap-1 flex-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary border border-border-subtle hover:border-earth-moss/40 hover:text-text-primary rounded-full transition-colors"
              aria-label="Recherche globale"
            >
              <MagnifyingGlass size={16} />
              <span>Rechercher</span>
              <kbd className="ml-1 px-1.5 py-0.5 bg-bg-card rounded text-[10px] border border-border-subtle font-mono">⌘K</kbd>
            </button>

            <ThemeToggle />

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-text-secondary border border-border-subtle rounded-full hover:bg-bg-hover transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-bg-primary border-b border-border-subtle shadow-soft-md">
          <nav className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
