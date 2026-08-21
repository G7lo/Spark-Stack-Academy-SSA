create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  currency text not null default 'KES',
  status text not null default 'active' check (status in ('active','frozen')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wallets_user on public.wallets(user_id);

alter table public.wallets enable row level security;

drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own" on public.wallets for select to authenticated
using (user_id = auth.uid());

create or replace function public.ensure_wallet()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.wallets(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profile_wallet on public.profiles;
create trigger profile_wallet after insert on public.profiles
for each row execute function public.ensure_wallet();

create or replace function public.is_verified_staff(target_role text)
returns boolean language sql immutable
as $$ select target_role in ('admin','founder'); $$;
