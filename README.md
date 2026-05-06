# Coeus

A student event discovery platform for Singapore. Aggregates events from 20+ universities, polytechnics, and event platforms into a single filterable feed.

**Live:** [coeus.sg](https://coeus.sg)

---

## Features

- Browse and filter events by category, date range, price, and keyword
- RSVP to events (Going / Interested / Not Going)
- Interactive map view of events across Singapore
- Submit your own events (auth required, pending admin approval)
- Dark / light theme toggle
- Admin dashboard for event and user management

**Sources:** NUS, NTU, SMU, SUTD, SIT, SUSS, SIM, PSB, SP, NP, TP, RP, NYP, ITE, Eventbrite, Luma, Eventfinda, SportsSG, Facebook, Government Youth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database & Auth | Supabase (Postgres + Auth) |
| Maps | Leaflet + react-leaflet |
| Scraping | Playwright + Axios |
| State | Zustand |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) Eventbrite / Luma / Eventfinda API keys

### Install

```bash
npm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional — scrapers work without these but with reduced data
EVENTBRITE_API_KEY=
LUMA_API_KEY=
EVENTFINDA_USERNAME=
EVENTFINDA_PASSWORD=
EVENTFINDA_QUERY=
```

### Database Setup

Apply migrations in order:

```bash
supabase db push
```

Or run manually via the Supabase SQL editor:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_profile_trigger.sql`
3. `supabase/migrations/003_roles.sql`

### Run Locally

```bash
npm run dev
```

---

## Scraping

Scrapers use Playwright (headless Chrome) and must be run on a local machine or VPS — they do not run on Vercel.

```bash
# Scrape all sources
npm run scrape:all

# Scrape nightly subset (17 sources)
npm run scrape:nightly

# Scrape a single source
npm run scrape -- eventbrite
npm run scrape -- nus

# Run as a persistent cron daemon
npm run scrape:cron

# Run daemon + trigger immediately
npm run scrape:cron:now
```

Available source names: `eventbrite`, `luma`, `eventfinda`, `sportsg`, `facebook`, `government`, `nus`, `ntu`, `smu`, `sutd`, `sit`, `suss`, `sim`, `psb`, `sp`, `np`, `tp`, `rp`, `nyp`, `ite`

On Vercel, `/api/cron/scrape` runs every 2 days (API-based sources only — no Playwright).

---

## Project Structure

```
app/                  # Next.js pages and API routes
  (auth)/             # Login, forgot password
  (public)/           # Home feed, event detail, map, submit
  (admin)/            # Admin dashboard
  api/                # REST endpoints + cron trigger
components/           # Shared React components
lib/                  # Supabase client, types, Zustand store
scraper/
  index.ts            # Orchestrator
  lib/                # Base class, geocoding, tagging
  sources/            # One file per source
    schools/          # 14 school scrapers
scripts/              # CLI utilities (run-scraper, cron-scraper, seed)
supabase/migrations/  # Postgres schema
```

---

## User Roles

Three roles exist: `normal_user`, `admin`, `super_admin`. Set via the `role` column in the `profiles` table (Supabase Table Editor or SQL).

Admins can approve/reject submitted events and manage users at `/admin`.

---

## Deployment

Push to `main` → Vercel auto-deploys.

For full nightly scraping, run `npm run scrape:nightly` on your own server via cron:

```cron
0 23 * * * cd /path/to/coeus && npm run scrape:nightly
```

---

## Known Limitations

- School scrapers require a local machine with Chromium — they do not run on Vercel
- `/following` and `/saved` pages are UI shells — not yet implemented
- Google OAuth requires additional Supabase + Google Cloud Console setup
- Supabase free tier limits confirmation emails to 4/hour — configure custom SMTP (e.g. Resend) for production
- Geocoding is not yet implemented; event coordinates are not populated automatically
