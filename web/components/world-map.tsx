'use client'

import { memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface WorldMapProps {
  visitedCountries: string[]
}

// Mapping des noms de pays de l'API vers les noms ISO
const countryNameMapping: Record<string, string> = {
  'France': 'France',
  'Espagne': 'Spain',
  'Italie': 'Italy',
  'Royaume-Uni': 'United Kingdom',
  'Suisse': 'Switzerland',
  'Allemagne': 'Germany',
  'Belgique': 'Belgium',
  'Portugal': 'Portugal',
  'Pays-Bas': 'Netherlands',
  'Autriche': 'Austria',
}

export const WorldMap = memo(function WorldMap({ visitedCountries }: WorldMapProps) {
  // Convertir les noms français en noms anglais
  const visitedCountriesEnglish = visitedCountries
    .map(country => countryNameMapping[country] || country)

  return (
    <div className="w-full h-full bg-bg-primary rounded-lg border border-border-subtle overflow-hidden relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-orange/5 to-transparent pointer-events-none" />

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 400,
          center: [10, 52] // Centré sur l'Europe
        }}
        width={800}
        height={400}
        className="w-full h-full"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = geo.properties.name
                const isVisited = visitedCountriesEnglish.includes(countryName)

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isVisited ? '#ff8800' : '#15151d'}
                    stroke={isVisited ? '#ffaa33' : '#2d2d3d'}
                    strokeWidth={isVisited ? 0.8 : 0.5}
                    filter={isVisited ? 'url(#glow)' : undefined}
                    style={{
                      default: {
                        outline: 'none',
                        transition: 'all 0.3s ease',
                      },
                      hover: {
                        fill: isVisited ? '#ffaa33' : '#1a1a25',
                        outline: 'none',
                        cursor: 'pointer',
                        strokeWidth: isVisited ? 1.5 : 0.5,
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                  >
                    {isVisited && (
                      <title>{countryName}</title>
                    )}
                  </Geography>
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 bg-bg-card/90 px-3 py-2 rounded border border-neon-orange/30">
          <div className="w-3 h-3 rounded-sm bg-neon-orange" />
          <span className="text-neon-orange">Pays visités</span>
        </div>
        <div className="flex items-center gap-2 bg-bg-card/90 px-3 py-2 rounded border border-border-subtle">
          <div className="w-3 h-3 rounded-sm bg-bg-tertiary" />
          <span className="text-text-muted">Non visités</span>
        </div>
      </div>
    </div>
  )
})
