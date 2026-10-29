-- السحب الشهري يعمل في موعده بالظبط (الساعة 8 مساءً بتوقيت الرياض) بدون الاعتماد على وجود زوار.
-- يوم 1 من الشهر فقط (8 فحوصات في الشهر كله، وليس كل دقيقة): تحضير قبل الموعد ثم تشغيل بعده.
-- كل فحص يسأل «هل يوجد سحب مستحق؟» (سحب منشور موعده جاء ولم يكتمل، أو سحب الشهر التلقائي لشهر بلا صف)،
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

  -- تحضير: سحب منشور موعده خلال 20 دقيقة القادمة ولم تُحسب لقطة مشاركيه بعد
  if exists (
    select 1 from public.monthly_draws d
     where d.is_published = true
       and d.status in ('scheduled', 'draft')
       and d.scheduled_at > now()
       and d.scheduled_at <= now() + interval '20 minutes'
       and not exists (select 1 from public.monthly_draw_entries e where e.draw_id = d.id)
  ) then
    return true;
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

  -- تحضير سحب الشهر التلقائي (لا صف له بعد) قبل موعده بـ 20 دقيقة، أو الموعد جاء ولم يُنشأ
  if v_slot <= now() + interval '20 minutes'
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

-- يوم 1 من كل شهر (بتوقيت UTC، والرياض = UTC+3):
--  • 16:45 و16:52 UTC (= 7:45 و7:52 مساءً): تحضير لقطة المشاركين قبل الموعد (تأخذ من 30 ثانية لعدة دقائق).
--  • 17:00–17:05 UTC (= 8:00–8:05 مساءً): تشغيل السحب. المحاولات بعد 8:00 احتياط لو الموقع تعطّل لحظتها.
-- يعني 8 فحوصات في الشهر كله؛ والدالة لا تنادي الموقع إلا عند وجود تحضير أو سحب مستحق لم يكتمل.
-- لو غيّرتِ يوم أو ساعة السحب في الإعدادات، يلزم تعديل هاتين الجدولتين.
select cron.schedule('monthly-draw-prepare', '45,52 16 1 * *', $cron$select public.monthly_draw_tick()$cron$);
select cron.schedule('monthly-draw-tick', '0-5 17 1 * *', $cron$select public.monthly_draw_tick()$cron$);
