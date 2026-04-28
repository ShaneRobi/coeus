'use client'

import { useState, useEffect } from 'react'
import type { Event } from '@/lib/types'

export default function AdminQueue() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPending()
  }, [])

  async function fetchPending() {
    const res = await fetch('/api/events?status=pending&limit=50')
    if (res.ok) {
      const data = await res.json()
      setEvents(data)
    }
    setLoading(false)
  }

  async function decide(id: string, status: 'approved' | 'rejected') {
    await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  if (loading) {
    return <div className="text-text-secondary text-sm py-8 text-center">Loading...</div>
  }

  if (!events.length) {
    return <div className="text-text-secondary text-sm py-8 text-center">Queue is empty.</div>
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="rounded-xl border-[0.5px] border-border bg-bg-card p-4 space-y-3">
          <div className="space-y-1">
            <h3 className="text-text-primary text-sm font-medium">{event.title}</h3>
            <p className="text-text-secondary text-xs">{event.location_name} · {new Date(event.start_at).toLocaleDateString('en-SG')}</p>
            <p className="text-text-secondary text-xs line-clamp-2">{event.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => decide(event.id, 'approved')}
              className="flex-1 py-1.5 rounded-lg bg-bg-base border-[0.5px] border-border text-text-secondary hover:border-hover hover:text-text-primary text-xs transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => decide(event.id, 'rejected')}
              className="flex-1 py-1.5 rounded-lg bg-bg-base border-[0.5px] border-border text-text-secondary hover:border-[#a32d2d] hover:text-[#8F2424] text-xs transition-colors"
            >
              Reject
            </button>
            <a
              href={`/events/${event.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-bg-base border-[0.5px] border-border text-text-secondary hover:text-text-primary text-xs transition-colors"
            >
              View
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
