import { NextResponse } from 'next/server'
import { getMetricsSnapshot } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Lecture des compteurs internes (cache hit/miss, etc.).
 * En prod, protéger derrière un token via header `x-metrics-token` si HUB_METRICS_TOKEN est défini.
 */
export async function GET(request: Request) {
  const expected = process.env.HUB_METRICS_TOKEN
  if (expected) {
    const provided = request.headers.get('x-metrics-token')
    if (provided !== expected) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }
  return NextResponse.json({
    metrics: getMetricsSnapshot(),
    timestamp: new Date().toISOString(),
  })
}
