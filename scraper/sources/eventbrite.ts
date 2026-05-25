import { BaseScraper, type ScrapedEvent } from '../lib/base'

// Eventbrite removed their public search API (/v3/events/search/) for
// third-party apps in 2023. All calls return 404 NOT_FOUND regardless of
// the key or auth method used. This scraper is disabled until a replacement
// approach is found (e.g. web scraping or a new API agreement).
// The class is kept so the scraper registry in index.ts doesn't break.
export class EventbriteScraper extends BaseScraper {
  readonly source = 'eventbrite'

  async scrape(): Promise<ScrapedEvent[]> {
    throw new Error(
      'Eventbrite public search API is no longer available for third-party apps. ' +
      'The /v3/events/search/ endpoint returns 404 for all requests. ' +
      'Remove eventbrite from NIGHTLY_SOURCES or implement a web-scraping fallback.'
    )
  }
}
