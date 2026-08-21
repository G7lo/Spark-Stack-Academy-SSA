-- Spark Stack Academy notification/event infrastructure.
-- Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_firebase_uid text,
  audience text not null default 'user',
  recipient_role text,
  course_id text,
  type text not null default 'general',
  title text not null,
  message text not null,
  priority text not null default 'normal',
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text unique,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications(recipient_firebase_uid, created_at desc);
create index if not exists notifications_role_idx
  on public.notifications(recipient_role, created_at desc);
create index if not exists notifications_course_idx
  on public.notifications(course_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications(recipient_firebase_uid, read_at)
  where read_at is null;

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique,
  sound_enabled boolean not null default true,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  report_code text not null unique,
  reporter_firebase_uid text not null,
  reporter_role text not null,
  category text not null default 'general',
  priority text not null default 'medium',
  title text not null,
  description text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_messages (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  sender_firebase_uid text not null,
  sender_role text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_reporter_idx
  on public.reports(reporter_firebase_uid, created_at desc);
create index if not exists reports_status_idx
  on public.reports(status, created_at desc);
create index if not exists report_messages_thread_idx
  on public.report_messages(report_id, created_at asc);

-- Generic course-content event trigger. It intentionally reads NEW through
-- to_jsonb so it remains compatible with the existing table column naming.
create or replace function public.ssa_notify_content_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb := to_jsonb(new);
  course_id_value text;
  title_value text;
  content_type text;
  dedupe text;
begin
  course_id_value := coalesce(
    row_data->>'course_id',
    row_data->>'courseId',
    row_data->>'courseID'
  );

  if course_id_value is null or course_id_value = '' then
    return new;
  end if;

  title_value := coalesce(
    row_data->>'title',
    row_data->>'name',
    initcap(replace(TG_TABLE_NAME, '_', ' '))
  );

  content_type := case TG_TABLE_NAME
    when 'lessons' then 'lesson_added'
    when 'assignments' then 'assignment_added'
    when 'quizzes' then 'quiz_added'
    else 'course_content_added'
  end;

  dedupe := 'content:' || TG_TABLE_NAME || ':' || coalesce(new.id::text, md5(row_data::text));

  insert into public.notifications (
    audience,
    course_id,
    type,
    title,
    message,
    priority,
    action_url,
    metadata,
    dedupe_key
  ) values (
    'course',
    course_id_value,
    content_type,
    case TG_TABLE_NAME
      when 'lessons' then 'New lesson added'
      when 'assignments' then 'New assignment added'
      when 'quizzes' then 'New quiz added'
      else 'New course content added'
    end,
    title_value || ' is now available in your course.',
    'normal',
    '/student/course-player.html?id=' || course_id_value,
    jsonb_build_object(
      'course_id', course_id_value,
      'source_table', TG_TABLE_NAME,
      'source_id', coalesce(new.id::text, '')
    ),
    dedupe
  ) on conflict (dedupe_key) do nothing;

  return new;
end;
$$;

-- Course creation is handled separately because course_id is the new row id.
create or replace function public.ssa_notify_course_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb := to_jsonb(new);
  course_id_value text := coalesce(new.id::text, row_data->>'course_id', row_data->>'courseId');
  title_value text := coalesce(row_data->>'title', row_data->>'name', 'New course');
  instructor_uid text := coalesce(row_data->>'instructor_uid', row_data->>'instructorUid', row_data->>'instructor_id', row_data->>'instructorId');
begin
  if course_id_value is null then return new; end if;

  insert into public.notifications (
    audience, type, title, message, priority, action_url, metadata, dedupe_key
  ) values (
    'all', 'course_created', 'New course available',
    title_value || ' is now available at Spark Stack Academy.',
    'normal', '/student/course-details.html?id=' || course_id_value,
    jsonb_build_object('course_id', course_id_value),
    'course-created:' || course_id_value
  ) on conflict (dedupe_key) do nothing;

  if instructor_uid is not null and instructor_uid <> '' then
    insert into public.notifications (
      recipient_firebase_uid, audience, type, title, message, priority, action_url, metadata, dedupe_key
    ) values (
      instructor_uid, 'user', 'course_created', 'Course published',
      'Your course ' || title_value || ' is now available on SSA.',
      'normal', '/instructor/courses.html',
      jsonb_build_object('course_id', course_id_value),
      'course-created-instructor:' || course_id_value || ':' || instructor_uid
    ) on conflict (dedupe_key) do nothing;
  end if;

  return new;
end;
$$;

-- Install triggers only when the corresponding tables exist.
do $$
begin
  if to_regclass('public.lessons') is not null then
    execute 'drop trigger if exists ssa_notify_lessons on public.lessons';
    execute 'create trigger ssa_notify_lessons after insert on public.lessons for each row execute function public.ssa_notify_content_event()';
  end if;
  if to_regclass('public.assignments') is not null then
    execute 'drop trigger if exists ssa_notify_assignments on public.assignments';
    execute 'create trigger ssa_notify_assignments after insert on public.assignments for each row execute function public.ssa_notify_content_event()';
  end if;
  if to_regclass('public.quizzes') is not null then
    execute 'drop trigger if exists ssa_notify_quizzes on public.quizzes';
    execute 'create trigger ssa_notify_quizzes after insert on public.quizzes for each row execute function public.ssa_notify_content_event()';
  end if;
  if to_regclass('public.courses') is not null then
    execute 'drop trigger if exists ssa_notify_courses on public.courses';
    execute 'create trigger ssa_notify_courses after insert on public.courses for each row execute function public.ssa_notify_course_created()';
  end if;
end $$;

-- Keep timestamps current when preferences/reports change.
create or replace function public.ssa_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ssa_touch_notification_preferences on public.notification_preferences;
create trigger ssa_touch_notification_preferences
before update on public.notification_preferences
for each row execute function public.ssa_touch_updated_at();

drop trigger if exists ssa_touch_reports on public.reports;
create trigger ssa_touch_reports
before update on public.reports
for each row execute function public.ssa_touch_updated_at();
