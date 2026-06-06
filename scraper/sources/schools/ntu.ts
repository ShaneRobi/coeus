import axios from 'axios'
import { BaseScraper, type ScrapedEvent } from '../../lib/base'

interface NTUApiEvent {
  title: string
  url: string
  image: string
  description: string
  date: string
  location: string
  eventstart: string
  eventend: string
}

interface NTUApiResponse {
  totalPages: number
  totalItems: number
  items: NTUApiEvent[]
}

// "20261116T090000" → "2026-11-16T09:00:00+08:00" (Singapore time)
function parseNTUDate(compact: string): string | null {
  const m = compact.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+08:00`
}

export class NTUScraper extends BaseScraper {
  readonly source = 'ntu'

  async scrape(): Promise<ScrapedEvent[]> {
    const results: ScrapedEvent[] = []
    let page = 1
    let totalPages = 1

    do {
      const res = await axios.get<NTUApiResponse>('https://www.ntu.edu.sg/events/GetEvents/', {
        params: { categories: 'all', page, pageSize: 50 },
        headers: { Accept: 'application/json' },
      })

      const { items, totalPages: tp } = res.data
      totalPages = tp

      for (const item of items) {
        if (!item.title) continue
        const start = parseNTUDate(item.eventstart)
        if (!start) continue

        results.push({
          title: item.title,
          description: item.description ?? '',
          start_at: start,
          end_at: item.eventend ? parseNTUDate(item.eventend) ?? undefined : undefined,
          location_name: item.location || 'NTU',
          location_address: item.location
            ? `${item.location}, Singapore`
            : 'Nanyang Technological University, Singapore',
          external_url: item.url || undefined,
          image_url: item.image || undefined,
          source: this.source,
          source_id: item.url || undefined,
          is_free: true,
          tags: ['university', 'ntu'],
        })
      }

      page++
    } while (page <= totalPages && results.length < 100)

    return results
  }
}
