import type { Event } from '@/lib/types'

export interface ScrapeResult {
  found: number
  added: number
}

export interface ScrapedEvent {
  title: string
  description: string
  start_at: string
  end_at?: string
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

  protected normalizeDate(input: string): string {
    return new Date(input).toISOString()
  }
}
