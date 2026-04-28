import { chromium } from 'playwright'
import { BaseScraper, type ScrapedEvent } from '../../lib/base'

export class NUSScraper extends BaseScraper {
  readonly source = 'nus'

  async scrape(): Promise<ScrapedEvent[]> {
    const browser = await chromium.launch({ headless: true })
    const events: ScrapedEvent[] = []
    try {
      const page = await browser.newPage()
      await page.goto('https://nus.edu.sg/oam/events', { waitUntil: 'networkidle', timeout: 20000 })
      const items = await page.$$eval('.event-item, .views-row', (els) =>
        els.slice(0, 30).map((el) => ({
          title: el.querySelector('h3, .title, .event-title')?.textContent?.trim() ?? '',
          date: el.querySelector('.date, .event-date, time')?.textContent?.trim() ?? '',
          venue: el.querySelector('.venue, .location')?.textContent?.trim() ?? '',
          url: (el.querySelector('a') as HTMLAnchorElement)?.href ?? '',
          description: el.querySelector('.description, .summary')?.textContent?.trim() ?? '',
        }))
      )
      for (const item of items) {
        if (!item.title) continue
        events.push({
          title: item.title,
          description: item.description,
          start_at: this.normalizeDate(item.date || new Date().toISOString()),
          location_name: item.venue || 'NUS',
          location_address: item.venue ? `${item.venue}, NUS, Singapore` : 'National University of Singapore, Singapore',
          external_url: item.url,
          source: this.source,
          is_free: true,
          tags: ['university', 'nus'],
        })
      }
    } finally {
      await browser.close()
    }
    return events
  }
}
