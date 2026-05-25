import { createServiceClient } from '@/lib/supabase'
import { geocodeAddress } from './lib/geocode'
import { inferCategory, extractTags } from './lib/tag'
import type { ScrapedEvent, ScrapeResult } from './lib/base'

import { EventbriteScraper } from './sources/eventbrite'
import { LumaScraper } from './sources/luma'
import { EventfindaScraper } from './sources/eventfinda'
import { SportsSGScraper } from './sources/sportsg'
import { FacebookScraper } from './sources/facebook'
import { NUSScraper } from './sources/schools/nus'
import { NTUScraper } from './sources/schools/ntu'
import { SMUScraper } from './sources/schools/smu'
import { SPScraper } from './sources/schools/sp'
import { NPScraper } from './sources/schools/np'
import { TPScraper } from './sources/schools/tp'
import { RPScraper } from './sources/schools/rp'
import { NYPScraper } from './sources/schools/nyp'
import { ITEScraper } from './sources/schools/ite'
import { SUTDScraper } from './sources/schools/sutd'
import { SITScraper } from './sources/schools/sit'
import { SUSSScraper } from './sources/schools/suss'
import { SIMScraper } from './sources/schools/sim'
import { PSBScraper } from './sources/schools/psb'
import { GovernmentYouthScraper } from './sources/government'

const SCRAPERS = {
  eventbrite: new EventbriteScraper(),
  luma: new LumaScraper(),
  eventfinda: new EventfindaScraper(),
  sportsg: new SportsSGScraper(),
  facebook: new FacebookScraper(),
  nus: new NUSScraper(),
  ntu: new NTUScraper(),
  smu: new SMUScraper(),
  sp: new SPScraper(),
  np: new NPScraper(),
  tp: new TPScraper(),
  rp: new RPScraper(),
  nyp: new NYPScraper(),
  ite: new ITEScraper(),
  sutd: new SUTDScraper(),
  sit: new SITScraper(),
  suss: new SUSSScraper(),
  sim: new SIMScraper(),
  psb: new PSBScraper(),
  government: new GovernmentYouthScraper(),
}

// Sources with confirmed working URLs and APIs. School scrapers with 404 URLs
// are kept in SCRAPERS for manual testing but excluded from the daily run.
// NOTE: 'eventbrite' removed — Eventbrite deprecated their public search API
// (/v3/events/search/) for third-party apps; the endpoint returns 404.
export const NIGHTLY_SOURCES = [
  'eventfinda',
  'luma',
  'nus',
  'ntu',
  'smu',
  'sim',
]

// Nominatim rate limit: 1 req/sec. We wait at least this long between calls.
const GEOCODE_DELAY_MS = 1100

// Per-scraper timeout: kill a hanging scraper after 45s so it cannot block others.
const SCRAPER_TIMEOUT_MS = 45_000

/**
 * Races a promise against a timeout. Rejects with a descriptive error if time runs out.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`[${label}] timed out after ${ms / 1000}s`)), ms)
  )
  return Promise.race([promise, timeout])
}

export async function runScraper(source: string): Promise<ScrapeResult> {
  if (source === 'all') {
    const results = await runAllScrapers()
    return Object.values(results).reduce(
      (total, result) => ({
        found:   total.found   + result.found,
        added:   total.added   + result.added,
        skipped: total.skipped + result.skipped,
      }),
      { found: 0, added: 0, skipped: 0 }
    )
  }

  const scraper = SCRAPERS[source as keyof typeof SCRAPERS]
  if (!scraper) throw new Error(`Unknown scraper: ${source}`)

  // Fetch events with a hard timeout so a hung scraper doesn't block the queue.
  const raw = await withTimeout(scraper.scrape(), SCRAPER_TIMEOUT_MS, source)

  const supabase = createServiceClient()

  // Drop events with unparseable or past dates
  const now = new Date()
  const upcoming = raw.filter((e): e is ScrapedEvent & { start_at: string } => {
    if (!e.start_at) return false
    return new Date(e.start_at) >= now
  })

  let added = 0
  let skipped = 0
  let lastGeocode = 0

  for (const event of upcoming) {
    // Scraped events must have a link — skip those without one
    if (!event.external_url) {
      console.warn(`[${source}] Skipping event without link: "${event.title}"`)
      skipped++
      continue
    }

    // --- Deduplication ---
    // Primary: if source_id is present, upsert using the (source, source_id) unique key.
    if (event.source_id) {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', event.source)
        .eq('source_id', event.source_id)
        .single()
      if (existing) {
        skipped++
        continue
      }
    } else {
      // Fallback: deduplicate by external_url for events that have no source_id.
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('external_url', event.external_url)
        .single()
      if (existing) {
        skipped++
        continue
      }
    }

    // Rate-limit geocoding to respect Nominatim's 1 req/sec policy
    const genericAddress = !event.location_address || event.location_address.trim() === 'Singapore'
    let coordinates = null
    if (!genericAddress) {
      const elapsed = Date.now() - lastGeocode
      if (elapsed < GEOCODE_DELAY_MS) {
        await new Promise(r => setTimeout(r, GEOCODE_DELAY_MS - elapsed))
      }
      coordinates = await geocodeAddress(event.location_address)
      lastGeocode = Date.now()
    }

    const category = inferCategory(event.title, event.description)
    const tags = event.tags.length ? event.tags : extractTags(event.title, event.description)

    const { error } = await supabase.from('events').insert({
      title: event.title,
      description: event.description,
      start_at: event.start_at,
      end_at: event.end_at ?? null,
      location_name: event.location_name,
      location_address: event.location_address,
      coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : null,
      image_url: event.image_url ?? null,
      external_url: event.external_url ?? null,
      source: event.source,
      source_id: event.source_id ?? null,
      tags,
      category,
      status: 'published',
      is_free: event.is_free,
      price_min: event.price_min ?? null,
      price_max: event.price_max ?? null,
      organiser_name: event.organiser_name ?? null,
      organiser_id: null,
    })

    if (!error) {
      added++
    } else {
      console.error(`[${source}] DB insert failed for "${event.title}":`, error.message)
    }
  }

  return { found: raw.length, added, skipped }
}

export async function runAllScrapers(): Promise<Record<string, ScrapeResult>> {
  return runScrapers(Object.keys(SCRAPERS))
}

export async function runScrapers(sources: string[]): Promise<Record<string, ScrapeResult>> {
  const results: Record<string, ScrapeResult> = {}
  for (const source of sources) {
    try {
      results[source] = await runScraper(source)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Scraper ${source} failed:`, message)
      // Propagate the error message into the result so callers can surface it.
      results[source] = { found: 0, added: 0, skipped: 0, error: message }
    }
  }
  return results
}
