'use client'

import { Award, BarChart3, Heart, TrendingUp } from 'lucide-react'
import {
  ExpandableSection,
  FitnessChart,
  RacePredictor,
  RecoveryAdvisor,
  HeartRateZones,
  PerformanceFactors,
} from '@/components'
import {
  analyzeRecovery,
  predictRaceTimes,
  calculateTimeToTarget,
  calculateFitnessMetrics,
  calculateLTHR,
  analyzePerformanceFactors,
} from '@/lib/fitness-calculator'
import { SportActivity } from '@/lib/sport'

interface Props {
  activities: SportActivity[]
  runOnlyMode: boolean
}

export function SportAiPanels({ activities, runOnlyMode }: Props) {
  const runs = activities.filter((a) => a.type === 'Run')

  return (
    <>
      {runOnlyMode && runs.length > 0 && (
        <div className="mb-6">
          <RecoveryAdvisor advice={analyzeRecovery(runs)} />
        </div>
      )}

      {runOnlyMode && runs.length > 0 && <RacePredictorPanel runs={runs} />}

      {activities.length > 0 && (
        <ExpandableSection
          title="Fitness_Metrics // CTL/ATL/TSB"
          subtitle="Analyse de ta forme physique et fatigue"
          icon={<TrendingUp className="w-5 h-5 text-neon-cyan" />}
          defaultExpanded={false}
        >
          <FitnessChart data={calculateFitnessMetrics(activities)} />
        </ExpandableSection>
      )}

      {runOnlyMode && runs.length > 0 && (
        <ExpandableSection
          title="Heart_Rate_Zones"
          subtitle="Analyse des zones de fréquence cardiaque"
          icon={<Heart className="w-5 h-5 text-neon-cyan" />}
          defaultExpanded={false}
        >
          <HeartRateZones activities={runs} lthr={calculateLTHR(runs)} />
        </ExpandableSection>
      )}

      {runOnlyMode && runs.length >= 10 && <PerformanceFactorsPanel runs={runs} />}
    </>
  )
}

function RacePredictorPanel({ runs }: { runs: SportActivity[] }) {
  let predictions = predictRaceTimes(runs)

  predictions = predictions.map((pred) => {
    try {
      const goal =
        typeof window !== 'undefined'
          ? (
              JSON.parse(localStorage.getItem('training-goals') || '[]') as {
                distance: number
                targetTime: number
              }[]
            ).find((g) => g.distance === pred.distance)
          : null

      if (goal && pred.predictedTime > goal.targetTime) {
        return {
          ...pred,
          targetTime: goal.targetTime,
          timeToTarget: calculateTimeToTarget(pred.predictedTime, goal.targetTime, runs),
        }
      }
    } catch (e) {
      console.error('Goal parsing error:', e)
    }
    return pred
  })

  return (
    <ExpandableSection
      title="Race_Predictor"
      subtitle="Prédictions de temps de course avec objectifs"
      icon={<Award className="w-5 h-5 text-neon-cyan" />}
      defaultExpanded={false}
    >
      <RacePredictor predictions={predictions} />
    </ExpandableSection>
  )
}

function PerformanceFactorsPanel({ runs }: { runs: SportActivity[] }) {
  const analysis = analyzePerformanceFactors(runs)
  if (!analysis) return null
  return (
    <ExpandableSection
      title="Performance_Factors"
      subtitle="Corrélations entre performances et conditions"
      icon={<BarChart3 className="w-5 h-5 text-neon-cyan" />}
      defaultExpanded={false}
    >
      <PerformanceFactors analysis={analysis} />
    </ExpandableSection>
  )
}
