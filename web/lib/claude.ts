import 'server-only'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { logger } from './logger'

const STATS_CACHE_FILE = path.join(os.homedir(), '.claude', 'stats-cache.json')

interface DailyActivity {
  date: string
  messageCount: number
  sessionCount: number
  toolCallCount: number
}

interface DailyModelTokens {
  date: string
  tokensByModel: Record<string, number>
}

interface ModelUsageEntry {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  webSearchRequests: number
  costUSD?: number
}

interface RawStatsCache {
  version?: number
  lastComputedDate?: string
  dailyActivity?: DailyActivity[]
  dailyModelTokens?: DailyModelTokens[]
  modelUsage?: Record<string, ModelUsageEntry>
  totalSessions?: number
  totalMessages?: number
  longestSession?: { sessionId: string; duration: number; messageCount: number; timestamp: string }
  firstSessionDate?: string
  hourCounts?: Record<string, number>
}

export interface ClaudeStats {
  available: boolean
  totalSessions: number
  totalMessages: number
  totalToolCalls: number
  firstSessionDate?: string
  lastComputedDate?: string
  daysActive: number
  longestSession?: { messageCount: number; durationHours: number; timestamp: string }
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  estimatedCostUSD: number
  modelBreakdown: { model: string; outputTokens: number; cacheReadTokens: number }[]
  dailyActivity: DailyActivity[]
  hourCounts: number[] // 24 entries, index = hour
}

export async function loadClaudeStats(): Promise<ClaudeStats> {
  const empty: ClaudeStats = {
    available: false,
    totalSessions: 0,
    totalMessages: 0,
    totalToolCalls: 0,
    daysActive: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheReadTokens: 0,
    totalCacheCreationTokens: 0,
    estimatedCostUSD: 0,
    modelBreakdown: [],
    dailyActivity: [],
    hourCounts: Array(24).fill(0),
  }

  try {
    if (!fs.existsSync(STATS_CACHE_FILE)) return empty
    const raw: RawStatsCache = JSON.parse(fs.readFileSync(STATS_CACHE_FILE, 'utf-8'))

    const dailyActivity = raw.dailyActivity ?? []
    const totalToolCalls = dailyActivity.reduce((s, d) => s + (d.toolCallCount ?? 0), 0)

    let totalInput = 0
    let totalOutput = 0
    let totalCacheRead = 0
    let totalCacheCreation = 0
    const modelBreakdown: { model: string; outputTokens: number; cacheReadTokens: number }[] = []
    for (const [model, u] of Object.entries(raw.modelUsage ?? {})) {
      totalInput += u.inputTokens ?? 0
      totalOutput += u.outputTokens ?? 0
      totalCacheRead += u.cacheReadInputTokens ?? 0
      totalCacheCreation += u.cacheCreationInputTokens ?? 0
      modelBreakdown.push({
        model,
        outputTokens: u.outputTokens ?? 0,
        cacheReadTokens: u.cacheReadInputTokens ?? 0,
      })
    }
    modelBreakdown.sort((a, b) => b.outputTokens - a.outputTokens)

    // Rough cost estimate using public pricing (USD per 1M tokens) for the
    // dominant Claude tiers. Cache reads are ~10% of base input price; cache
    // creation is ~1.25x. Output is ~5x. Numbers below are conservative
    // averages across recent Sonnet/Opus tiers — close enough for a dashboard
    // figure that's clearly labeled "estimé".
    const PRICE_INPUT_PER_1M = 4 // USD
    const PRICE_OUTPUT_PER_1M = 20
    const PRICE_CACHE_READ_PER_1M = 0.4
    const PRICE_CACHE_WRITE_PER_1M = 5
    const estimatedCostUSD =
      (totalInput * PRICE_INPUT_PER_1M +
        totalOutput * PRICE_OUTPUT_PER_1M +
        totalCacheRead * PRICE_CACHE_READ_PER_1M +
        totalCacheCreation * PRICE_CACHE_WRITE_PER_1M) /
      1_000_000

    const hourCounts = Array(24).fill(0) as number[]
    for (const [h, count] of Object.entries(raw.hourCounts ?? {})) {
      const i = parseInt(h, 10)
      if (i >= 0 && i < 24) hourCounts[i] = count as number
    }

    const longest = raw.longestSession
      ? {
          messageCount: raw.longestSession.messageCount,
          durationHours: raw.longestSession.duration / (1000 * 60 * 60),
          timestamp: raw.longestSession.timestamp,
        }
      : undefined

    return {
      available: true,
      totalSessions: raw.totalSessions ?? 0,
      totalMessages: raw.totalMessages ?? 0,
      totalToolCalls,
      firstSessionDate: raw.firstSessionDate,
      lastComputedDate: raw.lastComputedDate,
      daysActive: dailyActivity.length,
      longestSession: longest,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalCacheReadTokens: totalCacheRead,
      totalCacheCreationTokens: totalCacheCreation,
      estimatedCostUSD,
      modelBreakdown: modelBreakdown.slice(0, 6),
      dailyActivity,
      hourCounts,
    }
  } catch (e) {
    logger.error('Claude stats load error:', e)
    return empty
  }
}
