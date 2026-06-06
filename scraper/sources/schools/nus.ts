import { chromium } from 'playwright'
import { BaseScraper, type ScrapedEvent } from '../../lib/base'

export class NUSScraper extends BaseScraper {
  readonly source = 'nus'

  async scrape(): Promise<ScrapedEvent[]> {
    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    })
    const events: ScrapedEvent[] = []
    try {
      const page = await browser.newPage()
      await page.goto('https://nus.edu.sg/cfg/events', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      // Events load asynchronously via ASP.NET AJAX — wait until attached
      await page.waitForSelector('.list_event_info', { state: 'attached', timeout: 20000 })

      const items = await page.$$eval('.list_event', (els) =>
        els.map((el) => {
          const titleLink = el.querySelector('h3 a') as HTMLAnchorElement | null
          const spans = Array.from(el.querySelectorAll('.list_event_info span'))
          const dateSpan = spans.find((s) => s.textContent?.includes('Date:'))
          const venueSpan = spans.find((s) => s.textContent?.includes('Venue:'))
          const desc = (el.querySelector('.list_event_info p') as HTMLElement)?.innerText?.trim() ?? ''

          // Date may be a range like "29 May 2026 – 26 June 2026" — use the start
          const rawDate = dateSpan?.textContent?.replace(/^Date:\s*/i, '').trim() ?? ''
          const date = rawDate.includes('–') ? rawDate.split('–')[0].trim() : rawDate

          return {
            title: titleLink?.textContent?.trim() ?? '',
            url: titleLink?.href ?? '',
            date,
            venue: venueSpan?.textContent?.replace(/^Venue:\s*/i, '').trim() ?? '',
            description: desc,
          }
        })
      )

      for (const item of items) {
        if (!item.title) continue
        events.push({
          title: item.title,
          description: item.description,
          start_at: this.normalizeDate(item.date),
          location_name: item.venue || 'NUS',
          location_address: item.venue
            ? `${item.venue}, NUS, Singapore`
            : 'National University of Singapore, Singapore',
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
