'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EventCategory } from '@/lib/types'

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'tech', label: 'Tech' },
  { value: 'arts', label: 'Arts' },
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'food', label: 'Food' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'community', label: 'Community' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<EventCategory[]>([])
  const [step, setStep] = useState<1 | 2>(1)
  const [displayName, setDisplayName] = useState('')

  function toggleCategory(cat: EventCategory) {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  async function finish() {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        {step === 1 && (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-text-primary">Welcome to coeus</h1>
              <p className="text-text-secondary text-sm">What should we call you?</p>
            </div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary text-sm outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={() => setStep(2)}
              disabled={!displayName.trim()}
              className="w-full py-3 rounded-lg bg-accent text-bg-base font-medium text-sm disabled:opacity-40"
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-text-primary">What interests you?</h1>
              <p className="text-text-secondary text-sm">Pick as many as you like.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(({ value, label }) => {
                const active = selected.includes(value)
                return (
                  <button
                    key={value}
                    onClick={() => toggleCategory(value)}
                    className={`py-3 rounded-lg border text-sm font-medium transition-colors ${
                      active
                        ? 'bg-accent border-accent text-bg-base'
                        : 'bg-bg-card border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={finish}
              className="w-full py-3 rounded-lg bg-accent text-bg-base font-medium text-sm"
            >
              Finish
            </button>
          </>
        )}
      </div>
    </div>
  )
}
