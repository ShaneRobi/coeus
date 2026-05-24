-- Add observability columns to scraper_runs
alter table public.scraper_runs
  add column if not exists duration_ms    integer,
  add column if not exists events_skipped integer not null default 0,
  add column if not exists triggered_by   text    not null default 'unknown',
  add column if not exists metadata       jsonb;

-- Index for querying by trigger source and status
create index if not exists scraper_runs_triggered_by_idx on public.scraper_runs (triggered_by);
create index if not exists scraper_runs_status_idx       on public.scraper_runs (status);
create index if not exists scraper_runs_started_at_idx   on public.scraper_runs (started_at desc);
