# Coeus — Build Context & History

This document is written for a coding agent picking up this project cold. It covers what the app is, what the tech stack looks like, every meaningful change made during the initial build session, what is working, what is not, and what still needs to be done.

---

## What the app is

**Coeus** (`coeus.sg`) is a Singapore student event discovery platform. It aggregates events from university websites, Eventbrite, Luma, Eventfinda, and other sources into a single feed. Users can browse events, filter by category, RSVP, save events, and submit their own. The app is targeted at students across Singapore's universities, polytechnics, JCs, and ITEs.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.5 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4 with CSS custom properties |
| Database & Auth | Supabase (Postgres + Supabase Auth) |
| Maps | Leaflet + react-leaflet with CartoCDN tiles |
| State management | Zustand (filter state only) |
| Scrapers | Custom TypeScript scrapers, many using Playwright |
| Push notifications | Firebase (wired up but not actively used) |
| Deployment | Vercel |

---

## Project structure

```
app/
  (auth)/
    login/page.tsx          — email/password + Google OAuth tabs
    forgot-password/page.tsx
  (public)/
    page.tsx                — home feed
    events/[id]/page.tsx    — event detail
    map/page.tsx
    submit/page.tsx         — auth-gated event submission
    history/page.tsx
    following/page.tsx      — placeholder (no data yet)
    saved/page.tsx          — placeholder (no data yet)
    onboarding/page.tsx
  (admin)/
    admin/page.tsx
    admin/scrapers/page.tsx
    admin/users/page.tsx
  api/
    events/route.ts         — GET events with filters
    submit/route.ts         — POST user-submitted event
    cron/scrape/route.ts    — nightly scraper trigger
    admin/scrapers/run/route.ts
  globals.css
  layout.tsx

components/
  TopBar.tsx                — fixed header, logo, auth buttons, theme toggle
  BottomNav.tsx             — mobile bottom nav, auth-aware
  HomeTabs.tsx              — Discover / Following / Map / Saved / Event History
  FilterChips.tsx           — Sports (pinned) + scrollable category chips
  EventCard.tsx             — card with inline SVG category icons
  EventFeed.tsx             — paginated feed with filter integration
  MapView.tsx               — Leaflet map with dark/light tile switching
  ThemeToggle.tsx           — sun/moon toggle, persists to localStorage
  RsvpButtons.tsx
  AdminQueue.tsx

lib/
  supabase.ts               — client + service role client
  firebase.ts               — push notifications (not fully wired)
  store.ts                  — Zustand filter store
  types.ts                  — shared TypeScript types
  database.types.ts         — generated Supabase types

scraper/
  index.ts                  — orchestrates all scrapers
  lib/base.ts, geocode.ts, tag.ts
  sources/                  — one file per source (see Scrapers section)
```

---

## Colour system

The app uses CSS custom properties mapped to Tailwind via `tailwind.config.ts`. **Dark mode is the default.** Light mode is opt-in via a toggle.

### Dark (default — `:root`)
| Variable | Value |
|---|---|
| `--bg-base` | `#111110` |
| `--bg-card` | `#1a1a18` |
| `--bg-input` | `#232321` |
| `--text-primary` | `#e8e6e1` |
| `--text-secondary` | `#a8a69f` |
| `--text-muted` | `#6b6965` |
| `--border` | `#2a2a28` |
| `--border-hover` | `#3d3d3a` |
| `--accent` | `#e8e6e1` |

### Light (`:root.theme-light`)
| Variable | Value |
|---|---|
| `--bg-base` | `#F5F4F0` |
| `--bg-card` | `#ECEAE4` |
| `--bg-input` | `#E5E3DC` |
| `--text-primary` | `#1a1a18` |
| `--text-secondary` | `#4a4a46` |
| `--text-muted` | `#888780` |
| `--border` | `#D4D2CA` |
| `--border-hover` | `#B4B2A9` |
| `--accent` | `#1a1a18` |

### How the toggle works
- `ThemeToggle.tsx` adds/removes `theme-light` class on `<html>`
- `layout.tsx` has an inline `<script>` before the body that reads `localStorage` and applies `theme-light` on load (prevents flash)
- Default is dark — the script only acts if `localStorage.getItem('coeus-theme') === 'light'`
- The MapView reads the class via a `MutationObserver` and switches between CartoCDN `dark_all` and `light_all` tile layers

---

## Authentication

Auth is handled entirely through **Supabase Auth**, not Firebase.

- **Sign in**: `supabase.auth.signInWithPassword({ email, password })`
- **Sign up**: `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`
- **Google OAuth**: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- **Password reset**: `supabase.auth.resetPasswordForEmail(email, { redirectTo })`

### Sign-up flow
1. User fills form (email, password, confirm password, optional school)
2. `signUp` is called with `emailRedirectTo: window.location.origin + '/'`
3. If `data.user.identities.length === 0` → email already exists, show error
4. If `data.session` is returned immediately → email confirmation is disabled in Supabase, redirect to `/`
5. Otherwise → show "Check your email to confirm your account"
6. On first signup a row is inserted into `public.profiles`

### Google OAuth setup (still needs Supabase configuration)
The code is correct but Google OAuth requires two external steps:
1. **Google Cloud Console** — create OAuth 2.0 client ID, add Supabase callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Supabase Dashboard** → Authentication → Providers → Google → enable and paste client ID + secret
3. **Supabase Dashboard** → Authentication → URL Configuration → add your Vercel domain to redirect URLs

Firebase credentials in `.env` are for push notifications only and are not used for authentication.

---

## Email delivery (currently broken in production)

Supabase's built-in email service is rate-limited to **4 emails per hour** on the free tier. This causes confirmation emails to silently not arrive.

**Fix required (not yet done):** Configure a custom SMTP provider in Supabase → Project Settings → Auth → SMTP Settings.

Recommended provider: **Resend** (resend.com) — free tier covers 3,000 emails/month.
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: Resend API key

**Temporary workaround:** Disable email confirmation in Supabase → Authentication → Settings → uncheck "Enable email confirmations". The code already handles this case — if `data.session` comes back on sign-up it redirects immediately.

---

## Event category system

Each event has one of these categories, each with a dedicated colour and inline SVG icon:

| Category | Stroke colour | Background tint |
|---|---|---|
| sports | `#3b6d11` | `#E3EAD9` |
| hackathon | `#3c3489` | `#E4E2F1` |
| workshop | `#0c447c` | `#DCE8F1` |
| career | `#27500a` | `#E0E8D7` |
| social | `#712b13` | `#EEE1DA` |
| arts / music | `#72243e` | `#EFDFE5` |
| open_house | `#854f0b` | `#F0E5D3` |
| other | `#444441` | `#E2E0D9` |

Icons are 24×24 inline SVG, strokeWidth 1.4, strokeLinecap round, no fill. They sit in a 52×52 rounded square thumbnail inside each `EventCard`.

---

## Scrapers

The scraper system lives in `scraper/` and is orchestrated by `scraper/index.ts`. The nightly cron at `/api/cron/scrape` calls `runScrapers(NIGHTLY_SOURCES)`.

### What works on Vercel
| Scraper | Status | Notes |
|---|---|---|
| `eventbrite` | Works | HTTP/axios only |
| `luma` | Works with API key | Set `LUMA_API_KEY` env var. Without it falls back to Playwright (fails on Vercel) |
| `eventfinda` | Likely works | Check if it uses axios |

### What does NOT work on Vercel
All school scrapers (NUS, NTU, SMU, SP, NP, TP, RP, NYP, ITE, SUTD, SIT, SUSS, SIM, PSB), the Facebook scraper, and the Luma fallback all use **Playwright** (headless Chromium). Vercel's serverless environment cannot run a browser.

**Fix:** Run `npm run scrape:nightly` from a local machine or a VPS (Railway, DigitalOcean) with Playwright and Chromium installed to seed the database. The Vercel cron will handle the lightweight scrapers daily.

### Playwright on Vercel (build fix applied)
To prevent Vercel's build from downloading Chromium (~200 MB) and failing:
- `vercel.json` has `"installCommand": "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci"`
- `next.config.mjs` has `experimental.serverComponentsExternalPackages: ['playwright']`

---

## Cron job

```json
"schedule": "0 15 * * *"
```

`15:00 UTC = 23:00 SGT` — runs every night at 11pm Singapore time.

Verify in: Vercel Dashboard → Project → Settings → Cron Jobs. You can also trigger it manually from there.

---

## Required environment variables

Set all of these in Vercel → Project → Settings → Environment Variables.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `LUMA_API_KEY` | Luma account settings (optional but recommended) |
| `CRON_SECRET` | Any random string — used to authenticate cron requests |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase console (for push notifications) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase console |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase console |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase console |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase console |

---

## Pages and their status

| Route | Status | Notes |
|---|---|---|
| `/` | Working | Event feed with filter chips and tab bar |
| `/events/[id]` | Working | Event detail with RSVP |
| `/map` | Working | Leaflet map, dark/light tiles |
| `/login` | Working | Email/password + Google OAuth tabs |
| `/forgot-password` | Working | Sends reset link via Supabase |
| `/submit` | Working | Auth-gated, shows lock screen when logged out |
| `/history` | Working | Page exists, needs data wiring |
| `/following` | Placeholder | UI shell only, no data |
| `/saved` | Placeholder | UI shell only, no data |
| `/profile/me` | Working | Needs Supabase profile data |
| `/profile/[id]` | Working | Public profile view |
| `/admin` | Working | Admin only |
| `/onboarding` | Shell only | Not fully implemented |

---

## Navigation structure

**TopBar** (fixed, all pages): logo left · ThemeToggle + auth buttons right  
**HomeTabs** (homepage only): Discover · Following · Map · Saved · Event History  
**FilterChips** (homepage only): Sports (pinned, always first) · All · Career · Hackathons · Workshops · Social · Arts · Open Houses · Free only  
**BottomNav** (mobile, all pages): Feed · Map · Submit (logged-in only) · Profile

---

## Known remaining issues

1. **Google OAuth not working** — needs Supabase + Google Cloud Console configuration (no code changes needed, see Auth section above)
2. **Confirmation emails not arriving** — Supabase free SMTP rate limit; needs Resend SMTP configured (see Email section above)
3. **School scrapers don't run on Vercel** — Playwright can't run serverless; needs a separate VPS or local machine to seed the database
4. **`/following` and `/saved` are empty placeholders** — no save/follow functionality has been built yet
5. **Firebase push notifications** — credentials are wired but the notification flow is not implemented end-to-end
