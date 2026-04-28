import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/lib/types'
import RsvpButtons from '@/components/RsvpButtons'

interface Props {
  params: { id: string }
}

async function getEvent(id: string): Promise<Event | null> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  return data as Event | null
}

export default async function EventPage({ params }: Props) {
  const event = await getEvent(params.id)
  if (!event) notFound()

  const start = new Date(event.start_at)

  return (
    <div className="min-h-[calc(100vh-53px)] bg-bg-base">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary text-sm mb-6 hover:text-text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </a>

        {event.image_url && (
          <div className="rounded-xl overflow-hidden mb-6 bg-bg-card aspect-video border-[0.5px] border-border">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-bg-card text-text-secondary border-[0.5px] border-border">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-semibold text-text-primary">{event.title}</h1>

          <div className="flex flex-col gap-2 text-text-secondary text-sm">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="2" width="12" height="11" rx="1.5" />
                <path d="M1 6h12M5 1v2M9 1v2" />
              </svg>
              <span>
                {start.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' '}
                {start.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 1C4.8 1 3 2.8 3 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.2-1.8-4-4-4z" />
                <circle cx="7" cy="5" r="1.5" />
              </svg>
              <span>{event.location_name}</span>
            </div>
            {!event.is_free && event.price_min != null && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="7" r="6" />
                  <path d="M7 4v6M5 5.5h2.5a1.5 1.5 0 0 1 0 3H5" />
                </svg>
                <span>
                  {event.price_min === event.price_max
                    ? `SGD ${event.price_min}`
                    : `SGD ${event.price_min} - ${event.price_max}`}
                </span>
              </div>
            )}
            {event.is_free && (
              <span className="text-accent text-xs font-medium">Free</span>
            )}
          </div>

          <p className="text-text-secondary text-sm leading-relaxed">{event.description}</p>

          <RsvpButtons eventId={event.id} />

          {event.external_url && (
            <a
              href={event.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors border-[0.5px] border-border rounded-lg px-4 py-2"
            >
              View original
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2H2v8h8V7M7 2h3v3M10 2L5 7" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
