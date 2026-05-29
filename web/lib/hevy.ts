import 'server-only'
import path from 'node:path'
import { readFileCache, writeFileCache, isCacheFresh } from './file-cache'
import { logger } from './logger'
import { getServerEnv } from './env'

const HEVY_API = 'https://api.hevyapp.com/v1'
const WORKOUTS_CACHE_FILE = path.join(process.cwd(), 'data', 'hevy-workouts-cache.json')
const TEMPLATES_CACHE_FILE = path.join(process.cwd(), 'data', 'hevy-templates-cache.json')
const WORKOUTS_TTL_MS = 3600_000 // 1h
const TEMPLATES_TTL_MS = 7 * 24 * 3600_000 // 7d (templates change rarely)
const PAGE_SIZE = 10

export interface HevySet {
  index: number
  set_type: string
  weight_kg: number | null
  reps: number | null
  distance_meters?: number | null
  duration_seconds?: number | null
  rpe?: number | null
}

export interface HevyExercise {
  index: number
  title: string
  exercise_template_id: string
  superset_id?: number | null
  sets: HevySet[]
}

export interface HevyWorkout {
  id: string
  title: string
  description?: string | null
  start_time: string
  end_time: string
  updated_at?: string
  created_at?: string
  exercises: HevyExercise[]
}

export interface HevyTemplate {
  id: string
  title: string
  type: string
  primary_muscle_group: string
  secondary_muscle_groups: string[]
  equipment?: string
  is_custom?: boolean
}

async function fetchPaged<T>(
  endpoint: string,
  apiKey: string,
  itemsKey: string,
): Promise<T[]> {
  const items: T[] = []
  let page = 1
  while (page <= 200) {
    const res = await fetch(`${HEVY_API}${endpoint}?page=${page}&pageSize=${PAGE_SIZE}`, {
      headers: { 'api-key': apiKey, Accept: 'application/json' },
    })
    if (!res.ok) {
      logger.warn(`Hevy ${endpoint} page ${page} returned ${res.status}`)
      break
    }
    const json = await res.json()
    const pageItems = (json?.[itemsKey] ?? []) as T[]
    if (pageItems.length === 0) break
    items.push(...pageItems)
    const pageCount = json?.page_count ?? json?.pageCount
    if (typeof pageCount === 'number' && page >= pageCount) break
    page++
  }
  return items
}

export async function loadHevyWorkouts({ force = false } = {}): Promise<HevyWorkout[]> {
  const env = getServerEnv()
  if (!env.HEVY_API_KEY) return []
  const cache = await readFileCache<HevyWorkout[]>(WORKOUTS_CACHE_FILE)
  if (!force && cache && isCacheFresh(cache.cachedAt, WORKOUTS_TTL_MS)) {
    return cache.data
  }
  try {
    const workouts = await fetchPaged<HevyWorkout>('/workouts', env.HEVY_API_KEY, 'workouts')
    if (workouts.length > 0 || !cache) {
      await writeFileCache(WORKOUTS_CACHE_FILE, workouts)
      return workouts
    }
    return cache.data
  } catch (err) {
    logger.error('Hevy workouts fetch failed', err)
    return cache?.data ?? []
  }
}

export async function loadHevyTemplates({ force = false } = {}): Promise<HevyTemplate[]> {
  const env = getServerEnv()
  if (!env.HEVY_API_KEY) return []
  const cache = await readFileCache<HevyTemplate[]>(TEMPLATES_CACHE_FILE)
  if (!force && cache && isCacheFresh(cache.cachedAt, TEMPLATES_TTL_MS)) {
    return cache.data
  }
  try {
    const templates = await fetchPaged<HevyTemplate>(
      '/exercise_templates',
      env.HEVY_API_KEY,
      'exercise_templates',
    )
    if (templates.length > 0 || !cache) {
      await writeFileCache(TEMPLATES_CACHE_FILE, templates)
      return templates
    }
    return cache.data
  } catch (err) {
    logger.error('Hevy templates fetch failed', err)
    return cache?.data ?? []
  }
}
