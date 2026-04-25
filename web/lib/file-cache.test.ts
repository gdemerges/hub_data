import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fsp } from 'fs'
import os from 'os'
import path from 'path'
import { readFileCache, writeFileCache, isCacheFresh } from './file-cache'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'fc-'))
})

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true, force: true })
})

describe('file-cache', () => {
  it('returns null if file does not exist', async () => {
    const result = await readFileCache(path.join(tmpDir, 'missing.json'))
    expect(result).toBeNull()
  })

  it('writes then reads back the same data with cachedAt timestamp', async () => {
    const file = path.join(tmpDir, 'cache.json')
    const before = Date.now()
    await writeFileCache(file, { foo: 'bar', n: 42 })
    const got = await readFileCache<{ foo: string; n: number }>(file)
    expect(got).not.toBeNull()
    expect(got!.data).toEqual({ foo: 'bar', n: 42 })
    expect(got!.cachedAt).toBeGreaterThanOrEqual(before)
  })

  it('creates parent directories on write', async () => {
    const file = path.join(tmpDir, 'a', 'b', 'c', 'cache.json')
    await writeFileCache(file, { v: 1 })
    const got = await readFileCache<{ v: number }>(file)
    expect(got?.data.v).toBe(1)
  })

  it('returns null on corrupted JSON', async () => {
    const file = path.join(tmpDir, 'broken.json')
    await fsp.writeFile(file, '{ not valid json')
    const got = await readFileCache(file)
    expect(got).toBeNull()
  })
})

describe('isCacheFresh', () => {
  it('returns true within ttl', () => {
    expect(isCacheFresh(Date.now() - 1000, 5000)).toBe(true)
  })

  it('returns false past ttl', () => {
    expect(isCacheFresh(Date.now() - 6000, 5000)).toBe(false)
  })
})
