/**
 * Self-hosted fallback: runs scrapers on a schedule using node-cron.
 * Production uses Vercel's built-in cron (vercel.json → /api/cron/scrape).
 *
 * Usage:
 *   npm run scrape:cron          — start the scheduler (keeps process alive)
 *   npm run scrape:cron:now      — start + run immediately
 */
import * as dotenv from 'dotenv'
import * as path from 'path'
import cron from 'node-cron'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { NIGHTLY_SOURCES, runScrapers } from '../scraper/index'

const schedule = process.env.SCRAPER_CRON ?? '0 23 * * *'
const timezone = process.env.SCRAPER_TIMEZONE ?? 'Asia/Singapore'

async function runNightlyScrape() {
  const started = new Date()
  console.log(`[scraper-cron] ${started.toISOString()} running: ${NIGHTLY_SOURCES.join(', ')}`)

  const results = await runScrapers(NIGHTLY_SOURCES)
  const totals = Object.values(results).reduce(
    (total, result) => ({ found: total.found + result.found, added: total.added + result.added }),
    { found: 0, added: 0 }
  )

  console.log(`[scraper-cron] done — found: ${totals.found}, inserted: ${totals.added}`)
}

console.log(`[scraper-cron] scheduled "${schedule}" in ${timezone}`)

cron.schedule(schedule, () => {
  runNightlyScrape().catch((err) => console.error('[scraper-cron] failed:', err))
}, { timezone })

if (process.argv.includes('--run-now')) {
  runNightlyScrape().catch((err) => {
    console.error('[scraper-cron] initial run failed:', err)
    process.exit(1)
  })
}
