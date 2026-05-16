import axios from 'axios'
import { chromium } from 'playwright'
import { BaseScraper, type ScrapedEvent } from '../lib/base'

interface LumaEvent {
  api_id?: string
  event_api_id?: string
  id?: string
  name: string
  description?: string
  description_md?: string
  start_at: string
  end_at?: string
  geo_address_info?: { full_address?: string; place_id?: string }
  geo_address_json?: { full_address?: string; address?: string; city?: string; country?: string }
  cover_url?: string
  url: string
  ticket_info?: { is_free: boolean; price?: number; max_price?: number }
  timezone?: string
  host?: string
}

interface LumaListEventsResponse {
  entries?: Array<{ event?: LumaEvent } | LumaEvent>
  next_cursor?: string
}

function unwrapEvent(entry: { event?: LumaEvent } | LumaEvent): LumaEvent | undefined {
  if ('event' in entry) return entry.event
  return entry as LumaEvent
}

export class LumaScraper extends BaseScraper {
  readonly source = 'luma'

  async scrape(): Promise<ScrapedEvent[]> {
    const apiKey = process.env.LUMA_API_KEY
    if (!apiKey) return this.scrapePublicSingaporePage()

    const results: ScrapedEvent[] = []
    let cursor: string | undefined

    do {
      const res = await axios.get<LumaListEventsResponse>('https://public-api.luma.com/v1/calendar/list-events', {
        params: {
          after: new Date().toISOString(),
          pagination_cursor: cursor,
          pagination_limit: 50,
          sort_column: 'start_at',
          sort_direction: 'asc',
        },
        headers: {
          'x-luma-api-key': apiKey,
          accept: 'application/json',
        },
      })

      const entries = res.data.entries ?? []

      for (const entry of entries) {
        const e = unwrapEvent(entry)
        if (!e) continue

        const address =
          e.geo_address_info?.full_address ??
          e.geo_address_json?.full_address ??
          e.geo_address_json?.address ??
          ''
        if (!address.toLowerCase().includes('singapore')) continue

        results.push({
          title: e.name,
          description: e.description ?? e.description_md ?? '',
          start_at: this.normalizeDate(e.start_at),
          end_at: e.end_at ? this.normalizeDate(e.end_at) : undefined,
          location_name: address.split(',')[0] ?? 'Singapore',
          location_address: address,
          external_url: e.url,
          image_url: e.cover_url,
          source: this.source,
          source_id: e.api_id ?? e.event_api_id ?? e.id,
          is_free: e.ticket_info?.is_free ?? true,
          price_min: e.ticket_info?.price,
          price_max: e.ticket_info?.max_price,
          tags: ['luma'],
          organiser_name: e.host,
        })
      }

      cursor = res.data.next_cursor
    } while (cursor && results.length < 250)

    return results
  }

  private async scrapePublicSingaporePage(): Promise<ScrapedEvent[]> {
    const browser = await chromium.launch({ headless: true })
    const events: ScrapedEvent[] = []

    try {
      const page = await browser.newPage()
      await page.goto('https://luma.com/singapore', { waitUntil: 'domcontentloaded', timeout: 30000 })

      const urls = await page.$$eval('a[href]', (links) => {
        const found = new Set<string>()
        for (const link of links) {
          const href = (link as HTMLAnchorElement).href
          if (!href) continue
          if (!/^https:\/\/(lu\.ma|luma\.com)\//.test(href)) continue
          if (/\/(discover|pricing|help|home|signin|login|create|calendar|user)\b/.test(href)) continue
          if (href.includes('/singapore')) continue
          found.add(href.split('?')[0])
        }
        return Array.from(found).slice(0, 20)
      })

      for (const url of urls) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
          const item = await page.$$eval('script[type="application/ld+json"]', (scripts) => {
            for (const script of scripts) {
              try {
                const parsed = JSON.parse(script.textContent ?? '{}')
                const candidates = Array.isArray(parsed) ? parsed : [parsed]
                const event = candidates.find((entry) => entry?.['@type'] === 'Event')
                if (event) return event
              } catch {
                // Ignore malformed structured data.
              }
            }
            return null
          })

          if (!item?.name || !item?.startDate) continue

          const location = item.location
          const locationName =
            typeof location?.name === 'string'
              ? location.name
              : typeof location === 'string'
                ? location
                : 'Singapore'
          const addressValue =
            typeof location?.address === 'string'
              ? location.address
              : location?.address
                ? [location.address.streetAddress, location.address.addressLocality, location.address.addressCountry].filter(Boolean).join(', ')
                : `${locationName}, Singapore`
          const address = addressValue || `${locationName}, Singapore`
          if (!`${locationName} ${address}`.toLowerCase().includes('singapore')) continue

          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers
          const price = offer?.price != null ? Number(offer.price) : undefined

          events.push({
            title: item.name,
            description: item.description ?? '',
            start_at: this.normalizeDate(item.startDate),
            end_at: item.endDate ? this.normalizeDate(item.endDate) : undefined,
            location_name: locationName,
            location_address: address,
            external_url: item.url ?? url,
            image_url: Array.isArray(item.image) ? item.image[0] : item.image,
            source: this.source,
            source_id: url,
            is_free: price == null ? true : price === 0,
            price_min: price,
            price_max: price,
            tags: ['luma'],
            organiser_name: item.organizer?.name,
          })
        } catch (err) {
          console.warn(`Luma event scrape failed for ${url}:`, err)
        }
      }
    } finally {
      await browser.close()
    }

    return events
  }
}
