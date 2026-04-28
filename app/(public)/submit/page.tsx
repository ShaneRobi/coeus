'use client'

import { useEffect, useState } from 'react'
import type { EventCategory, SubmitPayload } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'

const CATEGORIES: EventCategory[] = [
  'tech', 'arts', 'sports', 'music', 'food', 'business', 'education', 'community', 'social', 'hackathon', 'career', 'workshop', 'open_house', 'other',
]

export default function SubmitPage() {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [form, setForm] = useState<Partial<SubmitPayload>>({
    is_free: true,
    category: 'other',
    tags: [],
  })

  const set = (k: keyof SubmitPayload, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user))
      setAuthChecked(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-text-primary font-semibold">Submitted for review</p>
          <p className="text-text-secondary text-sm">We will review your event and publish it shortly.</p>
          <a href="/" className="text-accent text-sm hover:underline">Back to feed</a>
        </div>
      </div>
    )
  }

  if (!authChecked) {
    return (
      <div className="min-h-[calc(100vh-53px)] bg-bg-base flex items-center justify-center">
        <span className="text-text-secondary text-sm">Loading...</span>
      </div>
    )
  }

  if (!signedIn) {
    return (
      <div className="flex min-h-[calc(100vh-53px)] flex-col bg-bg-base">
        <main className="flex flex-1 items-center justify-center px-6 pb-20">
          <section className="flex max-w-sm flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-card">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a4a46" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
            <h1 className="mb-2 text-base font-semibold text-text-primary">Sign in to submit an event</h1>
            <p className="mb-5 text-sm leading-6 text-text-secondary">
              Create an account or sign in so moderators can review your event submission.
            </p>
            <a href="/login" className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg-base">
              Sign in or create account
            </a>
          </section>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24">
        <h1 className="pt-6 text-base font-semibold text-text-primary">Submit event</h1>
        <form onSubmit={handleSubmit} className="space-y-5 py-6">
          <Field label="Event title" required>
            <input
              required
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
              className="input"
              placeholder="Hackathon @ NUS"
            />
          </Field>

          <Field label="Description" required>
            <textarea
              required
              rows={4}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              className="input resize-none"
              placeholder="What is this event about?"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start" required>
              <input
                required
                type="datetime-local"
                value={form.start_at ?? ''}
                onChange={(e) => set('start_at', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="End">
              <input
                type="datetime-local"
                value={form.end_at ?? ''}
                onChange={(e) => set('end_at', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Venue name" required>
            <input
              required
              value={form.location_name ?? ''}
              onChange={(e) => set('location_name', e.target.value)}
              className="input"
              placeholder="One-North MRT"
            />
          </Field>

          <Field label="Address" required>
            <input
              required
              value={form.location_address ?? ''}
              onChange={(e) => set('location_address', e.target.value)}
              className="input"
              placeholder="1 Fusionopolis Way, Singapore 138632"
            />
          </Field>

          <Field label="External link">
            <input
              type="url"
              value={form.external_url ?? ''}
              onChange={(e) => set('external_url', e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </Field>

          <Field label="Category" required>
            <select
              required
              value={form.category}
              onChange={(e) => set('category', e.target.value as EventCategory)}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Tags (comma separated)">
            <input
              value={(form.tags ?? []).join(', ')}
              onChange={(e) =>
                set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))
              }
              className="input"
              placeholder="workshop, ai, free food"
            />
          </Field>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_free"
              checked={form.is_free ?? true}
              onChange={(e) => set('is_free', e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <label htmlFor="is_free" className="text-text-secondary text-sm">Free event</label>
          </div>

          {!form.is_free && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price from (SGD)">
                <input
                  type="number"
                  min={0}
                  value={form.price_min ?? ''}
                  onChange={(e) => set('price_min', Number(e.target.value))}
                  className="input"
                  placeholder="0"
                />
              </Field>
              <Field label="Price to (SGD)">
                <input
                  type="number"
                  min={0}
                  value={form.price_max ?? ''}
                  onChange={(e) => set('price_max', Number(e.target.value))}
                  className="input"
                  placeholder="50"
                />
              </Field>
            </div>
          )}

          <Field label="Organiser name">
            <input
              value={form.organiser_name ?? ''}
              onChange={(e) => set('organiser_name', e.target.value)}
              className="input"
              placeholder="Tech Community SG"
            />
          </Field>

          <Field label="Your email" required>
            <input
              required
              type="email"
              value={form.submitter_email ?? ''}
              onChange={(e) => set('submitter_email', e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-accent text-bg-base font-medium text-sm disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Submitting...' : 'Submit for review'}
          </button>
        </form>
      </main>
      <BottomNav />

    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-text-secondary text-xs uppercase tracking-wider">
        {label}{required && <span className="text-accent ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
