# Coeus

A student event discovery platform for Singapore. Aggregates events from 20+ universities, polytechnics, and event platforms into a single filterable feed.

**Live:** [coeus-psi.vercel.app](https://coeus-psi.vercel.app)

---

## Features

- Browse and filter events by category, date range, price, and keyword
- RSVP to events (Going / Interested / Not Going)
- Interactive map view of events across Singapore
- Submit your own events (auth required, pending admin approval)
- Dark / light theme toggle
- Admin dashboard for event and user management
- Admin scraper dashboard — manually trigger any source, view run history, see next automated run
- Automated scraping via GitHub Actions, 4× daily (5am / 11am / 5pm / 11pm SGT)
- Telegram bot — listens to groups/channels and auto-saves event posts to the database
- Geocoding via Nominatim (OpenStreetMap) — coordinates populated automatically per address

**Sources:** NUS, NTU, SMU, SUTD, SIT, SUSS, SIM, PSB, SP, NP, TP, RP, NYP, ITE, Eventbrite, Luma, Eventfinda, SportsSG, Facebook, Government Youth, Telegram

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
| Date parsing | chrono-node |
| Telegram | Telegraf |
| Cron (self-hosted) | node-cron |
| State | Zustand |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) Eventbrite / Luma / Eventfinda API keys
- (Optional) Telegram bot token for the Telegram scraper

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

# Telegram bot scraper
TELEGRAM_BOT_TOKEN=

# Auth for manually triggering /api/cron/scrape (optional)
CRON_SECRET=

# Self-hosted cron overrides (optional)
SCRAPER_CRON=0 23 * * *
SCRAPER_TIMEZONE=Asia/Singapore
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
4. `supabase/migrations/004_require_scraped_event_url.sql`
5. `supabase/migrations/005_scraper_runs_metadata.sql`

### Run Locally

```bash
npm run dev
```

---

## Scraping

Scrapers use Playwright (headless Chrome) and cannot run on Vercel's serverless runtime. Automated scraping runs on **GitHub Actions** (`.github/workflows/daily-scrape.yml`) 4× daily at 03:00 / 09:00 / 15:00 / 21:00 UTC, which installs Chromium and runs the nightly source set. Credentials come from the repository's Actions secrets.

```bash
# Scrape all sources
npm run scrape:all

# Scrape nightly subset (confirmed working sources)
npm run scrape:nightly

# Scrape a single source
npm run scrape -- eventbrite
npm run scrape -- nus

# Run as a persistent cron daemon
npm run scrape:cron

# Run daemon + trigger immediately
npm run scrape:cron:now

# Run the Telegram bot (listens continuously)
npm run scrape:telegram
```

Available source names: `eventbrite`, `luma`, `eventfinda`, `sportsg`, `facebook`, `government`, `nus`, `ntu`, `smu`, `sutd`, `sit`, `suss`, `sim`, `psb`, `sp`, `np`, `tp`, `rp`, `nyp`, `ite`

The `/api/cron/scrape` endpoint remains available for manual triggering from the admin dashboard (API-based sources only — no Playwright). There is no Vercel cron; GitHub Actions is the automated scraping engine.

---

## Telegram Bot

The Telegram bot (`scripts/telegram-bot.ts`) listens on any group or channel it is added to as admin and automatically parses incoming messages for event data.

### How it works

1. A message arrives in a group or channel.
2. The parser (`scraper/sources/telegram.ts`) extracts:
   - **Title** — from the first Telegram bold entity, or the first non-empty line
   - **Date/time** — using `chrono-node` natural language parsing
   - **Location** — matched from emoji/keyword patterns (📍, `venue:`, `held at`, etc.)
   - **URL** — prefers known event platform links (Luma, Eventbrite, Facebook Events, Peatix, Meetup)
3. If a date is found, the event is geocoded, tagged, and inserted into the database.
4. Duplicate detection prevents the same message from being inserted twice (`source: 'telegram'`, `source_id: chatId:messageId`).

### Run the bot

```bash
npm run scrape:telegram
```

Invite the bot to a channel (as admin) or group to begin scraping.

---

## Geocoding

All scrapers and the Telegram bot geocode event addresses via the **Nominatim** (OpenStreetMap) API:

- Requests are rate-limited to **1 req/sec** to comply with Nominatim's usage policy.
- Generic addresses (e.g. `"Singapore"`) are skipped to avoid unnecessary lookups.
- Coordinates are stored as `{ lat, lng }` in the `coordinates` column.

---

## Project Structure

```
app/                  # Next.js pages and API routes
  (auth)/             # Login, forgot password
  (public)/           # Home feed, event detail, map, submit, history, saved, following, onboarding
  (admin)/            # Admin dashboard (queue, users, scrapers)
  api/                # REST endpoints + cron trigger
    admin/scrapers/   # Trigger scrapers from the admin UI
    auth/             # Profile creation
    cron/scrape/      # Vercel daily cron endpoint
    events/           # Event CRUD
    submit/           # User event submission
  profile/            # User profile pages
components/           # Shared React components
lib/                  # Supabase client, types, Zustand store, roles
scraper/
  index.ts            # Orchestrator + nightly source list
  lib/
    base.ts           # Base scraper class + shared types
    geocode.ts        # Nominatim geocoding
    tag.ts            # Category inference + tag extraction
  sources/            # One file per source
    schools/          # 14 school scrapers (NUS, NTU, SMU, SP, NP, TP, RP, NYP, ITE, SUTD, SIT, SUSS, SIM, PSB)
    eventbrite.ts
    eventfinda.ts
    facebook.ts
    government.ts
    luma.ts
    sportsg.ts
    telegram.ts       # Telegram message parser
scripts/
  run-scraper.ts      # CLI: run any scraper by name
  cron-scraper.ts     # Self-hosted node-cron daemon
  telegram-bot.ts     # Telegraf bot — listens & saves event posts
  seed-events.mjs     # Seed database with test events
  delete-seed-events.mjs
supabase/migrations/  # Postgres schema (001–004)
```

---

## User Roles

Three roles exist: `normal_user`, `admin`, `super_admin`. Set via the `role` column in the `profiles` table (Supabase Table Editor or SQL).

Admins can approve/reject submitted events and manage users at `/admin`.

---

## Admin Dashboard

Located at `/admin`, the dashboard has three sections:

| Section | Path | Description |
|---|---|---|
| Event Queue | `/admin` | Approve or reject user-submitted events |
| Users | `/admin/users` | View and manage user accounts and roles |
| Scrapers | `/admin/scrapers` | Manually trigger any scraper, view run history, see next automated cron run |

---

## Database Migrations

| File | What it does |
|---|---|
| `001_initial_schema.sql` | Core tables: events, profiles, RSVPs |
| `002_profile_trigger.sql` | Auto-create profile row on auth signup |
| `003_roles.sql` | Role enum + RLS policies |
| `004_require_scraped_event_url.sql` | Constraint: scraped events must have an `external_url`; rejects existing ones that don't |
| `005_scraper_runs_metadata.sql` | Observability columns on `scraper_runs`: `triggered_by`, `events_skipped`, `duration_ms`, `metadata` |

---

## Deployment

Push to `main` → Vercel auto-deploys.

Automated scraping runs on GitHub Actions (`.github/workflows/daily-scrape.yml`) 4× daily — no server required. The workflow needs these repository secrets (Settings → Secrets and variables → Actions): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEOCODE_API_KEY`, `EVENTFINDA_USERNAME`, `EVENTFINDA_PASSWORD` (plus optional `LUMA_API_KEY`, `EVENTFINDA_QUERY`).

---

## Known Limitations

- School scrapers require Chromium — they run on GitHub Actions (or locally), not on Vercel
- The Telegram bot must run as a persistent process on a VPS or local machine
- `/following` and `/saved` pages are UI shells — not yet fully implemented
- Google OAuth requires additional Supabase + Google Cloud Console setup
- Supabase free tier limits confirmation emails to 4/hour — configure custom SMTP (e.g. Resend) for production
