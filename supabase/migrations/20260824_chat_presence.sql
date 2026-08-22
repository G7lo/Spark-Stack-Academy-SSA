-- Chat presence metadata. Presence/typing itself uses Supabase Realtime,
-- so typing never creates database writes.
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists profiles_last_seen_at_idx
  on public.profiles(last_seen_at);
