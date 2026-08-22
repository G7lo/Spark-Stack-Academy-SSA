-- Supabase Auth becomes the platform authentication source.
-- Firebase remains available for legacy data until the wider migration is complete.

alter table public.profiles
  add column if not exists auth_uid uuid;

alter table public.profiles
  alter column firebase_uid drop not null;

create unique index if not exists profiles_auth_uid_unique
  on public.profiles(auth_uid)
  where auth_uid is not null;

create or replace function public.generate_username(name text, uid text)
returns text
language plpgsql
immutable
as $$
declare
  base text;
  suffix text;
begin
  base := lower(regexp_replace(coalesce(name, 'user'), '[^a-zA-Z0-9]+', '', 'g'));
  if base = '' then base := 'user'; end if;
  suffix := lower(substr(regexp_replace(coalesce(uid, '00000000'), '[^a-zA-Z0-9]+', '', 'g'), 1, 6));
  return left(base, 18) || '_' || suffix;
end;
$$;

create or replace function public.handle_supabase_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
  full_name text;
  role_name text;
  username_value text;
begin
  full_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Student');
  role_name := case when new.raw_user_meta_data->>'role' in ('student', 'instructor') then new.raw_user_meta_data->>'role' else 'student' end;
  username_value := public.generate_username(full_name, new.id::text);

  insert into public.profiles (
    auth_uid, email, full_name, username, role, status, avatar_url
  ) values (
    new.id, new.email, full_name, username_value, role_name, 'active', new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (auth_uid) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();

  select id into profile_id from public.profiles where auth_uid = new.id limit 1;

  if role_name = 'student' then
    insert into public.students (id, xp, level, verified, premium)
    values (profile_id, 0, 1, false, false)
    on conflict (id) do nothing;
  else
    insert into public.instructors (id, verified)
    values (profile_id, false)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_supabase_auth_user();
