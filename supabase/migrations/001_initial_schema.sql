-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  avatar_url    text,
  bio           text,
  interests     text[] not null default '{}',
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view any profile"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- events
-- ============================================================
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text not null,
  start_at         timestamptz not null,
  end_at           timestamptz,
  location_name    text not null,
  location_address text not null,
  coordinates      jsonb,
  image_url        text,
  external_url     text,
  source           text not null,
  source_id        text,
  tags             text[] not null default '{}',
  category         text not null,
  status           text not null default 'published',
  is_free          boolean not null,
  price_min        numeric,
  price_max        numeric,
  organiser_name   text,
  organiser_id     uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (source, source_id)
);

alter table public.events enable row level security;

create policy "Anyone can view published events"
  on public.events for select using (status = 'published');

create policy "Admins can manage events"
  on public.events for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create index if not exists events_start_at_idx  on public.events (start_at);
create index if not exists events_category_idx  on public.events (category);
create index if not exists events_source_idx    on public.events (source);
create index if not exists events_tags_idx      on public.events using gin (tags);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ============================================================
-- rsvps
-- ============================================================
create table if not exists public.rsvps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  status     text not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table public.rsvps enable row level security;

create policy "Users can view own rsvps"
  on public.rsvps for select using (auth.uid() = user_id);

create policy "Users can manage own rsvps"
  on public.rsvps for all using (auth.uid() = user_id);

create index if not exists rsvps_user_id_idx  on public.rsvps (user_id);
create index if not exists rsvps_event_id_idx on public.rsvps (event_id);

-- ============================================================
-- scraper_runs
-- ============================================================
create table if not exists public.scraper_runs (
  id           uuid primary key default gen_random_uuid(),
  source       text not null,
  started_at   timestamptz not null,
  finished_at  timestamptz,
  events_found integer not null,
  events_added integer not null,
  error        text,
  status       text not null
);

alter table public.scraper_runs enable row level security;

create policy "Admins can view scraper runs"
  on public.scraper_runs for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can insert scraper runs"
  on public.scraper_runs for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create index if not exists scraper_runs_source_idx on public.scraper_runs (source);
create index if not exists scraper_runs_status_idx on public.scraper_runs (status);
