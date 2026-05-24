import axios from 'axios'
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

// Types for the __NEXT_DATA__ SSR payload on lu.ma/singapore
interface LumaGeoInfo {
  full_address?: string
  short_address?: string
  address?: string
  sublocality?: string
  city_state?: string
  city?: string
}

interface LumaNextEvent {
  api_id: string
  name: string
  url: string
  cover_url?: string
  start_at: string
  end_at?: string
  geo_address_info?: LumaGeoInfo
}

interface LumaNextEntry {
  api_id: string
  start_at: string
  event?: LumaNextEvent
  ticket_info?: { is_free?: boolean; price?: number | null; max_price?: number | null }
  hosts?: Array<{ name?: string }>
}

/** Walk an arbitrary JSON value and collect Luma event-wrapper objects. */
function collectEntries(obj: unknown, out: LumaNextEntry[], depth = 0): void {
  if (depth > 10 || !obj || typeof obj !== 'object') return
  if (Array.isArray(obj)) {
    for (const item of obj) collectEntries(item, out, depth + 1)
    return
  }
  const record = obj as Record<string, unknown>
  if (record.api_id && record.start_at && record.event && typeof record.event === 'object') {
    out.push(record as unknown as LumaNextEntry)
    return
  }
  for (const val of Object.values(record)) {
    collectEntries(val, out, depth + 1)
  }
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

  /**
   * Scrapes lu.ma/singapore via plain HTTP by reading the __NEXT_DATA__ JSON
   * that Luma embeds server-side in the page. No Playwright or API key needed —
   * works on Vercel and in GitHub Actions.
   */
  private async scrapePublicSingaporePage(): Promise<ScrapedEvent[]> {
    const res = await axios.get<string>('https://lu.ma/singapore', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      maxRedirects: 5,
    })

    const html = res.data

    // Extract the __NEXT_DATA__ JSON blob Luma embeds for SSR
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!nextDataMatch) {
      console.warn('[luma] __NEXT_DATA__ not found in lu.ma/singapore — page structure may have changed')
      return []
    }

    let root: unknown
    try {
      root = JSON.parse(nextDataMatch[1])
    } catch {
      console.warn('[luma] Failed to parse __NEXT_DATA__ JSON')
      return []
    }

    // Recursively collect entries that look like Luma event wrappers:
    // { api_id, start_at, event: { name, url, geo_address_info, ... }, ticket_info, hosts }
    const entries: LumaNextEntry[] = []
    collectEntries(root, entries)

    const events: ScrapedEvent[] = []
    for (const entry of entries) {
      const ev = entry.event
      if (!ev?.name || !entry.start_at) continue

      const geo = ev.geo_address_info
      const address = geo?.full_address ?? geo?.short_address ?? 'Singapore'
      const locationName = geo?.address ?? geo?.sublocality ?? geo?.city_state ?? 'Singapore'

      const ticketInfo = entry.ticket_info
      const hostName = entry.hosts?.[0]?.name

      events.push({
        title: ev.name,
        description: '',
        start_at: this.normalizeDate(entry.start_at),
        end_at: ev.end_at ? this.normalizeDate(ev.end_at) : undefined,
        location_name: locationName,
        location_address: address,
        external_url: `https://lu.ma/${ev.url}`,
        image_url: ev.cover_url,
        source: this.source,
        source_id: entry.api_id,
        is_free: ticketInfo?.is_free ?? true,
        price_min: ticketInfo?.price ?? undefined,
        price_max: ticketInfo?.max_price ?? undefined,
        tags: ['luma'],
        organiser_name: hostName,
      })
    }

    return events
  }
}
