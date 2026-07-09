# HANDOFF — Coeus

> Read this first. It tells you what the project is, how the infrastructure fits together,
> what was fixed recently, and where the sharp edges are. Written 2026-07-06.

## Who you're working with

Shane (GitHub: `ShaneRobi`) is **non-technical**. Do fixes end-to-end yourself where possible
(local credentials, Supabase MCP, GitHub API) and report in plain language. Only hand back
steps that require his personal logins (e.g. the Vercel dashboard).

## What the app is

**Coeus** is a student event discovery platform for Singapore. It scrapes events from
university/polytechnic websites and event platforms into one filterable feed. Users can
browse, RSVP, view a map, and submit events; admins approve submissions and monitor scrapers.

- **Live site:** https://coeus-psi.vercel.app
  (the `coeus.sg` domain mentioned in older docs was **never registered** — don't trust old references to it)
- **Stack:** Next.js 14 App Router + TypeScript + Tailwind, Supabase (Postgres + Auth),
  Playwright/Axios scrapers, Leaflet maps, deployed on Vercel (Hobby plan)
- More detail: `README.md` (accurate as of 2026-07-06) and `COEUS_BUILD_CONTEXT.md` (initial build history)

## Infrastructure map

| Piece | Where | Notes |
|---|---|---|
| Code | github.com/ShaneRobi/coeus, branch `main` | `develop`/`feature-test`/`test` branches are stale — all real work goes to `main` |
| Database | Supabase project `anbkhizdpgtyjpjbokeu` | Renamed "Coeus" in dashboard 2026-07-06 (was confusingly "Habit Rabbit") |
| Website hosting | Vercel project **coeus** | Auto-deploys on push to `main`. A **duplicate project `coeus-323b`** also deploys (and fails) on every push — pending deletion by Shane in the Vercel dashboard |
| Automated scraping | GitHub Actions `.github/workflows/daily-scrape.yml` | Cron `0 3,9,15,21 * * *` UTC (= 11am/5pm/11pm/5am SGT), runs `npm run scrape:nightly` with Chromium |
| Credentials | Local: `.env.local` in repo root. CI: GitHub Actions repository secrets | Both set and working as of 2026-07-06 |

Nightly scrape sources (all verified working 2026-07-06): `eventfinda`, `luma`, `nus`, `ntu`,
`smu`, `sim`. The other ~14 scrapers in `scraper/sources/` are kept for manual testing but are
excluded from the automated run (dead URLs / dead APIs, e.g. Eventbrite's public API was shut down).

Scrape results are logged to the `scraper_runs` table (`triggered_by` column says who ran it)
and visible on the admin dashboard at `/admin/scrapers`.

## What was broken and fixed on 2026-07-06

The system had scraped nothing since June 6. Three independent causes, all fixed:

1. **GitHub Actions had zero repository secrets** — every scheduled run crashed instantly with
   `supabaseUrl is required.` Fixed by uploading all secrets from `.env.local`.
2. **Migration `005_scraper_runs_metadata.sql` was corrupted** (truncated mid-statement in a
   June 15 commit) **and never applied** — so every `scraper_runs` insert from current code
   failed silently and the admin dashboard stayed empty. Fixed the file (commit `1843609`) and
   applied the migration to the live database via Supabase MCP.
3. **The Vercel cron was invalid and blocking deploys** — `0 */6 * * *` isn't allowed on the
   Hobby plan, Vercel can't run Playwright anyway, and production had been frozen on ~May 23
   code for six weeks. Fixed by removing the `crons` block from `vercel.json` (commit `1843609`);
   the next push deployed successfully and production has been current since.

Also fixed: README/COEUS_BUILD_CONTEXT updated to reflect all of the above (commit `b7dd7c9`).

**Verified end-to-end:** manual workflow run succeeded, and the first fully automatic
scheduled run succeeded on 2026-07-06 (~3pm SGT). Automation needs no further work.

## Gotchas (will bite you if you don't know)

- **`.env.local` has a space after `=` on some lines.** Parse it with dotenv, never with
  naive `cut`/`grep` — a leading-space secret caused a 401 once already.
- **No `gh` CLI installed.** GitHub API access works via the stored git credential:
  `printf "protocol=https\nhost=github.com\n\n" | git credential fill` → token with
  `repo`+`workflow` scope. A downloaded gh binary may exist at `/tmp/gh_*/bin/gh` (ephemeral).
- **Supabase MCP is available** — use it for SQL/migrations instead of asking Shane.
- **Playwright scrapers can't run on Vercel.** GitHub Actions (which installs Chromium) is the
  only automated runner. Don't re-add a Vercel cron for scraping.
- The duplicate Vercel project `coeus-323b` fails on every push — ignore its failure emails/
  statuses unless Shane has deleted it by now.

## Coeus feeds another app: Grit-to-Great (added 2026-07-07)

Shane's other project **Grit-to-Great** (youth empowerment platform; local checkout at
`/Users/shane/Documents/Coder project/Grit-to-Great`) embeds the Coeus events feed:

- Repos: canonical = `Rising-Eagle/Grit-to-Great` (Vercel deploys from its `main`);
  Shane's fork = `ShaneRobi/Grit-to-Great` (origin). PRs go from the fork to Rising-Eagle.
- Integration: `src/coeusClient.js` in G2G holds a read-only Supabase client with the
  Coeus URL + anon key **hardcoded as defaults** (public by design; RLS limits to
  `status='published'` events). ⚠️ If the Coeus Supabase project or anon key ever changes,
  update that file too.
- The Events page is public (landing navbar link) and needs zero env config.
  Shipped via Rising-Eagle PRs #17 (tab) and #18 (public + zero-config); documented in
  G2G's `PROJECT_HISTORY.md` addendum (PR #19).
- Further G2G work (all merged as of 2026-07-09): PR #20 converted the whole app to
  URL-based routing with React Router (every page has its own path, back/forward work,
  `vercel.json` SPA rewrite added); PR #21 upgraded the Events UI (whole card clickable →
  detail modal with full description, `btn-pill` "View event" button, calendar date tile
  on images + highlighted date pill; shared helpers in `src/components/Events/eventUtils.js`).
- **Deployment gotcha learned 2026-07-07:** G2G production (`grit-to-great-tau.vercel.app`)
  served stale code despite green builds — cause was an active **Vercel Instant Rollback**
  pinning production to an old deployment. If production looks stale but builds are green,
  check for a rollback before anything else. Also: the `*-rising-eagles-projects.vercel.app`
  aliases are behind Vercel Deployment Protection (SSO); only the production domain is public.

## Known remaining work (not started)

- **Optional cleanup:** `lib/firebase.ts` is dead code (nothing imports it; `firebase` and
  `ics` are unused heavy dependencies). Stale branches `develop`/`feature-test`/`test` could be deleted.
- `/following` and `/saved` pages are UI shells — not implemented.
- **Telegram bot** (`scripts/telegram-bot.ts`) has no permanent home — it only works while a
  machine runs it. Needs a VPS/always-on host if Shane wants it live.
- Supabase free tier sends only **4 confirmation emails/hour** — needs custom SMTP (e.g.
  Resend) before real user signups.
- If Shane buys a real domain later: add it in Vercel → Settings → Domains, then update the
  URL in `README.md`, `COEUS_BUILD_CONTEXT.md`, and this file.
