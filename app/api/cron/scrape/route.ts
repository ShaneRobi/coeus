import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { VERCEL_SOURCES, runScraper } from '@/scraper/index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  // ── Environment guard ────────────────────────────────────────────────────
  // Fail fast with a clear message rather than a cryptic downstream error.
  const missingVars: string[] = []
  for (const key of [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'LUMA_API_KEY',
    'EVENTFINDA_USERNAME',
    'EVENTFINDA_PASSWORD',
    'EVENTFINDA_QUERY',
  ]) {
    if (!process.env[key]) missingVars.push(key)
  }
  // SUPABASE_SERVICE_ROLE_KEY is hard required — nothing works without it.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[cron] Missing required env var: SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json(
      { error: 'Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY not set' },
      { status: 500 }
    )
  }
  if (missingVars.length > 0) {
    console.warn('[cron] Optional env vars not set:', missingVars.join(', '))
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Determine trigger source ──────────────────────────────────────────────
  // Vercel sets x-vercel-signature on cron-triggered requests.
  // Admin dashboard passes ?triggered_by=admin in the URL.
  const triggeredByParam = req.nextUrl.searchParams.get('triggered_by')
  const triggeredBy = triggeredByParam ??
    (req.headers.get('x-vercel-signature') ? 'vercel-cron' : 'manual')

  const supabase = createServiceClient()
  const startedAt = new Date().toISOString()
  const results: Record<string, {
    found: number
    added: number
    skipped: number
    status: string
    error?: string
    duration_ms: number
  }> = {}

  for (const source of VERCEL_SOURCES) {
    const sourceStart = Date.now()

    const { data: run } = await supabase
      .from('scraper_runs')
      .insert({
        source,
        started_at: new Date().toISOString(),
        finished_at: null,
        events_found: 0,
        events_added: 0,
        events_skipped: 0,
        error: null,
        status: 'running',
        triggered_by: triggeredBy,
      })
      .select()
      .single()

    try {
      const result = await runScraper(source)
      const duration_ms = Date.now() - sourceStart

      // Treat a scraper that returned an error field as a partial failure.
      const status = result.error ? 'error' : 'success'
      results[source] = {
        found: result.found,
        added: result.added,
        skipped: result.skipped,
        status,
        error: result.error,
        duration_ms,
      }

      if (run) {
        await supabase
          .from('scraper_runs')
          .update({
            finished_at: new Date().toISOString(),
            events_found: result.found,
            events_added: result.added,
            events_skipped: result.skipped,
            error: result.error ?? null,
            status,
            duration_ms,
          })
          .eq('id', run.id)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const duration_ms = Date.now() - sourceStart
      results[source] = { found: 0, added: 0, skipped: 0, status: 'error', error: message, duration_ms }
      console.error(`[cron] ${source} failed:`, message)

      if (run) {
        await supabase
          .from('scraper_runs')
          .update({
            finished_at: new Date().toISOString(),
            events_found: 0,
            events_added: 0,
            events_skipped: 0,
            error: message,
            status: 'error',
            duration_ms,
          })
          .eq('id', run.id)
      }
    }
  }

  const totals = Object.values(results).reduce(
    (total, r) => ({
      found:   total.found   + r.found,
      added:   total.added   + r.added,
      skipped: total.skipped + r.skipped,
    }),
    { found: 0, added: 0, skipped: 0 }
  )

  return NextResponse.json({
    ok: true,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    triggered_by: triggeredBy,
    sources: VERCEL_SOURCES,
    totals,
    results,
  })
}
