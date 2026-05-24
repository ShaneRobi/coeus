import * as chrono from 'chrono-node'

export interface ScrapeResult {
  found: number
  added: number
  skipped: number
  error?: string
}

export interface ScrapedEvent {
  title: string
  description: string
  start_at: string | null
  end_at?: string | null
  location_name: string
  location_address: string
  external_url?: string
  image_url?: string
  source: string
  source_id?: string
  is_free: boolean
  price_min?: number
  price_max?: number
  tags: string[]
  organiser_name?: string
}

export abstract class BaseScraper {
  abstract readonly source: string

  abstract scrape(): Promise<ScrapedEvent[]>

  protected parsePrice(text: string): { is_free: boolean; price_min?: number; price_max?: number } {
    const lower = text.toLowerCase().trim()
    if (!lower || lower === 'free' || lower === 'complimentary') {
      return { is_free: true }
    }
    const nums = text.match(/\d+(?:\.\d+)?/g)
    if (!nums) return { is_free: false }
    const prices = nums.map(Number)
    return {
      is_free: false,
      price_min: Math.min(...prices),
      price_max: Math.max(...prices),
    }
  }

  // Returns null if the date cannot be parsed — callers should skip events with null start_at
  protected normalizeDate(input: string | undefined | null): string | null {
    if (!input?.trim()) return null
    // Fast path for ISO strings and other formats native Date handles well
    const native = new Date(input)
    if (!isNaN(native.getTime())) return native.toISOString()
    // Fallback: chrono-node handles human-readable text like "Mon 12 May 2025"
    const results = chrono.parse(input, new Date(), { forwardDate: true })
    if (!results.length) return null
    return results[0].start.date().toISOString()
  }
}
