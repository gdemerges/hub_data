'use client'

import { useState } from 'react'
import type { RacePrediction, TrainingGoal } from '@/lib/types'
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
      <div className="text-center py-8 text-text-muted text-sm">
        Pas assez de données de course pour prédire les temps.
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
    const parts = targetInput.split(':').map(p => parseInt(p, 10))
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
    if (confidence >= 85) return 'text-earth-moss'
    if (confidence >= 70) return 'text-earth-fern'
    return 'text-earth-saffron'
  }

  const getProgressColor = (prediction: RacePrediction, goal?: TrainingGoal) => {
    if (!goal) return 'border-border-subtle'

    const gap = ((prediction.predictedTime - goal.targetTime) / goal.targetTime) * 100
    if (gap <= 0) return 'border-earth-moss/50'
    if (gap <= 5) return 'border-earth-fern/50'
    if (gap <= 10) return 'border-earth-saffron/50'
    return 'border-earth-rust/50'
  }

  return (
    <div className="tech-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-earth-terracotta/10 border border-earth-terracotta/30 rounded-xl">
          <Award className="w-4 h-4 text-earth-terracotta" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium tracking-tight text-text-primary">
            Prédicteur de course
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Temps estimés via la formule de Riegel
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
              className={`tech-card-flat p-5 border ${getProgressColor(prediction, goal)} transition-all hover:border-earth-terracotta/50`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-display text-lg font-medium tracking-tight text-text-primary">{label}</h4>
                  <p className="text-[11px] text-text-muted mt-0.5 num">
                    Allure : {prediction.currentPace.toFixed(2)} min/km
                  </p>
                </div>
                <div className={`text-[10px] uppercase tracking-[0.18em] font-medium ${getConfidenceColor(prediction.confidence)}`}>
                  {prediction.confidence}% conf.
                </div>
              </div>

              {/* Predicted Time */}
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-1.5">Temps prédit</p>
                <p className="font-display text-3xl font-medium tracking-tight num text-earth-terracotta leading-none">
                  {formatTime(prediction.predictedTime)}
                </p>
              </div>

              {/* Goal Section */}
              {!isEditing ? (
                <div className="border-t border-border-subtle pt-3">
                  {goal ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Objectif</p>
                        <button
                          onClick={() => handleSetGoal(distance)}
                          className="text-earth-fern hover:text-text-primary transition-colors"
                          aria-label="Modifier l'objectif"
                        >
                          <Edit2 className="w-3 h-3" strokeWidth={1.75} />
                        </button>
                      </div>
                      <p className="font-display text-xl font-medium tracking-tight num text-earth-fern mb-2">
                        {formatTime(goal.targetTime)}
                      </p>
                      {isAheadOfGoal ? (
                        <div className="flex items-center gap-2 text-earth-moss text-xs">
                          <Check className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>Atteignable · {formatTime(Math.abs(timeDiff))} d'avance</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-earth-rust text-xs">
                          <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>Écart : +{formatTime(Math.abs(timeDiff))}</span>
                        </div>
                      )}
                      {prediction.timeToTarget !== undefined && prediction.timeToTarget > 0 && (
                        <p className="text-[11px] text-text-muted mt-2">
                          ≈ {Math.ceil(prediction.timeToTarget / 30)} mois d'entraînement
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSetGoal(distance)}
                      className="w-full py-2 px-3 border border-earth-fern/30 rounded-full text-earth-fern text-xs font-medium hover:bg-earth-fern/10 hover:border-earth-fern/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Target className="w-3 h-3" strokeWidth={2} />
                      Définir un objectif
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-t border-border-subtle pt-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mb-2">
                    Temps objectif (MM:SS ou HH:MM:SS)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      placeholder="59:00"
                      className="flex-1 px-3 py-2 bg-bg-card border border-border-subtle rounded-full text-text-primary text-sm num focus:outline-none focus:border-earth-fern/60"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveGoal(distance)}
                      className="p-2 bg-earth-moss/15 border border-earth-moss/30 rounded-full text-earth-moss hover:bg-earth-moss/25 transition-all"
                      aria-label="Valider"
                    >
                      <Check className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 bg-earth-clay/15 border border-earth-clay/30 rounded-full text-earth-clay hover:bg-earth-clay/25 transition-all"
                      aria-label="Annuler"
                    >
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 tech-card-flat p-4">
        <p className="text-xs text-text-secondary leading-relaxed">
          Prédictions via la <span className="text-earth-terracotta font-medium">formule de Riegel</span> ajustée,
          basées sur tes performances récentes. La confiance dépend du nombre de sorties et de la similarité avec la
          distance cible.
        </p>
      </div>
    </div>
  )
}
