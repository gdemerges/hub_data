'use client'

import { memo, useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface NationalityData {
  nationalite: string
  count: number
}

interface NationalityMapProps {
  data: NationalityData[]
}

// Mapping des noms de pays en français vers les noms ISO (utilisés dans le GeoJSON)
const countryNameMapping: Record<string, string> = {
  // Europe
  'France': 'France',
  'Espagne': 'Spain',
  'Italie': 'Italy',
  'Royaume-Uni': 'United Kingdom',
  'Angleterre': 'United Kingdom',
  'Suisse': 'Switzerland',
  'Allemagne': 'Germany',
  'Belgique': 'Belgium',
  'Portugal': 'Portugal',
  'Pays-Bas': 'Netherlands',
  'Hollande': 'Netherlands',
  'Autriche': 'Austria',
  'Pologne': 'Poland',
  'Tchéquie': 'Czechia',
  'République Tchèque': 'Czechia',
  'Hongrie': 'Hungary',
  'Roumanie': 'Romania',
  'Bulgarie': 'Bulgaria',
  'Grèce': 'Greece',
  'Suède': 'Sweden',
  'Norvège': 'Norway',
  'Danemark': 'Denmark',
  'Finlande': 'Finland',
  'Irlande': 'Ireland',
  'Écosse': 'United Kingdom',
  'Pays de Galles': 'United Kingdom',
  'Luxembourg': 'Luxembourg',
  'Slovaquie': 'Slovakia',
  'Slovénie': 'Slovenia',
  'Croatie': 'Croatia',
  'Serbie': 'Serbia',
  'Bosnie': 'Bosnia and Herz.',
  'Monténégro': 'Montenegro',
  'Macédoine': 'North Macedonia',
  'Albanie': 'Albania',
  'Kosovo': 'Kosovo',
  'Lettonie': 'Latvia',
  'Lituanie': 'Lithuania',
  'Estonie': 'Estonia',
  'Islande': 'Iceland',
  'Malte': 'Malta',
  'Chypre': 'Cyprus',
  // Europe de l'Est
  'Russie': 'Russia',
  'Ukraine': 'Ukraine',
  'Biélorussie': 'Belarus',
  'Moldavie': 'Moldova',
  'Géorgie': 'Georgia',
  'Arménie': 'Armenia',
  'Azerbaïdjan': 'Azerbaijan',
  // Amérique du Nord
  'États-Unis': 'United States of America',
  'USA': 'United States of America',
  'Canada': 'Canada',
  'Mexique': 'Mexico',
  // Amérique du Sud
  'Brésil': 'Brazil',
  'Argentine': 'Argentina',
  'Colombie': 'Colombia',
  'Chili': 'Chile',
  'Pérou': 'Peru',
  'Venezuela': 'Venezuela',
  'Cuba': 'Cuba',
  'Équateur': 'Ecuador',
  'Bolivie': 'Bolivia',
  'Paraguay': 'Paraguay',
  'Uruguay': 'Uruguay',
  // Asie
  'Japon': 'Japan',
  'Chine': 'China',
  'Corée du Sud': 'South Korea',
  'Corée': 'South Korea',
  'Inde': 'India',
  'Thaïlande': 'Thailand',
  'Vietnam': 'Vietnam',
  'Philippines': 'Philippines',
  'Indonésie': 'Indonesia',
  'Malaisie': 'Malaysia',
  'Singapour': 'Singapore',
  'Taïwan': 'Taiwan',
  // Océanie
  'Australie': 'Australia',
  'Nouvelle-Zélande': 'New Zealand',
  // Afrique du Nord
  'Maroc': 'Morocco',
  'Algérie': 'Algeria',
  'Tunisie': 'Tunisia',
  'Égypte': 'Egypt',
  'Libye': 'Libya',
  // Afrique
  'Afrique du Sud': 'South Africa',
  'Nigeria': 'Nigeria',
  'Kenya': 'Kenya',
  'Sénégal': 'Senegal',
  'Côte d\'Ivoire': 'Ivory Coast',
  'Cameroun': 'Cameroon',
  'Ghana': 'Ghana',
  'Éthiopie': 'Ethiopia',
  // Moyen-Orient
  'Turquie': 'Turkey',
  'Israël': 'Israel',
  'Liban': 'Lebanon',
  'Émirats Arabes Unis': 'United Arab Emirates',
  'Arabie Saoudite': 'Saudi Arabia',
  'Iran': 'Iran',
  'Irak': 'Iraq',
  'Syrie': 'Syria',
  'Jordanie': 'Jordan',
}

// Fonction pour nettoyer la nationalité (enlever emoji et espaces)
function cleanNationality(nationality: string): string {
  // Enlever tous les emojis (incluant les drapeaux qui sont 2 caractères régionaux)
  return nationality
    .replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, '') // Drapeaux (2 caractères régionaux)
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Autres emojis
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Symboles divers
    .trim()
}

export const NationalityMap = memo(function NationalityMap({ data }: NationalityMapProps) {
  // Créer un mapping pays -> count
  const countryData = useMemo(() => {
    const map = new Map<string, number>()

    data.forEach(({ nationalite, count }) => {
      // Nettoyer la nationalité (enlever emoji)
      const cleanedNationality = cleanNationality(nationalite)
      const country = countryNameMapping[cleanedNationality]
      if (country) {
        map.set(country, (map.get(country) || 0) + count)
      }
    })

    return map
  }, [data])

  // Trouver le maximum pour le calcul de l'opacité
  const maxCount = useMemo(() => {
    return Math.max(...Array.from(countryData.values()), 1)
  }, [countryData])

  // Fonction pour obtenir la couleur avec opacité
  const getCountryColor = (countryName: string): string => {
    const count = countryData.get(countryName)
    if (!count) return '#15151d' // Couleur de fond pour pays non visités

    // Calculer l'opacité (minimum 0.3, maximum 1.0)
    const intensity = 0.3 + (count / maxCount) * 0.7

    // Rouge néon avec intensité variable
    // #ff0000 = rgb(255, 0, 0)
    const r = Math.round(255 * intensity)
    const g = 0
    const b = Math.round(20 * intensity) // Légère touche pour éviter le noir pur

    return `rgb(${r}, ${g}, ${b})`
  }

  const getStrokeColor = (countryName: string): string => {
    const count = countryData.get(countryName)
    if (!count) return '#2d2d3d'
    return '#ff3333'
  }

  return (
    <div className="w-full h-full bg-bg-primary rounded-lg border border-border-subtle overflow-hidden relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-red/5 to-transparent pointer-events-none" />

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [10, 30]
        }}
        width={800}
        height={400}
        className="w-full h-full"
      >
        <defs>
          <filter id="glow-red">
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
                const count = countryData.get(countryName)
                const isHighlighted = !!count

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(countryName)}
                    stroke={getStrokeColor(countryName)}
                    strokeWidth={isHighlighted ? 0.8 : 0.3}
                    filter={isHighlighted ? 'url(#glow-red)' : undefined}
                    style={{
                      default: {
                        outline: 'none',
                        transition: 'all 0.3s ease',
                      },
                      hover: {
                        fill: isHighlighted ? '#ff4444' : '#1a1a25',
                        outline: 'none',
                        cursor: 'pointer',
                        strokeWidth: isHighlighted ? 1.5 : 0.3,
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                  >
                    <title>
                      {countryName}{count ? `: ${count}` : ''}
                    </title>
                  </Geography>
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 bg-bg-card/90 px-3 py-2 rounded border border-neon-red/30">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgb(77, 0, 6)' }} />
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgb(153, 0, 12)' }} />
            <div className="w-3 h-3 rounded-sm bg-neon-red" />
          </div>
          <span className="text-neon-red">Nationalités (intensité)</span>
        </div>
      </div>
    </div>
  )
})
