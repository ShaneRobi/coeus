import { chromium } from 'playwright'
import { BaseScraper, type ScrapedEvent } from '../../lib/base'

export class TPScraper extends BaseScraper {
  readonly source = 'tp'

  async scrape(): Promise<ScrapedEvent[]> {
    const browser = await chromium.launch({ headless: true })
    const events: ScrapedEvent[] = []
    try {
      const page = await browser.newPage()
      await page.goto('https://www.tp.edu.sg/news-and-events/events.html', { waitUntil: 'networkidle', timeout: 20000 })
      const items = await page.$$eval('[class*="event"], [class*="Event"], .views-row, article', (els) =>
        els.slice(0, 30).map((el) => ({
          title: el.querySelector('h2, h3, h4, [class*="title"]')?.textContent?.trim() ?? '',
          date: el.querySelector('time, [class*="date"], [class*="Date"]')?.textContent?.trim() ?? '',
          venue: el.querySelector('[class*="venue"], [class*="location"]')?.textContent?.trim() ?? '',
          url: (el.querySelector('a') as HTMLAnchorElement)?.href ?? '',
          description: el.querySelector('p, [class*="desc"], [class*="summary"]')?.textContent?.trim() ?? '',
        }))
      )
      for (const item of items) {
        if (!item.title) continue
        events.push({
          title: item.title,
          description: item.description,
          start_at: this.normalizeDate(item.date || new Date().toISOString()),
          location_name: item.venue || 'TP',
          location_address: item.venue ? `${item.venue}, Temasek Polytechnic, Singapore` : 'Temasek Polytechnic, Singapore',
          external_url: item.url,
          source: this.source,
          is_free: true,
          tags: ['university', 'tp'],
        })
      }
    } finally {
      await browser.close()
    }
    return events
  }
}
