import * as chrono from 'chrono-node'

export interface ParsedTelegramEvent {
  title: string
  start_at: string
  end_at?: string
  location_name: string
  location_address: string
  external_url?: string
}

interface MessageEntity {
  type: string
  offset: number
  length: number
}

const LOCATION_PATTERNS = [
  /(?:📍|📌|🏢|🏛️)\s*(.+)/,
  /(?:venue|location|where|place)\s*[:：]\s*(.+)/i,
  /(?:held at|taking place at|happening at|join us at)\s+(.+)/i,
]

const URL_RE = /https?:\/\/[^\s\])"'>]+/g

const EVENT_DOMAINS = [
  /lu\.ma\//,
  /eventbrite\./,
  /eventfinda\./,
  /facebook\.com\/events/,
  /fb\.me\//,
  /peatix\.com/,
  /meetup\.com/,
]

function extractTitle(text: string, entities?: MessageEntity[]): string {
  // Prefer the first Telegram bold entity as title
  if (entities) {
    const bold = entities.find((e) => e.type === 'bold')
    if (bold) {
      return text.slice(bold.offset, bold.offset + bold.length).replace(/[*_]/g, '').trim()
    }
  }
  // Strip Markdown bold markers and leading emoji from first non-empty line
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return ''
  const raw = lines[0]
    .replace(/^\*+|\*+$/g, '')
    .replace(/^(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|\s)+/, '')
    .trim()
  return raw || lines[0].replace(/^\*+|\*+$/g, '').trim()
}

function extractDateTime(text: string): { start_at: string; end_at?: string } | null {
  const results = chrono.parse(text, new Date(), { forwardDate: true })
  if (!results.length) return null
  const first = results[0]
  return {
    start_at: first.start.date().toISOString(),
    end_at: first.end ? first.end.date().toISOString() : undefined,
  }
}

function extractLocation(text: string): { location_name: string; location_address: string } {
  for (const pattern of LOCATION_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      const loc = match[1].replace(/[*_]/g, '').split('\n')[0].trim()
      return {
        location_name: loc.split(',')[0].trim(),
        location_address: loc,
      }
    }
  }
  return { location_name: 'Singapore', location_address: 'Singapore' }
}

function extractUrl(text: string): string | undefined {
  const urls = [...(text.match(URL_RE) ?? [])]
  for (const url of urls) {
    if (EVENT_DOMAINS.some((p) => p.test(url))) return url.replace(/[.,;:!?)]+$/, '')
  }
  return urls[0]?.replace(/[.,;:!?)]+$/, '')
}

export function parseMessageAsEvent(
  text: string,
  entities?: MessageEntity[],
): ParsedTelegramEvent | null {
  if (!text || text.length < 20) return null

  const title = extractTitle(text, entities)
  if (!title || title.length < 3) return null

  const datetime = extractDateTime(text)
  if (!datetime) return null // No date → not an event post

  const location = extractLocation(text)
  const external_url = extractUrl(text)

  return { title, ...datetime, ...location, external_url }
}
