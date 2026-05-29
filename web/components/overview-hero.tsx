import Image from 'next/image'
import type { HeroBackdrop } from '@/lib/hero-backdrop'

/**
 * Bandeau atmosphérique de l'aperçu.
 * - Avec `backdrop` : image TMDB en fond, mode « cinéma » — l'image reste vive,
 *   légèrement assombrie par un dégradé chaud-sombre pour faire ressortir le
 *   texte clair (le header passe en `overlay`), plus un crédit discret du titre.
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
          className="object-cover scale-105"
        />
        {/* Assombrissement cinéma : tons chaud-sombres, dense en bas (zone texte),
            l'image reste vive vers le haut/droite. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgb(20 16 12 / 0.82) 0%, rgb(20 16 12 / 0.4) 45%, rgb(20 16 12 / 0.12) 100%)',
          }}
        />
        {/* Léger renfort haut pour la ligne surtitre/dateline. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28"
          style={{ background: 'linear-gradient(to bottom, rgb(20 16 12 / 0.5), transparent)' }}
        />
        <div className="relative z-[2] [text-shadow:0_1px_12px_rgb(0_0_0_/_0.55)]">{children}</div>
        <span
          className="absolute bottom-3 right-5 z-[2] rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm"
          style={{ backgroundColor: 'rgb(0 0 0 / 0.4)' }}
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
