-- السحب الشهري يعمل في موعده بالظبط (الساعة 8 مساءً بتوقيت الرياض) بدون الاعتماد على وجود زوار.
-- كل دقيقة: pg_cron يسأل «هل يوجد سحب مستحق؟» (سحب منشور موعده جاء ولم يكتمل، أو سحب الشهر التلقائي لشهر بلا صف)،
-- وإن وُجد ينادي مسار الموقع /api/cron/monthly-draw عبر pg_net، فيشغّل العدّ التنازلي والدوران وإعلان الفائز.
-- لا يغيّر أي بيانات قائمة، ولا يحتاج أي سر (المسار يفعل ما يفعله أي زائر ولا يقبل مدخلات).
-- الامتدادان pg_cron و pg_net مفعّلان بالفعل في المشروع (مجانيان).

create or replace function public.monthly_draw_tick_needed()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  v_month text;
  v_slot timestamptz;
begin
  select draw_day, draw_hour, is_enabled into s
    from public.monthly_draw_settings
   order by id
   limit 1;

  if not found or coalesce(s.is_enabled, false) = false then
    return false;
  end if;

  -- سحب منشور حان موعده ولم يكتمل (تلقائي أو يدوي)، خلال آخر 6 ساعات
  if exists (
    select 1 from public.monthly_draws d
     where d.is_published = true
       and d.status in ('scheduled', 'draft', 'countdown', 'running')
       and d.scheduled_at <= now()
       and d.scheduled_at > now() - interval '6 hours'
  ) then
    return true;
  end if;

  -- سحب الشهر التلقائي: حان موعده ولا يوجد أي صف لهذا الشهر
  v_month := to_char(now() at time zone 'Asia/Riyadh', 'YYYY-MM');
  v_slot := make_timestamptz(
    split_part(v_month, '-', 1)::int,
    split_part(v_month, '-', 2)::int,
    least(28, greatest(1, coalesce(s.draw_day, 1))),
    least(23, greatest(0, coalesce(s.draw_hour, 20))),
    0, 0,
    'Asia/Riyadh'
  );

  if v_slot <= now()
     and v_slot > now() - interval '6 hours'
     and not exists (select 1 from public.monthly_draws d where d.month_key = v_month) then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.monthly_draw_tick()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.monthly_draw_tick_needed() then
    perform net.http_post(
      url := 'https://masarmakers.com/api/cron/monthly-draw',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  end if;
end;
$$;

revoke all on function public.monthly_draw_tick_needed() from public, anon, authenticated;
revoke all on function public.monthly_draw_tick() from public, anon, authenticated;

-- كل دقيقة (الدالة نفسها لا تنادي الموقع إلا عند وجود سحب مستحق)
select cron.schedule('monthly-draw-tick', '* * * * *', $cron$select public.monthly_draw_tick()$cron$);
