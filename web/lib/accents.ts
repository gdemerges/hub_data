import type { CSSProperties } from 'react'

/**
 * Source unique de la palette d'accents solarpunk.
 *
 * Vocabulaire canonique (noms de teintes earth) — partagé par PageHeader,
 * StatCard et les sections. Remplace les anciens noms hérités du thème neon
 * (cyan/magenta/green…) afin que toute l'app parle le même langage couleur.
 */
export type Accent =
  | 'moss'
  | 'fern'
  | 'terracotta'
  | 'rust'
  | 'saffron'
  | 'clay'
  | 'indigo'
  | 'sage'
  | 'leaf'

export interface AccentTokens {
  /** Classe utilitaire `text-*` */
  text: string
  /** Classe utilitaire `border-*` (opacité douce) */
  border: string
  /** Classe utilitaire `bg-*` pleine — pastilles, traits, rings */
  ring: string
  /** Triplet RGB de l'accent principal (`--accent`, mesh A/C) */
  accent: string
  /** Triplet RGB de la teinte chaude compagne (mesh B) */
  warm: string
}

export const ACCENTS: Record<Accent, AccentTokens> = {
  moss:       { text: 'text-earth-moss',       border: 'border-earth-moss/30',       ring: 'bg-earth-moss',       accent: '90 125 74',   warm: '138 178 116' },
  fern:       { text: 'text-earth-fern',       border: 'border-earth-fern/30',       ring: 'bg-earth-fern',       accent: '123 168 150', warm: '163 181 152' },
  terracotta: { text: 'text-earth-terracotta', border: 'border-earth-terracotta/30', ring: 'bg-earth-terracotta', accent: '184 107 60',  warm: '217 164 65'  },
  rust:       { text: 'text-earth-rust',       border: 'border-earth-rust/30',       ring: 'bg-earth-rust',       accent: '168 85 44',   warm: '217 164 65'  },
  saffron:    { text: 'text-earth-saffron',    border: 'border-earth-saffron/30',    ring: 'bg-earth-saffron',    accent: '217 164 65',  warm: '184 107 60'  },
  clay:       { text: 'text-earth-clay',       border: 'border-earth-clay/30',       ring: 'bg-earth-clay',       accent: '176 104 104', warm: '184 107 60'  },
  indigo:     { text: 'text-earth-indigo',     border: 'border-earth-indigo/30',     ring: 'bg-earth-indigo',     accent: '61 81 112',   warm: '123 168 150' },
  sage:       { text: 'text-earth-sage',       border: 'border-earth-sage/40',       ring: 'bg-earth-sage',       accent: '163 181 152', warm: '90 125 74'   },
  leaf:       { text: 'text-earth-leaf',       border: 'border-earth-leaf/30',       ring: 'bg-earth-leaf',       accent: '79 140 74',   warm: '138 178 116' },
}

/**
 * Variables CSS du gradient mesh + glow curseur pour un accent donné.
 * À étaler sur le `style` d'une carte : `style={accentMeshVars('moss')}`.
 */
export function accentMeshVars(accent: Accent): CSSProperties {
  const t = ACCENTS[accent]
  return {
    ['--accent']: t.accent,
    ['--mesh-a']: t.accent,
    ['--mesh-b']: t.warm,
    ['--mesh-c']: t.accent,
  } as CSSProperties
}
