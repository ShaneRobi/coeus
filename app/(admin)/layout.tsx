'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { canAccessAdmin } from '@/lib/roles'
import type { UserRole } from '@/lib/types'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function verify() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!canAccessAdmin(profile?.role as UserRole)) {
        window.location.href = '/'
        return
      }

      setReady(true)
    }
    verify()
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <span className="text-text-secondary text-sm">Checking access…</span>
      </div>
    )
  }

  return <>{children}</>
}
