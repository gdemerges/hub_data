import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fsp } from 'fs'
import os from 'os'
import path from 'path'
import { loadRencontres } from './rencontres-loader'
import { loadBooks } from './books-loader'

let originalCwd: string
let tmpRoot: string

beforeEach(async () => {
  originalCwd = process.cwd()
  tmpRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'loaders-'))
  // Loaders look for data either at cwd/data (rencontres) or cwd/../data (books).
  // Create a fake "web" subdir so cwd/.. is the project root.
  await fsp.mkdir(path.join(tmpRoot, 'web'), { recursive: true })
  process.chdir(path.join(tmpRoot, 'web'))
})

afterEach(async () => {
  process.chdir(originalCwd)
  await fsp.rm(tmpRoot, { recursive: true, force: true })
})

describe('loadRencontres', () => {
  it('returns hasData:false when partners.csv is missing', async () => {
    const result = await loadRencontres()
    expect(result.hasData).toBe(false)
    expect(result.partners).toEqual([])
    expect(result.stats).toBeNull()
  })

  it('returns hasData:false when CSV has only a header', async () => {
    await fsp.mkdir(path.join(tmpRoot, 'web', 'data'), { recursive: true })
    await fsp.writeFile(
      path.join(tmpRoot, 'web', 'data', 'partners.csv'),
      'prenom;ville;genre;nationalite;annee;penetration;anneeNaissance\n'
    )
    const result = await loadRencontres()
    expect(result.hasData).toBe(false)
  })

  it('parses partners and aggregates stats', async () => {
    await fsp.mkdir(path.join(tmpRoot, 'web', 'data'), { recursive: true })
    const csv = [
      'prenom;ville;genre;nationalite;annee;penetration;anneeNaissance',
      'Alice;Paris;F;FR;2020;oui;1990',
      'Bob;Lyon;M;FR;2021;non;1985',
      'Carol;Paris;F;US;2020;oui;1992',
    ].join('\n')
    await fsp.writeFile(path.join(tmpRoot, 'web', 'data', 'partners.csv'), csv)

    const result = await loadRencontres()
    expect(result.hasData).toBe(true)
    expect(result.partners).toHaveLength(3)
    expect(result.stats?.total).toBe(3)
    expect(result.stats?.villes[0]).toEqual({ ville: 'Paris', count: 2 })
    expect(result.stats?.nationalites.find((n) => n.nationalite === 'FR')?.count).toBe(2)
  })
})

describe('loadBooks', () => {
  it('returns [] when no source file is present', async () => {
    const books = await loadBooks()
    expect(books).toEqual([])
  })

  it('parses a CSV source file', async () => {
    await fsp.mkdir(path.join(tmpRoot, 'data'), { recursive: true })
    const csv = [
      'Titre VF;Auteur(s);Année;Note personnelle (/20)',
      'Dune;Frank Herbert;1965;18',
      'Foundation;Isaac Asimov;1951;17',
    ].join('\n')
    await fsp.writeFile(path.join(tmpRoot, 'data', 'books.csv'), csv)

    const books = await loadBooks()
    expect(books).toHaveLength(2)
    expect(books[0].title).toBe('Dune')
    expect(books[0].author).toBe('Frank Herbert')
    expect(books[0].rating).toBe(18)
    expect(books[1].title).toBe('Foundation')
  })
})
