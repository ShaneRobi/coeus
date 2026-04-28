import axios from 'axios'
import { BaseScraper, type ScrapedEvent } from '../lib/base'

interface EBEvent {
  id: string
  name: { text: string }
  description: { text: string }
  start: { utc: string }
  end: { utc: string }
  url: string
  logo?: { url: string }
  is_free: boolean
  ticket_availability?: {
    minimum_ticket_price?: { major_value: string }
    maximum_ticket_price?: { major_value: string }
  }
  venue?: { name: string; address: { localized_address_display: string } }
}

interface EBResponse {
  events?: EBEvent[]
  pagination?: { page_count: number; page_number: number }
}

export class EventbriteScraper extends BaseScraper {
  readonly source = 'eventbrite'

  async scrape(): Promise<ScrapedEvent[]> {
    const apiKey = process.env.EVENTBRITE_API_KEY
    if (!apiKey) throw new Error('EVENTBRITE_API_KEY not set')

    const results: ScrapedEvent[] = []
    let page = 1
    let totalPages = 1

    do {
      const res = await axios.get<EBResponse>('https://www.eventbriteapi.com/v3/events/search/', {
        params: {
          'location.address': 'Singapore',
          'location.within': '50km',
          expand: 'venue,ticket_availability,logo',
          token: apiKey,
          page_size: 50,
          page,
        },
      })

      totalPages = res.data.pagination?.page_count ?? 1
      const events = res.data.events ?? []

      for (const e of events) {
        results.push({
          title: e.name.text,
          description: e.description?.text ?? '',
          start_at: this.normalizeDate(e.start.utc),
          end_at: this.normalizeDate(e.end.utc),
          location_name: e.venue?.name ?? 'Singapore',
          location_address: e.venue?.address?.localized_address_display ?? 'Singapore',
          external_url: e.url,
          image_url: e.logo?.url,
          source: this.source,
          source_id: e.id,
          is_free: e.is_free,
          price_min: e.ticket_availability?.minimum_ticket_price
            ? parseFloat(e.ticket_availability.minimum_ticket_price.major_value)
            : undefined,
          price_max: e.ticket_availability?.maximum_ticket_price
            ? parseFloat(e.ticket_availability.maximum_ticket_price.major_value)
            : undefined,
          tags: [],
        })
      }

      page++
    } while (page <= Math.min(totalPages, 5))

    return results
  }
}
