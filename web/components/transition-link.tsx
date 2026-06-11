'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type ComponentProps, type MouseEvent, useEffect } from 'react'
import { navigateWithViewTransition, notifyNavigationDone } from '@/lib/view-transition'

// Monté une seule fois dans le layout : signale la fin de navigation aux
// View Transitions en attente (voir lib/view-transition.ts).
export function RouteTransitionListener() {
  const pathname = usePathname()
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname déclenche volontairement l'effet à chaque navigation
  useEffect(() => {
    notifyNavigationDone()
  }, [pathname])
  return null
}

type TransitionLinkProps = ComponentProps<typeof Link>

// next/link avec cross-fade View Transition. Laisse le navigateur gérer les
// clics modifiés (nouvel onglet, etc.) et les href non-string.
export function TransitionLink({ href, onClick, ...rest }: TransitionLinkProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (typeof href !== 'string' || rest.target === '_blank') return
    // Même route : pathname ne changera pas, la transition resterait figée
    // jusqu'au timeout → navigation classique sans transition.
    if (href === pathname) return
    e.preventDefault()
    navigateWithViewTransition(() => router.push(href))
  }

  return <Link href={href} {...rest} onClick={handleClick} />
}
