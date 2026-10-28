create extension if not exists pg_net;

-- Server-only settings (no RLS policies → only the service role / definer functions can read).
create table if not exists public.app_private_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_private_settings enable row level security;

create or replace function public.push_admin_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_url text;
begin
  -- Admin notifications only. The platform chat already pushes from the app.
  if coalesce(new.type, '') not like 'admin\_%' or new.type = 'admin_web_chat' then
    return new;
  end if;
  select value into v_secret from public.app_private_settings where key = 'push_webhook_secret';
  select value into v_url from public.app_private_settings where key = 'push_webhook_url';
  if v_secret is null or v_url is null then
    return new;
  end if;
  begin
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('title', new.title, 'body', new.body, 'url', coalesce(new.action_url, '/admin'), 'tag', new.type),
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
      timeout_milliseconds := 5000
    );
  exception when others then
    null; -- a push problem never blocks the notification
  end;
  return new;
end;
$$;

drop trigger if exists trg_push_admin_notification on public.notifications;
create trigger trg_push_admin_notification
  after insert on public.notifications
  for each row execute function public.push_admin_notification();
-- Then (values are secret, not in the repo):
-- insert into public.app_private_settings(key,value) values ('push_webhook_url','https://masarmakers.com/api/push/admin-event'),('push_webhook_secret','<PUSH_WEBHOOK_SECRET>') on conflict (key) do update set value=excluded.value, updated_at=now();
