'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const SCHOOLS = {
  University: [
    'National University of Singapore',
    'Nanyang Technological University',
    'Singapore Management University',
    'Singapore University of Technology and Design',
    'Singapore Institute of Technology',
    'Singapore University of Social Sciences',
  ],
  'Private University': [
    'SIM Global Education',
    'PSB Academy',
    'Kaplan Singapore',
    'MDIS',
    'James Cook University Singapore',
    'Curtin Singapore',
    'LASALLE College of the Arts',
    'NAFA',
  ],
  Polytechnic: [
    'Singapore Polytechnic',
    'Ngee Ann Polytechnic',
    'Temasek Polytechnic',
    'Nanyang Polytechnic',
    'Republic Polytechnic',
  ],
  'Junior College': [
    'Anderson Serangoon Junior College',
    'Anglo-Chinese Junior College',
    'Catholic Junior College',
    'Dunman High School',
    'Eunoia Junior College',
    'Hwa Chong Institution',
    'Jurong Pioneer Junior College',
    'Nanyang Junior College',
    'National Junior College',
    'Raffles Institution',
    'River Valley High School',
    'St. Andrews Junior College',
    'Tampines Meridian Junior College',
    'Temasek Junior College',
    'Victoria Junior College',
    'Yishun Innova Junior College',
  ],
  ITE: [
    'ITE College Central',
    'ITE College East',
    'ITE College West',
  ],
}

type Tab = 'signin' | 'create'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-53px)] bg-bg-base" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'create' ? 'create' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [school, setSchool] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (!email.includes('@')) {
      setLoading(false)
      setError('Please sign in with your email address, not a username.')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials'
        ? 'Invalid email or password. Use the email address you created the account with.'
        : signInError.message)
      return
    }

    window.location.href = '/'
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: email.split('@')[0],
        bio: school ? school : null,
        interests: [],
        is_admin: false,
      })
    }

    setLoading(false)
    setMessage('Check your email to confirm your account')
  }

  async function forgotPassword() {
    setError('')
    setMessage('')
    if (!email) {
      setError('Enter your email first.')
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (resetError) setError(resetError.message)
    else setMessage('Check your email for a reset link')
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  return (
    <main className="flex min-h-[calc(100vh-53px)] items-center justify-center bg-bg-base px-4 py-8">
      <section className="w-full max-w-md rounded-xl border-[0.5px] border-border bg-bg-card p-5">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-text-primary">coeus<span className="font-normal text-text-muted">.sg</span></h1>
          <p className="mt-1 text-xs text-text-muted">Sign in to save, RSVP, and submit events.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl border-[0.5px] border-border bg-bg-input p-1">
          <button
            type="button"
            onClick={() => setTab('signin')}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${tab === 'signin' ? 'bg-bg-base text-text-primary' : 'text-text-secondary'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${tab === 'create' ? 'bg-bg-base text-text-primary' : 'text-text-secondary'}`}
          >
            Create account
          </button>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border-[0.5px] border-border bg-bg-input px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-hover hover:text-text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5L15.4 17c-.9.6-2 .9-3.4.9a5.9 5.9 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22z" />
            <path fill="#FBBC05" d="M6.5 13.9a6 6 0 0 1 0-3.8V7.5H3.2a10 10 0 0 0 0 9l3.3-2.6z" />
            <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.5 9.5 0 0 0 12 2a10 10 0 0 0-8.8 5.5l3.3 2.6A5.9 5.9 0 0 1 12 6.1z" />
          </svg>
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-wider text-text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {tab === 'signin' ? (
          <form onSubmit={signIn} className="space-y-3">
            <Field label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Your password" />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-text-muted">Use your email address, not a username.</p>
              <button type="button" onClick={forgotPassword} className="flex-none text-xs text-text-secondary underline-offset-4 hover:text-text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg-base transition-opacity disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={createAccount} className="space-y-3">
            <Field label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="At least 8 characters" />
            </Field>
            <Field label="Confirm password">
              <input required minLength={8} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" placeholder="Repeat password" />
            </Field>
            <Field label="School optional">
              <select value={school} onChange={(e) => setSchool(e.target.value)} className="input">
                <option value="">Select school</option>
                {Object.entries(SCHOOLS).map(([group, schools]) => (
                  <optgroup key={group} label={group}>
                    {schools.map((name) => <option key={name} value={name}>{name}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg-base transition-opacity disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        {message && <p className="mt-4 rounded-lg border-[0.5px] border-[#3b6d11] bg-[#E3EAD9] px-3 py-2 text-xs text-[#3b6d11]">{message}</p>}
        {error && <p className="mt-4 rounded-lg border-[0.5px] border-[#a32d2d] bg-[#F1DEDD] px-3 py-2 text-xs text-[#8F2424]">{error}</p>}
      </section>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] uppercase tracking-wider text-text-secondary">{label}</span>
      {children}
    </label>
  )
}
