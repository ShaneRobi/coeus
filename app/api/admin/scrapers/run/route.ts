import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scraper_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  let body: { source: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.source) {
    return NextResponse.json({ error: 'Missing source' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: run, error: insertError } = await supabase
    .from('scraper_runs')
    .insert({
      source: body.source,
      started_at: new Date().toISOString(),
      finished_at: null,
      events_found: 0,
      events_added: 0,
      error: null,
      status: 'running',
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Fire and forget: run the scraper asynchronously
  runScraperAsync(body.source, run.id).catch(console.error)

  return NextResponse.json({ id: run.id }, { status: 202 })
}

async function runScraperAsync(source: string, runId: string) {
  const supabase = createServiceClient()
  try {
    const { runScraper } = await import('@/scraper/index')
    const result = await runScraper(source)

    await supabase
      .from('scraper_runs')
      .update({
        finished_at: new Date().toISOString(),
        events_found: result.found,
        events_added: result.added,
        status: 'success',
      })
      .eq('id', runId)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from('scraper_runs')
      .update({
        finished_at: new Date().toISOString(),
        error: message,
        status: 'error',
      })
      .eq('id', runId)
  }
}
