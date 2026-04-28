import { NextRequest, NextResponse } from 'next/server'
import { NIGHTLY_SOURCES, runScrapers } from '@/scraper/index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date().toISOString()
  const results = await runScrapers(NIGHTLY_SOURCES)
  const totals = Object.values(results).reduce(
    (total, result) => ({
      found: total.found + result.found,
      added: total.added + result.added,
    }),
    { found: 0, added: 0 }
  )

  return NextResponse.json({
    ok: true,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    sources: NIGHTLY_SOURCES,
    totals,
    results,
  })
}
