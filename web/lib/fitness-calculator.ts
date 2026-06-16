import { logger } from './logger'
import type {
  FitnessMetrics,
  PerformanceAnalysis,
  PerformanceInsight,
  RacePrediction,
  RecoveryAdvice,
} from './types'

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
 * Clé de date locale (YYYY-MM-DD) à partir des composantes locales d'une Date.
 * Indispensable pour aligner l'indexation TSS (basée sur start_date_local, donc
 * heure locale) avec l'itération jour-par-jour : `toISOString()` bascule en UTC
 * et décalait le TSS des sorties de fin de journée d'un jour.
 */
function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Calcule le seuil de fréquence cardiaque (LTHR) basé sur les activités récentes
 * LTHR = environ 90% de la FC max observée lors d'efforts soutenus
 */
export function calculateLTHR(activities: Activity[]): number {
  const activitiesWithHR = activities.filter((a) => a.averageHeartrate && a.averageHeartrate > 0)

  if (activitiesWithHR.length === 0) return FITNESS_CONSTANTS.DEFAULT_LTHR

  // Trouver les 10 efforts les plus intenses (allure rapide + FC élevée)
  const intensiveEfforts = activitiesWithHR
    .filter((a) => a.distance > 3) // Au moins 3km pour être significatif
    .sort((a, b) => {
      const scoreA = (a.averageHeartrate || 0) * (a.distance / (a.movingTime / 60))
      const scoreB = (b.averageHeartrate || 0) * (b.distance / (b.movingTime / 60))
      return scoreB - scoreA
    })
    .slice(0, 10)

  if (intensiveEfforts.length === 0) {
    // Utiliser la moyenne des 90% supérieurs
    const sortedHR = activitiesWithHR.map((a) => a.averageHeartrate || 0).sort((a, b) => b - a)
    const top10Percent = sortedHR.slice(0, Math.max(1, Math.floor(sortedHR.length * 0.1)))
    return Math.round((top10Percent.reduce((sum, hr) => sum + hr, 0) / top10Percent.length) * 0.9)
  }

  // Moyenne des FC des efforts intenses, réduite de 10% pour estimer le seuil
  const avgIntensiveHR =
    intensiveEfforts.reduce((sum, a) => sum + (a.averageHeartrate || 0), 0) /
    intensiveEfforts.length
  return Math.round(avgIntensiveHR * 0.9)
}

/**
 * Calcule le Training Stress Score (TSS) pour une activité
 * Priorité : utilise la fréquence cardiaque si disponible, sinon l'allure
 */
export function calculateTSS(
  activity: Activity,
  thresholdPace: number = FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE,
  lthr?: number,
): number {
  const durationHours = activity.movingTime / 60
  let intensityFactor = 0

  // Méthode 1 : Calcul basé sur la fréquence cardiaque (plus précis)
  if (activity.averageHeartrate && activity.averageHeartrate > 0 && lthr) {
    // IF = FC moyenne / LTHR
    intensityFactor = activity.averageHeartrate / lthr

    // Limiter IF entre MIN et MAX (sécurité)
    intensityFactor = Math.max(
      FITNESS_CONSTANTS.MIN_INTENSITY_FACTOR,
      Math.min(FITNESS_CONSTANTS.MAX_INTENSITY_FACTOR, intensityFactor),
    )

    // TSS = durée (h) × IF² × 100
    const tss = durationHours * intensityFactor ** 2 * 100

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
  const tss = durationHours * intensityFactor ** 2 * 100

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
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )

    if (sortedActivities.length === 0) return []

    // Limiter aux activités de la fenêtre FITNESS_WINDOW_DAYS pour optimiser les performances
    const sixMonthsAgo = Date.now() - FITNESS_CONSTANTS.FITNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000
    const recentActivities = sortedActivities.filter(
      (a) => new Date(a.startDate).getTime() >= sixMonthsAgo,
    )

    if (recentActivities.length === 0) return []

    // Calculer le LTHR (seuil de fréquence cardiaque)
    const lthr = calculateLTHR(recentActivities)

    // Calculer le pace seuil moyen (médiane des 10 dernières sorties)
    const recentPaces = recentActivities
      .slice(-10)
      .map((a) => a.movingTime / a.distance)
      .filter((pace) => !Number.isNaN(pace) && pace > 0)
      .sort((a, b) => a - b)
    const thresholdPace =
      recentPaces[Math.floor(recentPaces.length / 2)] || FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE

    // Créer un map date -> TSS (clé = date locale de la sortie)
    const dailyTSS = new Map<string, number>()
    for (const activity of recentActivities) {
      const date = localDateKey(new Date(activity.startDate))
      const tss = calculateTSS(activity, thresholdPace, lthr)
      if (!Number.isNaN(tss) && tss > 0) {
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
      firstDate.setTime(
        lastDate.getTime() - FITNESS_CONSTANTS.FITNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      )
    }

    // Itérer sur chaque jour (clé locale, alignée sur l'indexation TSS)
    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      const dateStr = localDateKey(d)
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
  const runs = activities.filter((a) => a.type === 'Run')
  if (runs.length === 0) return []

  // Trouver les meilleures performances récentes (3 derniers mois)
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  const recentRuns = runs.filter((a) => new Date(a.startDate).getTime() > threeMonthsAgo)

  if (recentRuns.length === 0) return []

  // Calculer la vitesse moyenne des 10 dernières sorties (km/h)
  const recentSpeeds = recentRuns.slice(-10).map((a) => a.distance / (a.movingTime / 60)) // km/h

  const avgSpeed = recentSpeeds.reduce((sum, s) => sum + s, 0) / recentSpeeds.length
  const currentPace = 60 / avgSpeed // min/km

  // Référence = meilleure perf récente TOUTES distances, projetée en équivalent
  // 10 km via Riegel (`temps × (10/distance)^1.06`). Un 5 km rapide ou un 15 km
  // solide informent ainsi les prédictions, pas seulement la bande 9–11 km.
  const eligibleRuns = recentRuns.filter((a) => a.distance >= 2 && a.movingTime > 0)
  let reference10kTime = 10 * currentPace // défaut: d'après la vitesse moyenne

  if (eligibleRuns.length > 0) {
    reference10kTime = eligibleRuns.reduce((best, run) => {
      const equiv10k = run.movingTime * (10 / run.distance) ** 1.06
      return Math.min(best, equiv10k)
    }, Infinity)
  }

  // Une course proche de la distance cible fiabilise sa prédiction.
  const hasRunNear = (d: number) =>
    recentRuns.some((a) => a.distance >= d * 0.8 && a.distance <= d * 1.2)

  // Formule de Riegel: T2 = T1 × (D2/D1)^1.06
  // Ajustée avec facteur de fatigue selon distance
  // Confiance : base selon le volume récent + bonus si une course proche de la
  // distance cible existe (la prédiction n'est alors plus une pure extrapolation).
  const confidenceFor = (base: number, target: number) =>
    Math.min(95, base + (hasRunNear(target) ? 10 : 0))

  const predictions: RacePrediction[] = [
    {
      distance: 5,
      predictedTime: reference10kTime * (5 / 10) ** 1.06,
      currentPace,
      confidence: confidenceFor(recentRuns.length >= 10 ? 80 : 65, 5),
    },
    {
      distance: 10,
      predictedTime: reference10kTime,
      currentPace,
      confidence: confidenceFor(recentRuns.length >= 10 ? 80 : 65, 10),
    },
    {
      distance: 21.1,
      predictedTime: reference10kTime * (21.1 / 10) ** 1.06,
      currentPace,
      confidence: confidenceFor(recentRuns.length >= 15 ? 70 : 55, 21.1),
    },
    {
      distance: 42.2,
      predictedTime: reference10kTime * (42.2 / 10) ** 1.08, // Plus conservateur
      currentPace,
      confidence: confidenceFor(recentRuns.length >= 20 ? 65 : 45, 42.2),
    },
  ]

  return predictions
}

/**
 * Estime l'indice de forme VDOT (Jack Daniels) à partir du meilleur effort
 * récent, toutes distances ramenées à un équivalent 10 km (Riegel). Le VDOT
 * approxime la VO2max et résume la forme aérobie en un seul nombre.
 * Retourne null si aucune course récente exploitable.
 */
export function estimateVdot(activities: Activity[]): number | null {
  const runs = activities.filter((a) => a.type === 'Run')
  if (runs.length === 0) return null

  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  const recent = runs.filter(
    (a) => new Date(a.startDate).getTime() > threeMonthsAgo && a.distance >= 2 && a.movingTime > 0,
  )
  if (recent.length === 0) return null

  // Meilleur temps équivalent 10 km (minutes).
  const best10kTime = recent.reduce(
    (best, run) => Math.min(best, run.movingTime * (10 / run.distance) ** 1.06),
    Infinity,
  )
  if (!Number.isFinite(best10kTime) || best10kTime <= 0) return null

  const t = best10kTime // minutes
  const v = 10000 / t // vitesse en m/min
  const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v
  const pctMax = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t)
  const vdot = vo2 / pctMax

  if (!Number.isFinite(vdot) || vdot <= 0) return null
  return Math.round(vdot)
}

/**
 * Calcule le temps estimé pour atteindre un objectif (en jours)
 */
export function calculateTimeToTarget(
  currentTime: number,
  targetTime: number,
  recentActivities: Activity[],
): number {
  if (currentTime <= targetTime) return 0

  // Calculer la progression récente (% amélioration par mois)
  const twoMonthsAgo = Date.now() - 60 * 24 * 60 * 60 * 1000
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  const runs = recentActivities.filter((a) => a.type === 'Run')
  const olderRuns = runs.filter((a) => {
    const date = new Date(a.startDate).getTime()
    return date >= twoMonthsAgo && date < oneMonthAgo
  })
  const recentRuns = runs.filter((a) => {
    const date = new Date(a.startDate).getTime()
    return date >= oneMonthAgo
  })

  if (olderRuns.length === 0 || recentRuns.length === 0) {
    // Pas assez de données, estimer 3% d'amélioration par mois (conservateur)
    const improvement = 0.03
    const gap = (currentTime - targetTime) / currentTime
    return Math.ceil((gap / improvement) * 30)
  }

  const avgOlderPace =
    olderRuns.reduce((sum, r) => sum + r.movingTime / r.distance, 0) / olderRuns.length
  const avgRecentPace =
    recentRuns.reduce((sum, r) => sum + r.movingTime / r.distance, 0) / recentRuns.length

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
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )

  // Calculer le LTHR (seuil de fréquence cardiaque)
  const lthr = calculateLTHR(sorted)

  const now = Date.now()
  const lastActivity = sorted[0]
  const hoursSinceLastActivity =
    (now - new Date(lastActivity.startDate).getTime()) / (1000 * 60 * 60)

  // Calculer la charge de la dernière activité
  const lastActivityLoad = calculateTSS(
    lastActivity,
    FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE,
    lthr,
  )

  // Calculer la charge de la semaine
  const oneWeekAgo = now - FITNESS_CONSTANTS.ATL_DAYS * 24 * 60 * 60 * 1000
  const weekActivities = sorted.filter((a) => new Date(a.startDate).getTime() >= oneWeekAgo)
  const weeklyLoad = weekActivities.reduce(
    (sum, a) => sum + calculateTSS(a, FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE, lthr),
    0,
  )

  // Calculer la charge de la semaine précédente
  const twoWeeksAgo = now - 2 * FITNESS_CONSTANTS.ATL_DAYS * 24 * 60 * 60 * 1000
  const previousWeekActivities = sorted.filter((a) => {
    const date = new Date(a.startDate).getTime()
    return date >= twoWeeksAgo && date < oneWeekAgo
  })
  const previousWeekLoad = previousWeekActivities.reduce(
    (sum, a) => sum + calculateTSS(a, FITNESS_CONSTANTS.DEFAULT_THRESHOLD_PACE, lthr),
    0,
  )

  // Calcul du risque
  let riskScore = 0
  const reasons: string[] = []

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
  const recentCount = sorted.filter((a) => new Date(a.startDate).getTime() >= last3Days).length
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

  const reason = reasons.length > 0 ? reasons.join(' • ') : "Charge d'entraînement équilibrée"

  return {
    status,
    hoursRecommended: Math.max(0, Math.round(hoursRecommended)),
    reason,
    riskScore: Math.min(100, riskScore),
  }
}

/** Sortie augmentée d'une vitesse et de son résidu vs. l'attendu pour sa distance. */
interface SpeedSample {
  speed: number // km/h
  residual: number // km/h, vitesse réelle − attendue pour la distance
}

/**
 * Analyse les facteurs de performance (jour de semaine, heure, repos).
 *
 * Les sorties courtes sont mécaniquement plus rapides : comparer la vitesse
 * brute par jour/heure ferait juste ressortir « quand tu fais tes sorties
 * courtes ». On neutralise ce biais via une régression linéaire vitesse~distance
 * et on classe les groupes sur la moyenne des résidus (vitesse réelle − attendue).
 */
export function analyzePerformanceFactors(activities: Activity[]): PerformanceAnalysis | null {
  if (activities.length < 10) return null // Besoin d'au moins 10 sorties pour analyse

  const speedOf = (a: Activity) => a.distance / (a.movingTime / 60) // km/h

  const globalAvgSpeed = activities.reduce((sum, a) => sum + speedOf(a), 0) / activities.length

  // Régression linéaire vitesse = intercept + slope · distance.
  const n = activities.length
  let sumD = 0,
    sumV = 0,
    sumDD = 0,
    sumDV = 0
  for (const a of activities) {
    const d = a.distance
    const v = speedOf(a)
    sumD += d
    sumV += v
    sumDD += d * d
    sumDV += d * v
  }
  const denom = n * sumDD - sumD * sumD
  const slope = denom !== 0 ? (n * sumDV - sumD * sumV) / denom : 0
  const intercept = (sumV - slope * sumD) / n
  const expectedSpeed = (distance: number) => intercept + slope * distance

  const sampleOf = (a: Activity): SpeedSample => {
    const speed = speedOf(a)
    return { speed, residual: speed - expectedSpeed(a.distance) }
  }

  // Construit les insights d'un regroupement : vitesse brute affichée, mais
  // classement (improvement) basé sur le résidu moyen normalisé par la globale.
  function buildInsights(
    factor: string,
    groups: Map<number, { samples: SpeedSample[]; label: string }>,
  ): { insights: PerformanceInsight[]; best: PerformanceInsight | null } {
    const insights: PerformanceInsight[] = []
    let best: PerformanceInsight | null = null
    let bestResidual = -Infinity

    groups.forEach(({ samples, label }) => {
      const avgSpeed = samples.reduce((s, x) => s + x.speed, 0) / samples.length
      const avgResidual = samples.reduce((s, x) => s + x.residual, 0) / samples.length
      const improvement = (avgResidual / globalAvgSpeed) * 100

      const insight: PerformanceInsight = {
        factor,
        label,
        avgSpeed,
        activityCount: samples.length,
        improvement,
      }
      insights.push(insight)

      if (avgResidual > bestResidual) {
        bestResidual = avgResidual
        best = insight
      }
    })

    return { insights, best }
  }

  // --- Jour de la semaine ---
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const byDay = new Map<number, { samples: SpeedSample[]; label: string }>()
  activities.forEach((a) => {
    const day = new Date(a.startDate).getDay()
    if (!byDay.has(day)) byDay.set(day, { samples: [], label: dayNames[day] })
    byDay.get(day)!.samples.push(sampleOf(a))
  })

  // --- Heure de la journée ---
  const timeNames = ['Nuit (0h-6h)', 'Matin (6h-12h)', 'Après-midi (12h-18h)', 'Soir (18h-24h)']
  const byTime = new Map<number, { samples: SpeedSample[]; label: string }>()
  activities.forEach((a) => {
    const hour = new Date(a.startDate).getHours()
    let slot = 0
    if (hour >= 6 && hour < 12) slot = 1
    else if (hour >= 12 && hour < 18) slot = 2
    else if (hour >= 18) slot = 3
    if (!byTime.has(slot)) byTime.set(slot, { samples: [], label: timeNames[slot] })
    byTime.get(slot)!.samples.push(sampleOf(a))
  })

  // --- Jours de repos avant la sortie ---
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  )
  const restNames = ['', '0-1 jour', '2 jours', '3 jours', '4+ jours']
  const byRest = new Map<number, { samples: SpeedSample[]; label: string }>()
  for (let i = 1; i < sortedActivities.length; i++) {
    const daysDiff = Math.round(
      (new Date(sortedActivities[i].startDate).getTime() -
        new Date(sortedActivities[i - 1].startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    const restCategory = daysDiff <= 1 ? 1 : daysDiff === 2 ? 2 : daysDiff === 3 ? 3 : 4
    if (!byRest.has(restCategory)) {
      byRest.set(restCategory, { samples: [], label: restNames[restCategory] })
    }
    byRest.get(restCategory)!.samples.push(sampleOf(sortedActivities[i]))
  }

  const day = buildInsights('day', byDay)
  const time = buildInsights('time', byTime)
  const rest = buildInsights('rest', byRest)

  if (!day.best || !time.best || !rest.best) return null

  return {
    globalAvgSpeed,
    bestDayOfWeek: day.best,
    bestTimeOfDay: time.best,
    bestRestDays: rest.best,
    insights: [...day.insights, ...time.insights, ...rest.insights].sort(
      (a, b) => b.improvement - a.improvement,
    ),
  }
}
