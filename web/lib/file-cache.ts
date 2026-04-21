import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'
import { logger } from './logger'

interface CacheEnvelope<T> {
  data: T
  cachedAt: number // ms since epoch
}

export async function readFileCache<T>(filePath: string): Promise<CacheEnvelope<T> | null> {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(await fsp.readFile(filePath, 'utf-8')) as CacheEnvelope<T>
  } catch {
    return null
  }
}

export async function writeFileCache<T>(filePath: string, data: T): Promise<void> {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    await fsp.writeFile(filePath, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch (e) {
    logger.error(`Failed to write cache ${filePath}:`, e)
  }
}

export function isCacheFresh(cachedAt: number, ttlMs: number): boolean {
  return Date.now() - cachedAt < ttlMs
}
