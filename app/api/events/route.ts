import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { FilterState } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const supabase = createServiceClient()

  let query = supabase
    .from('events')
    .select('*')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })

  const status = searchParams.get('status') ?? 'published'
  query = query.eq('status', status)

  const categories = searchParams.get('categories')
  if (categories) {
    query = query.in('category', categories.split(','))
  }

  const isFree = searchParams.get('is_free')
  if (isFree === 'true') query = query.eq('is_free', true)
  if (isFree === 'false') query = query.eq('is_free', false)

  const dateRange = searchParams.get('date_range') as FilterState['dateRange'] | null
  if (dateRange && dateRange !== 'all') {
    const now = new Date()
    const end = new Date()
    if (dateRange === 'today') end.setHours(23, 59, 59, 999)
    if (dateRange === 'week') end.setDate(now.getDate() + 7)
    if (dateRange === 'month') end.setMonth(now.getMonth() + 1)
    query = query.gte('start_at', now.toISOString()).lte('start_at', end.toISOString())
  }

  const search = searchParams.get('search')
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
