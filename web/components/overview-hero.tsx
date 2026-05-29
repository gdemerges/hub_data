import Image from 'next/image'
import type { HeroBackdrop } from '@/lib/hero-backdrop'

/**
 * Bandeau atmosphérique de l'aperçu.
 * - Avec `backdrop` : image TMDB en fond + voile chaud (basé sur --bg-primary,
 *   donc adaptatif clair/sombre) pour garder le texte éditorial sombre lisible,
 *   plus un crédit discret du titre.
 * - Sans `backdrop` : gradient-mesh solarpunk + orbes flottants (fallback).
 * Le contenu (PageHeader…) passe en children, au-dessus du décor (z-[2]).
 */
export function OverviewHero({
  children,
  backdrop,
}: {
  children: React.ReactNode
  backdrop?: HeroBackdrop
}) {
  if (backdrop) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-border-subtle shadow-soft mb-12 px-6 sm:px-10 py-10 sm:py-12">
        <Image
          src={backdrop.url}
          alt=""
          fill
          priority
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="object-cover saturate-[0.9] scale-105"
        />
        {/* Voile chaud : dense côté titre (bas-gauche), fondant vers l'image. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgb(var(--bg-primary) / 0.94) 0%, rgb(var(--bg-primary) / 0.78) 38%, rgb(var(--bg-primary) / 0.4) 70%, rgb(var(--bg-primary) / 0.25) 100%)',
          }}
        />
        {/* Voile haut localisé : protège la ligne surtitre/dateline sans assombrir l'image. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-24"
          style={{
            background: 'linear-gradient(to bottom, rgb(var(--bg-primary) / 0.75), transparent)',
          }}
        />
        <div className="relative z-[2]">{children}</div>
        <span
          className="absolute bottom-3 right-5 z-[2] rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary backdrop-blur-sm"
          style={{ backgroundColor: 'rgb(var(--bg-primary) / 0.55)' }}
        >
          {backdrop.title}
        </span>
      </section>
    )
  }

  return (
    <section
      className="gradient-mesh relative overflow-hidden rounded-3xl border border-border-subtle shadow-soft mb-12 px-6 sm:px-10 py-10 sm:py-12"
      style={
        {
          '--mesh-a': '163 181 152',
          '--mesh-b': '79 140 74',
          '--mesh-c': '123 168 150',
        } as React.CSSProperties
      }
    >
      {/* Orbes flottants — derrière le contenu, n'interceptent rien */}
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent) / 0.5), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle, rgb(var(--accent-warm) / 0.45), transparent 70%)',
          animationDelay: '1.5s',
        }}
      />
      <div className="relative z-[2]">{children}</div>
    </section>
  )
}
