-- Shared platform identity badges
alter table public.profiles
  add column if not exists verified boolean not null default false,
  add column if not exists badge_type text,
  add column if not exists badge_label text;

-- Founder and admin identities are platform-verified.
update public.profiles
set verified = true,
    badge_type = case when role = 'founder' then 'founder_crown' else 'verified' end,
    badge_label = case when role = 'founder' then 'Founder' else 'Verified' end
where role in ('founder', 'admin');

create index if not exists idx_profiles_role_status
on public.profiles(role, status);
