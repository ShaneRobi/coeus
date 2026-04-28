import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { NIGHTLY_SOURCES, runScraper, runScrapers } from '../scraper/index'

async function main() {
  const source = process.argv[2] ?? 'all'
  if (source === 'nightly') {
    console.log(`Running nightly scrapers: ${NIGHTLY_SOURCES.join(', ')}`)
    const results = await runScrapers(NIGHTLY_SOURCES)
    const totals = Object.values(results).reduce(
      (total, result) => ({ found: total.found + result.found, added: total.added + result.added }),
      { found: 0, added: 0 }
    )
    console.log(`Done - found: ${totals.found}, inserted: ${totals.added}`)
    return
  }

  console.log(`Running ${source} scraper...`)
  const result = await runScraper(source)
  console.log(`Done - found: ${result.found}, inserted: ${result.added}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
