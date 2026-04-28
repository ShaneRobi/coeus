import axios from 'axios'
import { BaseScraper, type ScrapedEvent } from '../lib/base'

export class SportsSGScraper extends BaseScraper {
  readonly source = 'sportsg'

  async scrape(): Promise<ScrapedEvent[]> {
    const res = await axios.get('https://www.myactivesg.com/api/v2/facilities/events', {
      params: { per_page: 50, page: 1 },
    })

    const items: Array<{
      title: string
      description?: string
      start_date: string
      end_date?: string
      venue_name: string
      venue_address?: string
      event_url?: string
      image_url?: string
      fee?: string
    }> = res.data?.data ?? []

    return items.map((item): ScrapedEvent => {
      const priceInfo = this.parsePrice(item.fee ?? '')
      return {
        title: item.title,
        description: item.description ?? '',
        start_at: this.normalizeDate(item.start_date),
        end_at: item.end_date ? this.normalizeDate(item.end_date) : undefined,
        location_name: item.venue_name,
        location_address: item.venue_address ?? `${item.venue_name}, Singapore`,
        external_url: item.event_url,
        image_url: item.image_url,
        source: this.source,
        is_free: priceInfo.is_free,
        price_min: priceInfo.price_min,
        price_max: priceInfo.price_max,
        tags: ['sports', 'activesg'],
      }
    })
  }
}
