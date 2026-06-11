import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canUseViewTransition,
  notifyNavigationDone,
  waitForNavigation,
  withViewTransition,
} from './view-transition'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function stubBrowser({ vt = true, reduce = false }: { vt?: boolean; reduce?: boolean }) {
  const startViewTransition = vi.fn((cb: () => void) => {
    cb()
    return { finished: Promise.resolve() }
  })
  vi.stubGlobal('document', {
    ...(vt ? { startViewTransition } : {}),
    documentElement: { classList: { add: vi.fn(), remove: vi.fn() } },
  })
  vi.stubGlobal('window', {
    matchMedia: vi.fn(() => ({ matches: reduce })),
  })
  return { startViewTransition }
}

describe('canUseViewTransition', () => {
  it('false côté serveur (pas de document)', () => {
    expect(canUseViewTransition()).toBe(false)
  })

  it('false sans startViewTransition', () => {
    stubBrowser({ vt: false })
    expect(canUseViewTransition()).toBe(false)
  })

  it('false si prefers-reduced-motion', () => {
    stubBrowser({ reduce: true })
    expect(canUseViewTransition()).toBe(false)
  })

  it('true avec support et sans reduced-motion', () => {
    stubBrowser({})
    expect(canUseViewTransition()).toBe(true)
  })
})

describe('withViewTransition', () => {
  it('fallback : exécute la mise à jour directement sans support', async () => {
    const update = vi.fn()
    await withViewTransition(update)
    expect(update).toHaveBeenCalledOnce()
  })

  it('enrobe dans startViewTransition quand supporté', async () => {
    const { startViewTransition } = stubBrowser({})
    const update = vi.fn()
    await withViewTransition(update)
    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledOnce()
  })
})

describe('waitForNavigation', () => {
  it('se résout sur notifyNavigationDone', async () => {
    const p = waitForNavigation(5000)
    notifyNavigationDone()
    await expect(p).resolves.toBeUndefined()
  })

  it('se résout au timeout si la navigation ne signale rien', async () => {
    vi.useFakeTimers()
    const p = waitForNavigation(3000)
    vi.advanceTimersByTime(3000)
    await expect(p).resolves.toBeUndefined()
  })
})
