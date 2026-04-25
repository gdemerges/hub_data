'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from '@phosphor-icons/react'

type Theme = 'dark' | 'light'
const STORAGE_KEY = 'hub-theme'

function applyTheme(t: Theme) {
  const root = document.documentElement
  root.classList.toggle('light', t === 'light')
  root.classList.toggle('dark', t === 'dark')
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'light'
    setTheme(stored)
    applyTheme(stored)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      className="p-2 text-text-secondary border border-border-subtle hover:border-earth-moss/40 hover:text-earth-moss rounded-full transition-colors"
      aria-label={theme === 'dark' ? 'Basculer en thème clair' : 'Basculer en thème sombre'}
      title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
    >
      {theme === 'dark' ? <Sun size={16} weight="duotone" /> : <Moon size={16} weight="duotone" />}
    </button>
  )
}
