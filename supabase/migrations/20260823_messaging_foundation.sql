-- Spark Stack Academy — cross-portal messaging foundation

create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    type text not null default 'direct' check (type in ('direct','group','broadcast')),
    title text,
    created_by uuid references public.profiles(id) on delete set null,
    last_message_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    joined_at timestamptz not null default now(),
    last_read_at timestamptz,
    primary key (conversation_id, user_id)
);

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete restrict,
    body text not null,
    message_type text not null default 'text' check (message_type in ('text','system')),
    created_at timestamptz not null default now(),
    edited_at timestamptz,
    deleted_at timestamptz
);

create index if not exists conversations_updated_at_idx on public.conversations(updated_at desc);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Firebase-authenticated clients are provisioned through trusted server functions.
-- Keep direct anonymous access denied; Edge Functions/service-role perform writes.

create or replace function public.touch_conversation()
returns trigger
language plpgsql
as $$
begin
    update public.conversations
    set last_message_at = new.created_at,
        updated_at = now()
    where id = new.conversation_id;
    return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation();

-- Idempotent Realtime registration.
do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'messages'
    ) then
        alter publication supabase_realtime add table public.messages;
    end if;

    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'conversations'
    ) then
        alter publication supabase_realtime add table public.conversations;
    end if;
end $$;
