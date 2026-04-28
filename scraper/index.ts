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

export const NIGHTLY_SOURCES = [
  'eventfinda',
  'eventbrite',
  'luma',
  'nus',
  'ntu',
  'smu',
  'sp',
  'np',
  'tp',
  'rp',
  'nyp',
  'ite',
  'sutd',
  'sit',
  'suss',
  'sim',
  'psb',
]

export async function runScraper(source: string): Promise<ScrapeResult> {
  if (source === 'all') {
    const results = await runAllScrapers()
    return Object.values(results).reduce(
      (total, result) => ({ found: total.found + result.found, added: total.added + result.added }),
      { found: 0, added: 0 }
    )
  }

  const scraper = SCRAPERS[source as keyof typeof SCRAPERS]
  if (!scraper) throw new Error(`Unknown scraper: ${source}`)

  const raw = await scraper.scrape()
  const supabase = createServiceClient()

  let added = 0

  for (const event of raw) {
    // Skip if already exists by source + source_id
    if (event.source_id) {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', event.source)
        .eq('source_id', event.source_id)
        .single()
      if (existing) continue
    }

    const coordinates = await geocodeAddress(event.location_address)
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

    if (!error) added++
  }

  return { found: raw.length, added }
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
      results[source] = { found: 0, added: 0 }
      console.error(`Scraper ${source} failed:`, err)
    }
  }
  return results
}
