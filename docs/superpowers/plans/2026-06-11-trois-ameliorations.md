# Trois améliorations (pré-agrégation stats, View Transitions, hero rétrospective) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Déplacer le calcul des stats médias côté serveur, ajouter des View Transitions (navigation + morph covers), ajouter un hero compteurs animés à la page rétrospective.

**Architecture:** Trois chantiers indépendants. (1) Les `useMemo` des composants stats sont extraits en fonctions pures dans `web/lib/media-stats/`, appelées par les pages server (ISR) et passées en props. (2) Un util `withViewTransition` + un `TransitionLink` maison enrobent les mises à jour dans `document.startViewTransition`, avec fallback silencieux. (3) Un composant `YearReviewHero` avec hook `useCountUp` maison s'insère dans la page `/insights/year-in-review` existante.

**Tech Stack:** Next.js 16 (App Router, ISR), React 19, TypeScript, Tailwind 4, vitest. Aucune dépendance ajoutée.

**Spec:** `docs/superpowers/specs/2026-06-11-trois-ameliorations-design.md`

**Règles projet (rappel):**
- Imports via alias `@/`, fichiers kebab-case, composants PascalCase.
- **Ne jamais lancer `next build` pendant qu'un `next dev` tourne** (`.next` partagé). Validation : `npx tsc --noEmit` + `npx vitest run`.
- Tous les chemins ci-dessous sont relatifs à la racine du repo (`hub_data/`). Les commandes npm/npx se lancent depuis `web/`.

---

## Chantier 1 — Pré-agrégation des stats (Tasks 1–6)

### Task 1: `computeGameStats` dans lib + tests

**Files:**
- Create: `web/lib/media-stats/games-stats.ts`
- Create: `web/lib/media-stats/games-stats.test.ts`
- Create: `web/lib/media-stats/index.ts`

**Contexte:** la logique vient du `useMemo` de `web/components/games-stats.tsx` lignes 144–273 et de ses helpers lignes 30–125. On la déplace **à l'identique** (mêmes algorithmes, mêmes seuils). Les tests figent le comportement.

- [ ] **Step 1: Écrire les tests (échouent — le module n'existe pas)**

Créer `web/lib/media-stats/games-stats.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import type { Game } from '@/lib/types'
import { computeGameStats } from './games-stats'

// Fixture helper : cast volontaire, seuls les champs utilisés par le calcul comptent.
function mkGame(over: Partial<Game>): Game {
  return { title: 'Sans titre', ...over } as Game
}

describe('computeGameStats', () => {
  it('retourne des stats neutres pour une liste vide (pas de crash)', () => {
    const s = computeGameStats([])
    expect(s.totalGames).toBe(0)
    expect(s.totalHours).toBe(0)
    expect(s.completionRate).toBe(0)
    expect(s.avgRating).toBe(0)
    expect(s.topPlayed).toEqual([])
    expect(s.topRated).toEqual([])
    expect(s.statusBreakdown).toEqual([])
    expect(s.hoursByDecade).toEqual([])
    expect(s.sagas).toEqual([])
    expect(s.unplayed).toEqual([])
    expect(s.statusTotal).toBe(0)
  })

  it('exclut Wishé / Jamais joué des stats mais les liste dans unplayed', () => {
    const s = computeGameStats([
      mkGame({ title: 'A', status: 'Fini', hoursPlayed: 10, rating: 15 }),
      mkGame({ title: 'B', status: 'Wishé' }),
      mkGame({ title: 'C', status: 'Jamais joué' }),
    ])
    expect(s.totalGames).toBe(1)
    expect(s.unplayed.map(g => g.title).sort()).toEqual(['B', 'C'])
    // Le backlog n'apparaît pas dans la répartition par statut
    expect(s.statusBreakdown).toEqual([{ label: 'Fini', count: 1 }])
    expect(s.statusTotal).toBe(1)
  })

  it('calcule totaux, completion et note moyenne', () => {
    const s = computeGameStats([
      mkGame({ title: 'A', status: 'Fini', hoursPlayed: 10, rating: 16 }),
      mkGame({ title: 'B', status: 'En cours', hoursPlayed: 30, rating: 12 }),
    ])
    expect(s.totalHours).toBe(40)
    expect(s.finished).toBe(1)
    expect(s.completionRate).toBe(50)
    expect(s.avgRating).toBe(14)
    expect(s.topPlayed[0].title).toBe('B')
    expect(s.topRated[0].title).toBe('A')
  })

  it('multi-plateformes : statut Fini prioritaire, breakdown par plateforme', () => {
    const s = computeGameStats([
      mkGame({
        title: 'Multi',
        hoursPlayed: 20,
        platforms: [
          { platform: 'PC', status: 'Fini', hoursPlayed: 15 },
          { platform: 'PS5', status: 'En cours', hoursPlayed: 5 },
        ],
      }),
    ])
    expect(s.finished).toBe(1) // statut résolu = Fini
    // 2 entrées de statut (une par plateforme)
    expect(s.statusTotal).toBe(2)
    expect(s.statusBreakdown).toContainEqual({ label: 'Fini', count: 1 })
    expect(s.statusBreakdown).toContainEqual({ label: 'En cours', count: 1 })
  })

  it('avgVsCrowd : delta moyen entre note perso et note publique', () => {
    const s = computeGameStats([
      mkGame({ title: 'A', status: 'Fini', rating: 16, avgRating: 14 }),
      mkGame({ title: 'B', status: 'Fini', rating: 10, avgRating: 14 }),
    ])
    expect(s.avgVsCrowd).toBe(-1) // (+2 + -4) / 2
  })

  it('sagas : min 2 jeux, tri par heures, cover du plus joué', () => {
    const s = computeGameStats([
      mkGame({ title: 'Zelda: Breath of the Wild', status: 'Fini', hoursPlayed: 100, coverUrl: 'botw.jpg' }),
      mkGame({ title: 'Zelda: Tears of the Kingdom', status: 'Fini', hoursPlayed: 80, coverUrl: 'totk.jpg' }),
      mkGame({ title: 'Hadès', status: 'Fini', hoursPlayed: 50 }), // pas une saga listée
    ])
    expect(s.sagas).toHaveLength(1)
    expect(s.sagas[0].name).toBe('Zelda')
    expect(s.sagas[0].count).toBe(2)
    expect(s.sagas[0].hours).toBe(180)
    expect(s.sagas[0].cover).toBe('botw.jpg')
    expect(s.sagas[0].games[0].title).toBe('Zelda: Breath of the Wild')
  })

  it('heures par décennie de sortie', () => {
    const s = computeGameStats([
      mkGame({ title: 'A', status: 'Fini', hoursPlayed: 10, releaseYear: 1998 }),
      mkGame({ title: 'B', status: 'Fini', hoursPlayed: 20, releaseYear: 2021 }),
    ])
    expect(s.hoursByDecade).toEqual([
      { decade: '1990s', hours: 10 },
      { decade: '2020s', hours: 20 },
    ])
  })
})
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `cd web && npx vitest run lib/media-stats/games-stats.test.ts`
Expected: FAIL — `Cannot find module './games-stats'` (ou équivalent).

- [ ] **Step 3: Créer `web/lib/media-stats/games-stats.ts`**

Déplacer depuis `web/components/games-stats.tsx` (le composant sera nettoyé en Task 2, ne pas y toucher ici) :

```ts
import type { Game } from '@/lib/types'

// ——— Helpers (déplacés depuis components/games-stats.tsx, inchangés) ———

export function gameHours(g: Game): number {
  return g.hoursPlayed ?? 0
}

const UNPLAYED_STATUSES = new Set(['Wishé', 'Jamais joué'])

export function gameStatus(g: Game): string | undefined {
  if (g.status) return g.status
  if (g.platforms && g.platforms.length > 0) {
    if (g.platforms.some(p => p.status === 'Fini')) return 'Fini'
    if (g.platforms.some(p => p.status === 'En cours')) return 'En cours'
    // Prefer a "played" platform over a wished/unplayed one
    const played = g.platforms.find(p => p.status && !UNPLAYED_STATUSES.has(p.status))
    if (played) return played.status
    return g.platforms[0].status
  }
  return undefined
}

export function isUnplayed(g: Game): boolean {
  const s = gameStatus(g)
  return !!s && UNPLAYED_STATUSES.has(s)
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
```

Puis copier **sans modification** depuis `components/games-stats.tsx` :
- le tableau `SAGAS` complet (lignes 60–114), le `SAGAS.sort(...)` avec son commentaire (116–118) et `detectSaga` (120–125) — non exportés ;
- le corps du `useMemo` (lignes 145–272, c'est-à-dire de `const played = games.filter(...)` jusqu'au `return {...}` final inclus) qui devient le corps de `computeGameStats`.

Ajouter les types et la signature autour du corps déplacé :

```ts
export interface SagaStats {
  name: string
  hours: number
  count: number
  cover?: string
  games: Game[]
}

export interface GameStatsData {
  totalGames: number
  totalHours: number
  finished: number
  completionRate: number
  avgRating: number
  avgVsCrowd: number
  topPlayed: Game[]
  topRated: Game[]
  statusBreakdown: { label: string; count: number }[]
  hoursByDecade: { decade: string; hours: number }[]
  avgRatingByGenre: { label: string; value: number; count: number }[]
  avgRatingByPlatform: { label: string; value: number; count: number }[]
  sagas: SagaStats[]
  unplayed: Game[]
  statusTotal: number
}

export function computeGameStats(games: Game[]): GameStatsData {
  // … corps du useMemo, inchangé …
}
```

Créer `web/lib/media-stats/index.ts` :

```ts
export {
  computeGameStats,
  gameHours,
  gameStatus,
  isUnplayed,
  type GameStatsData,
  type SagaStats,
} from './games-stats'
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `cd web && npx vitest run lib/media-stats/games-stats.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/media-stats/
git commit -m "feat(games): extraire computeGameStats en lib pure + tests"
```

---

### Task 2: GameStats présentationnel + découpage + branchement server

**Files:**
- Create: `web/components/games-stats/index.tsx` (+ 7 sous-fichiers, voir Step 1)
- Delete: `web/components/games-stats.tsx`
- Modify: `web/components/games-page-client.tsx:7,11-29,107`
- Modify: `web/app/games/page.tsx`

- [ ] **Step 1: Créer le dossier `web/components/games-stats/` (8 fichiers)**

Découpage selon les fonctions existantes de `games-stats.tsx`. Chaque fichier reprend **le JSX inchangé** de la fonction correspondante ; seuls les imports changent (`gameHours`/`gameStatus` viennent désormais de la lib). Détail :

**`top-list.tsx`** — fonction `TopList` (lignes 436–512 de l'ancien fichier), exportée :

```tsx
import Image from 'next/image'
import type { Game } from '@/lib/types'

export function TopList({ title, icon, items, metric, progress, extra }: {
  title: string
  icon: React.ReactNode
  items: Game[]
  metric: (g: Game) => string
  progress: (g: Game) => number
  extra?: (g: Game) => React.ReactNode
}) {
  // … corps inchangé (lignes 451–511) …
}
```

**`kpi-row.tsx`** — fonction `KpiRow` (353–434) exportée, avec ses imports lucide (`Trophy, Clock, CheckCircle2, Star`). Corps inchangé.

**`status-breakdown.tsx`** — fonction `StatusBreakdown` (514–562) exportée + la constante `STATUS_COLORS` (23–28) déplacée ici (seul consommateur). Import lucide `CheckCircle2`. Corps inchangé.

**`hours-by-decade.tsx`** — fonction `HoursByDecade` (564–603) exportée. Import lucide `Calendar`. Corps inchangé.

**`backlog-list.tsx`** — fonction `BacklogList` (605–670) exportée. Imports : `Image` (next/image), `Star` (lucide), `gameStatus` depuis `@/lib/media-stats`, type `Game`. Corps inchangé.

**`saga-list.tsx`** — fonction `SagaList` (680–812) exportée, **avec `'use client'` en tête** (elle utilise `useState`). Imports : `useState`, `Image`, `Layers, ChevronDown` (lucide), `gameHours` et type `SagaStats` depuis `@/lib/media-stats`, type `Game`. L'interface locale `SagaItem` (672–678) est supprimée au profit de `SagaStats`. Corps inchangé.

**`ranking-bars.tsx`** — fonction `RankingBars` (814–868) exportée. Corps inchangé.

**`index.tsx`** — le composant principal, désormais purement présentationnel :

```tsx
'use client'

import { Clock, Star, Target, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { gameHours, type GameStatsData } from '@/lib/media-stats'
import { BacklogList } from './backlog-list'
import { HoursByDecade } from './hours-by-decade'
import { KpiRow } from './kpi-row'
import { RankingBars } from './ranking-bars'
import { SagaList } from './saga-list'
import { StatusBreakdown } from './status-breakdown'
import { TopList } from './top-list'

interface GameStatsProps {
  stats: GameStatsData
}

export function GameStats({ stats }: GameStatsProps) {
  const {
    totalGames, totalHours, finished, completionRate, avgRating, avgVsCrowd,
    topPlayed, topRated, statusBreakdown, hoursByDecade,
    avgRatingByGenre, avgRatingByPlatform, sagas, unplayed, statusTotal,
  } = stats

  return (
    // … JSX inchangé des lignes 275–335 de l'ancien fichier
    // (KpiRow, TopList ×2, StatusBreakdown, HoursByDecade, BacklogList,
    //  SagaList, RankingBars ×2 — mêmes props qu'avant) …
  )
}

// deltaLabel (lignes 338–351) reste ici, inchangé — utilisé par le `extra` du TopList "mieux notés".
```

- [ ] **Step 2: Supprimer l'ancien fichier**

```bash
rm web/components/games-stats.tsx
```

(L'import `'@/components/games-stats'` de `games-page-client.tsx` résout maintenant sur le dossier.)

- [ ] **Step 3: Brancher `games-page-client.tsx` et `app/games/page.tsx`**

Dans `web/components/games-page-client.tsx` :
- ajouter aux props : `gameStats: GameStatsData` (import : `import type { GameStatsData } from '@/lib/media-stats'`) ;
- ligne 107 : `<GameStats games={games} />` → `<GameStats stats={gameStats} />`.

Dans `web/app/games/page.tsx` :

```tsx
import { computeGameStats } from '@/lib/media-stats'
// dans le composant :
const gameStats = computeGameStats(games)
// et dans le JSX :
<GamesPageClient
  games={games}
  gameStats={gameStats}
  // … autres props inchangées …
/>
```

- [ ] **Step 4: Vérifier types + tests**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: 0 erreur TS, tous les tests passent.

- [ ] **Step 5: Vérification visuelle rapide**

Avec `make dev` lancé : ouvrir `http://localhost:3000/games`, onglet **Statistiques** — KPIs, tops, sagas dépliables et backlog identiques à avant.

- [ ] **Step 6: Commit**

```bash
git add web/components/games-stats/ web/components/games-page-client.tsx web/app/games/page.tsx
git rm web/components/games-stats.tsx 2>/dev/null; true
git commit -m "refactor(games): GameStats présentationnel, stats calculées côté serveur"
```

---

### Task 3: `computeFilmStats` dans lib + tests

**Files:**
- Create: `web/lib/media-stats/films-stats.ts`
- Create: `web/lib/media-stats/films-stats.test.ts`
- Modify: `web/lib/media-stats/index.ts`

**Contexte:** logique du `useMemo` de `web/components/films-stats.tsx` lignes 22–93.

- [ ] **Step 1: Écrire les tests**

Créer `web/lib/media-stats/films-stats.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import type { Film } from '@/lib/types'
import { computeFilmStats } from './films-stats'

function mkFilm(over: Partial<Film>): Film {
  return { title: 'Sans titre', ...over } as Film
}

describe('computeFilmStats', () => {
  it('liste vide → stats neutres', () => {
    const s = computeFilmStats([])
    expect(s.totalFilms).toBe(0)
    expect(s.totalMinutes).toBe(0)
    expect(s.avgRuntime).toBe(0)
    expect(s.avgRating).toBe(0)
    expect(s.topRated).toEqual([])
    expect(s.genreData).toEqual([])
    expect(s.yearData).toEqual([])
    // garde-fous division : max à 1 minimum
    expect(s.yearMax).toBe(1)
    expect(s.decadeMax).toBe(1)
    expect(s.ratingMax).toBe(1)
  })

  it('totaux, moyennes et top noté', () => {
    const s = computeFilmStats([
      mkFilm({ title: 'A', runtime: 120, rating: 18 }),
      mkFilm({ title: 'B', runtime: 90, rating: 12 }),
      mkFilm({ title: 'C' }), // ni durée ni note
    ])
    expect(s.totalFilms).toBe(3)
    expect(s.totalMinutes).toBe(210)
    expect(s.avgRuntime).toBe(105) // moyenne sur les films AVEC durée
    expect(s.avgRating).toBe(15)
    expect(s.bestRated?.title).toBe('A')
    expect(s.topRated.map(f => f.title)).toEqual(['A', 'B'])
  })

  it('films vus par année (dateWatched) et décennies de sortie', () => {
    const s = computeFilmStats([
      mkFilm({ title: 'A', dateWatched: '2024-03-01', releaseYear: 1999 }),
      mkFilm({ title: 'B', dateWatched: '2024-07-15', releaseYear: 2003 }),
      mkFilm({ title: 'C', dateWatched: '2025-01-02', releaseYear: 2001 }),
    ])
    expect(s.yearData).toEqual([[2024, 2], [2025, 1]])
    expect(s.yearMax).toBe(2)
    expect(s.decadeData).toEqual([[1990, 1], [2000, 2]])
  })

  it('répartition des notes arrondies, triée note décroissante', () => {
    const s = computeFilmStats([
      mkFilm({ title: 'A', rating: 15.4 }),
      mkFilm({ title: 'B', rating: 15 }),
      mkFilm({ title: 'C', rating: 12 }),
    ])
    expect(s.ratingData).toEqual([[15, 2], [12, 1]])
    expect(s.ratingMax).toBe(2)
  })

  it('top 8 genres avec couleurs', () => {
    const s = computeFilmStats([
      mkFilm({ title: 'A', genres: ['SF', 'Drame'] }),
      mkFilm({ title: 'B', genres: ['SF'] }),
    ])
    expect(s.genreData[0].label).toBe('SF')
    expect(s.genreData[0].value).toBe(2)
    expect(s.genreData[0].color).toBeTruthy()
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `cd web && npx vitest run lib/media-stats/films-stats.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Créer `web/lib/media-stats/films-stats.ts`**

```ts
import { seriesColor } from '@/lib/chart'
import type { Film } from '@/lib/types'

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export interface FilmStatsData {
  totalFilms: number
  totalMinutes: number
  avgRuntime: number
  avgRating: number
  bestRated: Film | undefined
  topRated: Film[]
  genreData: { label: string; value: number; color: string }[]
  yearData: [number, number][]
  yearMax: number
  decadeData: [number, number][]
  decadeMax: number
  ratingData: [number, number][]
  ratingMax: number
}

export function computeFilmStats(films: Film[]): FilmStatsData {
  // … corps du useMemo de components/films-stats.tsx lignes 23–92, inchangé
  // (de `const totalFilms = films.length` au `return {...}` inclus) …
}
```

Ajouter au barrel `web/lib/media-stats/index.ts` :

```ts
export { computeFilmStats, type FilmStatsData } from './films-stats'
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `cd web && npx vitest run lib/media-stats/films-stats.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/media-stats/
git commit -m "feat(films): extraire computeFilmStats en lib pure + tests"
```

---

### Task 4: FilmsStats présentationnel + branchement server

**Files:**
- Modify: `web/components/films-stats.tsx:1-99`
- Modify: `web/components/films-page-client.tsx:6-15,42`
- Modify: `web/app/films/page.tsx`

- [ ] **Step 1: Rendre `films-stats.tsx` présentationnel**

- Supprimer les imports `useMemo` et la fonction locale `avg` (lignes 16–19).
- Props : `interface FilmsStatsProps { stats: FilmStatsData }` (import `import type { FilmStatsData } from '@/lib/media-stats'` ; l'import `seriesColor` devient inutile, le retirer).
- Remplacer tout le bloc `const stats = useMemo(() => { … }, [films])` (lignes 22–93) par rien : le composant utilise directement `stats` reçu en prop. La ligne `const topMax = …` (99) et tout le JSX restent inchangés.
- Le fichier garde `'use client'` (sous-composants présentationnels seulement, pas de state — mais il est importé par un client component, la directive ne gêne pas).

- [ ] **Step 2: Brancher `films-page-client.tsx` et `app/films/page.tsx`**

`films-page-client.tsx` :

```tsx
import type { FilmStatsData } from '@/lib/media-stats'

interface FilmsPageClientProps {
  films: Film[]
  filmStats: FilmStatsData
}

export function FilmsPageClient({ films, filmStats }: FilmsPageClientProps) {
  // …
  {activeTab === 'stats' && <FilmsStats stats={filmStats} />}
```

`app/films/page.tsx` :

```tsx
import { computeFilmStats } from '@/lib/media-stats'
// …
const films = await getFilmsData()
const filmStats = computeFilmStats(films)
// …
<FilmsPageClient films={films} filmStats={filmStats} />
```

- [ ] **Step 3: Vérifier types + tests + visuel**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: PASS. Puis vérifier `http://localhost:3000/films` onglet **Statistiques** (identique à avant).

- [ ] **Step 4: Commit**

```bash
git add web/components/films-stats.tsx web/components/films-page-client.tsx web/app/films/page.tsx
git commit -m "refactor(films): FilmsStats présentationnel, stats calculées côté serveur"
```

---

### Task 5: `computeSeriesStats` dans lib + tests

**Files:**
- Create: `web/lib/media-stats/series-stats.ts`
- Create: `web/lib/media-stats/series-stats.test.ts`
- Modify: `web/lib/media-stats/index.ts`

**Contexte:** logique du `useMemo` de `web/components/series-stats.tsx` lignes 30–103. Attention : dépend de `totalSeriesMinutes` de `@/lib/series-time` (déjà une lib pure).

- [ ] **Step 1: Écrire les tests**

Créer `web/lib/media-stats/series-stats.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import type { Series } from '@/lib/types'
import { computeSeriesStats } from './series-stats'

function mkSeries(over: Partial<Series>): Series {
  return { title: 'Sans titre', ...over } as Series
}

describe('computeSeriesStats', () => {
  it('liste vide → stats neutres', () => {
    const s = computeSeriesStats([])
    expect(s.totalSeries).toBe(0)
    expect(s.totalEpisodes).toBe(0)
    expect(s.avgRating).toBe(0)
    expect(s.topWatched).toEqual([])
    expect(s.genreData).toEqual([])
    expect(s.statusData).toEqual([])
    expect(s.statusTotal).toBe(0)
    expect(s.decadeMax).toBe(1)
    expect(s.channelMax).toBe(1)
  })

  it('totaux, top visionnage et note moyenne', () => {
    const s = computeSeriesStats([
      mkSeries({ title: 'A', watchMinutes: 600, episodesWatched: 10, rating: 16 }),
      mkSeries({ title: 'B', watchMinutes: 1200, episodesWatched: 20, rating: 12 }),
    ])
    expect(s.totalSeries).toBe(2)
    expect(s.totalEpisodes).toBe(30)
    expect(s.avgRating).toBe(14)
    expect(s.mostWatched?.title).toBe('B')
    expect(s.topWatched.map(x => x.title)).toEqual(['B', 'A'])
  })

  it('répartition par statut avec Inconnu par défaut', () => {
    const s = computeSeriesStats([
      mkSeries({ title: 'A', status: 'Terminée' }),
      mkSeries({ title: 'B', status: 'Terminée' }),
      mkSeries({ title: 'C' }),
    ])
    expect(s.statusData).toEqual([['Terminée', 2], ['Inconnu', 1]])
    expect(s.statusTotal).toBe(3)
  })

  it('top chaînes : tri par nombre de séries puis minutes', () => {
    const s = computeSeriesStats([
      mkSeries({ title: 'A', channel: 'HBO', watchMinutes: 100 }),
      mkSeries({ title: 'B', channel: 'HBO', watchMinutes: 50 }),
      mkSeries({ title: 'C', channel: 'Netflix', watchMinutes: 900 }),
    ])
    expect(s.channelData[0]).toEqual({ name: 'HBO', minutes: 150, count: 2 })
    expect(s.channelData[1]).toEqual({ name: 'Netflix', minutes: 900, count: 1 })
    expect(s.channelMax).toBe(2)
  })

  it('minutes par décennie de sortie (ignore les séries sans watchMinutes)', () => {
    const s = computeSeriesStats([
      mkSeries({ title: 'A', releaseYear: 2015, watchMinutes: 300 }),
      mkSeries({ title: 'B', releaseYear: 2018, watchMinutes: 200 }),
      mkSeries({ title: 'C', releaseYear: 2018 }), // pas de minutes → ignorée
    ])
    expect(s.decadeData).toEqual([[2010, 500]])
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `cd web && npx vitest run lib/media-stats/series-stats.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Créer `web/lib/media-stats/series-stats.ts`**

```ts
import { seriesColor } from '@/lib/chart'
import { totalSeriesMinutes } from '@/lib/series-time'
import type { Series } from '@/lib/types'

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export interface SeriesStatsData {
  totalSeries: number
  totalMinutes: number
  totalEpisodes: number
  avgRating: number
  mostWatched: Series | undefined
  topWatched: Series[]
  genreData: { label: string; value: number; color: string }[]
  statusData: [string, number][]
  statusTotal: number
  decadeData: [number, number][]
  decadeMax: number
  channelData: { name: string; minutes: number; count: number }[]
  channelMax: number
}

export function computeSeriesStats(series: Series[]): SeriesStatsData {
  // … corps du useMemo de components/series-stats.tsx lignes 31–102, inchangé …
}
```

Barrel : `export { computeSeriesStats, type SeriesStatsData } from './series-stats'`.

- [ ] **Step 4: Vérifier que les tests passent**

Run: `cd web && npx vitest run lib/media-stats/series-stats.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/media-stats/
git commit -m "feat(series): extraire computeSeriesStats en lib pure + tests"
```

---

### Task 6: SeriesStats présentationnel + branchement server

**Files:**
- Modify: `web/components/series-stats.tsx:1-109`
- Modify: `web/components/series-page-client.tsx:6-15,42`
- Modify: `web/app/series/page.tsx`

- [ ] **Step 1: Rendre `series-stats.tsx` présentationnel**

Même opération que Task 4 : supprimer `useMemo`, `avg` (24–27), les imports `seriesColor`/`totalSeriesMinutes` devenus inutiles (`formatWatchHours` reste — utilisé par le JSX). Props : `{ stats: SeriesStatsData }`. `STATUS_COLORS` (16–22) reste dans le composant (présentation pure). JSX inchangé.

- [ ] **Step 2: Brancher `series-page-client.tsx` et `app/series/page.tsx`**

`series-page-client.tsx` : prop `seriesStats: SeriesStatsData`, et `<SeriesStats stats={seriesStats} />`.

`app/series/page.tsx` :

```tsx
import { computeSeriesStats } from '@/lib/media-stats'
// …
const seriesStats = computeSeriesStats(series)
// …
<SeriesPageClient series={series} seriesStats={seriesStats} />
```

- [ ] **Step 3: Vérifier types + tests + visuel**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: PASS. Vérifier `http://localhost:3000/series` onglet **Statistiques**.

- [ ] **Step 4: Commit**

```bash
git add web/components/series-stats.tsx web/components/series-page-client.tsx web/app/series/page.tsx
git commit -m "refactor(series): SeriesStats présentationnel, stats calculées côté serveur"
```

---

## Chantier 2 — View Transitions (Tasks 7–9)

### Task 7: `lib/view-transition.ts` + tests

**Files:**
- Create: `web/lib/view-transition.ts`
- Create: `web/lib/view-transition.test.ts`

- [ ] **Step 1: Écrire les tests (échouent)**

Créer `web/lib/view-transition.test.ts` (environnement node : `document`/`window` n'existent pas par défaut, on les stubbe) :

```ts
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
```

- [ ] **Step 2: Vérifier l'échec**

Run: `cd web && npx vitest run lib/view-transition.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Créer `web/lib/view-transition.ts`**

```ts
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
  return new Promise(resolve => {
    const timer = setTimeout(() => {
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
  doc
    .startViewTransition!(async () => {
      push()
      await waitForNavigation()
    })
    .finished.finally(() => root.classList.remove('route-changing'))
}
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `cd web && npx vitest run lib/view-transition.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/view-transition.ts web/lib/view-transition.test.ts
git commit -m "feat(ui): util withViewTransition + coordination navigation"
```

---

### Task 8: TransitionLink, navigation, palette, CSS route

**Files:**
- Create: `web/components/transition-link.tsx`
- Modify: `web/components/index.ts`
- Modify: `web/app/layout.tsx:74-77`
- Modify: `web/components/navigation.tsx:4,131-167,199-226,232,235`
- Modify: `web/components/command-palette.tsx:160,210`
- Modify: `web/app/globals.css` (fin du bloc `@layer utilities` View Transitions, après la `@keyframes themeReveal`)

- [ ] **Step 1: Créer `web/components/transition-link.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type ComponentProps, type MouseEvent, useEffect } from 'react'
import { navigateWithViewTransition, notifyNavigationDone } from '@/lib/view-transition'

// Monté une seule fois dans le layout : signale la fin de navigation aux
// View Transitions en attente (voir lib/view-transition.ts).
export function RouteTransitionListener() {
  const pathname = usePathname()
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

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (typeof href !== 'string' || rest.target === '_blank') return
    e.preventDefault()
    navigateWithViewTransition(() => router.push(href))
  }

  return <Link href={href} {...rest} onClick={handleClick} />
}
```

Ajouter au barrel `web/components/index.ts` :

```ts
export { TransitionLink, RouteTransitionListener } from './transition-link'
```

- [ ] **Step 2: Monter le listener dans `web/app/layout.tsx`**

Ajouter `RouteTransitionListener` à l'import existant depuis `'@/components'` (ligne 4), puis dans le JSX, à côté de `<RouteProgress />` (déjà sous `<Suspense fallback={null}>`) :

```tsx
<Suspense fallback={null}>
  <RouteProgress />
  <RouteTransitionListener />
</Suspense>
```

- [ ] **Step 3: Adopter `TransitionLink` dans `navigation.tsx`**

- Ligne 4 : remplacer `import Link from 'next/link'` par `import { TransitionLink } from './transition-link'`.
- Remplacer les **trois** usages de `<Link` par `<TransitionLink` (et `</Link>` par `</TransitionLink>`) : le `NavLink` (ligne 135), les items du dropdown de groupe (ligne 205), le logo (ligne 235). Aucune autre modification.

- [ ] **Step 4: Adopter la transition dans `command-palette.tsx`**

Ajouter l'import : `import { navigateWithViewTransition } from '@/lib/view-transition'`.
Lignes 160 et 210 : `router.push(item.href)` → `navigateWithViewTransition(() => router.push(item.href))`.
(Vérifier le contexte exact de chaque ligne avant l'édition : il peut y avoir un `setOpen(false)` adjacent — le conserver tel quel, **avant** l'appel.)

- [ ] **Step 5: CSS des transitions de route dans `globals.css`**

Dans le bloc `@layer utilities`, juste après la `@keyframes themeReveal` existante, ajouter :

```css
  /* === View Transitions — navigation entre pages === */
  /* Le header garde sa propre couche : il reste immobile pendant le fade. */
  html.route-changing .site-nav-vt {
    view-transition-name: site-nav;
  }
  html.route-changing::view-transition-old(site-nav),
  html.route-changing::view-transition-new(site-nav) {
    animation: none;
  }
  html.route-changing::view-transition-old(root) {
    animation: vtRouteOut 0.25s ease both;
  }
  html.route-changing::view-transition-new(root) {
    animation: vtRouteIn 0.25s ease both;
  }
  @keyframes vtRouteOut {
    to { opacity: 0; }
  }
  @keyframes vtRouteIn {
    from { opacity: 0; }
  }
```

Puis dans `navigation.tsx` ligne 232, ajouter la classe au header :

```tsx
<header className="site-nav-vt sticky top-0 z-50 bg-bg-primary/85 backdrop-blur-md border-b border-border-subtle">
```

**Pourquoi scoper par `html.route-changing`** : le theme toggle utilise déjà `::view-transition-*(root)` avec `animation: none` par défaut ; scoper le fade de route par classe évite tout conflit entre les deux mécanismes, et le `view-transition-name` du header n'est posé que pendant une navigation (sinon il serait exclu du reveal circulaire du thème).

- [ ] **Step 6: Vérifier types + tests + visuel**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: PASS.
Visuel (Chrome/Edge/Safari 18+) : naviguer entre sections → cross-fade doux, header immobile. Cmd+clic ouvre bien un nouvel onglet. ⌘K → naviguer via la palette → transition aussi. Vérifier que le theme toggle garde son reveal circulaire. Dans Firefox : navigation normale sans erreur console.

- [ ] **Step 7: Commit**

```bash
git add web/components/transition-link.tsx web/components/index.ts web/app/layout.tsx web/components/navigation.tsx web/components/command-palette.tsx web/app/globals.css
git commit -m "feat(ui): cross-fade View Transitions sur la navigation"
```

---

### Task 9: Morph cover grille → détail

**Files:**
- Modify: `web/components/media-card.tsx:7-16,42-65`
- Modify: `web/components/media-detail.tsx:38-59`
- Modify: `web/components/media-grid.tsx:1-56,118-149`
- Modify: `web/components/films-client.tsx:1-44,170-209`
- Modify: `web/app/globals.css` (suite du bloc View Transitions ajouté en Task 8)

- [ ] **Step 1: `media-card.tsx` — prop `transitionName`**

Ajouter à `MediaCardProps` :

```ts
  /** Nom de View Transition posé sur le poster (morph vers le détail). */
  transitionName?: string
```

Le destructurer dans la signature, et sur le conteneur du poster (ligne 65) :

```tsx
<div
  className="relative w-full aspect-[2/3] overflow-hidden bg-bg-tertiary"
  style={transitionName ? { viewTransitionName: transitionName } : undefined}
>
```

- [ ] **Step 2: `media-detail.tsx` — nom sur le poster du modal**

Sur le conteneur du poster (ligne 40, `<div className="flex-shrink-0 w-full md:w-56">`) :

```tsx
<div className="flex-shrink-0 w-full md:w-56" style={{ viewTransitionName: 'media-cover' }}>
```

(Un seul modal ouvert à la fois → pas de collision de nom. Le nom n'est actif que quand le modal est monté.)

- [ ] **Step 3: `media-grid.tsx` — ouverture/fermeture avec morph**

Imports à ajouter :

```ts
import { flushSync } from 'react-dom'
import { withViewTransition } from '@/lib/view-transition'
```

Dans `MediaGrid`, ajouter l'état et les handlers après les `useState` existants (ligne 36) :

```tsx
// Titre de la carte en cours de morph : seule cette carte porte le
// view-transition-name (le navigateur exige un nom unique par document).
const [morphTitle, setMorphTitle] = useState<string | null>(null)

const openItem = (item: T) => {
  // Pose le nom sur la carte cliquée AVANT la capture de l'état "old".
  flushSync(() => setMorphTitle(item.title))
  withViewTransition(() => {
    flushSync(() => setSelectedItem(item))
  })
}

const closeItem = () => {
  withViewTransition(() => {
    flushSync(() => setSelectedItem(null))
  }).then(() => setMorphTitle(null))
}
```

Brancher : dans la grille (ligne 126), `onClick={() => setSelectedItem(item)}` → `onClick={() => openItem(item)}` et ajouter `transitionName={morphTitle === item.title ? 'media-cover' : undefined}` au `<MediaCard>`. Dans le modal (ligne 143), `onClose={() => setSelectedItem(null)}` → `onClose={closeItem}`.

- [ ] **Step 4: `films-client.tsx` — même mécanique**

Mêmes imports (`flushSync`, `withViewTransition`). Mêmes `morphTitle`/`openItem`/`closeItem` (avec `Film` au lieu de `T`), après les `useState` existants (ligne 36).

Brancher : la `MediaCard` de la grille (ligne 178) passe à `onClick={() => openItem(item)}` + `transitionName={morphTitle === item.title ? 'media-cover' : undefined}` ; le `onClose` du `MediaDetail` (ligne 197) passe à `closeItem`. **Ne pas toucher** aux `setSelectedItem` des top picks (ligne 112) ni des `Recommendations` (ligne 206) — pas de morph là (l'élément source n'est pas une carte de grille).

- [ ] **Step 5: CSS du morph dans `globals.css`**

À la suite du bloc route (Task 8 Step 5) :

```css
  /* === View Transitions — morph cover grille → détail === */
  ::view-transition-group(media-cover) {
    animation-duration: 0.3s;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  /* Les snapshots remplissent le groupe pendant l'interpolation de taille. */
  ::view-transition-old(media-cover),
  ::view-transition-new(media-cover) {
    animation: none;
    height: 100%;
    width: 100%;
    object-fit: cover;
  }
```

- [ ] **Step 6: Vérifier types + tests + visuel**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: PASS.
Visuel : `/films` → cliquer une cover → elle « grandit » vers le poster du modal ; fermer → retour inverse. Pareil pour une page utilisant `MediaGrid`. Vérifier que la recherche/filtres de la grille fonctionnent comme avant, et l'ouverture via `?open=` (deep link films) fonctionne toujours (sans morph, c'est normal).

- [ ] **Step 7: Commit**

```bash
git add web/components/media-card.tsx web/components/media-detail.tsx web/components/media-grid.tsx web/components/films-client.tsx web/app/globals.css
git commit -m "feat(ui): morph de cover grille → détail via View Transitions"
```

---

## Chantier 3 — Hero rétrospective (Tasks 10–11)

### Task 10: Hook `useCountUp` + tests

**Files:**
- Create: `web/lib/use-count-up.ts`
- Create: `web/lib/use-count-up.test.ts`

- [ ] **Step 1: Écrire les tests (fonctions pures uniquement — pas de testing-library dans le projet)**

Créer `web/lib/use-count-up.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { countUpValue, easeOutCubic } from './use-count-up'

describe('easeOutCubic', () => {
  it('borne 0 → 0 et 1 → 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('démarre vite (au-dessus de la diagonale)', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })
})

describe('countUpValue', () => {
  it('atteint exactement la cible à la fin (et au-delà)', () => {
    expect(countUpValue(312, 1200, 1200)).toBe(312)
    expect(countUpValue(312, 5000, 1200)).toBe(312)
  })

  it('vaut 0 au départ', () => {
    expect(countUpValue(312, 0, 1200)).toBe(0)
  })

  it('progresse de façon monotone', () => {
    const a = countUpValue(1000, 300, 1200)
    const b = countUpValue(1000, 600, 1200)
    expect(b).toBeGreaterThan(a)
  })

  it('durée nulle ou négative → cible directe (garde-fou)', () => {
    expect(countUpValue(42, 0, 0)).toBe(42)
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `cd web && npx vitest run lib/use-count-up.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Créer `web/lib/use-count-up.ts`**

```ts
'use client'

import { useEffect, useRef, useState } from 'react'

// Easing ease-out cubic : démarre vite, atterrit en douceur.
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

// Valeur affichée à un instant donné du count-up (pure, testable).
export function countUpValue(target: number, elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0 || elapsedMs >= durationMs) return target
  if (elapsedMs <= 0) return 0
  return Math.round(target * easeOutCubic(elapsedMs / durationMs))
}

// Compte de 0 à target en durationMs via requestAnimationFrame.
// prefers-reduced-motion → valeur finale immédiate, sans animation.
export function useCountUp(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || target === 0) {
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const v = countUpValue(target, now - start, durationMs)
      setValue(v)
      if (v !== target) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, durationMs])

  return value
}
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `cd web && npx vitest run lib/use-count-up.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/use-count-up.ts web/lib/use-count-up.test.ts
git commit -m "feat(ui): hook useCountUp (rAF, ease-out, reduced-motion)"
```

---

### Task 11: Composant `YearReviewHero` + intégration page

**Files:**
- Create: `web/components/year-review-hero.tsx`
- Modify: `web/components/index.ts`
- Modify: `web/app/insights/year-in-review/page.tsx:6,100-147`

- [ ] **Step 1: Créer `web/components/year-review-hero.tsx`**

Le hero a un fond crépuscule identique dans les deux thèmes (comme la maquette validée) — d'où les couleurs littérales plutôt que les tokens earth (qui s'adaptent au thème).

```tsx
'use client'

import { useCountUp } from '@/lib/use-count-up'

export interface YearReviewHeroData {
  films: { total: number }
  games: { hoursPlayed: number }
  books: { total: number; pages: number }
  highlights: string[]
}

function Counter({ value, label, accent }: { value: number; label: string; accent: string }) {
  const display = useCountUp(value)
  return (
    <div>
      <p className={`font-display text-5xl sm:text-6xl font-semibold tracking-tight tabular-nums ${accent}`}>
        {display.toLocaleString('fr-FR')}
      </p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#c4b89a]">
        {label}
      </p>
    </div>
  )
}

export function YearReviewHero({ year, data }: { year: number; data: YearReviewHeroData | null }) {
  // Skeleton pendant le chargement SWR (même hauteur → pas de saut de layout)
  if (!data) {
    return <div className="mb-6 h-52 animate-pulse rounded-2xl border border-border-subtle bg-bg-card" />
  }

  const counters = [
    { value: data.films.total, label: 'Films', accent: 'text-[#e8965a]' },
    { value: data.games.hoursPlayed, label: 'Heures de jeu', accent: 'text-[#9db86f]' },
    { value: data.books.total, label: 'Livres', accent: 'text-[#a8b4e0]' },
    { value: data.books.pages, label: 'Pages lues', accent: 'text-[#d9a441]' },
  ].filter(c => c.value > 0)

  if (counters.length === 0 && data.highlights.length === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-border-subtle bg-bg-card p-8 text-center font-mono text-sm text-text-muted">
        Aucune activité enregistrée cette année-là.
      </div>
    )
  }

  return (
    // key={year} : remonte le composant au changement d'année → les compteurs rejouent
    <section
      key={year}
      className="relative mb-6 overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-[#2e2a22] to-[#3d342a] p-8 shadow-soft-md"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d9a441]">
        Rétrospective · {year}
      </p>
      <div className="mt-6 flex flex-wrap gap-x-12 gap-y-6">
        {counters.map(c => (
          <Counter key={c.label} value={c.value} label={c.label} accent={c.accent} />
        ))}
      </div>
      {data.highlights.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {data.highlights.map(h => (
            <span
              key={h}
              className="rounded-full border border-[#d9a441]/30 bg-[#d9a441]/10 px-3 py-1 font-mono text-xs text-[#f0e6d2]"
            >
              {h}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
```

Barrel `web/components/index.ts` : `export { YearReviewHero } from './year-review-hero'`.

- [ ] **Step 2: Intégrer dans `web/app/insights/year-in-review/page.tsx`**

- Import : `import { YearReviewHero } from '@/components/year-review-hero'`.
- Insérer le hero **après** le sélecteur d'années (le `div` role="group" qui se ferme ligne 125) et avant le bloc `{isLoading && …}` :

```tsx
<YearReviewHero year={year} data={data ?? null} />
```

- Supprimer le bloc « Faits marquants » (lignes 133–147 : le `{data.highlights.length > 0 && (…)}` complet) — les chips vivent désormais dans le hero.
- Supprimer le bloc `{isLoading && (…)}` (lignes 127–129) : le skeleton du hero couvre le chargement, et la grille de cartes apparaît avec `{data && (…)}` comme avant.
- Nettoyer l'import `Sparkles` (lucide) devenu inutile, ligne 6.

- [ ] **Step 3: Vérifier types + tests + visuel**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: PASS.
Visuel : `/insights/year-in-review` → compteurs qui s'animent à l'arrivée, rejouent au changement d'année, chips de faits marquants dans le hero, plus de carte « Faits marquants » en doublon. Choisir une année vide (ex. 2017 si pas de données) → état vide sobre. Tester en light et dark : le bandeau crépuscule doit bien rendre dans les deux.

- [ ] **Step 4: Commit**

```bash
git add web/components/year-review-hero.tsx web/components/index.ts web/app/insights/year-in-review/page.tsx
git commit -m "feat(insights): hero compteurs animés sur la rétrospective annuelle"
```

---

## Task 12: Vérification finale

**Files:** aucun nouveau.

- [ ] **Step 1: Suite complète**

Run: `cd web && npx tsc --noEmit && npx vitest run && npx biome check .`
Expected: 0 erreur TS, tous les tests passent, lint propre (corriger les éventuels imports inutilisés signalés).

- [ ] **Step 2: Passe visuelle complète (avec `make dev`)**

- `/games`, `/films`, `/series` : onglets Statistiques identiques à avant (comparer mentalement avec la prod).
- Navigation entre 3-4 sections : cross-fade, header stable.
- `/films` : morph cover ↔ modal, recherche + tri + deep link `?open=` OK.
- Theme toggle : reveal circulaire intact.
- `/insights/year-in-review` : hero animé, changement d'année, année vide.

- [ ] **Step 3: Commit final si des corrections lint ont été faites**

```bash
git add -A web/
git commit -m "chore: corrections lint post-implémentation"
```

(Ne committer que si Step 1 a entraîné des modifications.)

---

## Notes pour l'exécutant

- **Les numéros de ligne** référencent l'état des fichiers au moment de la rédaction du plan (commit `658cd60`). Si un fichier a bougé, retrouver les blocs par leur contenu (les extraits cités sont exacts).
- **Déplacements de code** : quand le plan dit « corps inchangé », copier-coller strictement — le but du chantier 1 est l'iso-fonctionnalité, vérifiée par les tests écrits AVANT le déplacement.
- **Ne jamais lancer `next build`** si un `next dev` tourne (voir CLAUDE.md).
- L'ordre des tasks est important : 1→6 (stats), 7→9 (View Transitions), 10→11 (hero), 12 (verif). Les trois chantiers sont indépendants entre eux mais chaque task suppose les précédentes de son chantier.
