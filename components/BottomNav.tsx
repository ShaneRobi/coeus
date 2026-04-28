'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const NAV = [
  {
    href: '/',
    label: 'Feed',
    authOnly: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    href: '/map',
    label: 'Map',
    authOnly: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    href: '/submit',
    label: 'Submit',
    authOnly: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: '/profile/me',
    label: 'Profile',
    authOnly: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(Boolean(data.user))
      setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user))
      setReady(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const items = NAV.filter((item) => !item.authOnly || loggedIn)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t-[0.5px] border-border bg-bg-base sm:hidden">
      {items.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
              active ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
            } ${ready ? '' : 'pointer-events-none opacity-70'}`}
          >
            {icon}
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
