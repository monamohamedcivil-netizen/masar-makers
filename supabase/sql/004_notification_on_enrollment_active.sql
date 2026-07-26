-- Masar Makers
-- Reliable enrollment approval notifications
-- Run this entire file once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

-- =========================================================
-- 1) Ensure notification tables exist
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text not null default 'general',
  action_url text null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_recipients (
  notification_id uuid not null
    references public.notifications(id)
    on delete cascade,
  user_id uuid not null
    references auth.users(id)
    on delete cascade,
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists
  notification_recipients_user_created_idx
on public.notification_recipients (user_id, created_at desc);

-- =========================================================
-- 2) Student read policies
-- =========================================================
alter table public.notifications enable row level security;
alter table public.notification_recipients enable row level security;

drop policy if exists
  "Recipients can read their notifications"
on public.notifications;

create policy
  "Recipients can read their notifications"
on public.notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.notification_recipients nr
    where nr.notification_id = notifications.id
      and nr.user_id = auth.uid()
  )
);

drop policy if exists
  "Users can read their notification recipients"
on public.notification_recipients;

create policy
  "Users can read their notification recipients"
on public.notification_recipients
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists
  "Users can mark their notifications as read"
on public.notification_recipients;

create policy
  "Users can mark their notifications as read"
on public.notification_recipients
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- =========================================================
-- 3) Trigger function: active enrollment => notification
-- =========================================================
create or replace function public.notify_enrollment_activated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_title text;
  v_type text;
begin
  -- Only run when the status really changes to active.
  if new.status = 'active'
     and old.status is distinct from new.status then

    v_title := coalesce(
      nullif(trim(new.action_title), ''),
      'الرحلة التعليمية'
    );

    v_type := case
      when lower(coalesce(new.journey_type, '')) in
        ('workshop', 'one_day', 'one_day_journey')
        then 'workshop'
      when lower(coalesce(new.journey_type, '')) in
        ('free', 'free_session', 'free_journey')
        then 'free_session'
      else 'journey_available'
    end;

    insert into public.notifications (
      title,
      body,
      type,
      action_url
    )
    values (
      'تم قبول اشتراكك',
      'تم اعتماد اشتراكك في ' || v_title ||
      '. يمكنك الآن بدء رحلتك من لوحة الطالب.',
      v_type,
      '/dashboard'
    )
    returning id into v_notification_id;

    insert into public.notification_recipients (
      notification_id,
      user_id,
      is_read,
      read_at
    )
    values (
      v_notification_id,
      new.user_id,
      false,
      null
    );
  end if;

  return new;
end;
$$;

drop trigger if exists
  trg_notify_enrollment_activated
on public.enrollments;

create trigger trg_notify_enrollment_activated
after update of status
on public.enrollments
for each row
execute function public.notify_enrollment_activated();

-- =========================================================
-- 4) Refresh PostgREST cache
-- =========================================================
notify pgrst, 'reload schema';

-- =========================================================
-- 5) Verification query
-- After approving a NEW pending request, run this section alone.
-- =========================================================
-- select
--   nr.user_id,
--   nr.is_read,
--   nr.created_at,
--   n.title,
--   n.body,
--   n.type,
--   n.action_url
-- from public.notification_recipients nr
-- join public.notifications n
--   on n.id = nr.notification_id
-- order by nr.created_at desc
-- limit 20;
