'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const TABS = [
  {
    href: '/',
    label: 'Feed',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="7" height="7" rx="1" />
        <rect x="11" y="2" width="7" height="7" rx="1" />
        <rect x="2" y="11" width="7" height="7" rx="1" />
        <rect x="11" y="11" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/map',
    label: 'Map',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1,4 7,1 13,4 19,1 19,16 13,19 7,16 1,19" />
        <line x1="7" y1="1" x2="7" y2="16" />
        <line x1="13" y1="4" x2="13" y2="19" />
      </svg>
    ),
  },
  {
    href: '/submit',
    label: 'Submit',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="8" />
        <line x1="10" y1="6" x2="10" y2="14" />
        <line x1="6" y1="10" x2="14" y2="10" />
      </svg>
    ),
  },
  {
    href: '/profile/me',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="7" r="4" />
        <path d="M2 19c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
]

export default function TabBar() {
  const pathname = usePathname()

  return (
    <div className="flex border-t border-border bg-bg-base">
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
              active ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {icon}
            {label}
          </Link>
        )
      })}
    </div>
  )
}
