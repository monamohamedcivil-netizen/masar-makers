-- إرسال الإعلان تلقائيًا (إشعار + إيميل) عند موعد بدايته.
alter table public.platform_announcements
  add column if not exists auto_broadcast boolean not null default false;

-- تشغيل الفحص كل 10 دقائق؛ لا يفعل شيئًا إلا لو وُجد إعلان مستحق.
create or replace function public.announcement_broadcast_tick()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if exists (
    select 1 from public.platform_announcements
     where auto_broadcast = true
       and is_active = true
       and starts_at is not null
       and starts_at <= now()
       and starts_at > now() - interval '48 hours'
       and (ends_at is null or ends_at > now())
       and (notified_at is null or emailed_at is null)
  ) then
    perform net.http_post(
      url := 'https://masarmakers.com/api/cron/announcement-broadcast',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  end if;
end;
$$;

revoke all on function public.announcement_broadcast_tick() from public, anon, authenticated;

select cron.schedule('announcement-broadcast', '*/10 * * * *', 'select public.announcement_broadcast_tick()');
