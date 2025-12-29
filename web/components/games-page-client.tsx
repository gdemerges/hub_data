'use client'

import { useState } from 'react'
import { GamesClient } from '@/components/games-client'
import { PieChart } from '@/components'
import { Clock, Trophy, Gamepad2, BarChart3 } from 'lucide-react'
import { Game } from '@/lib/types'

interface GamesPageClientProps {
  games: Game[]
  platforms: string[]
  platformData: { platform: string; hours: number }[]
  pieChartData: { label: string; value: number; color: string }[]
  genreChartData: { label: string; value: number; color: string }[]
  totalHours: number
}

type Tab = 'games' | 'stats'

export function GamesPageClient({
  games,
  platforms,
  platformData,
  pieChartData,
  genreChartData,
  totalHours,
}: GamesPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('games')
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)

  const handlePlatformClick = (platform: string) => {
    // Toggle selection
    setSelectedPlatform(selectedPlatform === platform ? null : platform)
    setSelectedGenre(null) // Clear genre filter when selecting platform
  }

  const handleGenreClick = (genre: string) => {
    // Toggle selection
    setSelectedGenre(selectedGenre === genre ? null : genre)
    setSelectedPlatform(null) // Clear platform filter when selecting genre
  }

  // Filter games by genre if selected
  const filteredGames = selectedGenre
    ? games.filter(game => game.genres?.includes(selectedGenre))
    : games

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('games')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
            activeTab === 'games'
              ? 'text-accent-primary border-accent-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          Jeux
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
            activeTab === 'stats'
              ? 'text-accent-primary border-accent-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Statistiques
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'games' && (
        <GamesClient
          games={filteredGames}
          platforms={platforms}
          initialFilter={selectedPlatform || undefined}
        />
      )}

      {activeTab === 'stats' && (
        <>
          {/* First row - Total hours and Platform distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Total hours */}
            <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-accent-primary" />
                <h3 className="text-sm font-semibold text-text-secondary">Temps de jeu total</h3>
              </div>
              <p className="text-3xl font-bold text-text-primary">{Math.round(totalHours)}h</p>
              <p className="text-xs text-text-muted mt-2">Toutes plateformes confondues</p>
            </div>

            {/* Platform distribution */}
            <div className="lg:col-span-2 bg-bg-card border border-border-subtle rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-5 h-5 text-accent-primary" />
                <h3 className="text-sm font-semibold text-text-secondary">
                  Répartition par plateforme
                </h3>
              </div>
              {pieChartData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <PieChart
                    data={pieChartData}
                    size={300}
                    onSliceClick={handlePlatformClick}
                    selectedLabel={selectedPlatform || undefined}
                  />
                  {selectedPlatform && (
                    <p className="mt-4 text-sm text-accent-primary">
                      Cliquez sur "{selectedPlatform}" à nouveau pour désélectionner
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted">Aucune donnée disponible</p>
              )}
            </div>
          </div>

          {/* Second row - Genre distribution */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-accent-primary" />
                <h3 className="text-sm font-semibold text-text-secondary">
                  Répartition par genre
                </h3>
              </div>
              {genreChartData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <PieChart
                    data={genreChartData}
                    size={300}
                    onSliceClick={handleGenreClick}
                    selectedLabel={selectedGenre || undefined}
                  />
                  {selectedGenre && (
                    <p className="mt-4 text-sm text-accent-primary">
                      Cliquez sur "{selectedGenre}" à nouveau pour désélectionner
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted">Aucune donnée disponible</p>
              )}
            </div>
          </div>

          {/* Games list for selected filter */}
          {(selectedPlatform || selectedGenre) && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Gamepad2 className="w-5 h-5 text-accent-primary" />
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedPlatform && `Jeux sur ${selectedPlatform}`}
                  {selectedGenre && `Jeux de type ${selectedGenre}`}
                </h3>
              </div>
              <GamesClient
                games={filteredGames}
                platforms={platforms}
                initialFilter={selectedPlatform || undefined}
              />
            </div>
          )}
        </>
      )}
    </>
  )
}
