-- Masar Makers: create an approval notification safely from an admin action.
-- Run this entire file once in Supabase SQL Editor.

create or replace function public.admin_create_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text,
  p_action_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_user_id
  ) then
    raise exception 'STUDENT_NOT_FOUND';
  end if;

  insert into public.notifications (
    title,
    body,
    type,
    action_url
  )
  values (
    p_title,
    p_body,
    coalesce(nullif(trim(p_type), ''), 'general'),
    nullif(trim(p_action_url), '')
  )
  returning id into v_notification_id;

  insert into public.notification_recipients (
    notification_id,
    user_id,
    is_read
  )
  values (
    v_notification_id,
    p_user_id,
    false
  );

  return v_notification_id;
end;
$$;

revoke all on function public.admin_create_notification(uuid, text, text, text, text) from public;
grant execute on function public.admin_create_notification(uuid, text, text, text, text) to authenticated;
