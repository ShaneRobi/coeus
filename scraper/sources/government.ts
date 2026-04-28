import { chromium } from 'playwright'
import { BaseScraper, type ScrapedEvent } from '../lib/base'

const TARGETS = [
  {
    sourceId: 'nyc-home',
    url: 'https://www.nyc.gov.sg/',
    organiser: 'National Youth Council',
    defaultVenue: 'Singapore',
    tags: ['government', 'youth', 'nyc'],
  },
  {
    sourceId: 'youth-corps',
    url: 'https://youthcorps.nyc.gov.sg/',
    organiser: 'Youth Corps Singapore',
    defaultVenue: 'Singapore',
    tags: ['government', 'youth', 'volunteering'],
  },
  {
    sourceId: 'discover-nyc',
    url: 'https://discover.nyc.gov.sg/omw/Join-Programmes',
    organiser: 'National Youth Council',
    defaultVenue: 'Singapore',
    tags: ['government', 'youth', 'programme'],
  },
]

const YOUTH_KEYWORDS = [
  'youth',
  'student',
  'students',
  'young',
  'volunteer',
  'career',
  'workshop',
  'programme',
  'hackathon',
  'mentoring',
  'leadership',
  'community',
]

function looksYouthFocused(text: string) {
  const lower = text.toLowerCase()
  return YOUTH_KEYWORDS.some((keyword) => lower.includes(keyword))
}

function dateFromText(text: string) {
  const match = text.match(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[,]?\s*\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i)
  if (!match) return undefined
  const parsed = new Date(`${match[0]} Singapore`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

export class GovernmentYouthScraper extends BaseScraper {
  readonly source = 'government'

  async scrape(): Promise<ScrapedEvent[]> {
    const browser = await chromium.launch({ headless: true })
    const events: ScrapedEvent[] = []

    try {
      const page = await browser.newPage()

      for (const target of TARGETS) {
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 })

        const items = await page.$$eval('a', (links) =>
          links.slice(0, 120).map((link) => ({
            title: link.textContent?.replace(/\s+/g, ' ').trim() ?? '',
            url: (link as HTMLAnchorElement).href,
          }))
        )

        for (const item of items) {
          if (!item.title || item.title.length < 8) continue
          if (!item.url.startsWith('https://')) continue
          if (!looksYouthFocused(`${item.title} ${item.url}`)) continue

          const start = dateFromText(item.title) ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

          events.push({
            title: item.title,
            description: `${item.title} from ${target.organiser}.`,
            start_at: start,
            location_name: target.defaultVenue,
            location_address: `${target.defaultVenue}, Singapore`,
            external_url: item.url,
            source: this.source,
            source_id: `${target.sourceId}:${item.url}`,
            is_free: true,
            tags: target.tags,
            organiser_name: target.organiser,
          })
        }
      }
    } finally {
      await browser.close()
    }

    const unique = new Map<string, ScrapedEvent>()
    for (const event of events) {
      if (event.source_id && !unique.has(event.source_id)) unique.set(event.source_id, event)
    }
    return Array.from(unique.values()).slice(0, 80)
  }
}
