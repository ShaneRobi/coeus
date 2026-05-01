-- Add a proper role enum to replace the boolean is_admin field.
-- Roles: normal_user (default), admin, super_admin.
-- Manage roles from the Supabase Table Editor by editing the `role` column.

-- 1. Create the enum type
create type public.user_role as enum ('normal_user', 'admin', 'super_admin');

-- 2. Add role column (defaults to normal_user for all new and existing rows)
alter table public.profiles
  add column if not exists role public.user_role not null default 'normal_user';

-- 3. Migrate any existing rows that had is_admin = true → admin
update public.profiles
set role = 'admin'
where is_admin = true;

-- 4. Replace events admin policy
drop policy if exists "Admins can manage events" on public.events;
create policy "Admins can manage events"
  on public.events for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- 5. Replace scraper_runs admin policies
drop policy if exists "Admins can view scraper runs" on public.scraper_runs;
drop policy if exists "Admins can insert scraper runs" on public.scraper_runs;

create policy "Admins can view scraper runs"
  on public.scraper_runs for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

create policy "Admins can insert scraper runs"
  on public.scraper_runs for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- 6. Update the new-user trigger to populate role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, bio, interests, is_admin, role)
  values (
    new.id,
    split_part(new.email, '@', 1),
    null,
    '{}',
    false,
    'normal_user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
