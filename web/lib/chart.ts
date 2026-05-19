/**
 * Palette data-viz partagée. Les couleurs sont des références aux CSS vars
 * `--dv-*` (définies light + dark dans globals.css) : un seul point de vérité,
 * et tous les charts shiftent correctement en thème sombre.
 */

export const CHART_SERIES = [
  'rgb(var(--dv-1))',
  'rgb(var(--dv-2))',
  'rgb(var(--dv-3))',
  'rgb(var(--dv-4))',
  'rgb(var(--dv-5))',
  'rgb(var(--dv-6))',
  'rgb(var(--dv-7))',
  'rgb(var(--dv-8))',
] as const

export const CHART_GRID = 'rgb(var(--dv-grid))'
export const CHART_AXIS = 'rgb(var(--dv-axis))'

/** Couleur de série par index (cyclique). */
export function seriesColor(i: number): string {
  return CHART_SERIES[i % CHART_SERIES.length]
}

/**
 * Normalise une couleur potentiellement héritée (hex en dur, classe Tailwind)
 * vers une couleur de série thémée. On ne conserve une couleur explicite que
 * si elle est déjà une CSS var (donc dark-aware) ; sinon on retombe sur la
 * palette indexée pour garantir la cohérence et le bon contraste en sombre.
 */
export function themedColor(raw: string | undefined, index: number): string {
  if (raw && (raw.startsWith('rgb(var(') || raw.startsWith('var('))) return raw
  return seriesColor(index)
}
