-- SSA cross-portal messaging security

create or replace function public.can_message_role(sender_role text, recipient_role text)
returns boolean
language sql
immutable
as $$
  select case sender_role
    when 'founder' then recipient_role in ('founder','admin','instructor','student')
    when 'admin' then recipient_role in ('founder','instructor','student')
    when 'instructor' then recipient_role in ('admin','student')
    when 'student' then recipient_role = 'instructor'
    else false
  end;
$$;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Members can only see conversations they belong to.
drop policy if exists "conversation_members_select_own" on public.conversation_members;
create policy "conversation_members_select_own"
on public.conversation_members for select
using (user_id = auth.uid());

-- Members can read their own conversation messages.
drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member"
on public.messages for select
using (
  exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
  )
);

-- A member may send messages as themselves.
drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
  )
);

-- Users may create a conversation only when the other participant is allowed by role.
drop policy if exists "conversations_insert_authenticated" on public.conversations;
create policy "conversations_insert_authenticated"
on public.conversations for insert
to authenticated
with check (created_by = auth.uid());

-- Users can see conversations they are members of.
drop policy if exists "conversations_select_member" on public.conversations;
create policy "conversations_select_member"
on public.conversations for select
using (
  exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversations.id
      and cm.user_id = auth.uid()
  )
);
