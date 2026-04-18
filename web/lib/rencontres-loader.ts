import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

export interface Partner {
  prenom: string
  ville: string
  genre: string
  nationalite: string
  annee: number
  penetration: string
  anneeNaissance: number
}

export interface RencontresStats {
  total: number
  villes: { ville: string; count: number }[]
  nationalites: { nationalite: string; count: number }[]
  parAnnee: { annee: number; count: number }[]
  parAnneeNaissance: { annee: number; count: number }[]
}

export async function loadRencontres(): Promise<{
  partners: Partner[]
  stats: RencontresStats | null
  hasData: boolean
}> {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'partners.csv')
    if (!fs.existsSync(dataFile)) return { partners: [], stats: null, hasData: false }

    const content = await fsp.readFile(dataFile, 'utf-8')
    const lines = content.trim().split('\n')
    if (lines.length <= 1) return { partners: [], stats: null, hasData: false }

    const partners: Partner[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue
      const columns = line.split(';')
      if (columns.length >= 7) {
        partners.push({
          prenom: columns[0]?.trim() || '',
          ville: columns[1]?.trim() || '',
          genre: columns[2]?.trim() || '',
          nationalite: columns[3]?.trim() || '',
          annee: parseInt(columns[4]?.trim()) || 0,
          penetration: columns[5]?.trim() || '',
          anneeNaissance: parseInt(columns[6]?.trim()) || 0,
        })
      }
    }

    const villeCount = new Map<string, number>()
    const nationaliteCount = new Map<string, number>()
    const anneeCount = new Map<number, number>()
    const anneeNaissanceCount = new Map<number, number>()

    for (const p of partners) {
      if (p.ville) villeCount.set(p.ville, (villeCount.get(p.ville) || 0) + 1)
      if (p.nationalite) nationaliteCount.set(p.nationalite, (nationaliteCount.get(p.nationalite) || 0) + 1)
      if (p.annee) anneeCount.set(p.annee, (anneeCount.get(p.annee) || 0) + 1)
      if (p.anneeNaissance)
        anneeNaissanceCount.set(p.anneeNaissance, (anneeNaissanceCount.get(p.anneeNaissance) || 0) + 1)
    }

    const stats: RencontresStats = {
      total: partners.length,
      villes: Array.from(villeCount.entries())
        .map(([ville, count]) => ({ ville, count }))
        .sort((a, b) => b.count - a.count),
      nationalites: Array.from(nationaliteCount.entries())
        .map(([nationalite, count]) => ({ nationalite, count }))
        .sort((a, b) => b.count - a.count),
      parAnnee: Array.from(anneeCount.entries())
        .map(([annee, count]) => ({ annee, count }))
        .sort((a, b) => a.annee - b.annee),
      parAnneeNaissance: Array.from(anneeNaissanceCount.entries())
        .map(([annee, count]) => ({ annee, count }))
        .sort((a, b) => a.annee - b.annee),
    }

    return { partners, stats, hasData: true }
  } catch (error) {
    console.error('Rencontres loader error:', error)
    return { partners: [], stats: null, hasData: false }
  }
}
