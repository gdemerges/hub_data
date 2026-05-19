/**
 * Bandeau atmosphérique de l'aperçu : gradient-mesh solarpunk + orbes
 * flottants très discrets pour donner de la profondeur sans bruit visuel.
 * Le contenu (PageHeader…) passe en children, au-dessus du décor.
 */
export function OverviewHero({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="gradient-mesh relative overflow-hidden rounded-3xl border border-border-subtle shadow-soft mb-12 px-6 sm:px-10 py-10 sm:py-12"
      style={
        {
          '--mesh-a': '90 125 74',
          '--mesh-b': '184 107 60',
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
