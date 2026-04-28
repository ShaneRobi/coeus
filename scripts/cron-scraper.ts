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

  console.log(`[scraper-cron] done - found: ${totals.found}, inserted: ${totals.added}`)
}

console.log(`[scraper-cron] scheduled "${schedule}" in ${timezone}`)
console.log('[scraper-cron] keep this process running with pm2, launchd, systemd, or a hosting cron worker')

cron.schedule(schedule, () => {
  runNightlyScrape().catch((err) => {
    console.error('[scraper-cron] failed:', err)
  })
}, { timezone })

if (process.argv.includes('--run-now')) {
  runNightlyScrape().catch((err) => {
    console.error('[scraper-cron] initial run failed:', err)
  })
}
