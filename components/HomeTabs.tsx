'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Discover' },
  { href: '/following', label: 'Following' },
  { href: '/map', label: 'Map' },
  { href: '/saved', label: 'Saved' },
  { href: '/history', label: 'Event History' },
]

export default function HomeTabs() {
  const pathname = usePathname()

  return (
    <nav className="border-b-[0.5px] border-border">
      <div className="mx-auto flex max-w-2xl overflow-x-auto px-4 scrollbar-none">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-none border-b-2 px-3 py-2.5 text-xs transition-colors ${
                active
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
