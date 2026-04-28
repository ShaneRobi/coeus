'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { RsvpStatus } from '@/lib/types'

interface Props {
  eventId: string
}

export default function RsvpButtons({ eventId }: Props) {
  const [status, setStatus] = useState<RsvpStatus>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('rsvps')
        .select('status')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single()
      if (data) setStatus((data as { status: string }).status as RsvpStatus)
    }
    init()
  }, [eventId])

  async function rsvp(newStatus: NonNullable<RsvpStatus>) {
    if (!userId) {
      window.location.href = '/login'
      return
    }
    setLoading(true)
    try {
      if (status === newStatus) {
        await supabase.from('rsvps').delete().eq('user_id', userId).eq('event_id', eventId)
        setStatus(null)
      } else {
        await supabase.from('rsvps').upsert({
          user_id: userId,
          event_id: eventId,
          status: newStatus,
        })
        setStatus(newStatus)
      }
    } finally {
      setLoading(false)
    }
  }

  const btn = (value: NonNullable<RsvpStatus>, label: string) => (
    <button
      key={value}
      onClick={() => rsvp(value)}
      disabled={loading}
      className={`flex-1 py-2 rounded-lg text-sm border-[0.5px] transition-colors disabled:opacity-50 ${
        status === value
          ? 'bg-accent border-accent text-bg-base font-medium'
          : 'bg-bg-card border-border text-text-secondary hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex gap-2 pt-2">
      {btn('going', 'Going')}
      {btn('interested', 'Interested')}
    </div>
  )
}
