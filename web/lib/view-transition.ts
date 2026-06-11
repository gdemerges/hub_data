// Helpers View Transitions API. Fallback silencieux : sans support navigateur
// (Firefox, vieux Safari) ou avec prefers-reduced-motion, la mise à jour
// s'applique directement — comportement identique à avant.

type DocumentWithVT = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> }
}

export function canUseViewTransition(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false
  if (!('startViewTransition' in document)) return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Enrobe une mise à jour DOM dans une View Transition.
// Résout quand la transition est terminée (immédiatement en fallback).
export function withViewTransition(update: () => void): Promise<void> {
  if (!canUseViewTransition()) {
    update()
    return Promise.resolve()
  }
  const doc = document as DocumentWithVT
  return doc.startViewTransition!(update).finished.catch(() => {})
}

// ——— Coordination des transitions de route ———
// startViewTransition doit attendre que la nouvelle page soit rendue avant de
// capturer l'état "new". router.push ne renvoie pas de promesse : on attend le
// changement de pathname signalé par RouteTransitionListener (components/
// transition-link.tsx), avec un timeout de sécurité.

let pendingResolve: (() => void) | null = null

// Appelé à chaque changement de pathname.
export function notifyNavigationDone(): void {
  pendingResolve?.()
  pendingResolve = null
}

export function waitForNavigation(timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      if (pendingResolve === done) pendingResolve = null
      resolve()
    }, timeoutMs)
    const done = () => {
      clearTimeout(timer)
      resolve()
    }
    pendingResolve = done
  })
}

// Navigation avec cross-fade. La classe `route-changing` active le CSS dédié
// dans globals.css sans perturber la transition du theme toggle (qui utilise
// `theme-changing` sur le même mécanisme).
export function navigateWithViewTransition(push: () => void): void {
  if (!canUseViewTransition()) {
    push()
    return
  }
  const root = document.documentElement
  root.classList.add('route-changing')
  const doc = document as DocumentWithVT
  doc.startViewTransition!(async () => {
    push()
    await waitForNavigation()
  }).finished.finally(() => root.classList.remove('route-changing'))
}
