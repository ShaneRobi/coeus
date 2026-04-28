'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'coeus-theme'

function applyTheme(enabled: boolean) {
  document.documentElement.classList.toggle('theme-dark', enabled)
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const enabled = saved === 'dark'
    setDark(enabled)
    applyTheme(enabled)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="flex h-8 w-8 items-center justify-center rounded-full border-[0.5px] border-border bg-bg-card text-text-secondary transition-colors hover:border-hover hover:text-text-primary"
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8.2 8.2 0 1 0 10.5 10.5z" />
        </svg>
      )}
    </button>
  )
}
