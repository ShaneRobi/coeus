import { chromium } from 'playwright'
import { BaseScraper, type ScrapedEvent } from '../../lib/base'

export class SIMScraper extends BaseScraper {
  readonly source = 'sim'

  async scrape(): Promise<ScrapedEvent[]> {
    const browser = await chromium.launch({ headless: true })
    const events: ScrapedEvent[] = []
    try {
      const page = await browser.newPage()
      await page.goto('https://www.sim.edu.sg/news-events', { waitUntil: 'domcontentloaded', timeout: 30000 })
      const items = await page.$$eval('[class*="event"], [class*="Event"], .views-row, article, .card', (els) =>
        els.slice(0, 30).map((el) => ({
          title: el.querySelector('h2, h3, h4, [class*="title"], a')?.textContent?.trim() ?? '',
          // Query date-specific class before falling back to <p> so we don't
          // accidentally pick up category labels like "<p>Events</p>" that
          // appear first in the DOM when the card root is itself an <a> element.
          date: el.querySelector('time')?.getAttribute('datetime')
            ?? el.querySelector('[class*="date"], [class*="Date"]')?.textContent?.trim()
            ?? el.querySelector('time')?.textContent?.trim()
            ?? '',
          venue: el.querySelector('[class*="venue"], [class*="location"]')?.textContent?.trim() ?? '',
          // SIM cards use <a class="card"> as the root element, so querySelector('a')
          // finds no nested link. Fall back to the element's own href when applicable.
          url: (el.tagName === 'A' ? (el as HTMLAnchorElement).href : (el.querySelector('a') as HTMLAnchorElement | null)?.href) ?? '',
          description: el.querySelector('p, [class*="desc"], [class*="summary"]')?.textContent?.trim() ?? '',
        }))
      )
      for (const item of items) {
        if (!item.title) continue
        events.push({
          title: item.title,
          description: item.description,
          start_at: this.normalizeDate(item.date),
          location_name: item.venue || 'SIM',
          location_address: item.venue ? `${item.venue}, Singapore Institute of Management, Singapore` : 'Singapore Institute of Management, Singapore',
          external_url: item.url || undefined,
          source: this.source,
          source_id: item.url || undefined,
          is_free: true,
          tags: ['university', 'sim'],
        })
      }
    } finally {
      await browser.close()
    }
    return events
  }
}
