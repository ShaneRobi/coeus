import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { SubmitPayload } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: SubmitPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const required: (keyof SubmitPayload)[] = [
    'title', 'description', 'start_at', 'location_name', 'location_address', 'submitter_email',
  ]
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 })
    }
  }

  const supabase = createServiceClient()

  const { error } = await supabase.from('events').insert({
    title: body.title,
    description: body.description,
    start_at: body.start_at,
    end_at: body.end_at ?? null,
    location_name: body.location_name,
    location_address: body.location_address,
    external_url: body.external_url ?? null,
    is_free: body.is_free,
    price_min: body.price_min ?? null,
    price_max: body.price_max ?? null,
    category: body.category,
    tags: body.tags ?? [],
    organiser_name: body.organiser_name ?? null,
    organiser_id: null,
    source: 'user_submission',
    source_id: null,
    coordinates: null,
    image_url: null,
    status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
