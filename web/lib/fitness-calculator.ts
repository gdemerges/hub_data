import { FitnessMetrics, RacePrediction, RecoveryAdvice, PerformanceAnalysis, PerformanceInsight } from './types'
import { logger } from './logger'

// Fitness algorithm constants — edit here to adjust all calculations
export const FITNESS_CONSTANTS = {
  // CTL (Chronic Training Load) exponential moving average window in days
  CTL_DAYS: 42,
  // ATL (Acute Training Load) exponential moving average window in days
  ATL_DAYS: 7,
  // Default LTHR (lactate threshold heart rate) when no HR data available
  DEFAULT_LTHR: 165,
  // Default threshold pace (min/km) used when pace-based TSS is the fallback
  DEFAULT_THRESHOLD_PACE: 5.5,
  // Rolling window (days) used to compute fitness metrics
  FITNESS_WINDOW_DAYS: 180,
  // Minimum intensity factor clamped in TSS calculation
  MIN_INTENSITY_FACTOR: 0.5,
  // Maximum intensity factor clamped in TSS calculation
  MAX_INTENSITY_FACTOR: 1.5,
  // Risk threshold: load increase % that triggers moderate warning
  LOAD_INCREASE_WARNING_PCT: 10,
  // Risk threshold: load increase % that triggers high warning
  LOAD_INCREASE_DANGER_PCT: 20,
  // TSS above this value = high intensity activity
  TSS_HIGH_INTENSITY: 150,
  // TSS above this value = moderate intensity activity
  TSS_MODERATE_INTENSITY: 100,
  // Consecutive activities within 3 days count as overtraining risk
  CONSECUTIVE_ACTIVITY_RISK: 3,
} as const

interface Activity {
  startDate: string
  distance: number // km
  movingTime: number // minutes
  totalElevationGain: number // meters
  type: string
  averageHeartrate?: number
}

/**
 * Calcule le seuil de fréquence cardiaque (LTHR) basé sur les activités récentes
 * LTHR = environ 90% de la FC max observée lors d'efforts soutenus
 */
export function calculateLTHR(activities: Activity[]): number {
  const activitiesWithHR = activities.filter(a => a.averageHeartrate && a.averageHeartrate > 0)

  if (activitiesWithHR.length === 0) return FITNESS_CONSTANTS.DEFAULT_LTHR

  // Trouver les 10 efforts les plus intenses (allure rapide + FC élevée)
  const intensiveEfforts = activitiesWithHR
    .filter(a => a.distance > 3) // Au moins 3km pour être significatif
    .sort((a, b) => {
      const scoreA = (a.averageHeartrate || 0) * (a.distance / (a.movingTime / 60))
      const scoreB = (b.averageHeartrate || 0) * (b.distance / (b.movingTime / 60))
      return scoreB - scoreA
    })
    .slice(0, 10)

  if (intensiveEfforts.length === 0) {
    // Utiliser la moyenne des 90% supérieurs
    const sortedHR = activitiesWithHR
      .map(a => a.averageHeartrate || 0)
      .sort((a, b) => b - a)
    const top10Percent = sortedHR.slice(0, Math.max(1, Math.floor(sortedHR.length * 0.1)))
    return Math.round(top10Percent.reduce((sum, hr) => sum + hr, 0) / top10Percent.length * 0.90)
  }

  // Moyenne des FC des efforts intenses, réduite de 10% pour estimer le seuil
  const avgIntensiveHR = intensiveEfforts.reduce((sum, a) => sum + (a.averageHeartrate || 0), 0) / intensiveEfforts.length
  return Math.round(avgIntensiveHR * 0.90)
}

/**
 * Calcule le Training Stress Score (TSS) pour une activité
 * Priorité : utilise la fréquence cardiaque si disponible, sinon l'allure
 */
export function calculateTSS(activity: Activity, thresholdPace: number = FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE, lthr?: number): number {
  const durationHours = activity.movingTime / 60
  let intensityFactor = 0

  // Méthode 1 : Calcul basé sur la fréquence cardiaque (plus précis)
  if (activity.averageHeartrate && activity.averageHeartrate > 0 && lthr) {
    // IF = FC moyenne / LTHR
    intensityFactor = activity.averageHeartrate / lthr

    // Limiter IF entre MIN et MAX (sécurité)
    intensityFactor = Math.max(FITNESS_CONSTANTS.MIN_INTENSITY_FACTOR, Math.min(FITNESS_CONSTANTS.MAX_INTENSITY_FACTOR, intensityFactor))

    // TSS = durée (h) × IF² × 100
    const tss = durationHours * Math.pow(intensityFactor, 2) * 100

    // Ajustement pour le dénivelé (chaque 100m = +3% TSS avec FC)
    const elevationMultiplier = 1 + (activity.totalElevationGain / 1000) * 0.03

    return Math.round(tss * elevationMultiplier)
  }

  // Méthode 2 : Calcul basé sur l'allure (fallback)
  const pace = activity.movingTime / activity.distance // min/km

  // Intensité relative (IF) : rapport entre allure actuelle et allure seuil
  // Plus le pace est bas (rapide), plus IF est élevé
  intensityFactor = Math.min(thresholdPace / pace, FITNESS_CONSTANTS.MAX_INTENSITY_FACTOR)

  // TSS = durée (h) × IF² × 100
  const tss = durationHours * Math.pow(intensityFactor, 2) * 100

  // Ajustement pour le dénivelé (chaque 100m = +5 TSS)
  const elevationBonus = (activity.totalElevationGain / 100) * 5

  return Math.round(tss + elevationBonus)
}

/**
 * Calcule les métriques de fitness (CTL/ATL/TSB) sur la période
 * Optimisé pour calculer seulement les 180 derniers jours pour des performances optimales
 */
export function calculateFitnessMetrics(activities: Activity[]): FitnessMetrics[] {
  try {
    // Trier par date croissante
    const sortedActivities = [...activities].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )

    if (sortedActivities.length === 0) return []

    // Limiter aux activités de la fenêtre FITNESS_WINDOW_DAYS pour optimiser les performances
    const sixMonthsAgo = Date.now() - FITNESS_CONSTANTS.FITNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000
    const recentActivities = sortedActivities.filter(
      a => new Date(a.startDate).getTime() >= sixMonthsAgo
    )

    if (recentActivities.length === 0) return []

    // Calculer le LTHR (seuil de fréquence cardiaque)
    const lthr = calculateLTHR(recentActivities)

    // Calculer le pace seuil moyen (médiane des 10 dernières sorties)
    const recentPaces = recentActivities
      .slice(-10)
      .map(a => a.movingTime / a.distance)
      .filter(pace => !isNaN(pace) && pace > 0)
      .sort((a, b) => a - b)
    const thresholdPace = recentPaces[Math.floor(recentPaces.length / 2)] || FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE

    // Créer un map date -> TSS
    const dailyTSS = new Map<string, number>()
    for (const activity of recentActivities) {
      const date = activity.startDate.split('T')[0]
      const tss = calculateTSS(activity, thresholdPace, lthr)
      if (!isNaN(tss) && tss > 0) {
        dailyTSS.set(date, (dailyTSS.get(date) || 0) + tss)
      }
    }

    // Calculer CTL et ATL jour par jour
    const metrics: FitnessMetrics[] = []
    let ctl = 0 // Chronic Training Load
    let atl = 0 // Acute Training Load

    const firstDate = new Date(recentActivities[0].startDate)
    const lastDate = new Date(recentActivities[recentActivities.length - 1].startDate)

    // Limiter le nombre d'itérations
    const daysDiff = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > FITNESS_CONSTANTS.FITNESS_WINDOW_DAYS) {
      firstDate.setTime(lastDate.getTime() - FITNESS_CONSTANTS.FITNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    }

    // Itérer sur chaque jour
    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const todayTSS = dailyTSS.get(dateStr) || 0

      // Formules de moyennes mobiles exponentielles
      // CTL/ATL: exponential moving averages (smoothing = 2 / (window + 1))
      ctl = ctl + (todayTSS - ctl) * (2 / (FITNESS_CONSTANTS.CTL_DAYS + 1))
      atl = atl + (todayTSS - atl) * (2 / (FITNESS_CONSTANTS.ATL_DAYS + 1))

      // TSB = CTL - ATL
      // TSB positif = forme, TSB négatif = fatigue
      const tsb = ctl - atl

      metrics.push({
        ctl: Math.round(ctl * 10) / 10,
        atl: Math.round(atl * 10) / 10,
        tsb: Math.round(tsb * 10) / 10,
        date: dateStr,
      })
    }

    return metrics
  } catch (error) {
    logger.error('Error calculating fitness metrics:', error)
    return []
  }
}

/**
 * Prédit les temps de course sur différentes distances
 * Utilise la formule de Riegel ajustée + progression récente
 */
export function predictRaceTimes(activities: Activity[]): RacePrediction[] {
  const runs = activities.filter(a => a.type === 'Run')
  if (runs.length === 0) return []

  // Trouver les meilleures performances récentes (3 derniers mois)
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  const recentRuns = runs.filter(a => new Date(a.startDate).getTime() > threeMonthsAgo)

  if (recentRuns.length === 0) return []

  // Calculer la vitesse moyenne des 10 dernières sorties (km/h)
  const recentSpeeds = recentRuns
    .slice(-10)
    .map(a => (a.distance / (a.movingTime / 60))) // km/h

  const avgSpeed = recentSpeeds.reduce((sum, s) => sum + s, 0) / recentSpeeds.length
  const currentPace = 60 / avgSpeed // min/km

  // Trouver la meilleure performance sur ~10km
  const runs10k = recentRuns.filter(a => a.distance >= 9 && a.distance <= 11)
  let reference10kTime = 60 // défaut: 60 min

  if (runs10k.length > 0) {
    const best10k = runs10k.reduce((best, run) => {
      const time = run.movingTime
      const bestTime = best.movingTime
      return time < bestTime ? run : best
    })
    reference10kTime = best10k.movingTime
  } else {
    // Estimer d'après la vitesse moyenne
    reference10kTime = 10 * currentPace
  }

  // Formule de Riegel: T2 = T1 × (D2/D1)^1.06
  // Ajustée avec facteur de fatigue selon distance
  const predictions: RacePrediction[] = [
    {
      distance: 5,
      predictedTime: reference10kTime * Math.pow(5 / 10, 1.06),
      currentPace,
      confidence: recentRuns.length >= 10 ? 85 : 70,
    },
    {
      distance: 10,
      predictedTime: reference10kTime,
      currentPace,
      confidence: runs10k.length > 0 ? 90 : 75,
    },
    {
      distance: 21.1,
      predictedTime: reference10kTime * Math.pow(21.1 / 10, 1.06),
      currentPace,
      confidence: recentRuns.length >= 15 ? 75 : 60,
    },
    {
      distance: 42.2,
      predictedTime: reference10kTime * Math.pow(42.2 / 10, 1.08), // Plus conservateur
      currentPace,
      confidence: recentRuns.length >= 20 ? 70 : 50,
    },
  ]

  return predictions
}

/**
 * Calcule le temps estimé pour atteindre un objectif (en jours)
 */
export function calculateTimeToTarget(
  currentTime: number,
  targetTime: number,
  recentActivities: Activity[]
): number {
  if (currentTime <= targetTime) return 0

  // Calculer la progression récente (% amélioration par mois)
  const twoMonthsAgo = Date.now() - 60 * 24 * 60 * 60 * 1000
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  const runs = recentActivities.filter(a => a.type === 'Run')
  const olderRuns = runs.filter(a => {
    const date = new Date(a.startDate).getTime()
    return date >= twoMonthsAgo && date < oneMonthAgo
  })
  const recentRuns = runs.filter(a => {
    const date = new Date(a.startDate).getTime()
    return date >= oneMonthAgo
  })

  if (olderRuns.length === 0 || recentRuns.length === 0) {
    // Pas assez de données, estimer 3% d'amélioration par mois (conservateur)
    const improvement = 0.03
    const gap = (currentTime - targetTime) / currentTime
    return Math.ceil((gap / improvement) * 30)
  }

  const avgOlderPace = olderRuns.reduce((sum, r) => sum + (r.movingTime / r.distance), 0) / olderRuns.length
  const avgRecentPace = recentRuns.reduce((sum, r) => sum + (r.movingTime / r.distance), 0) / recentRuns.length

  // Amélioration mensuelle
  const paceImprovement = (avgOlderPace - avgRecentPace) / avgOlderPace

  if (paceImprovement <= 0) {
    // Pas de progression, estimer 2% par mois avec entraînement
    return Math.ceil(((currentTime - targetTime) / currentTime / 0.02) * 30)
  }

  // Projection basée sur progression actuelle
  const gap = (currentTime - targetTime) / currentTime
  return Math.ceil((gap / paceImprovement) * 30)
}

/**
 * Analyse la récupération et donne des conseils
 */
export function analyzeRecovery(activities: Activity[]): RecoveryAdvice {
  if (activities.length === 0) {
    return {
      status: 'ready',
      hoursRecommended: 0,
      reason: 'Aucune activité récente',
      riskScore: 0,
    }
  }

  // Trier par date décroissante
  const sorted = [...activities].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  // Calculer le LTHR (seuil de fréquence cardiaque)
  const lthr = calculateLTHR(sorted)

  const now = Date.now()
  const lastActivity = sorted[0]
  const hoursSinceLastActivity = (now - new Date(lastActivity.startDate).getTime()) / (1000 * 60 * 60)

  // Calculer la charge de la dernière activité
  const lastActivityLoad = calculateTSS(lastActivity, FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE, lthr)

  // Calculer la charge de la semaine
  const oneWeekAgo = now - FITNESS_CONSTANTS.ATL_DAYS * 24 * 60 * 60 * 1000
  const weekActivities = sorted.filter(a => new Date(a.startDate).getTime() >= oneWeekAgo)
  const weeklyLoad = weekActivities.reduce((sum, a) => sum + calculateTSS(a, FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE, lthr), 0)

  // Calculer la charge de la semaine précédente
  const twoWeeksAgo = now - 2 * FITNESS_CONSTANTS.ATL_DAYS * 24 * 60 * 60 * 1000
  const previousWeekActivities = sorted.filter(a => {
    const date = new Date(a.startDate).getTime()
    return date >= twoWeeksAgo && date < oneWeekAgo
  })
  const previousWeekLoad = previousWeekActivities.reduce((sum, a) => sum + calculateTSS(a, FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE, lthr), 0)

  // Calcul du risque
  let riskScore = 0
  let reasons: string[] = []

  // Risque 1: Augmentation brutale de charge (>20%)
  if (previousWeekLoad > 0) {
    const weekIncrease = ((weeklyLoad - previousWeekLoad) / previousWeekLoad) * 100
    if (weekIncrease > FITNESS_CONSTANTS.LOAD_INCREASE_DANGER_PCT) {
      riskScore += 30
      reasons.push(`Charge hebdo +${Math.round(weekIncrease)}% (>20%)`)
    } else if (weekIncrease > FITNESS_CONSTANTS.LOAD_INCREASE_WARNING_PCT) {
      riskScore += 15
      reasons.push(`Charge hebdo +${Math.round(weekIncrease)}%`)
    }
  }

  // Risque 2: Activité très intense récente
  if (lastActivityLoad > FITNESS_CONSTANTS.TSS_HIGH_INTENSITY) {
    riskScore += 25
    reasons.push('Dernière sortie très intense')
  } else if (lastActivityLoad > FITNESS_CONSTANTS.TSS_MODERATE_INTENSITY) {
    riskScore += 10
  }

  // Risque 3: Récupération insuffisante
  const recommendedRestHours = Math.max(24, lastActivityLoad / 3)
  if (hoursSinceLastActivity < recommendedRestHours) {
    riskScore += 20
    reasons.push('Récupération incomplète')
  }

  // Risque 4: Trop de sorties consécutives
  const last3Days = now - FITNESS_CONSTANTS.CONSECUTIVE_ACTIVITY_RISK * 24 * 60 * 60 * 1000
  const recentCount = sorted.filter(a => new Date(a.startDate).getTime() >= last3Days).length
  if (recentCount >= FITNESS_CONSTANTS.CONSECUTIVE_ACTIVITY_RISK) {
    riskScore += 15
    reasons.push(`${recentCount} sorties en 3 jours`)
  }

  // Déterminer le statut
  let status: 'ready' | 'caution' | 'rest'
  let hoursRecommended = 0

  if (riskScore >= 50) {
    status = 'rest'
    hoursRecommended = Math.max(48, recommendedRestHours - hoursSinceLastActivity)
  } else if (riskScore >= 25 || hoursSinceLastActivity < 24) {
    status = 'caution'
    hoursRecommended = Math.max(24, recommendedRestHours - hoursSinceLastActivity)
  } else {
    status = 'ready'
    hoursRecommended = 0
  }

  const reason = reasons.length > 0 ? reasons.join(' • ') : 'Charge d\'entraînement équilibrée'

  return {
    status,
    hoursRecommended: Math.max(0, Math.round(hoursRecommended)),
    reason,
    riskScore: Math.min(100, riskScore),
  }
}

/**
 * Analyse les facteurs de performance (jour de semaine, heure, repos)
 * Identifie les conditions optimales pour la performance
 */
export function analyzePerformanceFactors(activities: Activity[]): PerformanceAnalysis | null {
  if (activities.length < 10) return null // Besoin d'au moins 10 sorties pour analyse

  // Calculer la vitesse moyenne globale
  const globalAvgSpeed = activities.reduce((sum, a) => {
    const speed = a.distance / (a.movingTime / 60) // km/h
    return sum + speed
  }, 0) / activities.length

  // Analyse par jour de la semaine
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const byDay = new Map<number, { speeds: number[]; count: number }>()

  activities.forEach(a => {
    const date = new Date(a.startDate)
    const day = date.getDay()
    const speed = a.distance / (a.movingTime / 60)

    if (!byDay.has(day)) {
      byDay.set(day, { speeds: [], count: 0 })
    }
    const dayData = byDay.get(day)!
    dayData.speeds.push(speed)
    dayData.count++
  })

  const dayInsights: PerformanceInsight[] = []
  let bestDay: PerformanceInsight | null = null

  byDay.forEach((data, day) => {
    const avgSpeed = data.speeds.reduce((sum, s) => sum + s, 0) / data.speeds.length
    const improvement = ((avgSpeed - globalAvgSpeed) / globalAvgSpeed) * 100

    const insight: PerformanceInsight = {
      factor: 'day',
      label: dayNames[day],
      avgSpeed,
      activityCount: data.count,
      improvement,
    }

    dayInsights.push(insight)

    if (!bestDay || avgSpeed > bestDay.avgSpeed) {
      bestDay = insight
    }
  })

  // Analyse par heure de la journée
  const timeNames = ['Nuit (0h-6h)', 'Matin (6h-12h)', 'Après-midi (12h-18h)', 'Soir (18h-24h)']
  const byTime = new Map<number, { speeds: number[]; count: number }>()

  activities.forEach(a => {
    const date = new Date(a.startDate)
    const hour = date.getHours()
    let timeSlot = 0
    if (hour >= 6 && hour < 12) timeSlot = 1 // Matin
    else if (hour >= 12 && hour < 18) timeSlot = 2 // Après-midi
    else if (hour >= 18) timeSlot = 3 // Soir

    const speed = a.distance / (a.movingTime / 60)

    if (!byTime.has(timeSlot)) {
      byTime.set(timeSlot, { speeds: [], count: 0 })
    }
    const timeData = byTime.get(timeSlot)!
    timeData.speeds.push(speed)
    timeData.count++
  })

  const timeInsights: PerformanceInsight[] = []
  let bestTime: PerformanceInsight | null = null

  byTime.forEach((data, timeSlot) => {
    const avgSpeed = data.speeds.reduce((sum, s) => sum + s, 0) / data.speeds.length
    const improvement = ((avgSpeed - globalAvgSpeed) / globalAvgSpeed) * 100

    const insight: PerformanceInsight = {
      factor: 'time',
      label: timeNames[timeSlot],
      avgSpeed,
      activityCount: data.count,
      improvement,
    }

    timeInsights.push(insight)

    if (!bestTime || avgSpeed > bestTime.avgSpeed) {
      bestTime = insight
    }
  })

  // Analyse par nombre de jours de repos avant la sortie
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  const byRest = new Map<number, { speeds: number[]; count: number }>()

  for (let i = 1; i < sortedActivities.length; i++) {
    const current = sortedActivities[i]
    const previous = sortedActivities[i - 1]

    const daysDiff = Math.round(
      (new Date(current.startDate).getTime() - new Date(previous.startDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Grouper: 0-1j, 2j, 3j, 4j+
    let restCategory = Math.min(daysDiff, 4)
    if (daysDiff <= 1) restCategory = 1
    else if (daysDiff === 2) restCategory = 2
    else if (daysDiff === 3) restCategory = 3
    else restCategory = 4

    const speed = current.distance / (current.movingTime / 60)

    if (!byRest.has(restCategory)) {
      byRest.set(restCategory, { speeds: [], count: 0 })
    }
    const restData = byRest.get(restCategory)!
    restData.speeds.push(speed)
    restData.count++
  }

  const restNames = ['', '0-1 jour', '2 jours', '3 jours', '4+ jours']
  const restInsights: PerformanceInsight[] = []
  let bestRest: PerformanceInsight | null = null

  byRest.forEach((data, restDays) => {
    const avgSpeed = data.speeds.reduce((sum, s) => sum + s, 0) / data.speeds.length
    const improvement = ((avgSpeed - globalAvgSpeed) / globalAvgSpeed) * 100

    const insight: PerformanceInsight = {
      factor: 'rest',
      label: restNames[restDays],
      avgSpeed,
      activityCount: data.count,
      improvement,
    }

    restInsights.push(insight)

    if (!bestRest || avgSpeed > bestRest.avgSpeed) {
      bestRest = insight
    }
  })

  if (!bestDay || !bestTime || !bestRest) return null

  return {
    globalAvgSpeed,
    bestDayOfWeek: bestDay,
    bestTimeOfDay: bestTime,
    bestRestDays: bestRest,
    insights: [...dayInsights, ...timeInsights, ...restInsights].sort((a, b) => b.improvement - a.improvement),
  }
}
