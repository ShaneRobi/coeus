import Link from 'next/link'
import type { Event, EventCategory } from '@/lib/types'
import { format } from 'date-fns'

interface Props {
  event: Event
}

const CATEGORY_STYLES: Record<string, { stroke: string; bg: string; label: string }> = {
  sports: { stroke: '#3b6d11', bg: '#E3EAD9', label: 'Sports' },
  hackathon: { stroke: '#3c3489', bg: '#E4E2F1', label: 'Hackathon' },
  workshop: { stroke: '#0c447c', bg: '#DCE8F1', label: 'Workshop' },
  career: { stroke: '#27500a', bg: '#E0E8D7', label: 'Career' },
  social: { stroke: '#712b13', bg: '#EEE1DA', label: 'Social' },
  arts: { stroke: '#72243e', bg: '#EFDFE5', label: 'Arts' },
  music: { stroke: '#72243e', bg: '#EFDFE5', label: 'Arts' },
  open_house: { stroke: '#854f0b', bg: '#F0E5D3', label: 'Open House' },
  other: { stroke: '#444441', bg: '#E2E0D9', label: 'Other' },
}

function getCategoryStyle(category: EventCategory) {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.other
}

function getCategoryIcon(category: EventCategory) {
  const { stroke } = getCategoryStyle(category)
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (category === 'sports') {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
  }
  if (category === 'hackathon') {
    return <svg {...common}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
  }
  if (category === 'career') {
    return <svg {...common}><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M9 7V5h6v2M3 12h18" /></svg>
  }
  if (category === 'workshop') {
    return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
  }
  if (category === 'social') {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8.5 10h.01M15.5 10h.01M8.5 14.5c1.8 1.6 5.2 1.6 7 0" /></svg>
  }
  if (category === 'arts' || category === 'music') {
    return <svg {...common}><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></svg>
  }
  if (category === 'open_house') {
    return <svg {...common}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></svg>
  }
  return <svg {...common}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
}

export default function EventCard({ event }: Props) {
  const start = new Date(event.start_at)
  const style = getCategoryStyle(event.category)

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex gap-3 rounded-xl border-[0.5px] border-border bg-bg-card p-3 transition-colors hover:border-hover"
    >
      <div
        className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-xl"
        style={{ backgroundColor: style.bg }}
      >
        {getCategoryIcon(event.category)}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="mb-1 truncate text-sm font-semibold text-text-primary">
          {event.title}
        </h3>

        <p className="mb-2 truncate text-xs text-text-secondary">
          {format(start, 'EEE d MMM, HH:mm')} · {event.location_name}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span
            className="rounded-full border-[0.5px] px-2 py-0.5 text-[10px] font-medium"
            style={{ borderColor: style.stroke, color: style.stroke, backgroundColor: style.bg }}
          >
            {style.label}
          </span>
          {event.is_free && (
            <span className="rounded-full border-[0.5px] border-border bg-bg-base px-2 py-0.5 text-[10px] font-medium text-text-secondary">
              Free
            </span>
          )}
          {!event.is_free && event.price_min != null && (
            <span className="rounded-full border-[0.5px] border-border bg-bg-base px-2 py-0.5 text-[10px] font-medium text-text-secondary">
              SGD {event.price_min}{event.price_max && event.price_max !== event.price_min ? `-${event.price_max}` : ''}
            </span>
          )}
        </div>

        {event.source && event.source !== 'submitted' && (
          <p className="mt-1 text-[10px] text-text-muted">via {event.source}</p>
        )}
      </div>
    </Link>
  )
}
