import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { chromium } from 'playwright'

async function diagnose(url: string, selector: string, label: string) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    console.log(`\n=== ${label}: ${url} ===`)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const count = await page.$$eval(selector, (els) => els.length)
    console.log(`  Selector "${selector}" matched: ${count}`)

    if (count > 0) {
      const items = await page.$$eval(selector, (els: Element[]) =>
        els.slice(0, 2).map((el) => ({
          title: (el.querySelector('h2, h3, h4, [class*="title"]') as HTMLElement)?.innerText?.trim()?.slice(0, 60) ?? '(none)',
          date: (el.querySelector('time') as HTMLElement)?.getAttribute('datetime')
            ?? (el.querySelector('time, [class*="date"], [class*="Date"]') as HTMLElement)?.innerText?.trim()?.slice(0, 40)
            ?? '(none)',
          href: (el.querySelector('a') as HTMLAnchorElement)?.href?.slice(0, 80) ?? '(none)',
          html: el.outerHTML.slice(0, 200),
        }))
      )
      for (const i of items) {
        console.log('  title:', i.title)
        console.log('  date:', i.date)
        console.log('  href:', i.href)
        console.log('  html:', i.html)
        console.log()
      }
    } else {
      const snippet = await page.evaluate(() => document.body.innerHTML.slice(0, 600))
      console.log('  Body snippet:', snippet.replace(/<[^>]+>/g, ' ').trim().slice(0, 300))
    }
  } finally {
    await browser.close()
  }
}

async function main() {
  await diagnose('https://nus.edu.sg/cfg/events', '.event-item, .views-row, [class*="event"], article', 'NUS')
  await diagnose('https://www.ntu.edu.sg/news-events/events', '[class*="event"], [class*="Event"], .views-row, article', 'NTU')
  await diagnose('https://www.smu.edu.sg/events', '[class*="event"], [class*="Event"], .views-row, article', 'SMU')
  await diagnose('https://www.sim.edu.sg/news-events', '[class*="event"], [class*="Event"], .views-row, article, .card', 'SIM')
}

main().catch(console.error)
