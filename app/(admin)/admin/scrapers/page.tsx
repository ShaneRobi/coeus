'use client'

import { useState, useEffect } from 'react'
import type { ScraperRun } from '@/lib/types'

const SOURCES = [
  'all',
  'eventbrite', 'luma', 'eventfinda', 'sportsg', 'facebook',
  'government', 'nus', 'ntu', 'smu', 'sp', 'np', 'tp', 'rp', 'nyp', 'ite', 'sutd', 'sit', 'suss', 'sim', 'psb',
]

// vercel.json cron: "0 15 * * *" UTC = 11:00 PM SGT
const CRON_SCHEDULE_UTC = '0 15 * * *'
const CRON_LABEL = 'Daily at 11:00 PM SGT (3:00 AM UTC)'

function nextCronRun(): Date {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(15, 0, 0, 0)
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  return next
}

export default function AdminScrapersPage() {
  const [runs, setRuns] = useState<ScraperRun[]>([])
  const [running, setRunning] = useState<string | null>(null)
  const [nextRun, setNextRun] = useState<Date | null>(null)

  useEffect(() => {
    fetchRuns()
    setNextRun(nextCronRun())
  }, [])

  async function fetchRuns() {
    const res = await fetch('/api/admin/scrapers/run')
    if (res.ok) setRuns(await res.json())
  }

  async function runScraper(source: string) {
    setRunning(source)
    try {
      await fetch('/api/admin/scrapers/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      await fetchRuns()
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-53px)] bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Scrapers</h1>
          <nav className="flex gap-4 text-sm text-text-secondary">
            <a href="/admin" className="hover:text-text-primary transition-colors">Queue</a>
            <a href="/admin/users" className="hover:text-text-primary transition-colors">Users</a>
            <a href="/admin/scrapers" className="text-text-primary">Scrapers</a>
          </nav>
        </div>

        {/* Automated schedule banner */}
        <div className="mb-4 rounded-xl border-[0.5px] border-border bg-bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Automated daily scrape</p>
              <p className="text-xs text-text-secondary mt-0.5">{CRON_LABEL}</p>
            </div>
            {nextRun && (
              <div className="text-right">
                <p className="text-xs text-text-secondary">Next run</p>
                <p className="text-sm text-text-primary">
                  {nextRun.toLocaleString('en-SG', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' })}
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Cron: <code className="text-text-primary">{CRON_SCHEDULE_UTC}</code> UTC via Vercel &mdash; runs all nightly sources automatically.
          </p>
        </div>

        <div className="mb-5 rounded-xl border-[0.5px] border-border bg-bg-card p-4 text-sm text-text-secondary">
          Luma requires <code className="text-text-primary">LUMA_API_KEY</code>. Eventfinda requires{' '}
          <code className="text-text-primary">EVENTFINDA_USERNAME</code> and{' '}
          <code className="text-text-primary">EVENTFINDA_PASSWORD</code>. Add real credentials to{' '}
          <code className="text-text-primary">.env.local</code>, restart the dev server, then run the source here.
        </div>

        <h2 className="text-text-secondary text-sm mb-3">Manual run</h2>
        <div className="grid grid-cols-3 gap-3 mb-10">
          {SOURCES.map((source) => (
            <button
              key={source}
              onClick={() => runScraper(source)}
              disabled={running === source}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-card border-[0.5px] border-border text-sm text-text-secondary hover:text-text-primary hover:border-hover transition-colors disabled:opacity-50"
            >
              <span>{source}</span>
              {running === source && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <h2 className="text-text-secondary text-sm mb-3">Recent runs</h2>
        <div className="rounded-xl border-[0.5px] border-border overflow-hidden bg-bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-secondary font-normal">Source</th>
                <th className="text-left px-4 py-3 text-text-secondary font-normal">Status</th>
                <th className="text-left px-4 py-3 text-text-secondary font-normal">Found</th>
                <th className="text-left px-4 py-3 text-text-secondary font-normal">Added</th>
                <th className="text-left px-4 py-3 text-text-secondary font-normal">Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-primary">{run.source}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${run.status === 'success' ? 'text-green-400' : run.status === 'error' ? 'text-red-400' : 'text-text-secondary'}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{run.events_found}</td>
                  <td className="px-4 py-3 text-text-secondary">{run.events_added}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(run.started_at).toLocaleString('en-SG')}
                  </td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
