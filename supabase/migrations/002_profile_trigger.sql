-- Auto-create a profile row whenever a new auth.users row is inserted.
-- This fires server-side with SECURITY DEFINER, bypassing RLS entirely,
-- so it works regardless of whether email confirmation is enabled.
-- ON CONFLICT DO NOTHING ensures it's safe to run even if the API route
-- already created the profile.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, bio, interests, is_admin)
  values (
    new.id,
    split_part(new.email, '@', 1),
    null,
    '{}',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
