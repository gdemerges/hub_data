import { NextResponse } from 'next/server'
import { getServerEnv } from '@/lib/env'
import { loadHevyTemplates, loadHevyWorkouts } from '@/lib/hevy'
import {
  computeAggregateStats,
  computeExercisePRs,
  computeMonthlyVolume,
  computeMuscleGroupBreakdown,
  computeSessions,
  computeWeeklyVolume,
} from '@/lib/hevy-stats'

export const revalidate = 3600

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' }

export async function GET() {
  const env = getServerEnv()
  if (!env.HEVY_API_KEY) {
    return NextResponse.json({ hasData: false, reason: 'HEVY_API_KEY missing' }, { status: 200 })
  }
  const [workouts, templates] = await Promise.all([loadHevyWorkouts(), loadHevyTemplates()])
  if (workouts.length === 0) {
    return NextResponse.json({ hasData: false }, { headers: CACHE_HEADERS })
  }
  const stats = computeAggregateStats(workouts)
  const weekly = computeWeeklyVolume(workouts)
  const monthly = computeMonthlyVolume(workouts)
  const muscleGroups = computeMuscleGroupBreakdown(workouts, templates)
  const prs = computeExercisePRs(workouts, templates)
  const sessions = computeSessions(workouts, templates)

  return NextResponse.json(
    { hasData: true, stats, weekly, monthly, muscleGroups, prs, sessions },
    { headers: CACHE_HEADERS },
  )
}
