import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { parseMessageAsEvent } from '../scraper/sources/telegram'
import { createServiceClient } from '@/lib/supabase'
import { inferCategory, extractTags } from '../scraper/lib/tag'
import { geocodeAddress } from '../scraper/lib/geocode'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('[telegram-bot] TELEGRAM_BOT_TOKEN is not set in .env.local')
  process.exit(1)
}

const bot = new Telegraf(token)
const supabase = createServiceClient()

async function handleEventMessage(
  text: string,
  messageId: number,
  chatId: number,
  chatTitle?: string,
  entities?: Array<{ type: string; offset: number; length: number }>,
) {
  const parsed = parseMessageAsEvent(text, entities)
  if (!parsed) return

  const source_id = `${chatId}:${messageId}`

  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('source', 'telegram')
    .eq('source_id', source_id)
    .single()
  if (existing) return

  const coordinates = await geocodeAddress(parsed.location_address)
  const category = inferCategory(parsed.title, '')
  const tags = extractTags(parsed.title, '')

  const { error } = await supabase.from('events').insert({
    title: parsed.title,
    description: '',
    start_at: parsed.start_at,
    end_at: parsed.end_at ?? null,
    location_name: parsed.location_name,
    location_address: parsed.location_address,
    coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : null,
    image_url: null,
    external_url: parsed.external_url ?? null,
    source: 'telegram',
    source_id,
    tags,
    category,
    status: 'published',
    is_free: true,
    price_min: null,
    price_max: null,
    organiser_name: chatTitle ?? null,
    organiser_id: null,
  })

  if (error) {
    console.error(`[telegram-bot] DB error for "${parsed.title}":`, error.message)
  } else {
    console.log(`[telegram-bot] saved: "${parsed.title}" (${parsed.start_at.slice(0, 10)}) from ${chatTitle ?? chatId}`)
  }
}

// Group / supergroup messages
bot.on(message('text'), async (ctx) => {
  const { text, message_id, chat, entities } = ctx.message
  const chatTitle = 'title' in chat ? chat.title : undefined
  await handleEventMessage(text, message_id, chat.id, chatTitle, entities).catch((err) =>
    console.error('[telegram-bot] handler error:', err),
  )
})

// Channel posts
bot.on('channel_post', async (ctx) => {
  const post = ctx.channelPost
  if (!('text' in post) || !post.text) return
  const entities = ('entities' in post ? post.entities : undefined) as
    | Array<{ type: string; offset: number; length: number }>
    | undefined
  await handleEventMessage(post.text, post.message_id, post.chat.id, post.chat.title, entities).catch(
    (err) => console.error('[telegram-bot] handler error:', err),
  )
})

bot.launch({ dropPendingUpdates: true })

console.log('[telegram-bot] started — listening for event messages')
console.log('[telegram-bot] invite the bot to channels (as admin) or groups to begin scraping')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
