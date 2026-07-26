-- Masar Makers
-- Final repair for:
-- 1) Creating a notification on every real activation.
-- 2) Reading only the current student's notifications.
-- 3) Marking one or all notifications as read.
-- Run this entire script in the SAME Supabase project used by the app.

create extension if not exists pgcrypto;

-- =========================================================
-- Tables
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

-- =========================================================
-- Create notification when enrollment becomes active
-- =========================================================
create or replace function public.notify_enrollment_activated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_journey_type text;
  v_action_url text;
  v_notification_type text;
  v_journey_title text;
begin
  if new.status = 'active'
     and old.status is distinct from new.status then

    v_journey_type := lower(
      coalesce(new.journey_type, '')
    );

    v_journey_title := coalesce(
      nullif(trim(new.action_title), ''),
      'الرحلة التعليمية'
    );

    if v_journey_type in (
      'workshop',
      'one_day',
      'one_day_journey'
    ) then
      v_notification_type := 'workshop';
      v_action_url := '/dashboard?panel=one-day';

    elsif v_journey_type in (
      'free',
      'free_session',
      'free_journey'
    ) then
      v_notification_type := 'free_session';
      v_action_url := '/dashboard?panel=free';

    else
      v_notification_type := 'journey_available';
      v_action_url := '/dashboard?panel=career';
    end if;

    insert into public.notifications (
      title,
      body,
      type,
      action_url
    )
    values (
      'تم قبول اشتراكك',
      'تم اعتماد اشتراكك في ' ||
      v_journey_title ||
      '. يمكنك الآن بدء رحلتك من لوحة الطالب.',
      v_notification_type,
      v_action_url
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
-- Read notifications
-- =========================================================
drop function if exists
  public.get_my_notifications(integer);

create function public.get_my_notifications(
  p_limit integer
)
returns table (
  notification_id uuid,
  is_read boolean,
  read_at timestamptz,
  received_at timestamptz,
  title text,
  body text,
  type text,
  action_url text,
  notification_created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    nr.notification_id,
    nr.is_read,
    nr.read_at,
    nr.created_at as received_at,
    n.title,
    n.body,
    n.type,
    n.action_url,
    n.created_at as notification_created_at
  from public.notification_recipients nr
  join public.notifications n
    on n.id = nr.notification_id
  where nr.user_id = auth.uid()
  order by nr.created_at desc
  limit greatest(
    1,
    least(coalesce(p_limit, 20), 100)
  );
$$;

revoke all on function
  public.get_my_notifications(integer)
from public;

grant execute on function
  public.get_my_notifications(integer)
to authenticated;

grant execute on function
  public.get_my_notifications(integer)
to service_role;

-- =========================================================
-- Mark one notification read
-- =========================================================
drop function if exists
  public.mark_my_notification_read(uuid);

create function public.mark_my_notification_read(
  p_notification_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer;
begin
  update public.notification_recipients
  set
    is_read = true,
    read_at = coalesce(read_at, now())
  where notification_id = p_notification_id
    and user_id = auth.uid();

  get diagnostics v_updated_count = row_count;

  return v_updated_count > 0;
end;
$$;

revoke all on function
  public.mark_my_notification_read(uuid)
from public;

grant execute on function
  public.mark_my_notification_read(uuid)
to authenticated;

grant execute on function
  public.mark_my_notification_read(uuid)
to service_role;

-- =========================================================
-- Mark all notifications read
-- =========================================================
drop function if exists
  public.mark_all_my_notifications_read();

create function public.mark_all_my_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer;
begin
  update public.notification_recipients
  set
    is_read = true,
    read_at = coalesce(read_at, now())
  where user_id = auth.uid()
    and is_read = false;

  get diagnostics v_updated_count = row_count;

  return v_updated_count;
end;
$$;

revoke all on function
  public.mark_all_my_notifications_read()
from public;

grant execute on function
  public.mark_all_my_notifications_read()
to authenticated;

grant execute on function
  public.mark_all_my_notifications_read()
to service_role;

notify pgrst, 'reload schema';

-- Verification: these rows must appear after running.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid)
    as arguments
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_my_notifications',
    'mark_my_notification_read',
    'mark_all_my_notifications_read',
    'notify_enrollment_activated'
  )
order by p.proname;
