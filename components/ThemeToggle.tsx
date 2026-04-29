'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'coeus-theme'

function applyTheme(light: boolean) {
  document.documentElement.classList.toggle('theme-light', light)
}

export default function ThemeToggle() {
  const [light, setLight] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const isLight = saved === 'light'
    setLight(isLight)
    applyTheme(isLight)
  }, [])

  function toggle() {
    const next = !light
    setLight(next)
    localStorage.setItem(STORAGE_KEY, next ? 'light' : 'dark')
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Dark mode' : 'Light mode'}
      className="flex h-8 w-8 items-center justify-center rounded-full border-[0.5px] border-border bg-bg-card text-text-secondary transition-colors hover:border-hover hover:text-text-primary"
    >
      {light ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8.2 8.2 0 1 0 10.5 10.5z" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  )
}
