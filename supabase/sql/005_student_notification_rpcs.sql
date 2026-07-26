-- Masar Makers
-- Student notification RPCs
-- Run this entire file in Supabase > SQL Editor.

create or replace function public.get_my_notifications(
  p_limit integer default 20
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
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

revoke all on function public.get_my_notifications(integer) from public;
grant execute on function public.get_my_notifications(integer) to authenticated;

create or replace function public.mark_my_notification_read(
  p_notification_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notification_recipients
  set
    is_read = true,
    read_at = coalesce(read_at, now())
  where notification_id = p_notification_id
    and user_id = auth.uid();

  return found;
end;
$$;

revoke all on function public.mark_my_notification_read(uuid) from public;
grant execute on function public.mark_my_notification_read(uuid) to authenticated;

create or replace function public.mark_all_my_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.notification_recipients
  set
    is_read = true,
    read_at = coalesce(read_at, now())
  where user_id = auth.uid()
    and is_read = false;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_all_my_notifications_read() from public;
grant execute on function public.mark_all_my_notifications_read() to authenticated;

notify pgrst, 'reload schema';
