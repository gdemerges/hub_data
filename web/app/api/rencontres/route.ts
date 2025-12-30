import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Partner {
  prenom: string
  ville: string
  genre: string
  nationalite: string
  annee: number
  penetration: string
  anneeNaissance: number
}

export async function GET() {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'partners.csv')

    if (!fs.existsSync(dataFile)) {
      return NextResponse.json({
        partners: [],
        stats: null,
        hasData: false
      })
    }

    const content = fs.readFileSync(dataFile, 'utf-8')
    const lines = content.trim().split('\n')

    if (lines.length <= 1) {
      return NextResponse.json({
        partners: [],
        stats: null,
        hasData: false
      })
    }

    // Parse CSV (skip header)
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

    // Calculate statistics
    const villeCount = new Map<string, number>()
    const nationaliteCount = new Map<string, number>()
    const anneeCount = new Map<number, number>()
    const anneeNaissanceCount = new Map<number, number>()

    partners.forEach(partner => {
      // Ville
      if (partner.ville) {
        villeCount.set(partner.ville, (villeCount.get(partner.ville) || 0) + 1)
      }

      // Nationalité
      if (partner.nationalite) {
        nationaliteCount.set(partner.nationalite, (nationaliteCount.get(partner.nationalite) || 0) + 1)
      }

      // Année
      if (partner.annee) {
        anneeCount.set(partner.annee, (anneeCount.get(partner.annee) || 0) + 1)
      }

      // Année de naissance
      if (partner.anneeNaissance) {
        anneeNaissanceCount.set(partner.anneeNaissance, (anneeNaissanceCount.get(partner.anneeNaissance) || 0) + 1)
      }
    })

    // Convert to arrays and sort
    const villeStats = Array.from(villeCount.entries())
      .map(([ville, count]) => ({ ville, count }))
      .sort((a, b) => b.count - a.count)

    const nationaliteStats = Array.from(nationaliteCount.entries())
      .map(([nationalite, count]) => ({ nationalite, count }))
      .sort((a, b) => b.count - a.count)

    const anneeStats = Array.from(anneeCount.entries())
      .map(([annee, count]) => ({ annee, count }))
      .sort((a, b) => a.annee - b.annee)

    const anneeNaissanceStats = Array.from(anneeNaissanceCount.entries())
      .map(([annee, count]) => ({ annee, count }))
      .sort((a, b) => a.annee - b.annee)

    return NextResponse.json({
      partners,
      stats: {
        total: partners.length,
        villes: villeStats,
        nationalites: nationaliteStats,
        parAnnee: anneeStats,
        parAnneeNaissance: anneeNaissanceStats,
      },
      hasData: true,
    })
  } catch (error) {
    console.error('Rencontres API error:', error)
    return NextResponse.json(
      { partners: [], stats: null, hasData: false },
      { status: 500 }
    )
  }
}
