import path from 'path'
import { FileCacheStore } from './cache-store'

export async function readFileCache<T>(filePath: string): Promise<{ data: T; cachedAt: number } | null> {
  const store = new FileCacheStore<T>({
    filePath,
    ttlMs: Number.POSITIVE_INFINITY,
    name: path.basename(filePath),
  })
  return store.read()
}

export async function writeFileCache<T>(filePath: string, data: T): Promise<void> {
  const store = new FileCacheStore<T>({
    filePath,
    ttlMs: Number.POSITIVE_INFINITY,
    name: path.basename(filePath),
  })
  await store.write(data)
}

export function isCacheFresh(cachedAt: number, ttlMs: number): boolean {
  return Date.now() - cachedAt < ttlMs
}
