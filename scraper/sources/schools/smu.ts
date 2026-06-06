import axios from 'axios'
import { BaseScraper, type ScrapedEvent } from '../../lib/base'

// Extract text content from a simple XML tag (handles CDATA and plain text).
function xmlText(block: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = block.match(new RegExp(`<${escaped}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escaped}>|<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`))
  return (m?.[1] ?? m?.[2] ?? '').trim()
}

export class SMUScraper extends BaseScraper {
  readonly source = 'smu'

  async scrape(): Promise<ScrapedEvent[]> {
    const res = await axios.get<string>(
      'https://www.trumba.com/calendars/SMU_NextWeb_Main.rss',
      { headers: { Accept: 'application/rss+xml, text/xml, */*' } }
    )

    const xml = res.data as string
    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
    const results: ScrapedEvent[] = []

    for (const block of itemBlocks) {
      const title = xmlText(block, 'xCal:summary') || xmlText(block, 'title')
      if (!title) continue

      const dtstart = xmlText(block, 'xCal:dtstart')
      const dtend = xmlText(block, 'xCal:dtend')
      const location = xmlText(block, 'xCal:location')
      const description = xmlText(block, 'xCal:description')
      const link = xmlText(block, 'link')
      const guid = xmlText(block, 'guid')
      const sourceId = guid.replace('http://uid.trumba.com/event/', '').trim()

      // Event image is in a customfield element
      const imageMatch = block.match(/<x-trumba:customfield[^>]*name="Event image"[^>]*>([^<]*)<\/x-trumba:customfield>/)
      const imageUrl = imageMatch?.[1]?.trim() || undefined

      // Parse fee info
      const feeMatch = block.match(/<x-trumba:customfield[^>]*name="Fee\(s\)"[^>]*>([\s\S]*?)<\/x-trumba:customfield>/)
      const feeText = feeMatch?.[1]?.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() ?? ''
      const { is_free, price_min, price_max } = this.parsePrice(feeText || 'free')

      results.push({
        title,
        description,
        start_at: dtstart ? new Date(dtstart).toISOString() : null,
        end_at: dtend ? new Date(dtend).toISOString() : undefined,
        location_name: location || 'SMU',
        location_address: location ? `${location}, Singapore` : 'Singapore Management University, Singapore',
        external_url: link || undefined,
        image_url: imageUrl,
        source: this.source,
        source_id: sourceId || undefined,
        is_free,
        price_min,
        price_max,
        tags: ['university', 'smu'],
      })
    }

    return results
  }
}
