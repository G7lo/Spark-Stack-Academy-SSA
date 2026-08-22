-- SSA learning features: course discussion threads/messages.
-- Realtime is handled by Supabase Realtime; typing/live-class presence should never write rows.

create table if not exists public.class_discussions (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  lesson_id text,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists class_discussions_course_idx
  on public.class_discussions(course_id, created_at desc);

create index if not exists class_discussions_lesson_idx
  on public.class_discussions(lesson_id, created_at desc);

alter table public.class_discussions enable row level security;

drop policy if exists "class_discussions_select_authenticated" on public.class_discussions;
create policy "class_discussions_select_authenticated"
on public.class_discussions for select
to authenticated
using (deleted_at is null);

drop policy if exists "class_discussions_insert_authenticated" on public.class_discussions;
create policy "class_discussions_insert_authenticated"
on public.class_discussions for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "class_discussions_update_own" on public.class_discussions;
create policy "class_discussions_update_own"
on public.class_discussions for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create or replace function public.touch_class_discussion_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists class_discussions_updated_at on public.class_discussions;
create trigger class_discussions_updated_at
before update on public.class_discussions
for each row execute function public.touch_class_discussion_updated_at();
