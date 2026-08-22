-- Clerk is the identity provider. Supabase remains the data/realtime/storage backend.
-- Do not store Clerk IDs in auth_uid because Clerk IDs are strings, not UUIDs.

alter table public.profiles
  add column if not exists clerk_user_id text;

create unique index if not exists profiles_clerk_user_id_unique
  on public.profiles(clerk_user_id)
  where clerk_user_id is not null;

-- The previous Supabase Auth trigger is no longer part of the signup flow.
drop trigger if exists on_auth_user_created on auth.users;

-- Clerk users are provisioned by the protected Edge Function using the service role.
-- Client-side profile access is controlled by the Clerk JWT verified by Supabase.
alter table public.profiles enable row level security;

 drop policy if exists "Clerk users can read their own profile" on public.profiles;
create policy "Clerk users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.jwt() ->> 'sub') = clerk_user_id);

 drop policy if exists "Clerk users can update their own profile" on public.profiles;
create policy "Clerk users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.jwt() ->> 'sub') = clerk_user_id)
with check ((select auth.jwt() ->> 'sub') = clerk_user_id);
