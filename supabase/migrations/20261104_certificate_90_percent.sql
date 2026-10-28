-- Certificate eligibility at 90% (Mona, 2026-10-28):
-- 1) Professional enrollments: admin notification + certificate_ready_at when progress crosses 90% (was 100%).
-- 2) One-day + free journeys (student without a professional enrollment): admin notification once
--    when the completed lectures reach 90% of the integrated journey's lectures (per certificate type).
-- Issuing stays manual from the admin certificates page.

create or replace function public.notify_admin_certificate_eligible()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_progress numeric := 0;
  v_new_progress numeric := 0;
  v_journey_type text;
  v_student_name text;
  v_course_title text;
  c_threshold constant numeric := 90;
begin
  if lower(coalesce(new.status::text, '')) <> 'active' then
    return new;
  end if;

  v_journey_type := lower(trim(coalesce(new.journey_type::text, '')));

  if v_journey_type not in (
    'fundamental', 'fundamentals', 'advanced', 'integrated', 'professional', 'career_path', 'career'
  ) then
    return new;
  end if;

  if lower(coalesce(new.certificate_status::text, '')) = 'issued' or new.certificate_id is not null then
    return new;
  end if;

  v_new_progress := greatest(0, least(100, coalesce(new.progress_percent, 0)::numeric));

  if tg_op = 'UPDATE' then
    v_old_progress := greatest(0, least(100, coalesce(old.progress_percent, 0)::numeric));
    -- Fire only on the transition from below 90% to 90% or more.
    if v_old_progress >= c_threshold or v_new_progress < c_threshold then
      return new;
    end if;
  elsif v_new_progress < c_threshold then
    return new;
  end if;

  update public.enrollments
     set certificate_ready_at = coalesce(certificate_ready_at, now()),
         updated_at = now()
   where id = new.id
     and certificate_ready_at is null;

  select coalesce(nullif(trim(p.full_name), ''), nullif(trim(new.student_name), ''), nullif(trim(new.student_email), ''), 'طالب')
    into v_student_name
    from public.profiles p
   where p.id = new.user_id;
  v_student_name := coalesce(v_student_name, nullif(trim(new.student_name), ''), nullif(trim(new.student_email), ''), 'طالب');

  select coalesce(nullif(trim(c.title_ar), ''), nullif(trim(c.title), ''), nullif(trim(new.course_title), ''), 'الكورس')
    into v_course_title
    from public.courses c
   where c.id = new.course_id;
  v_course_title := coalesce(v_course_title, nullif(trim(new.course_title), ''), 'الكورس');

  perform public.create_admin_event_notification(
    'استحقاق شهادة جديد',
    v_student_name || ' أنجز ' || round(v_new_progress)::text || '% من ' || v_course_title ||
      ' وأصبح مستحقًا للشهادة (يمكنك إصدارها من صفحة الشهادات).',
    'admin_certificate_ready',
    '/admin/students/certificates'
  );

  return new;
end;
$$;

-- One notification per student / course / certificate type for one-day + free journeys.
create table if not exists public.composed_certificate_notices (
  user_id uuid not null,
  course_id uuid not null,
  certificate_type text not null,
  percent integer not null,
  notified_at timestamptz not null default now(),
  primary key (user_id, course_id, certificate_type)
);
alter table public.composed_certificate_notices enable row level security;

create or replace function public.notify_composed_certificate(p_user_id uuid, p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_split boolean;
  v_has_pro_links boolean;
  r record;
  v_student_name text;
  v_course_title text;
begin
  -- Professional enrollment → its own certificate flow.
  if exists (
    select 1 from public.enrollments e
     where e.user_id = p_user_id and e.course_id = p_course_id and e.status = 'active'
       and lower(replace(coalesce(e.journey_type, ''), '-', '_')) in
           ('fundamental', 'fundamentals', 'advanced', 'integrated', 'professional', 'career_path', 'career')
  ) then
    return;
  end if;

  select exists (
    select 1 from public.lessons l
     where l.course_id = p_course_id and l.status = 'published'
       and lower(coalesce(l.course_part, '')) in ('fundamental', 'fundamentals', 'advanced')
  ) into v_is_split;

  select exists (
    select 1 from public.lesson_journeys lj
      join public.journeys j on j.id = lj.journey_id
      join public.lessons l on l.id = lj.lesson_id
     where l.course_id = p_course_id and j.course_id = p_course_id and j.is_active = true
       and lower(replace(coalesce(j.journey_type, ''), '-', '_')) not in
           ('free', 'free_session', 'free_journey', 'workshop', 'one_day', 'one_day_workshop')
  ) into v_has_pro_links;

  for r in
    with pro as (
      select l.id,
             case
               when not v_is_split then 'advanced'
               when lower(coalesce(l.course_part, '')) in ('fundamental', 'fundamentals') then 'fundamental'
               else 'advanced'
             end as cert_type
        from public.lessons l
       where l.course_id = p_course_id and l.status = 'published'
         and (
           (v_is_split and lower(coalesce(l.course_part, '')) in ('fundamental', 'fundamentals', 'advanced'))
           or (
             not v_is_split
             and (
               not v_has_pro_links
               or exists (
                 select 1 from public.lesson_journeys lj
                   join public.journeys j on j.id = lj.journey_id
                  where lj.lesson_id = l.id and j.course_id = p_course_id and j.is_active = true
                    and lower(replace(coalesce(j.journey_type, ''), '-', '_')) not in
                        ('free', 'free_session', 'free_journey', 'workshop', 'one_day', 'one_day_workshop')
               )
             )
           )
         )
    ),
    mine as (
      select distinct substring(e.action_key from '^(?:workshop|free):lesson:([0-9a-fA-F-]{36})')::uuid as lesson_id
        from public.enrollments e
       where e.user_id = p_user_id and e.course_id = p_course_id and e.status = 'active'
         and lower(replace(coalesce(e.journey_type, ''), '-', '_')) in
             ('free', 'free_session', 'free_journey', 'workshop', 'one_day', 'one_day_workshop')
         and e.action_key ~ '^(workshop|free):lesson:[0-9a-fA-F-]{36}'
    )
    select pro.cert_type,
           count(*) as total,
           count(*) filter (
             where pro.id in (select lesson_id from mine)
               and exists (
                 select 1 from public.lesson_progress lp
                  where lp.user_id = p_user_id and lp.lesson_id = pro.id
                    and (lp.completed = true or coalesce(lp.progress_percent, 0) >= 100)
               )
           ) as covered
      from pro
     group by pro.cert_type
  loop
    if r.total > 0 and r.covered::numeric / r.total >= 0.9 then
      insert into public.composed_certificate_notices (user_id, course_id, certificate_type, percent)
      values (p_user_id, p_course_id, r.cert_type, round(100 * r.covered::numeric / r.total))
      on conflict do nothing;

      if found then
        select coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.email), ''), 'طالب') into v_student_name
          from public.profiles p where p.id = p_user_id;
        select coalesce(nullif(trim(c.title_ar), ''), nullif(trim(c.title), ''), 'الكورس') into v_course_title
          from public.courses c where c.id = p_course_id;

        perform public.create_admin_event_notification(
          'استحقاق شهادة جديد (يوم واحد + مجاني)',
          coalesce(v_student_name, 'طالب') || ' شاهد ' || r.covered || ' من ' || r.total ||
            ' محاضرة من الرحلة المتكاملة في ' || coalesce(v_course_title, 'الكورس') ||
            case when v_is_split then (case when r.cert_type = 'fundamental' then ' (الأساسيات)' else ' (المتقدم)' end) else '' end ||
            ' عن طريق رحلات اليوم الواحد والمجانية (يمكنك إصدار الشهادة من صفحة الشهادات).',
          'admin_certificate_ready',
          '/admin/students/certificates'
        );
      end if;
    end if;
  end loop;
end;
$$;

create or replace function public.handle_lesson_progress_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_lesson_id uuid;
  v_course_id uuid;
  v_prev_internal_flag text;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
    v_lesson_id := old.lesson_id;
  else
    v_user_id := new.user_id;
    v_lesson_id := new.lesson_id;
  end if;

  select course_id into v_course_id from public.lessons where id = v_lesson_id;

  if v_course_id is not null then
    v_prev_internal_flag := current_setting('app.internal_progress_refresh', true);
    perform set_config('app.internal_progress_refresh', 'on', true);

    begin
      perform public.refresh_enrollment_progress(v_user_id, v_course_id);
    exception when others then
      perform set_config('app.internal_progress_refresh', coalesce(v_prev_internal_flag, ''), true);
      raise;
    end;

    perform set_config('app.internal_progress_refresh', coalesce(v_prev_internal_flag, ''), true);

    -- One-day + free certificate notice: never blocks saving the progress.
    if tg_op <> 'DELETE' then
      begin
        perform public.notify_composed_certificate(v_user_id, v_course_id);
      exception when others then
        null;
      end;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;
