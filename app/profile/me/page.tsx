'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'
import { isAdmin, getRoleLabel } from '@/lib/roles'
import BottomNav from '@/components/BottomNav'

export default function MyProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data as unknown as UserProfile)
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-53px)] bg-bg-base flex items-center justify-center">
        <span className="text-text-secondary text-sm">Loading...</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-53px)] bg-bg-base flex flex-col">
        <main className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-text-secondary text-sm">You are not signed in.</p>
          <a href="/login" className="text-accent text-sm hover:underline">Sign in</a>
        </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-53px)] bg-bg-base pb-20">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">My profile</h1>
          <button onClick={signOut} className="text-text-secondary text-sm hover:text-text-primary transition-colors">
            Sign out
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-bg-card border-[0.5px] border-border flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#888780" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="8" r="4" />
                <path d="M3 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-text-primary font-semibold">{profile.display_name}</p>
            {profile.bio && <p className="text-text-secondary text-sm">{profile.bio}</p>}
            <p className="text-text-secondary text-xs mt-0.5">{getRoleLabel(profile.role)}</p>
          </div>
        </div>

        <div className="rounded-xl border-[0.5px] border-border bg-bg-card divide-y divide-border">
          <a href="/history" className="flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <span>Event history</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3l4 4-4 4" />
            </svg>
          </a>
          <a href="/submit" className="flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <span>Submit an event</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3l4 4-4 4" />
            </svg>
          </a>
          {isAdmin(profile.role) && (
            <a href="/admin" className="flex items-center justify-between px-4 py-3 text-sm text-accent hover:opacity-80 transition-opacity">
              <span>Admin panel</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 3l4 4-4 4" />
              </svg>
            </a>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
