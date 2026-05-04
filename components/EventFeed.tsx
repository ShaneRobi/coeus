'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Event } from '@/lib/types'
import EventCard from './EventCard'
import { useFilterStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/roles'
import type { UserRole } from '@/lib/types'

export default function EventFeed() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const filter = useFilterStore()

  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (isAdmin(profile?.role as UserRole)) {
        setAdminToken(session.access_token)
      }
    }
    checkAdmin()
  }, [])

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.categories.length) params.set('categories', filter.categories.join(','))
    if (filter.isFree !== null) params.set('is_free', String(filter.isFree))
    if (filter.dateRange !== 'all') params.set('date_range', filter.dateRange)
    if (filter.search) params.set('search', filter.search)
    const currentOffset = reset ? 0 : offset
    params.set('offset', String(currentOffset))
    params.set('limit', '20')

    try {
      const res = await fetch(`/api/events?${params}`, { cache: 'no-store' })
      const data: Event[] = (await res.json()) ?? []
      setEvents((prev) => reset ? data : [...prev, ...data])
      setHasMore(data.length === 20)
      if (reset) setOffset(20)
      else setOffset((o) => o + 20)
    } finally {
      setLoading(false)
    }
  }, [filter, offset])

  useEffect(() => {
    load(true)
  }, [filter.categories, filter.isFree, filter.dateRange, filter.search])

  useEffect(() => {
    const timer = window.setInterval(() => load(true), 60000)
    return () => window.clearInterval(timer)
  }, [load])

  if (loading && events.length === 0) {
    return (
      <div className="py-12 text-center text-text-secondary text-sm">Loading...</div>
    )
  }

  if (!loading && events.length === 0) {
    return (
      <div className="py-12 text-center text-text-secondary text-sm">No events found.</div>
    )
  }

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-3 mt-4">
      {(events ?? []).map((event) => (
        <EventCard
          key={event.id}
          event={event}
          adminToken={adminToken ?? undefined}
          onRemove={adminToken ? () => removeEvent(event.id) : undefined}
        />
      ))}
      {hasMore && (
        <button
          onClick={() => load(false)}
          disabled={loading}
          className="w-full py-3 text-text-secondary text-sm hover:text-text-primary transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}
