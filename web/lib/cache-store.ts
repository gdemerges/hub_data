import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'
import { logger } from './logger'

export interface CacheStore<T> {
  read(): Promise<{ data: T; cachedAt: number } | null>
  write(data: T): Promise<void>
  isFresh(cachedAt: number): boolean
  readonly name: string
}

export interface FileCacheStoreOptions {
  filePath: string
  ttlMs: number
  name: string
  pretty?: boolean
}

interface CacheEnvelope<T> {
  data: T
  cachedAt: number
}

export class FileCacheStore<T> implements CacheStore<T> {
  constructor(private readonly opts: FileCacheStoreOptions) {}

  get name(): string {
    return this.opts.name
  }

  async read(): Promise<{ data: T; cachedAt: number } | null> {
    const { filePath, name } = this.opts
    if (!fs.existsSync(filePath)) {
      logger.metric('cache.miss', { cache: name, reason: 'absent' })
      return null
    }
    try {
      const env = JSON.parse(await fsp.readFile(filePath, 'utf-8')) as CacheEnvelope<T>
      if (env == null || typeof env.cachedAt !== 'number' || !('data' in env)) {
        logger.metric('cache.miss', { cache: name, reason: 'shape' })
        return null
      }
      logger.metric('cache.hit', { cache: name })
      return env
    } catch {
      logger.metric('cache.miss', { cache: name, reason: 'corrupt' })
      return null
    }
  }

  async write(data: T): Promise<void> {
    const { filePath, pretty } = this.opts
    try {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const env: CacheEnvelope<T> = { data, cachedAt: Date.now() }
      await fsp.writeFile(filePath, pretty ? JSON.stringify(env, null, 2) : JSON.stringify(env))
    } catch (e) {
      logger.error(`Failed to write cache ${this.opts.name}:`, e)
    }
  }

  isFresh(cachedAt: number): boolean {
    return Date.now() - cachedAt < this.opts.ttlMs
  }
}

export function createFileCache<T>(opts: FileCacheStoreOptions) {
  const store = new FileCacheStore<T>(opts)
  return {
    read: () => store.read(),
    write: (data: T) => store.write(data),
    isFresh: (cachedAt: number) => store.isFresh(cachedAt),
  }
}
