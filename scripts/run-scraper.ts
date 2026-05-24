import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { createServiceClient } from '@/lib/supabase'
import { NIGHTLY_SOURCES, runScraper, runScrapers } from '../scraper/index'

// When running the nightly set (e.g. from GitHub Actions), write to scraper_runs
// so results are visible in the admin dashboard, regardless of which trigger fired.
async function runNightlyWithLogging() {
  const supabase = createServiceClient()
  const triggeredBy = process.env.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'manual'

  console.log(`[run-scraper] nightly — ${triggeredBy}: ${NIGHTLY_SOURCES.join(', ')}`)

  const runIds: Record<string, string> = {}

  // Insert "running" rows upfront
  for (const source of NIGHTLY_SOURCES) {
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
      .select('id')
      .single()

    if (run) runIds[source] = run.id
  }

  const results = await runScrapers(NIGHTLY_SOURCES)

  // Update rows with final status
  for (const source of NIGHTLY_SOURCES) {
    const result = results[source] ?? { found: 0, added: 0, skipped: 0, error: 'No result returned' }
    const status = result.error ? 'error' : 'success'

    if (runIds[source]) {
      await supabase
        .from('scraper_runs')
        .update({
          finished_at: new Date().toISOString(),
          events_found: result.found,
          events_added: result.added,
          events_skipped: result.skipped ?? 0,
          error: result.error ?? null,
          status,
        })
        .eq('id', runIds[source])
    }

    const icon = status === 'success' ? '✓' : '✗'
    const detail = result.error ? ` — ERROR: ${result.error}` : ''
    console.log(`  ${icon} ${source}: found=${result.found} added=${result.added} skipped=${result.skipped ?? 0}${detail}`)
  }

  const totals = Object.values(results).reduce(
    (t, r) => ({ found: t.found + r.found, added: t.added + r.added, skipped: t.skipped + (r.skipped ?? 0) }),
    { found: 0, added: 0, skipped: 0 }
  )

  console.log(`[run-scraper] done — found: ${totals.found}, added: ${totals.added}, skipped: ${totals.skipped}`)

  const failures = NIGHTLY_SOURCES.filter(s => results[s]?.error)
  if (failures.length > 0) {
    console.error(`[run-scraper] ${failures.length} source(s) failed: ${failures.join(', ')}`)
    process.exit(1)
  }
}

async function main() {
  const source = process.argv[2] ?? 'all'

  if (source === 'nightly') {
    await runNightlyWithLogging()
    return
  }

  console.log(`Running ${source} scraper...`)
  const result = await runScraper(source)
  console.log(`Done — found: ${result.found}, added: ${result.added}, skipped: ${result.skipped}`)
  if (result.error) {
    console.error(`Error: ${result.error}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
