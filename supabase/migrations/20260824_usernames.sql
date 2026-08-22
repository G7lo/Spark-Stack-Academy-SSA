alter table public.profiles
add column if not exists username text;

create unique index if not exists profiles_username_unique
on public.profiles (lower(username))
where username is not null;

create index if not exists profiles_username_search
on public.profiles (lower(username));

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

update public.profiles
set username = public.generate_username(full_name, firebase_uid)
where username is null;

alter table public.profiles
alter column username set not null;
