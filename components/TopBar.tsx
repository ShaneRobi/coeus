'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ThemeToggle from './ThemeToggle'

function initialsFromEmail(email?: string | null) {
  if (!email) return 'U'
  return email.slice(0, 2).toUpperCase()
}

export default function TopBar() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-bg-base border-b-[0.5px] border-border">
      <div className="mx-auto flex h-[53px] max-w-4xl items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-text-primary">
          coeus<span className="font-normal text-text-muted">.sg</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!loading && email ? (
            <Link
              href="/profile/me"
              aria-label="Open profile"
              className="flex h-8 w-8 items-center justify-center rounded-full border-[0.5px] border-border bg-bg-card text-[11px] font-semibold text-text-primary"
            >
              {initialsFromEmail(email)}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border-[0.5px] border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-hover hover:text-text-primary"
              >
                Sign in
              </Link>
              <Link
                href="/login?tab=create"
                className="rounded-full border-[0.5px] border-accent bg-accent px-3 py-1.5 text-xs font-medium text-bg-base transition-opacity hover:opacity-85"
              >
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
