import { chromium } from 'playwright'
import { BaseScraper, type ScrapedEvent } from '../../lib/base'

export class NUSScraper extends BaseScraper {
  readonly source = 'nus'

  async scrape(): Promise<ScrapedEvent[]> {
    const browser = await chromium.launch({ headless: true })
    const events: ScrapedEvent[] = []
    try {
      const page = await browser.newPage()
      await page.goto('https://nus.edu.sg/cfg/events', { waitUntil: 'domcontentloaded', timeout: 30000 })
      const items = await page.$$eval('.event-item, .views-row, [class*="event"], article', (els) =>
        els.slice(0, 30).map((el) => ({
          title: el.querySelector('h3, h2, h4, .title, .event-title, [class*="title"]')?.textContent?.trim() ?? '',
          date: el.querySelector('time, .date, .event-date, [class*="date"], [class*="Date"]')?.getAttribute('datetime')
            ?? el.querySelector('time, .date, .event-date, [class*="date"], [class*="Date"]')?.textContent?.trim()
            ?? '',
          venue: el.querySelector('.venue, .location, [class*="venue"], [class*="location"]')?.textContent?.trim() ?? '',
          url: (el.querySelector('a') as HTMLAnchorElement)?.href ?? '',
          description: el.querySelector('.description, .summary, p')?.textContent?.trim() ?? '',
        }))
      )
      for (const item of items) {
        if (!item.title) continue
        events.push({
          title: item.title,
          description: item.description,
          start_at: this.normalizeDate(item.date),
          location_name: item.venue || 'NUS',
          location_address: item.venue ? `${item.venue}, NUS, Singapore` : 'National University of Singapore, Singapore',
          external_url: item.url || undefined,
          source: this.source,
          source_id: item.url || undefined,
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
