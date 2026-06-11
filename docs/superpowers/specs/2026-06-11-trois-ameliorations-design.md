# Trois améliorations : pré-agrégation des stats, View Transitions, hero rétrospective

**Date** : 2026-06-11
**Statut** : validé (brainstorming avec Guillaume, choix visuels via companion)

## Contexte

Trois chantiers indépendants retenus parmi une liste d'améliorations :

1. **Pré-agrégation des stats** — les composants `games-stats.tsx` (868 lignes), `films-stats.tsx`, `series-stats.tsx` recalculent toutes leurs statistiques côté client dans des `useMemo`. Le calcul doit se faire côté serveur (pages statiques, `revalidate = 3600`).
2. **View Transitions** — transitions fluides entre pages + effet « morph » de la cover quand on ouvre le détail d'un média depuis la grille.
3. **Hero rétrospective** — la page `/insights/year-in-review` existe (cartes + listes) ; on lui ajoute un hero narratif animé au-dessus (décision : option « hybride », composition « compteurs géants »).

Périmètre validé : pré-agrégation **games + films + séries** uniquement (books reste tel quel) ; View Transitions **navigation + morph covers** ; hero **compteurs géants** sans covers.

---

## Chantier 1 : Pré-agrégation des stats

### Architecture

```
web/lib/media-stats/
  games-stats.ts    → computeGameStats(games: Game[]): GameStatsData
  films-stats.ts    → computeFilmStats(films: Film[]): FilmStatsData
  series-stats.ts   → computeSeriesStats(series: Series[]): SeriesStatsData
  index.ts          (barrel)
```

- La logique des `useMemo` actuels est **déplacée à l'identique** — pas de réécriture des calculs. Les tests figent le comportement avant déplacement.
- Les types `GameStatsData` / `FilmStatsData` / `SeriesStatsData` décrivent les objets retournés aujourd'hui par les `useMemo`. Ils sont exportés depuis les fichiers lib (types dérivés, pas des entités → pas dans `types.ts`).

### Data flow

Les pages server `app/games/page.tsx`, `app/films/page.tsx`, `app/series/page.tsx` appellent `computeXxxStats(...)` et passent le résultat en prop aux composants client. Pages en ISR → calcul au build/revalidation, plus jamais dans le navigateur.

### Composants

- `games-stats.tsx`, `films-stats.tsx`, `series-stats.tsx` perdent leurs `useMemo` et reçoivent `stats` en prop. L'état interactif (sections dépliables, sélections de filtres) reste client.
- `games-stats.tsx` est découpé en sous-composants présentationnels (`components/games-stats/` : kpi-row, tops, status-breakdown… selon les blocs naturels du fichier), avec barrel export conservé pour ne pas casser les imports.
- Les clics interactifs des camemberts (filtrage plateforme/genre dans `games-page-client.tsx`) continuent de fonctionner : ils filtrent la **liste** des jeux (données brutes déjà passées au client pour la grille), pas les stats.

### Tests

Vitest sur chaque `computeXxxStats` avec fixtures : totaux, tops, cas limites (liste vide → stats neutres sans crash, jeux multi-plateformes, normalisation des genres RPG).

### Risque principal

Régression silencieuse si l'extraction altère un calcul → écrire les tests sur le comportement actuel **avant** le déplacement.

---

## Chantier 2 : View Transitions

### Util de base

`web/lib/view-transition.ts` :

```ts
withViewTransition(update: () => void): void
```

- `document.startViewTransition` absent **ou** `prefers-reduced-motion` → exécute `update()` directement (comportement actuel, zéro régression).
- Sinon, enrobe dans `startViewTransition`. Factorise le pattern déjà utilisé par le theme toggle.

### A. Navigation entre pages

- Nouveau composant `TransitionLink` (même API que `next/link`) : `preventDefault` au clic, puis `startViewTransition` dont le callback fait `router.push(href)` et retourne une promesse résolue quand `usePathname()` a changé (ref + `useEffect`, ~60 lignes).
- Adopté dans `navigation.tsx` (liens de section) et la command palette. Les autres `Link` restent intacts — adoption progressive.
- Clic molette / cmd+clic / touches modificatrices : pas de `preventDefault`, comportement navigateur normal.
- CSS dans `globals.css` : cross-fade ~250ms sur `::view-transition-old/new(root)` ; le header de nav reçoit `view-transition-name: site-nav` pour rester stable pendant la transition du contenu.
- Timeout de sécurité ~3s : si la navigation ne se résout pas, la promesse se résout quand même (le navigateur skippe la transition, la nav aboutit).

### B. Morph cover grille → détail

Dans `media-grid.tsx` et `films-client.tsx` (rendu propre) :

- Au clic sur une carte : pose `viewTransitionName: 'media-cover'` en style inline **sur la vignette cliquée uniquement** (un seul élément peut porter le nom), puis `withViewTransition(() => flushSync(ouverture de l'overlay))`.
- L'image de `MediaDetail` porte le même `view-transition-name` → le navigateur interpole position/taille (la cover « grandit » vers l'overlay).
- Fermeture : même mécanique en sens inverse ; le nom est retiré de la vignette après la transition (sinon il polluerait les transitions de navigation).
- CSS : `::view-transition-group(media-cover)`, easing doux ~300ms.

### Tests

Vitest sur `withViewTransition` (fallback sans support, reduced-motion). Le rendu visuel se vérifie à la main (animation navigateur, pas testable utilement en unit).

---

## Chantier 3 : Hero rétrospective (compteurs géants)

### Composant

`web/components/year-review-hero.tsx`, inséré dans `/insights/year-in-review` entre le sélecteur d'année et la grille de cartes existante.

### Contenu

- Bandeau pleine largeur, dégradé crépuscule (tons `earth.*` sombres), cohérent avec le thème solarpunk, style `tech-card-raised`.
- Eyebrow mono : `RÉTROSPECTIVE · {year}`.
- Rangée de 4 compteurs géants en Fraunces : **films** (total), **heures de jeu**, **livres**, **pages lues** — accent de section (terracotta, moss, indigo), libellé mono dessous.
- Compteurs à zéro masqués ; si tout est vide, le hero est remplacé par un état vide sobre.
- Les **faits marquants** (chips `highlights`) migrent dans le bas du hero ; la carte « Faits marquants » séparée disparaît (pas de doublon).

### Animation

Hook `useCountUp(target, { duration: 1200 })` : rAF + easing ease-out, démarre au montage, se rejoue au changement d'année (key sur `year`). `prefers-reduced-motion` → valeur finale directe. Zéro dépendance.

### Données

Aucune modification de l'API : `/api/year-in-review` fournit déjà `films.total`, `games.hoursPlayed`, `books.total`, `books.pages`, `highlights`. Pendant le chargement SWR : skeleton du bandeau (pas de saut de layout).

### Séries

Toujours exclues (non datées, voir mémoire projet) — le hero ne les mentionne pas ; la carte Séries existante avec son explication reste en dessous.

### Tests

Vitest sur la logique pure du count-up (progression easing, valeur finale atteinte) — pas de testing-library dans le projet, donc test de la fonction de progression, pas du rendu.

---

## Décisions écartées

- **Stats dans les JSON ou `stats.json` séparé** : écarté au profit du calcul en Server Component (zéro changement de pipeline/whitelist git, testable, même gain perf).
- **Flag Next `experimental.viewTransition` / lib `next-view-transitions`** : écarté au profit du manuel ciblé (API instable / dépendance inutile pour ~100 lignes).
- **Scroll narratif « Wrapped » ou stories plein écran** : écarté au profit de l'hybride hero + cartes existantes.
- **Mosaïque de covers / punchlines dans le hero** : écarté au profit des compteurs géants.

## Ordre suggéré d'implémentation

1. Chantier 1 (pré-agrégation) — indépendant, le plus de valeur perf.
2. Chantier 2 (View Transitions) — touche `media-grid`/`films-client`, à faire après le 1 pour éviter les conflits sur les pages média.
3. Chantier 3 (hero) — indépendant, le plus court.

## Contraintes transverses

- Imports via `@/`, fichiers kebab-case, composants PascalCase, barrel exports.
- Pas de `next build` pendant le dev (casse le `next dev` en cours) — validation via `tsc` + `vitest`.
- Thème : ne pas réintroduire de classes `neon-*`.
