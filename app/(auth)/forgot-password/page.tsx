'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    setLoading(false)
    if (resetError) setError(resetError.message)
    else setMessage('Check your email for a reset link')
  }

  return (
    <main className="flex min-h-[calc(100vh-53px)] items-center justify-center bg-bg-base px-4 py-8">
      <section className="w-full max-w-sm rounded-xl border-[0.5px] border-border bg-bg-card p-5">
        <h1 className="text-lg font-semibold text-text-primary">Reset password</h1>
        <p className="mt-1 text-xs text-text-muted">Enter your email and we will send a reset link.</p>

        <form onSubmit={sendReset} className="mt-5 space-y-3">
          <label className="block space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-text-secondary">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border-[0.5px] border-border bg-bg-input px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-hover"
            />
          </label>
          <button disabled={loading} className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg-base transition-opacity disabled:opacity-50">
            {loading ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>

        {message && <p className="mt-4 rounded-lg border-[0.5px] border-[#3b6d11] bg-[#E3EAD9] px-3 py-2 text-xs text-[#3b6d11]">{message}</p>}
        {error && <p className="mt-4 rounded-lg border-[0.5px] border-[#a32d2d] bg-[#F1DEDD] px-3 py-2 text-xs text-[#8F2424]">{error}</p>}
      </section>
    </main>
  )
}
