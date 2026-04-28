import axios from 'axios'
import { BaseScraper, type ScrapedEvent } from '../lib/base'

interface EventfindaImageTransform {
  url?: string
}

interface EventfindaImage {
  transforms?: { transforms?: EventfindaImageTransform[] }
}

interface EventfindaSession {
  datetime_start?: string
  datetime_end?: string
}

interface EventfindaTicketType {
  price?: string | number
  name?: string
}

interface EventfindaEvent {
  id: number
  name: string
  description?: string
  url: string
  address?: string
  location_summary?: string
  datetime_start?: string
  datetime_end?: string
  is_free?: boolean
  presented_by?: string
  category?: { name?: string }
  location?: {
    name?: string
    address?: string
    point?: { lat?: number; lng?: number }
  }
  sessions?: { sessions?: EventfindaSession[] }
  ticket_types?: { ticket_types?: EventfindaTicketType[] }
  images?: { images?: EventfindaImage[] }
}

interface EventfindaResponse {
  events?: EventfindaEvent[]
  count?: number
}

const DEFAULT_QUERY = [
  'youth',
  'student',
  'students',
  'school',
  'university',
  'polytechnic',
  'workshop',
  'hackathon',
  'career',
  'volunteer',
  'community',
].join(' OR ')

function parseEventfindaDate(value?: string) {
  if (!value) return new Date().toISOString()
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const withSingaporeOffset = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized)
    ? normalized
    : `${normalized}+08:00`
  return new Date(withSingaporeOffset).toISOString()
}

function getImageUrl(event: EventfindaEvent) {
  const image = event.images?.images?.[0]
  const transforms = image?.transforms?.transforms ?? []
  return transforms.find((transform) => transform.url)?.url
}

function getPrice(event: EventfindaEvent) {
  if (event.is_free) return { is_free: true }
  const prices = (event.ticket_types?.ticket_types ?? [])
    .map((ticket) => Number(ticket.price))
    .filter((price) => Number.isFinite(price))

  if (!prices.length) return { is_free: false }
  return {
    is_free: false,
    price_min: Math.min(...prices),
    price_max: Math.max(...prices),
  }
}

export class EventfindaScraper extends BaseScraper {
  readonly source = 'eventfinda'

  async scrape(): Promise<ScrapedEvent[]> {
    const username = process.env.EVENTFINDA_USERNAME
    const password = process.env.EVENTFINDA_PASSWORD
    if (!username || !password) {
      throw new Error('EVENTFINDA_USERNAME and EVENTFINDA_PASSWORD must be set')
    }

    const results: ScrapedEvent[] = []
    let offset = 0
    const rows = 20
    let total = rows
    const query = process.env.EVENTFINDA_QUERY ?? DEFAULT_QUERY

    do {
      const res = await axios.get<EventfindaResponse>('https://api.eventfinda.sg/v2/events.json', {
        auth: { username, password },
        params: {
          rows,
          offset,
          start_date: new Date().toISOString(),
          point: '1.3521,103.8198',
          radius: 60,
          order: 'date',
          q: query || undefined,
          fields: [
            'event:(id,name,description,url,address,location_summary,datetime_start,datetime_end,is_free,presented_by,category,location,sessions,ticket_types,images)',
            'location:(name,address,point)',
            'session:(datetime_start,datetime_end)',
            'ticket_type:(name,price)',
            'image:(transforms)',
            'transform:(url)',
            'category:(name)',
          ].join(','),
        },
      })

      const events = res.data.events ?? []
      total = res.data.count ?? events.length

      for (const event of events) {
        const firstSession = event.sessions?.sessions?.[0]
        const start = firstSession?.datetime_start ?? event.datetime_start
        const end = firstSession?.datetime_end ?? event.datetime_end
        const price = getPrice(event)
        const venue = event.location?.name ?? event.location_summary ?? 'Singapore'
        const address = event.location?.address ?? event.address ?? `${venue}, Singapore`
        const category = event.category?.name?.toLowerCase()

        results.push({
          title: event.name,
          description: event.description ?? '',
          start_at: parseEventfindaDate(start),
          end_at: end ? parseEventfindaDate(end) : undefined,
          location_name: venue,
          location_address: address,
          external_url: event.url,
          image_url: getImageUrl(event),
          source: this.source,
          source_id: String(event.id),
          is_free: price.is_free,
          price_min: price.price_min,
          price_max: price.price_max,
          tags: ['eventfinda', ...(category ? [category] : [])],
          organiser_name: event.presented_by,
        })
      }

      offset += rows
    } while (offset < total && offset < 100)

    return results
  }
}
