'use client'

import { useState, useRef, useEffect } from 'react'
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
  Code,
  MusicNote,
  PersonSimpleRun,
  Compass,
  List,
  X,
  MagnifyingGlass,
  Leaf,
  CaretDown,
  Stack,
  Heartbeat,
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

interface NavItem {
  href: string
  label: string
  icon: Icon
  color: Accent
}

interface NavGroup {
  label: string
  icon: Icon
  color: Accent
  items: NavItem[]
}

type NavEntry = NavItem | NavGroup

function isGroup(e: NavEntry): e is NavGroup {
  return 'items' in e
}

const navEntries: NavEntry[] = [
  { href: '/', label: 'Aperçu', icon: House, color: 'moss' },
  { href: '/insights', label: 'Insights', icon: Sparkle, color: 'fern' },
  {
    label: 'Médias',
    icon: Stack,
    color: 'terracotta',
    items: [
      { href: '/games', label: 'Jeux', icon: GameController, color: 'moss' },
      { href: '/films', label: 'Films', icon: FilmStrip, color: 'terracotta' },
      { href: '/series', label: 'Séries', icon: Television, color: 'saffron' },
      { href: '/books', label: 'Lecture', icon: Books, color: 'indigo' },
      { href: '/spotify', label: 'Musique', icon: MusicNote, color: 'leaf' },
    ],
  },
  {
    label: 'Vie',
    icon: Heartbeat,
    color: 'rust',
    items: [
      { href: '/sport', label: 'Sport', icon: PersonSimpleRun, color: 'rust' },
      { href: '/voyages', label: 'Voyages', icon: Compass, color: 'sage' },
      { href: '/rencontres', label: 'Rencontres', icon: HeartHalf, color: 'clay' },
    ],
  },
  { href: '/github', label: 'Dev', icon: Code, color: 'indigo' },
]

// Flat list for the mobile menu / utilities.
const flatItems: NavItem[] = navEntries.flatMap(e => (isGroup(e) ? e.items : [e]))

export function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const groupRef = useRef<HTMLDivElement | null>(null)

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!openGroup) return
    const onDown = (e: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenGroup(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openGroup])

  const NavLink = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const isActive = pathname === item.href
    const Icon = item.icon
    return (
      <Link
        href={item.href}
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-soft',
          isActive
            ? `${accentBg[item.color]} ${accentText[item.color]}`
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
        )}
      >
        <Icon
          size={18}
          weight={isActive ? 'duotone' : 'regular'}
          className={cn(
            'transition-transform duration-300 ease-spring',
            isActive ? 'scale-110' : 'group-hover:scale-110',
          )}
        />
        <span className="whitespace-nowrap">{item.label}</span>
        <span
          aria-hidden
          className={cn(
            'absolute left-3 right-3 -bottom-0.5 h-px origin-left transition-transform duration-500 ease-soft',
            isActive
              ? `scale-x-100 ${accentText[item.color]}`
              : 'scale-x-0 group-hover:scale-x-100 text-border-default',
          )}
          style={{ background: 'currentColor' }}
        />
      </Link>
    )
  }

  const GroupTrigger = ({ group }: { group: NavGroup }) => {
    const isOpen = openGroup === group.label
    const hasActiveChild = group.items.some(it => pathname === it.href)
    const Icon = group.icon
    return (
      <div className="relative" ref={isOpen ? groupRef : undefined}>
        <button
          onClick={() => setOpenGroup(isOpen ? null : group.label)}
          className={cn(
            'group flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-soft',
            hasActiveChild
              ? `${accentBg[group.color]} ${accentText[group.color]}`
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
          )}
        >
          <Icon
            size={18}
            weight={hasActiveChild ? 'duotone' : 'regular'}
            className={cn(
              'transition-transform duration-300 ease-spring',
              hasActiveChild ? 'scale-110' : 'group-hover:scale-110',
            )}
          />
          <span className="whitespace-nowrap">{group.label}</span>
          <CaretDown
            size={12}
            weight="bold"
            className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 min-w-[180px] py-2 bg-bg-primary border border-border-subtle rounded-xl shadow-soft-lg z-50 animate-fade-in">
            {group.items.map(item => {
              const isActive = pathname === item.href
              const ItemIcon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenGroup(null)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm transition-colors',
                    isActive
                      ? `${accentBg[item.color]} ${accentText[item.color]}`
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
                  )}
                >
                  <ItemIcon
                    size={16}
                    weight={isActive ? 'duotone' : 'regular'}
                    className={accentText[item.color]}
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/85 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span
              className="p-1.5 rounded-xl bg-earth-moss/10 border border-earth-moss/30 transition-transform duration-500 ease-spring group-hover:rotate-[-12deg] group-hover:scale-110"
              style={{ transformOrigin: 'bottom center' }}
            >
              <Leaf size={20} weight="duotone" className="text-earth-moss" />
            </span>
            <span className="font-display text-lg font-medium tracking-tight text-text-primary">
              Hub Life
            </span>
          </Link>

          <nav className="hidden lg:flex items-center justify-end gap-1 flex-1">
            {navEntries.map(entry =>
              isGroup(entry) ? (
                <GroupTrigger key={entry.label} group={entry} />
              ) : (
                <NavLink key={entry.href} item={entry} />
              )
            )}
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
            {flatItems.map((item) => (
              <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
