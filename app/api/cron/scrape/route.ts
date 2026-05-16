import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { NIGHTLY_SOURCES, runScraper } from '@/scraper/index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const startedAt = new Date().toISOString()
  const results: Record<string, { found: number; added: number; status: string; error?: string }> = {}

  for (const source of NIGHTLY_SOURCES) {
    const { data: run } = await supabase
      .from('scraper_runs')
      .insert({
        source,
        started_at: new Date().toISOString(),
        finished_at: null,
        events_found: 0,
        events_added: 0,
        error: null,
        status: 'running',
      })
      .select()
      .single()

    try {
      const result = await runScraper(source)
      results[source] = { found: result.found, added: result.added, status: 'success' }

      if (run) {
        await supabase
          .from('scraper_runs')
          .update({
            finished_at: new Date().toISOString(),
            events_found: result.found,
            events_added: result.added,
            status: 'success',
          })
          .eq('id', run.id)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      results[source] = { found: 0, added: 0, status: 'error', error: message }
      console.error(`[cron] ${source} failed:`, message)

      if (run) {
        await supabase
          .from('scraper_runs')
          .update({
            finished_at: new Date().toISOString(),
            events_found: 0,
            events_added: 0,
            error: message,
            status: 'error',
          })
          .eq('id', run.id)
      }
    }
  }

  const totals = Object.values(results).reduce(
    (total, r) => ({ found: total.found + r.found, added: total.added + r.added }),
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
