# HUB LIFE - Personal Dashboard

Dashboard Next.js 14 cyberpunk — agrège games, films, séries, books, sport, Spotify, GitHub, Steam, voyages, rencontres.

## Commandes

```bash
make dev          # Lance le serveur
make build        # Build data + Next.js
make update       # Pipeline Python complet
make update-quick # Génère JSON sans re-télécharger
```

## Règles

- Imports : toujours `@/` alias
- Composants : PascalCase, barrel export via `components/index.ts`
- Fichiers : kebab-case
- Données jamais committées — `data/` et `web/data/` sont gitignorés
- Erreurs API : toujours `{ data: [], hasData: false }` + `console.error`
- Images externes : `<Image>` Next.js ; couvertures livres : `<img>`
- Style : thème cyberpunk sombre, JetBrains Mono + Orbitron

## Pointeurs

- Architecture détaillée : `README.md`
- Types centralisés : `web/lib/types.ts`
- Chargement données : `web/lib/data.ts`
- Sections + couleurs + data sources : `web/app/` (une page par section)
- Caches : `web/lib/file-cache.ts`, `github-cache.ts`, `steam-cache.ts`, `token-cache.ts`
- Rate limiting : `web/lib/rate-limiter.ts`
- Build pipeline : `web/scripts/build-data.ts`, `pipelines/update-data.py`
