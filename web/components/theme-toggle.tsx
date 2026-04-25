'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Desktop } from '@phosphor-icons/react'

type Theme = 'dark' | 'light'
type Preference = Theme | 'system'
const STORAGE_KEY = 'hub-theme'

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(t: Theme) {
  const root = document.documentElement
  root.classList.toggle('light', t === 'light')
  root.classList.toggle('dark', t === 'dark')
}

export function ThemeToggle() {
  const [pref, setPref] = useState<Preference>('system')
  const [resolved, setResolved] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initialPref: Preference = stored ?? 'system'
    setPref(initialPref)
    const initialTheme = stored ?? systemTheme()
    setResolved(initialTheme)
    applyTheme(initialTheme)
    setMounted(true)

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      // Only react to system changes when user hasn't picked a manual override
      if (!localStorage.getItem(STORAGE_KEY)) {
        const next: Theme = mql.matches ? 'dark' : 'light'
        setResolved(next)
        applyTheme(next)
      }
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Cycle: system → light → dark → system
  const cycle = () => {
    const order: Preference[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(pref) + 1) % order.length]
    setPref(next)
    if (next === 'system') {
      localStorage.removeItem(STORAGE_KEY)
      const sys = systemTheme()
      setResolved(sys)
      applyTheme(sys)
    } else {
      localStorage.setItem(STORAGE_KEY, next)
      setResolved(next)
      applyTheme(next)
    }
  }

  if (!mounted) return null

  const Icon = pref === 'system' ? Desktop : pref === 'dark' ? Moon : Sun
  const label =
    pref === 'system'
      ? `Thème automatique (actuellement ${resolved === 'dark' ? 'sombre' : 'clair'})`
      : pref === 'dark'
        ? 'Thème sombre'
        : 'Thème clair'

  return (
    <button
      onClick={cycle}
      className="p-2 text-text-secondary border border-border-subtle hover:border-earth-moss/40 hover:text-earth-moss rounded-full transition-colors"
      aria-label={label}
      title={label}
    >
      <Icon size={16} weight="duotone" />
    </button>
  )
}
