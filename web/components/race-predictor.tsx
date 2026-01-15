'use client'

import { useState } from 'react'
import { RacePrediction, TrainingGoal } from '@/lib/types'
import { Target, Award, TrendingUp, Edit2, Check, X } from 'lucide-react'

interface RacePredictorProps {
  predictions: RacePrediction[]
  onSetGoal?: (distance: number, targetTime: number) => void
}

const RACE_DISTANCES = [
  { distance: 5, label: '5 km' },
  { distance: 10, label: '10 km' },
  { distance: 21.1, label: 'Semi-marathon' },
  { distance: 42.2, label: 'Marathon' },
]

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  const secs = Math.round((minutes % 1) * 60)

  if (hours > 0) {
    return `${hours}h${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function RacePredictor({ predictions, onSetGoal }: RacePredictorProps) {
  const [editingDistance, setEditingDistance] = useState<number | null>(null)
  const [targetInput, setTargetInput] = useState('')
  const [goals, setGoals] = useState<Map<number, TrainingGoal>>(new Map())

  if (predictions.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted font-mono text-sm">
        Pas assez de données de course pour prédire les temps
      </div>
    )
  }

  const handleSetGoal = (distance: number) => {
    setEditingDistance(distance)
    const existingGoal = goals.get(distance)
    if (existingGoal) {
      setTargetInput(formatTime(existingGoal.targetTime))
    } else {
      setTargetInput('')
    }
  }

  const handleSaveGoal = (distance: number) => {
    // Parse input HH:MM:SS or MM:SS
    const parts = targetInput.split(':').map(p => parseInt(p))
    let targetMinutes = 0

    if (parts.length === 3) {
      // HH:MM:SS
      targetMinutes = parts[0] * 60 + parts[1] + parts[2] / 60
    } else if (parts.length === 2) {
      // MM:SS
      targetMinutes = parts[0] + parts[1] / 60
    } else if (parts.length === 1) {
      // Just minutes
      targetMinutes = parts[0]
    }

    if (targetMinutes > 0) {
      const newGoal: TrainingGoal = {
        distance,
        targetTime: targetMinutes,
        createdAt: new Date().toISOString(),
      }
      setGoals(new Map(goals.set(distance, newGoal)))

      // Save to localStorage
      if (typeof window !== 'undefined') {
        const goalsArray = Array.from(goals.values())
        goalsArray.push(newGoal)
        localStorage.setItem('training-goals', JSON.stringify(goalsArray))
      }

      if (onSetGoal) {
        onSetGoal(distance, targetMinutes)
      }
    }

    setEditingDistance(null)
    setTargetInput('')
  }

  const handleCancelEdit = () => {
    setEditingDistance(null)
    setTargetInput('')
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-neon-green'
    if (confidence >= 70) return 'text-neon-cyan'
    return 'text-neon-yellow'
  }

  const getProgressColor = (prediction: RacePrediction, goal?: TrainingGoal) => {
    if (!goal) return 'border-border-subtle'

    const gap = ((prediction.predictedTime - goal.targetTime) / goal.targetTime) * 100
    if (gap <= 0) return 'border-neon-green/50'
    if (gap <= 5) return 'border-neon-cyan/50'
    if (gap <= 10) return 'border-neon-yellow/50'
    return 'border-neon-orange/50'
  }

  return (
    <div className="tech-card p-6 border-neon-magenta/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded">
          <Award className="w-5 h-5 text-neon-magenta" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">
            Race_Predictor // Prédictions de temps
          </h3>
          <p className="text-xs font-mono text-text-muted mt-1">
            Temps estimés basés sur tes performances récentes (formule de Riegel)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RACE_DISTANCES.map(({ distance, label }) => {
          const prediction = predictions.find(p => p.distance === distance)
          const goal = goals.get(distance)

          if (!prediction) return null

          const isEditing = editingDistance === distance
          const timeDiff = goal ? prediction.predictedTime - goal.targetTime : 0
          const isAheadOfGoal = goal && timeDiff <= 0

          return (
            <div
              key={distance}
              className={`bg-bg-primary p-4 rounded-lg border ${getProgressColor(prediction, goal)} transition-all hover:border-neon-magenta/50`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-mono font-bold text-text-primary">{label}</h4>
                  <p className="text-xs font-mono text-text-muted mt-1">
                    Allure: {prediction.currentPace.toFixed(2)} min/km
                  </p>
                </div>
                <div className={`text-xs font-mono ${getConfidenceColor(prediction.confidence)}`}>
                  {prediction.confidence}% conf.
                </div>
              </div>

              {/* Predicted Time */}
              <div className="mb-3">
                <p className="text-xs font-mono text-text-muted mb-1">Temps prédit</p>
                <p className="text-2xl font-mono font-bold text-neon-magenta">
                  {formatTime(prediction.predictedTime)}
                </p>
              </div>

              {/* Goal Section */}
              {!isEditing ? (
                <div className="border-t border-border-subtle pt-3">
                  {goal ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-mono text-text-muted">Objectif</p>
                        <button
                          onClick={() => handleSetGoal(distance)}
                          className="text-neon-cyan hover:text-neon-cyan/70 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-lg font-mono font-bold text-neon-cyan mb-2">
                        {formatTime(goal.targetTime)}
                      </p>
                      {isAheadOfGoal ? (
                        <div className="flex items-center gap-2 text-neon-green text-xs font-mono">
                          <Check className="w-4 h-4" />
                          <span>Objectif atteignable ! ({formatTime(Math.abs(timeDiff))} d'avance)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-neon-orange text-xs font-mono">
                          <TrendingUp className="w-4 h-4" />
                          <span>Écart: +{formatTime(Math.abs(timeDiff))}</span>
                        </div>
                      )}
                      {prediction.timeToTarget !== undefined && prediction.timeToTarget > 0 && (
                        <p className="text-xs font-mono text-text-muted mt-2">
                          Estimation: {Math.ceil(prediction.timeToTarget / 30)} mois d'entraînement
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSetGoal(distance)}
                      className="w-full py-2 px-3 border border-neon-cyan/30 rounded text-neon-cyan text-xs font-mono hover:bg-neon-cyan/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Target className="w-3 h-3" />
                      Définir un objectif
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-t border-border-subtle pt-3">
                  <p className="text-xs font-mono text-text-muted mb-2">Temps objectif (MM:SS ou HH:MM:SS)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      placeholder="59:00"
                      className="flex-1 px-3 py-2 bg-bg-card border border-border-subtle rounded text-text-primary font-mono text-sm focus:outline-none focus:border-neon-cyan/50"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveGoal(distance)}
                      className="p-2 bg-neon-green/20 border border-neon-green/30 rounded text-neon-green hover:bg-neon-green/30 transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info box */}
      <div className="mt-6 p-4 bg-bg-primary rounded-lg border border-border-subtle">
        <p className="text-xs font-mono text-text-secondary leading-relaxed">
          Les prédictions sont calculées via la <span className="text-neon-magenta">formule de Riegel</span> ajustée,
          basée sur tes performances récentes. Le niveau de confiance dépend du nombre de sorties et de la
          similarité avec la distance cible. Définis un objectif pour suivre ta progression !
        </p>
      </div>
    </div>
  )
}
